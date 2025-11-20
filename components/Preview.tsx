import React, { useEffect, useRef } from 'react';

interface PreviewProps {
  markdown: string;
  font: string;
}

const Preview: React.FC<PreviewProps> = ({ markdown, font }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize Marked.js configuration once
  useEffect(() => {
    if (window.marked) {
      // Custom renderer to handle image alignment via URL hash
      // Example: ![Alt](image.png#right) -> <img class="align-right" ... />
      window.marked.use({
        renderer: {
          // @ts-ignore - Handling dynamic arguments for Marked v14+ compatibility
          image(tokenOrHref: any, title: string | null, text: string) {
            let href = tokenOrHref;
            let imgTitle = title;
            let imgText = text;

            // Compatibility for Marked v14+ where arguments are passed as an object
            if (typeof tokenOrHref === 'object' && tokenOrHref !== null) {
                href = tokenOrHref.href;
                imgTitle = tokenOrHref.title;
                imgText = tokenOrHref.text;
            }
            
            // Fail gracefully if href is not a string
            if (typeof href !== 'string') return '';

            const [url, hash] = href.split('#');
            let className = '';
            
            if (hash === 'left') className = 'align-left';
            else if (hash === 'right') className = 'align-right';
            else if (hash === 'center') className = 'align-center';
            else if (hash === 'full') className = 'align-full';
            
            const titleAttr = imgTitle ? ` title="${imgTitle}"` : '';
            const altAttr = imgText ? ` alt="${imgText}"` : '';
            const classAttr = className ? ` class="${className}"` : '';
            
            return `<img src="${url}"${titleAttr}${altAttr}${classAttr} />`;
          }
        }
      });
    }
  }, []);

  useEffect(() => {
    if (containerRef.current && window.marked) {
      // Parse markdown to HTML
      const result = window.marked.parse(markdown);
      
      // Handle potential Promise return from marked.parse (in newer versions if async extensions used)
      if (result instanceof Promise) {
          result.then((html) => {
              if (containerRef.current) containerRef.current.innerHTML = html;
          });
      } else {
          containerRef.current.innerHTML = result as string;
      }
    }
  }, [markdown]);

  // Define CSS variables safely for TypeScript
  // We apply the font family here to ensure html2pdf sees it on the root element being exported
  const containerStyle = {
    width: '210mm',
    minHeight: '297mm',
    padding: '15mm',
    boxSizing: 'border-box',
    fontFamily: font, 
  } as React.CSSProperties;

  // Redundantly apply to inner content for immediate screen preview consistency
  const contentStyle = {
    fontFamily: font,
  } as React.CSSProperties;

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
        style={containerStyle}
      >
        <div 
            ref={containerRef} 
            className="pdf-content"
            style={contentStyle}
        >
            {/* Markdown content injected here */}
        </div>
      </div>
    </div>
  );
};

export default Preview;