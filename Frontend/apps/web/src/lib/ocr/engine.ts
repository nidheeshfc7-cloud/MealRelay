import type { OcrEngineResult, OcrProgress, OcrWordConfidence } from "./types";

const OCR_TIMEOUT_MS = 60000;

interface SpatialItem {
  text: string;
  box: { x: number; y: number; width: number; height: number };
  confidence: number;
}

const reconstructSpatialLines = (rawLines: any[][]): string => {
  const allItems: SpatialItem[] = [];

  for (const line of rawLines) {
    if (!Array.isArray(line)) continue;
    for (const item of line) {
      if (!item || !item.text) continue;
      const text = String(item.text).trim();
      if (!text) continue;
      if (item.box && typeof item.box.y === "number") {
        allItems.push({
          text,
          box: item.box,
          confidence: typeof item.confidence === "number" ? item.confidence : 0.85,
        });
      }
    }
  }

  // Early return if bounding box coordinates are not available
  if (allItems.length === 0) {
    return "";
  }

  // Sort top-to-bottom by vertical center point
  allItems.sort((a, b) => {
    const centerYA = a.box.y + (a.box.height || 20) / 2;
    const centerYB = b.box.y + (b.box.height || 20) / 2;
    return centerYA - centerYB;
  });

  // Cluster items into lines based on vertical overlap
  const rows: SpatialItem[][] = [];
  for (const item of allItems) {
    const itemHeight = item.box.height || 20;
    const itemCenter = item.box.y + itemHeight / 2;

    const matchingRow = rows.find((row) => {
      const rowItem = row[0];
      const rowHeight = rowItem.box.height || 20;
      const rowCenter = rowItem.box.y + rowHeight / 2;
      const verticalTolerance = Math.max(itemHeight, rowHeight) * 0.75;
      return Math.abs(itemCenter - rowCenter) <= verticalTolerance;
    });

    if (matchingRow) {
      matchingRow.push(item);
    } else {
      rows.push([item]);
    }
  }

  // Sort each row left-to-right (by x) and join text to ensure dish name and price are on the same line
  return rows
    .map((row) =>
      row
        .sort((a, b) => a.box.x - b.box.x)
        .map((i) => i.text)
        .join(" ")
    )
    .join("\n");
};

export const recognizeText = async (
  imageDataUrl: string,
  onProgress?: (progress: OcrProgress) => void
): Promise<OcrEngineResult> => {
  // Early return if running in SSR environment
  if (typeof window === "undefined") {
    return {
      text: "",
      confidence: 0,
      words: [],
    };
  }

  let timeoutTimer: ReturnType<typeof setTimeout> | null = null;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutTimer = setTimeout(() => {
      reject(
        new Error(
          "PaddleOCR processing timed out. Please try a clearer photo or use direct text paste."
        )
      );
    }, OCR_TIMEOUT_MS);
  });

  const workerExecution = async (): Promise<OcrEngineResult> => {
    let service: any = null;
    try {
      if (onProgress) {
        onProgress({ status: "Loading in-browser PaddleOCR runtime...", progress: 10 });
      }

      // Dynamic client-side import for WebAssembly/WebGPU PaddleOCR
      const { PaddleOcrService } = await import("ppu-paddle-ocr/web");

      if (onProgress) {
        onProgress({ status: "Initializing PaddleOCR models...", progress: 25 });
      }

      service = new PaddleOcrService();
      await service.initialize();

      if (onProgress) {
        onProgress({ status: "Recognizing text in browser...", progress: 60 });
      }

      // Convert data URL to ArrayBuffer for in-browser inference
      const responseBuffer = await fetch(imageDataUrl).then((res) => res.arrayBuffer());
      const ocrOutput = await service.recognize(responseBuffer);

      if (onProgress) {
        onProgress({ status: "Structuring extracted dishes...", progress: 95 });
      }

      const words: OcrWordConfidence[] = [];
      let totalConfidence = 0;
      let count = 0;

      // Extract per-word tokens and confidence ratings
      if (Array.isArray(ocrOutput.lines)) {
        for (const line of ocrOutput.lines) {
          if (!Array.isArray(line)) continue;
          for (const item of line) {
            const itemText = String(item.text || "").trim();
            if (!itemText) continue;

            const rawConfidence =
              typeof item.confidence === "number" ? item.confidence : 0.85;
            const normalizedScore =
              rawConfidence <= 1 ? Math.round(rawConfidence * 100) : Math.round(rawConfidence);

            words.push({
              text: itemText,
              confidence: normalizedScore,
            });

            totalConfidence += normalizedScore;
            count++;
          }
        }
      }

      const meanConfidence =
        count > 0
          ? Math.round(totalConfidence / count)
          : typeof ocrOutput.confidence === "number"
            ? Math.round(ocrOutput.confidence <= 1 ? ocrOutput.confidence * 100 : ocrOutput.confidence)
            : 80;

      // Spatially align 2D bounding boxes to unite dish names with prices horizontally
      const spatialText = Array.isArray(ocrOutput.lines)
        ? reconstructSpatialLines(ocrOutput.lines)
        : "";

      const fullText =
        spatialText ||
        ocrOutput.text ||
        (Array.isArray(ocrOutput.lines)
          ? ocrOutput.lines
              .map((line: any[]) =>
                Array.isArray(line) ? line.map((w: any) => String(w.text || "")).join(" ") : ""
              )
              .join("\n")
          : words.map((w) => w.text).join("\n"));

      return {
        text: fullText,
        confidence: meanConfidence,
        words,
      };
    } finally {
      if (service && typeof service.destroy === "function") {
        try {
          await service.destroy();
        } catch {
          // Cleanup fallback
        }
      }
    }
  };

  try {
    const result = await Promise.race([workerExecution(), timeoutPromise]);
    return result;
  } finally {
    if (timeoutTimer) {
      clearTimeout(timeoutTimer);
    }
  }
};
