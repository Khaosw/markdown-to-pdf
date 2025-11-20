import React, { useEffect, useRef, useState } from 'react';

interface PreviewProps {
  markdown: string;
  font: string;
}

interface FrontmatterConfig {
  header?: string;
  date?: string;
  'bg-image'?: string;
  'bg-opacity'?: string;
  'bg-rotate'?: string;
  'bg-fit'?: string;
  [key: string]: string | undefined;
}

const parseFrontmatter = (text: string): { config: FrontmatterConfig; content: string } => {
  // Regex to match YAML-like frontmatter at the start of the file
  // Matches --- followed by content, followed by ---
  const regex = /^---\n([\s\S]*?)\n---\n/;
  const match = text.match(regex);
  
  if (match) {
    const frontmatterBlock = match[1];
    const content = text.replace(match[0], ''); // Remove the full match
    
    const config: FrontmatterConfig = {};
    frontmatterBlock.split('\n').forEach(line => {
      const parts = line.split(':');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        // Rejoin the rest in case the value has colons (e.g. timestamps)
        const value = parts.slice(1).join(':').trim();
        config[key] = value;
      }
    });
    return { config, content };
  }
  
  return { config: {}, content: text };
};

const Preview: React.FC<PreviewProps> = ({ markdown, font }) => {
  // State to hold the array of pages (each page is an array of HTML strings)
  const [pages, setPages] = useState<string[][]>([]);
  const [docConfig, setDocConfig] = useState<FrontmatterConfig>({});
  
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

      // 0. Parse Frontmatter to separate config from content
      const { config, content } = parseFrontmatter(markdown);
      setDocConfig(config);

      // 1. Parse Markdown Content to HTML
      const parseResult = window.marked.parse(content);
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
            continue; 
        }

        const childHeight = child.offsetHeight;
        const childHtml = child.outerHTML;

        // Check if this element fits on the current page
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

  // Date Logic
  const getDisplayDate = () => {
    if (docConfig.date === 'false') return null;
    if (docConfig.date && docConfig.date !== 'true') return docConfig.date;
    
    // Default to today if date is 'true' or undefined but header is present
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const headerText = docConfig.header;
  const dateText = getDisplayDate();
  const showHeader = headerText || (docConfig.date && docConfig.date !== 'false');

  // Background Logic
  const bgImage = docConfig['bg-image'];
  const bgOpacity = docConfig['bg-opacity'] ? parseFloat(docConfig['bg-opacity']) : 1;
  const bgRotate = docConfig['bg-rotate'] || '0';
  // Map configuration to valid CSS background-size
  let bgSize = 'cover'; // Default
  if (docConfig['bg-fit'] === 'stretch') bgSize = '100% 100%';
  else if (docConfig['bg-fit'] === 'contain') bgSize = 'contain';

  const rotationVal = bgRotate.includes('deg') ? bgRotate : `${bgRotate}deg`;

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
                {/* Background Image Layer */}
                {bgImage && (
                  <div 
                    className="absolute inset-0 z-0 pointer-events-none overflow-hidden"
                    style={{
                      backgroundImage: `url("${bgImage}")`,
                      backgroundSize: bgSize,
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                      opacity: bgOpacity,
                      transform: `rotate(${rotationVal})`,
                      transformOrigin: 'center center'
                    }}
                  />
                )}

                {/* Page Header (Configurable) */}
                {showHeader && (
                    <div 
                        className="absolute top-8 left-0 right-0 flex justify-between items-end text-[10px] text-slate-400 uppercase tracking-wider font-medium pb-2 border-b border-slate-100/50 z-10" 
                        style={{ paddingLeft: '15mm', paddingRight: '15mm' }}
                    >
                        <span>{headerText || ''}</span>
                        <span>{dateText || ''}</span>
                    </div>
                )}

                <div 
                    className="pdf-content relative z-10"
                    style={{ fontFamily: font }}
                    dangerouslySetInnerHTML={{ __html: pageContent.join('') }}
                />
                
                {/* Footer: Page X of Y */}
                <div className="absolute bottom-5 left-0 w-full text-center text-xs text-slate-500 font-medium pointer-events-none z-10">
                    Page {index + 1} of {pages.length}
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};

export default Preview;