declare module 'pdf-parse' {
  interface PdfData {
    text: string;
    numpages: number;
    numrender: number;
    info: any;
    metadata: any;
    version: string;
  }

  function pdfParse(dataBuffer: Buffer, options?: any): Promise<PdfData>;
  
  export = pdfParse;
}