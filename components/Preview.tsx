import React, { useEffect, useRef } from 'react';

interface PreviewProps {
  markdown: string;
  font: string;
}

const Preview: React.FC<PreviewProps> = ({ markdown, font }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && window.marked) {
      // Parse markdown to HTML
      const html = window.marked.parse(markdown);
      containerRef.current.innerHTML = html;
    }
  }, [markdown]);

  return (
    <div className="flex flex-col items-center bg-slate-100 p-4 sm:p-8 overflow-y-auto h-full w-full">
        <div className="mb-4 text-slate-500 text-sm font-medium">
            Preview (A4 PDF Output)
        </div>
        
      {/* 
        A4 Dimensions in pixels at 96 DPI are approx 794px x 1123px.
        However, for screen viewing we often scale it or just use mm units in CSS.
        Width 210mm is standard A4 width.
      */}
      <div 
        id="pdf-export-container"
        className="bg-white shadow-xl transition-all duration-300 ease-in-out border border-slate-200"
        style={{
            width: '210mm',
            minHeight: '297mm',
            padding: '15mm', // Matches the PDF margin settings
            boxSizing: 'border-box'
        }}
      >
        <div 
            ref={containerRef} 
            className="pdf-content"
            style={{ fontFamily: font }}
        >
            {/* Markdown content injected here */}
        </div>
      </div>
    </div>
  );
};

export default Preview;