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

export async function downloadElementAsPdf(
  element: HTMLElement,
  filename: string
) {
  const { default: html2pdf } = await import("html2pdf.js");

  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });

  await html2pdf()
    .set({
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
        compressPDF: true,
      },
      pagebreak: {
        mode: ["css", "legacy"],
        avoid: ".pdf-avoid-break",
      },
    })
    .from(element)
    .save();
}