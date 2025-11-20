import React, { useEffect, useRef, useState } from 'react';

interface PreviewProps {
  markdown: string;
  font: string;
}

const Preview: React.FC<PreviewProps> = ({ markdown, font }) => {
  // State to hold the array of pages (each page is an array of HTML strings)
  const [pages, setPages] = useState<string[][]>([]);
  
  // A ref to a hidden container used for measuring element heights
  const measureRef = useRef<HTMLDivElement>(null);

  // Initialize Marked.js configuration once
  useEffect(() => {
    if (window.marked) {
      // Custom renderer to handle image alignment via URL hash
      window.marked.use({
        renderer: {
          // @ts-ignore - Handling dynamic arguments for Marked v14+ compatibility
          image(tokenOrHref: any, title: string | null, text: string) {
            let href = tokenOrHref;
            let imgTitle = title;
            let imgText = text;

            if (typeof tokenOrHref === 'object' && tokenOrHref !== null) {
                href = tokenOrHref.href;
                imgTitle = tokenOrHref.title;
                imgText = tokenOrHref.text;
            }
            
            if (typeof href !== 'string') return '';

            const [url, rawHash] = href.split('#');
            const hash = rawHash ? rawHash.toLowerCase() : '';
            let className = '';
            
            if (hash === 'left') className = 'align-left';
            else if (hash === 'right') className = 'align-right';
            else if (hash === 'center') className = 'align-center';
            else if (hash === 'full') className = 'align-full';
            else if (hash === 'float-left') className = 'float-left';
            else if (hash === 'float-right') className = 'float-right';
            else if (hash === 'half') className = 'width-half';
            else if (hash === 'third') className = 'width-third';
            
            const titleAttr = imgTitle ? ` title="${imgTitle}"` : '';
            const altAttr = imgText ? ` alt="${imgText}"` : '';
            const classAttr = className ? ` class="${className}"` : '';
            
            return `<img src="${url}"${titleAttr}${altAttr}${classAttr} />`;
          }
        }
      });
    }
  }, []);

  // The Pagination Logic
  useEffect(() => {
    const paginate = async () => {
      if (!window.marked || !measureRef.current) return;

      // 1. Parse Markdown to HTML
      const parseResult = window.marked.parse(markdown);
      const fullHtml = parseResult instanceof Promise ? await parseResult : parseResult;

      // 2. Inject into hidden container to measure
      const measureContainer = measureRef.current;
      measureContainer.innerHTML = fullHtml;
      
      // A4 Calculation (Approximation)
      // 297mm height. Padding 15mm top/bottom. 
      // Available height approx 267mm.
      // In pixels (96dpi): 297mm ~ 1122px. Padding ~ 56px * 2 = 112px.
      // Content Height ~ 1010px.
      // To be safe and allow for footer margins, we use a slightly conservative max height.
      const MAX_PAGE_HEIGHT = 1000; 

      const newPages: string[][] = [];
      let currentPage: string[] = [];
      let currentHeight = 0;

      // 3. Iterate through top-level children (paragraphs, headings, etc.)
      const children = Array.from(measureContainer.children);

      for (let i = 0; i < children.length; i++) {
        const child = children[i] as HTMLElement;
        
        // Explicit Page Break Detection
        if (child.classList.contains('page-break')) {
            // Push current page if not empty
            if (currentPage.length > 0) {
                newPages.push(currentPage);
                currentPage = [];
                currentHeight = 0;
            }
            // Note: We don't add the 'page-break' div itself to the visible page content 
            // because the break is implicit by starting a new array.
            // However, for visualization in 'Screen Mode', we might want to see it?
            // The user logic inserts <div class="page-break"></div>.
            // If we ignore it, it won't show up. Let's check style requirements.
            // Requirement: "‘page break’ do not show in pdf."
            // If we skip adding it to the DOM array, it won't show.
            // But to separate content, we just start a new page loop.
            continue; 
        }

        const childHeight = child.offsetHeight;
        const childHtml = child.outerHTML;

        // Check if this element fits on the current page
        // If it's a huge element (larger than page), we force it onto a new page and let it clip/overflow
        // or we just put it here if page is empty.
        if (currentHeight + childHeight > MAX_PAGE_HEIGHT && currentPage.length > 0) {
            // Content overflow -> New Page
            newPages.push(currentPage);
            currentPage = [childHtml];
            currentHeight = childHeight;
        } else {
            // Fits on page
            currentPage.push(childHtml);
            currentHeight += childHeight;
        }
      }

      // Push the last page
      if (currentPage.length > 0) {
        newPages.push(currentPage);
      }

      // If no content, show at least one empty page
      if (newPages.length === 0) {
          newPages.push(['']);
      }

      setPages(newPages);
    };

    // Debounce slightly to avoid thrashing on every keystroke
    const timer = setTimeout(paginate, 100);
    return () => clearTimeout(timer);

  }, [markdown, font]); // Re-run when markdown or font changes

  // Styles
  // We apply the font family to the outer container so measurement is accurate
  const hiddenMeasureStyle: React.CSSProperties = {
    position: 'absolute',
    top: '-9999px',
    left: '-9999px',
    width: '210mm', // Match the A4 width
    visibility: 'hidden',
    padding: '15mm', // Match padding used in CSS
    fontFamily: font,
    lineHeight: '1.6',
    boxSizing: 'border-box',
  };

  return (
    <div className="flex flex-col items-center bg-slate-200/50 p-4 sm:p-8 overflow-y-auto h-full w-full">
      
      {/* Header / Info */}
      <div className="mb-4 text-slate-500 text-sm font-medium">
        Preview ({pages.length} Page{pages.length !== 1 ? 's' : ''})
      </div>

      {/* Hidden container for measuring calculations */}
      <div ref={measureRef} className="pdf-content" style={hiddenMeasureStyle} />

      {/* The Export Container acts as the wrapper for all pages */}
      <div id="pdf-export-container" style={{ fontFamily: font }}>
        {pages.map((pageContent, index) => (
            <div 
                key={index} 
                className="sheet"
            >
                <div 
                    className="pdf-content"
                    style={{ fontFamily: font }}
                    dangerouslySetInnerHTML={{ __html: pageContent.join('') }}
                />
                
                {/* Footer: Page X of Y */}
                <div className="absolute bottom-5 left-0 w-full text-center text-xs text-slate-500 font-medium pointer-events-none">
                    Page {index + 1} of {pages.length}
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};

export default Preview;