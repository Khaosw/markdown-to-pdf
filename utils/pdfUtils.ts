import { Html2PdfOptions } from "../types";

export const downloadPDF = async (elementId: string, filename: string = 'document.pdf') => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    return;
  }

  // Add specific class to hide "Screen Only" elements like page break visualizers
  element.classList.add('exporting-pdf');

  const opt: Html2PdfOptions = {
    margin: [15, 15, 15, 15], // mm: top, left, bottom, right
    filename: filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
        scale: 2, // Higher scale for better resolution
        useCORS: true, // Allow loading external images
        logging: false 
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { 
        mode: ['css', 'legacy'], 
        // Avoid breaking inside these elements to keep them intact
        avoid: ['tr', 'blockquote', 'pre', 'img', 'h1', 'h2', 'h3', 'table'] 
    }
  };

  // We use the global window.html2pdf loaded from CDN
  if (window.html2pdf) {
    try {
        // Important: html2pdf is async.
        // We need to ensure the class is removed ONLY after generation.
        await window.html2pdf().set(opt).from(element).save();
    } catch (e) {
        console.error("PDF Generation failed", e);
        alert("Failed to generate PDF. See console for details.");
    } finally {
        // Always remove the class to restore screen state
        element.classList.remove('exporting-pdf');
    }
  } else {
    alert("PDF library not loaded. Please refresh the page.");
    element.classList.remove('exporting-pdf');
  }
};