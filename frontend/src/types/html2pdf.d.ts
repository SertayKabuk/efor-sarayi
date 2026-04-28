declare module "html2pdf.js" {
  interface Html2PdfOptions {
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
      compressPDF?: boolean;
    };
    pagebreak?: {
      mode?: Array<"avoid-all" | "css" | "legacy"> | string;
      before?: string | string[];
      after?: string | string[];
      avoid?: string | string[];
    };
  }

  interface Html2PdfWorker {
    set(options: Html2PdfOptions): Html2PdfWorker;
    from(source: HTMLElement | string): Html2PdfWorker;
    save(filename?: string): Promise<void>;
  }

  interface Html2PdfFactory {
    (): Html2PdfWorker;
  }

  const html2pdf: Html2PdfFactory;
  export default html2pdf;
}