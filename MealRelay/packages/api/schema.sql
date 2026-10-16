-- ==============================================================================
-- MEALRELAY DATABASE SCHEMA & ROW-LEVEL SECURITY SPECIFICATION
-- Target: Supabase / PostgreSQL 15+
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ORGANIZATIONS (Top-Level Tenant)
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    plan TEXT NOT NULL DEFAULT 'starter' CHECK (plan IN ('demo', 'starter', 'enterprise')),
    contact_email TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. USERS & MEMBERSHIPS (Multi-tenant RBAC)
CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL, -- references auth.users(id) in Supabase
    role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'head_chef', 'sous_chef', 'operations_manager', 'viewer')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(org_id, user_id)
);

-- 4. KITCHENS (Operating Facilities within an Organization)
CREATE TABLE IF NOT EXISTS public.kitchens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    location TEXT,
    capacity INT NOT NULL DEFAULT 500,
    timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. MEAL SERVICES
CREATE TABLE IF NOT EXISTS public.meal_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kitchen_id UUID NOT NULL REFERENCES public.kitchens(id) ON DELETE CASCADE,
    service_key TEXT NOT NULL CHECK (service_key IN ('breakfast', 'lunch', 'dinner')),
    name TEXT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    default_base_portions INT NOT NULL DEFAULT 150,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. MENU ITEMS
CREATE TABLE IF NOT EXISTS public.menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kitchen_id UUID NOT NULL REFERENCES public.kitchens(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT,
    dietary_tags TEXT[],
    estimated_portion_grams NUMERIC(6, 2) DEFAULT 350.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. PREPARATION PLANS (Daily Kitchen Work Orders)
CREATE TABLE IF NOT EXISTS public.preparation_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kitchen_id UUID NOT NULL REFERENCES public.kitchens(id) ON DELETE CASCADE,
    service_date DATE NOT NULL,
    buffer_percent NUMERIC(4, 2) NOT NULL DEFAULT 4.80,
    total_portions INT NOT NULL DEFAULT 0,
    breakfast_portions INT NOT NULL DEFAULT 0,
    lunch_portions INT NOT NULL DEFAULT 0,
    dinner_portions INT NOT NULL DEFAULT 0,
    approved BOOLEAN NOT NULL DEFAULT FALSE,
    approved_at TIMESTAMPTZ,
    approved_by UUID,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(kitchen_id, service_date)
);

-- 8. DEMAND FORECASTS (Estimated Requirements)
CREATE TABLE IF NOT EXISTS public.demand_forecasts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kitchen_id UUID NOT NULL REFERENCES public.kitchens(id) ON DELETE CASCADE,
    service_date DATE NOT NULL,
    meal_service TEXT NOT NULL CHECK (meal_service IN ('breakfast', 'lunch', 'dinner')),
    baseline_portions INT NOT NULL,
    suggested_portions INT NOT NULL,
    recommended_buffer_percent NUMERIC(4, 2) NOT NULL DEFAULT 4.80,
    confidence_score NUMERIC(3, 2) NOT NULL DEFAULT 0.90,
    historical_avg INT NOT NULL,
    weather_factor NUMERIC(3, 2) NOT NULL DEFAULT 1.00,
    reasoning TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. CONSUMPTION & LEFTOVER RECORDS (Post-Service Actuals)
CREATE TABLE IF NOT EXISTS public.consumption_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID NOT NULL REFERENCES public.preparation_plans(id) ON DELETE CASCADE,
    kitchen_id UUID NOT NULL REFERENCES public.kitchens(id) ON DELETE CASCADE,
    meal_service TEXT NOT NULL CHECK (meal_service IN ('breakfast', 'lunch', 'dinner')),
    service_date DATE NOT NULL,
    prepared_portions INT NOT NULL,
    served_portions INT NOT NULL,
    leftover_portions INT NOT NULL DEFAULT 0,
    headcount INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 10. WASTE RECORDS (Physical Weight & Discard Tracking)
CREATE TABLE IF NOT EXISTS public.waste_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consumption_record_id UUID REFERENCES public.consumption_records(id) ON DELETE SET NULL,
    kitchen_id UUID NOT NULL REFERENCES public.kitchens(id) ON DELETE CASCADE,
    waste_weight_kg NUMERIC(6, 2) NOT NULL,
    waste_reason TEXT CHECK (waste_reason IN ('unserved_leftover', 'spoilage', 'preparation_trim', 'plate_waste')),
    logged_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- Ensures complete tenant isolation between organizations.
-- ==============================================================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kitchens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preparation_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demand_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumption_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waste_records ENABLE ROW LEVEL SECURITY;

-- Helper function to check tenant membership
CREATE OR REPLACE FUNCTION public.user_belongs_to_org(target_org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE org_id = target_org_id
      AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Organization access: Users can only select their own organizations
CREATE POLICY org_member_select ON public.organizations
    FOR SELECT USING (user_belongs_to_org(id));

-- Kitchens: Access scoped by org_id
CREATE POLICY kitchen_org_policy ON public.kitchens
    FOR ALL USING (user_belongs_to_org(org_id));

-- Preparation Plans: Scoped via parent kitchen's org_id
CREATE POLICY plan_org_policy ON public.preparation_plans
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.kitchens
            WHERE kitchens.id = preparation_plans.kitchen_id
              AND user_belongs_to_org(kitchens.org_id)
        )
    );
