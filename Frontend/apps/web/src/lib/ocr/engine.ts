import type { OcrEngineResult, OcrProgress } from "./types";

const OCR_TIMEOUT_MS = 35000;

export const recognizeText = async (
  imageDataUrl: string,
  onProgress?: (progress: OcrProgress) => void
): Promise<OcrEngineResult> => {
  if (typeof window === "undefined") {
    return {
      text: "",
      confidence: 0,
      words: [],
    };
  }

  const { createWorker } = await import("tesseract.js");

  let timeoutTimer: ReturnType<typeof setTimeout> | null = null;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutTimer = setTimeout(() => {
      reject(
        new Error(
          "OCR processing timed out. Please try a smaller or higher-contrast photo, or use direct text paste."
        )
      );
    }, OCR_TIMEOUT_MS);
  });

  const workerExecution = async (): Promise<OcrEngineResult> => {
    let worker: any = null;
    try {
      if (onProgress) {
        onProgress({ status: "Initializing OCR engine...", progress: 5 });
      }

      worker = await createWorker("eng", 1, {
        logger: (message: { status?: string; progress?: number }) => {
          if (!onProgress) return;
          const status = message.status || "processing";
          const rawProgress = typeof message.progress === "number" ? message.progress : 0;

          if (status === "recognizing text") {
            const mappedProgress = Math.min(98, Math.max(15, Math.round(rawProgress * 100)));
            onProgress({
              status: `Recognizing text... (${mappedProgress}%)`,
              progress: mappedProgress,
            });
            return;
          }

          if (status.includes("loading") || status.includes("initialized")) {
            onProgress({ status: "Loading language models...", progress: 12 });
            return;
          }

          onProgress({ status: "Preparing image for scan...", progress: 8 });
        },
      });

      if (onProgress) {
        onProgress({ status: "Scanning text...", progress: 20 });
      }

      const response = await worker.recognize(imageDataUrl);

      if (onProgress) {
        onProgress({ status: "Structuring extracted dishes...", progress: 100 });
      }

      const words = Array.isArray(response.data.words)
        ? response.data.words.map((w: { text?: string; confidence?: number }) => ({
            text: String(w.text || "").trim(),
            confidence: typeof w.confidence === "number" ? w.confidence : 0,
          }))
        : [];

      return {
        text: response.data.text || "",
        confidence: typeof response.data.confidence === "number" ? response.data.confidence : 0,
        words,
      };
    } finally {
      if (worker) {
        try {
          await worker.terminate();
        } catch {
          // Worker termination fallback
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
