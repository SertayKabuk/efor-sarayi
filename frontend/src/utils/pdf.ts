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
  const exportHost = document.createElement("div");
  const clonedElement = element.cloneNode(true) as HTMLElement;

  exportHost.setAttribute("data-pdf-export-host", "true");
  exportHost.style.position = "fixed";
  exportHost.style.top = "0";
  exportHost.style.left = "0";
  exportHost.style.opacity = "0";
  exportHost.style.pointerEvents = "none";
  exportHost.style.zIndex = "-1";
  exportHost.style.background = "#ffffff";
  exportHost.style.padding = "0";
  exportHost.style.margin = "0";
  exportHost.style.overflow = "hidden";

  exportHost.appendChild(clonedElement);
  document.body.appendChild(exportHost);

  try {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });

    if ("fonts" in document) {
      await document.fonts.ready;
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
    exportHost.remove();
  }
}