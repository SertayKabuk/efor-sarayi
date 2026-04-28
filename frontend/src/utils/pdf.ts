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

function createPdfSandboxDocument() {
  const iframe = document.createElement("iframe");

  iframe.setAttribute("aria-hidden", "true");
  iframe.style.position = "fixed";
  iframe.style.left = "-100000px";
  iframe.style.top = "0";
  iframe.style.width = "1200px";
  iframe.style.height = "1200px";
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

  for (const node of Array.from(document.head.querySelectorAll("style, link[rel='stylesheet']"))) {
    iframeDoc.head.appendChild(node.cloneNode(true));
  }

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
  `;
  iframeDoc.head.appendChild(style);

  return { iframe, iframeDoc };
}

function createPageCanvas(source: HTMLCanvasElement, startY: number, height: number) {
  const pageCanvas = document.createElement("canvas");
  pageCanvas.width = source.width;
  pageCanvas.height = height;

  const context = pageCanvas.getContext("2d");
  if (!context) {
    throw new Error("Failed to create a PDF page canvas.");
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
  context.drawImage(
    source,
    0,
    startY,
    source.width,
    height,
    0,
    0,
    source.width,
    height
  );

  return pageCanvas;
}

async function waitForStylesheets(targetDoc: Document) {
  const links = Array.from(targetDoc.querySelectorAll("link[rel='stylesheet']"));

  await Promise.all(
    links.map(
      (link) =>
        new Promise<void>((resolve) => {
          if ((link as HTMLLinkElement).sheet) {
            resolve();
            return;
          }

          const finish = () => resolve();
          link.addEventListener("load", finish, { once: true });
          link.addEventListener("error", finish, { once: true });
        })
    )
  );
}

export async function downloadElementAsPdf(
  element: HTMLElement,
  filename: string
) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas-pro"),
    import("jspdf"),
  ]);
  const { iframe, iframeDoc } = createPdfSandboxDocument();
  const clonedElement = element.cloneNode(true) as HTMLElement;

  try {
    iframeDoc.body.appendChild(clonedElement);

    await waitForStylesheets(iframeDoc);

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });

    if ("fonts" in iframeDoc) {
      await iframeDoc.fonts.ready;
    }

    const canvas = await html2canvas(clonedElement, {
      scale: Math.max(1, Math.min(window.devicePixelRatio || 1, 1.5)),
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      windowWidth: Math.max(clonedElement.scrollWidth, clonedElement.clientWidth, 1200),
      windowHeight: Math.max(clonedElement.scrollHeight, clonedElement.clientHeight, 1200),
      foreignObjectRendering: true,
    });

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
      compress: true,
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const horizontalMargin = 28.8;
    const verticalMargin = 25.2;
    const contentWidth = pageWidth - horizontalMargin * 2;
    const contentHeight = pageHeight - verticalMargin * 2;
    const pixelsPerPage = Math.max(
      1,
      Math.floor((contentHeight / contentWidth) * canvas.width)
    );

    let offsetY = 0;
    let firstPage = true;

    while (offsetY < canvas.height) {
      const sliceHeight = Math.min(pixelsPerPage, canvas.height - offsetY);
      const pageCanvas = createPageCanvas(canvas, offsetY, sliceHeight);
      const imageData = pageCanvas.toDataURL("image/jpeg", 0.96);
      const renderedHeight = (sliceHeight / canvas.width) * contentWidth;

      if (!firstPage) {
        doc.addPage();
      }

      doc.addImage(
        imageData,
        "JPEG",
        horizontalMargin,
        verticalMargin,
        contentWidth,
        renderedHeight,
        undefined,
        "FAST"
      );

      offsetY += sliceHeight;
      firstPage = false;
    }

    doc.save(filename);
  } catch (error) {
    const message = getPdfErrorMessage(error);
    console.error("PDF export failed", error);
    throw new Error(message);
  } finally {
    iframe.remove();
  }
}