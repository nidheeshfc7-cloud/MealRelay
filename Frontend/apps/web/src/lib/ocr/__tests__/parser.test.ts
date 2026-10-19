import { parseMenuDishes, parseKitchenRegisterText } from "../parser";
import type { OcrEngineResult } from "../types";

const runOcrTests = () => {
  console.log("Starting OCR Parser Unit & Regression Tests...");

  // Test 1: Indian Canteen Rate Sheet
  const sampleMenuText = `
    HOSTEL MESS WEEKLY MENU
    1. Steamed Basmati Rice ₹45
    2. Yellow Dal Tadka Rs. 60
    3. Butter Phulka Roti 15/-
    4. Paneer Butter Masala 120
    5. Boondi Raita ₹30
    6. Masala Chai 15
    7. Hot Gulab Jamun Rs 40.00
  `;

  const mockOcrResult: OcrEngineResult = {
    text: sampleMenuText,
    confidence: 88,
    words: sampleMenuText.split(/\s+/).map((w) => ({ text: w, confidence: 88 })),
  };

  const dishes = parseMenuDishes(mockOcrResult);

  if (dishes.length !== 7) {
    throw new Error(`Expected 7 dishes, got ${dishes.length}`);
  }

  const rice = dishes.find((d) => d.name.includes("Rice"));
  if (!rice || rice.category !== "rice" || rice.price !== 45) {
    throw new Error(`Failed rice extraction: ${JSON.stringify(rice)}`);
  }

  const dal = dishes.find((d) => d.name.includes("Dal"));
  if (!dal || dal.category !== "curry" || dal.price !== 60) {
    throw new Error(`Failed dal extraction: ${JSON.stringify(dal)}`);
  }

  const roti = dishes.find((d) => d.name.includes("Roti") || d.name.includes("Phulka"));
  if (!roti || roti.category !== "bread" || roti.price !== 15) {
    throw new Error(`Failed roti extraction: ${JSON.stringify(roti)}`);
  }

  const dessert = dishes.find((d) => d.name.includes("Jamun"));
  if (!dessert || dessert.category !== "dessert" || dessert.price !== 40) {
    throw new Error(`Failed dessert extraction: ${JSON.stringify(dessert)}`);
  }

  console.log("✓ Test 1: Menu Rate List & Taxonomy Classification Passed!");

  // Test 2: Fuzzy Duplicate Matching
  const existingCatalog = [
    { id: "11111111-1111-1111-1111-111111111111", name: "Yellow Dal Tadka", category: "curry" as const, price: 55 },
  ];
  const matchedDishes = parseMenuDishes(mockOcrResult, existingCatalog);
  const matchedDal = matchedDishes.find((d) => d.name.includes("Dal"));
  if (!matchedDal || !matchedDal.isExistingMatch || matchedDal.existingId !== existingCatalog[0].id) {
    throw new Error("Failed fuzzy duplicate match");
  }
  console.log("✓ Test 2: Fuzzy Duplicate Catalog Matcher Passed!");

  // Test 3: Daily Kitchen Register Logs
  const sampleRegister = `
    Date: 2026-10-19 Service: Lunch
    Yellow Dal Tadka 180 165 15 170
    Steamed Basmati Rice 200 185 15 170
  `;

  const logs = parseKitchenRegisterText(sampleRegister, existingCatalog);
  if (logs.length !== 2) {
    throw new Error(`Expected 2 logs, got ${logs.length}`);
  }

  const dalLog = logs[0];
  if (
    dalLog.prepared !== 180 ||
    dalLog.served !== 165 ||
    dalLog.leftover !== 15 ||
    dalLog.attendance !== 170 ||
    !dalLog.isValid
  ) {
    throw new Error(`Invalid register log parsed: ${JSON.stringify(dalLog)}`);
  }

  console.log("✓ Test 3: Kitchen Register Log Parser Passed!");

  // Test 4: Portion Arithmetic Invariant (Prepared = Served + Leftover)
  const invalidRegister = `
    Steamed Rice 200 170 10
  `; // 200 != 170 + 10 (mismatch by 20)
  const invalidLogs = parseKitchenRegisterText(invalidRegister);
  if (invalidLogs.length > 0 && invalidLogs[0].isValid) {
    throw new Error("Arithmetic invariant check failed to flag mismatch");
  }
  console.log("✓ Test 4: Portion Arithmetic Invariant Protection Passed!");

  console.log("ALL OCR PARSER VERIFICATION TESTS PASSED SUCCESSFULLY!");
};

runOcrTests();
