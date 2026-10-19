import type { DishCatalogItem } from "@/lib/types/api";
import type { MealServiceKey } from "@mealrelay/types";
import type {
  ExtractedActivityRecord,
  ExtractedMenuItem,
  OcrEngineResult,
} from "./types";

const CATEGORY_KEYWORDS: Record<DishCatalogItem["category"], RegExp> = {
  rice: /\b(rice|biryani|pulao|jeera\s*rice|fried\s*rice|khichdi|pulav|pongal|curd\s*rice|lemon\s*rice|ghee\s*rice)\b/i,
  bread: /\b(roti|phulka|chapati|naan|paratha|puri|poori|kulcha|tandoori\s*roti|bread|pav|bhatura|thepla)\b/i,
  curry: /\b(curry|dal|sambar|tadka|gravy|korma|chole|rajma|rasam|kadhi|masala|kofta|saag|makhani|aloo\s*matar)\b/i,
  main: /\b(thali|paneer|chicken|idli|dosa|poha|upma|pasta|noodles|chole\s*bhature|meal|combo|maggi|egg\s*curry|mutton)\b/i,
  side: /\b(salad|papad|pickle|chutney|raita|bhaji|pakoda|samosa|boondi|vada|kachori|curd|onion|kachumber)\b/i,
  beverage: /\b(tea|chai|coffee|milk|buttermilk|chaas|juice|lassi|shake|water|cold\s*drink|badam\s*milk)\b/i,
  dessert: /\b(gulab\s*jamun|kheer|halwa|ice\s*cream|sweet|payasam|jalebi|rasgulla|custard|brownie|shrikhand|laddu)\b/i,
};

const isNoiseHeader = (line: string): boolean => {
  const trimmed = line.trim();
  if (trimmed.length <= 1) return true;
  if (/^[-=_~*#|.\s]+$/.test(trimmed)) return true;
  if (/^(day|date|sl\s*no|s\.no|item\s*name|dish|cost|rate|price|total|timing|shift)$/i.test(trimmed)) return true;
  if (/^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/i.test(trimmed)) return true;
  if (/^(breakfast|lunch|snacks?|tea|dinner|meals?)$/i.test(trimmed)) return true;
  if (/\b(hostel\s*mess|weekly\s*menu|canteen\s*menu|rate\s*list|price\s*list|dining\s*hall|mess\s*schedule)\b/i.test(trimmed)) {
    return true;
  }
  if (/^(today'?s\s*)?menu$/i.test(trimmed)) {
    return true;
  }
  return false;
};

const normalizeForComparison = (text: string): string => {
  return text.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
};

const formatTitleCase = (text: string): string => {
  if (!text) return "";
  return text
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export const parseMenuDishes = (
  ocrResult: OcrEngineResult,
  existingCatalog: Array<{ id: string; name: string; category: DishCatalogItem["category"]; price: number }> = []
): ExtractedMenuItem[] => {
  if (!ocrResult || !ocrResult.text) {
    return [];
  }

  const lines = ocrResult.text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length >= 2);

  if (!lines.length) {
    return [];
  }

  const results: ExtractedMenuItem[] = [];
  const wordConfidenceMap = new Map<string, number>();

  for (const wordItem of ocrResult.words) {
    const norm = normalizeForComparison(wordItem.text);
    if (norm) {
      wordConfidenceMap.set(norm, wordItem.confidence);
    }
  }

  for (const line of lines) {
    // 1. Skip metadata, table column headers, and noise rows
    if (isNoiseHeader(line)) {
      continue;
    }

    // 2. Extract Price
    let detectedPrice = 0;
    const priceWithSymbolMatch = line.match(/(?:₹|rs\.?|inr)\s*(\d+(?:\.\d{1,2})?)/i);
    const trailingPriceMatch = line.match(/(?:[-:\s|]|^)\s*(\d+(?:\.\d{1,2})?)\s*(?:\/-)?\s*$/i);

    if (priceWithSymbolMatch) {
      detectedPrice = parseFloat(priceWithSymbolMatch[1]);
    } else if (trailingPriceMatch) {
      const candidate = parseFloat(trailingPriceMatch[1]);
      // Sensible canteen price boundary
      if (candidate > 0 && candidate <= 5000) {
        detectedPrice = candidate;
      }
    }

    // 3. Clean Dish Name
    let cleanedName = line
      .replace(/(?:₹|rs\.?|inr)\s*\d+(?:\.\d{1,2})?/gi, "")
      .replace(/(?:[-:\s|]|^)\s*\d+(?:\.\d{1,2})?\s*(?:\/-)?\s*$/i, "")
      .replace(/^[\d\.\-\*\•\)\:\#\~]+\s*/, "")
      .replace(/[\:\-\|\~\.]+$/, "")
      .trim();

    if (!cleanedName || cleanedName.length < 2) {
      continue;
    }

    cleanedName = formatTitleCase(cleanedName);

    // 4. Determine Dish Category
    let detectedCategory: DishCatalogItem["category"] = "main";
    for (const [category, regex] of Object.entries(CATEGORY_KEYWORDS)) {
      if (regex.test(cleanedName)) {
        detectedCategory = category as DishCatalogItem["category"];
        break;
      }
    }

    // 5. Calculate Average Confidence for the line
    const wordsInName = cleanedName.split(/\s+/);
    let totalScore = 0;
    let scoredWordCount = 0;

    for (const w of wordsInName) {
      const normW = normalizeForComparison(w);
      if (wordConfidenceMap.has(normW)) {
        totalScore += wordConfidenceMap.get(normW)!;
        scoredWordCount++;
      }
    }

    const avgConfidence =
      scoredWordCount > 0
        ? Math.round(totalScore / scoredWordCount)
        : Math.round(ocrResult.confidence || 75);

    // 6. Check for duplicate against user's existing catalog
    const normCleaned = normalizeForComparison(cleanedName);
    const matchedExisting = existingCatalog.find((item) => {
      const normExisting = normalizeForComparison(item.name);
      if (normExisting === normCleaned) return true;
      if (
        normCleaned.length > 5 &&
        normExisting.length > 5 &&
        (normExisting.includes(normCleaned) || normCleaned.includes(normExisting))
      ) {
        return true;
      }
      return false;
    });

    const finalPrice =
      detectedPrice > 0
        ? detectedPrice
        : matchedExisting
          ? Number(matchedExisting.price)
          : 50.0;

    const confidenceTag: "high" | "review_needed" =
      avgConfidence >= 65 && detectedPrice > 0 ? "high" : "review_needed";

    results.push({
      id: crypto.randomUUID(),
      name: cleanedName.slice(0, 100),
      category: matchedExisting ? matchedExisting.category : detectedCategory,
      price: finalPrice,
      confidence: confidenceTag,
      confidenceScore: avgConfidence,
      isExistingMatch: Boolean(matchedExisting),
      existingId: matchedExisting?.id,
      selected: true,
    });
  }

  return results;
};

const normalizeIsoDate = (dateStr: string): string => {
  const partsYmd = dateStr.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/);
  if (partsYmd) {
    const [, y, m, d] = partsYmd;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  const partsDmy = dateStr.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{2,4})$/);
  if (partsDmy) {
    const [, d, m, rawYear] = partsDmy;
    const y = rawYear.length === 2 ? `20${rawYear}` : rawYear;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  return new Date().toISOString().slice(0, 10);
};

export const parseKitchenRegisterText = (
  rawText: string,
  existingCatalog: Array<{ id: string; name: string }> = []
): ExtractedActivityRecord[] => {
  if (!rawText) return [];

  // Extract global date if present on sheet
  let globalDate = new Date().toISOString().slice(0, 10);
  const dateMatch =
    rawText.match(/\b(\d{4}[-\/]\d{1,2}[-\/]\d{1,2})\b/) ||
    rawText.match(/\b(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})\b/);

  if (dateMatch) {
    globalDate = normalizeIsoDate(dateMatch[1]);
  }

  // Detect meal service
  let globalShift: MealServiceKey = "lunch";
  if (/\b(breakfast|morning|tiffin)\b/i.test(rawText)) {
    globalShift = "breakfast";
  } else if (/\b(dinner|night|supper)\b/i.test(rawText)) {
    globalShift = "dinner";
  }

  const lines = rawText.split("\n").map((l) => l.trim()).filter((l) => l.length >= 3);
  const records: ExtractedActivityRecord[] = [];

  for (const line of lines) {
    // Look for lines with multiple quantities (e.g. "Dal Tadka 180 165 15 170" or labeled "Prep: 180, Served: 165")
    const labeledMatch = line.match(
      /(?:prep(?:ared)?[:\s]+)?(\d+)\s+(?:served[:\s]+)?(\d+)\s+(?:left(?:over)?[:\s]+)?(\d+)(?:\s+(?:att(?:endance)?[:\s]+)?(\d+))?/i
    );

    if (!labeledMatch) continue;

    const prep = parseInt(labeledMatch[1], 10);
    const served = parseInt(labeledMatch[2], 10);
    const leftover = parseInt(labeledMatch[3], 10);
    const attendance = labeledMatch[4] ? parseInt(labeledMatch[4], 10) : served;

    const dishPart = line
      .replace(labeledMatch[0], "")
      .replace(/^[\d\.\-\*\•\)\:\#]+\s*/, "")
      .trim();

    if (!dishPart || dishPart.length < 2) continue;

    const formattedDishName = formatTitleCase(dishPart);
    const normDish = normalizeForComparison(formattedDishName);

    const matchedMenu = existingCatalog.find((item) => {
      const normCatalog = normalizeForComparison(item.name);
      return (
        normCatalog === normDish ||
        normCatalog.includes(normDish) ||
        normDish.includes(normCatalog)
      );
    });

    const isArithmeticValid = prep === served + leftover;

    records.push({
      id: crypto.randomUUID(),
      service_date: globalDate,
      meal_service: globalShift,
      dish_name: formattedDishName,
      menu_item_id: matchedMenu?.id || "",
      prepared: prep,
      served,
      leftover,
      attendance,
      notes: "Extracted via OCR register scan",
      isValid: isArithmeticValid,
      selected: isArithmeticValid,
    });
  }

  return records;
};
