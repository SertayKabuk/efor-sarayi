function sanitizeFilenameSegment(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildPdfFilename(title: string) {
  const slug = sanitizeFilenameSegment(title) || "project-details";
  return `${slug}.pdf`;
}

function getPdfErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message || "Failed to generate the PDF export.";
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  return "Failed to generate the PDF export.";
}

function cloneCanvasContent(source: HTMLCanvasElement, target: HTMLCanvasElement) {
  target.width = source.width;
  target.height = source.height;

  const context = target.getContext("2d");
  if (!context) return;

  context.drawImage(source, 0, 0);
}

const unsupportedColorFunctionPattern = /\boklch\(|\boklab\(/i;

function createStyleValueResolver() {
  const resolver = document.createElement("div");
  const cache = new Map<string, string>();

  resolver.style.position = "fixed";
  resolver.style.left = "-9999px";
  resolver.style.top = "0";
  resolver.style.visibility = "hidden";
  resolver.style.pointerEvents = "none";
  resolver.style.background = "#ffffff";
  resolver.style.color = "#000000";
  document.body.appendChild(resolver);

  return {
    resolve(property: string, value: string) {
      if (!unsupportedColorFunctionPattern.test(value)) {
        return value;
      }

      const key = `${property}:${value}`;
      const cached = cache.get(key);
      if (cached !== undefined) {
        return cached;
      }

      resolver.style.setProperty(property, value);
      const resolvedValue = window.getComputedStyle(resolver).getPropertyValue(property).trim();
      resolver.style.removeProperty(property);

      const safeValue = unsupportedColorFunctionPattern.test(resolvedValue)
        ? ""
        : resolvedValue;

      cache.set(key, safeValue);
      return safeValue;
    },
    cleanup() {
      resolver.remove();
    },
  };
}

function inlineComputedStyles(
  source: Element,
  target: Element,
  resolveStyleValue: (property: string, value: string) => string
) {
  if (!(source instanceof HTMLElement) || !(target instanceof HTMLElement)) {
    return;
  }

  const computedStyle = window.getComputedStyle(source);
  for (const property of Array.from(computedStyle)) {
    if (property.startsWith("--")) {
      continue;
    }

    const rawValue = computedStyle.getPropertyValue(property);
    const normalizedValue = resolveStyleValue(property, rawValue);

    if (!normalizedValue) {
      continue;
    }

    target.style.setProperty(property, normalizedValue);
  }

  if (source instanceof HTMLInputElement && target instanceof HTMLInputElement) {
    target.value = source.value;
    target.checked = source.checked;
  }

  if (source instanceof HTMLTextAreaElement && target instanceof HTMLTextAreaElement) {
    target.value = source.value;
  }

  if (source instanceof HTMLSelectElement && target instanceof HTMLSelectElement) {
    target.value = source.value;
  }

  if (source instanceof HTMLCanvasElement && target instanceof HTMLCanvasElement) {
    cloneCanvasContent(source, target);
  }

  const sourceChildren = Array.from(source.children);
  const targetChildren = Array.from(target.children);

  sourceChildren.forEach((child, index) => {
    const targetChild = targetChildren[index];
    if (targetChild) {
      inlineComputedStyles(child, targetChild, resolveStyleValue);
    }
  });
}

function collectFontFaceCss() {
  const fontFaceRules: string[] = [];

  for (const stylesheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;

    try {
      rules = stylesheet.cssRules;
    } catch {
      continue;
    }

    for (const rule of Array.from(rules)) {
      if (rule.type === CSSRule.FONT_FACE_RULE) {
        fontFaceRules.push(rule.cssText);
      }
    }
  }

  return fontFaceRules.join("\n");
}

function createPdfSandboxDocument() {
  const iframe = document.createElement("iframe");

  iframe.setAttribute("aria-hidden", "true");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.opacity = "0";
  iframe.style.pointerEvents = "none";
  iframe.style.border = "0";
  iframe.style.zIndex = "-1";

  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument;
  if (!iframeDoc) {
    iframe.remove();
    throw new Error("Failed to create a PDF export sandbox document.");
  }

  iframeDoc.open();
  iframeDoc.write("<!DOCTYPE html><html><head><meta charset=\"utf-8\"></head><body></body></html>");
  iframeDoc.close();

  const style = iframeDoc.createElement("style");
  style.textContent = `
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
    }
    *, *::before, *::after {
      box-sizing: border-box;
    }
    ${collectFontFaceCss()}
  `;
  iframeDoc.head.appendChild(style);

  return { iframe, iframeDoc };
}

type PdfExportOptions = {
  margin?: number | [number, number] | [number, number, number, number];
  filename?: string;
  image?: {
    type?: "jpeg" | "png" | "webp";
    quality?: number;
  };
  html2canvas?: {
    scale?: number;
    useCORS?: boolean;
    logging?: boolean;
    backgroundColor?: string;
  };
  jsPDF?: {
    unit?: string;
    format?: string | [number, number];
    orientation?: "portrait" | "landscape";
  };
  pagebreak?: {
    mode?: Array<"avoid-all" | "css" | "legacy"> | string;
    before?: string | string[];
    after?: string | string[];
    avoid?: string | string[];
  };
};

export async function downloadElementAsPdf(
  element: HTMLElement,
  filename: string
) {
  const { default: html2pdf } = await import("html2pdf.js");
  const { iframe, iframeDoc } = createPdfSandboxDocument();
  const clonedElement = element.cloneNode(true) as HTMLElement;
  const styleValueResolver = createStyleValueResolver();

  try {
    inlineComputedStyles(element, clonedElement, (property, value) =>
      styleValueResolver.resolve(property, value)
    );
    iframeDoc.body.appendChild(clonedElement);

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });

    if ("fonts" in document) {
      await document.fonts.ready;
    }

    if ("fonts" in iframeDoc) {
      await iframeDoc.fonts.ready;
    }

    const options: PdfExportOptions = {
      margin: [0.35, 0.4, 0.35, 0.4],
      filename,
      image: { type: "jpeg", quality: 0.96 },
      html2canvas: {
        scale: Math.max(1, Math.min(window.devicePixelRatio || 1, 1.5)),
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      },
      jsPDF: {
        unit: "in",
        format: "a4",
        orientation: "portrait",
      },
      pagebreak: {
        mode: ["css", "legacy"],
        avoid: ".pdf-avoid-break",
      },
    };

    const worker = html2pdf();

    await worker
      .set(options)
      .from(clonedElement)
      .save();
  } catch (error) {
    const message = getPdfErrorMessage(error);
    console.error("PDF export failed", error);
    throw new Error(message);
  } finally {
    styleValueResolver.cleanup();
    iframe.remove();
  }
}