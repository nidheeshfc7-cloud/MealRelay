import React from 'react';
import { Calendar, CheckCircle2, ChevronRight, Clock } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function Header({ title, subtitle, action }: HeaderProps) {
  const today = new Intl.DateTimeFormat("en-IN", { dateStyle: "full", timeZone: "Asia/Kolkata" }).format(new Date());

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-line-light">
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-ink-secondary uppercase tracking-widest mb-1">
          <Calendar size={13} className="text-forest" />
          <span>{today}</span>
          <span>•</span>
          <span className="text-forest font-extrabold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-forest inline-block"></span>
            Workspace
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-ink tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-ink-secondary mt-1">{subtitle}</p>}
      </div>

      {action && <div className="flex items-center gap-3">{action}</div>}
    </div>
  );
}
