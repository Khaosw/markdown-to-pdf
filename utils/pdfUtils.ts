import { Html2PdfOptions } from "../types";

export const downloadPDF = async (elementId: string, filename: string = 'document.pdf') => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    return;
  }

  // Add specific class to hide shadows/margins and prepare for print
  element.classList.add('exporting-pdf');

  // Because we are now pre-paginating content into 297mm height divs,
  // we want html2pdf to simply print them one after another.
  // We rely on the CSS `page-break-before` in the .sheet class.
  
  const opt: Html2PdfOptions = {
    margin: 0, // We handle margins inside the .sheet div (padding)
    filename: filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
        scale: 2, 
        useCORS: true, 
        logging: false,
        // Ensure we capture the full height of the stacked pages
        scrollY: 0,
        // Ensure background is white to prevent transparency issues
        backgroundColor: '#ffffff'
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { 
        mode: ['css', 'legacy'], 
        // We still want to avoid breaking inside specific elements if they happen to be huge
        // but largely our custom pagination handles this.
        avoid: ['tr', 'blockquote', 'pre', 'img', 'h1', 'h2', 'h3', 'table'] 
    }
  };

  if (window.html2pdf) {
    try {
        await window.html2pdf().set(opt).from(element).save();
    } catch (e) {
        console.error("PDF Generation failed", e);
        alert("Failed to generate PDF. See console for details.");
    } finally {
        element.classList.remove('exporting-pdf');
    }
  } else {
    alert("PDF library not loaded. Please refresh the page.");
    element.classList.remove('exporting-pdf');
  }
};