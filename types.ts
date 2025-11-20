export enum EditorMode {
    WRITE = 'WRITE',
    PREVIEW = 'PREVIEW',
    SPLIT = 'SPLIT'
  }
  
  export interface AIRequestConfig {
    text: string;
    instruction: string;
  }
  
  // Declare global libraries loaded via CDN
  declare global {
    interface Window {
      marked: {
        parse: (text: string) => string | Promise<string>;
        use: (options: any) => void;
      };
      html2pdf: () => {
        set: (opt: any) => any;
        from: (element: HTMLElement) => any;
        save: () => Promise<void>;
        toPdf: () => any;
        getPdf: (cb: (pdf: any) => void) => any;
      };
    }
  }
  
  // Type for html2pdf options
  export interface Html2PdfOptions {
    margin: number | [number, number, number, number];
    filename: string;
    image: { type: string; quality: number };
    html2canvas: { scale: number; useCORS: boolean; logging: boolean };
    jsPDF: { unit: string; format: string; orientation: string };
    pagebreak?: { mode?: string[]; before?: string[]; avoid?: string[] };
  }