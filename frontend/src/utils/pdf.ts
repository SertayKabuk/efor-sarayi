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

  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });

  const options: PdfExportOptions = {
    margin: [0.35, 0.4, 0.35, 0.4],
    filename,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: {
      scale: Math.min(window.devicePixelRatio || 1, 2),
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
    .from(element)
    .save();
}