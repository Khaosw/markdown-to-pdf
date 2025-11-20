import React, { useState, useRef } from 'react';
import { enhanceMarkdown, generateTableOfContents } from './services/geminiService';
import { downloadPDF } from './utils/pdfUtils';
import { EditorMode } from './types';
import Preview from './components/Preview';
import { 
    IconWand, IconDownload, IconEye, IconPen, IconSplit, IconRefresh, IconTrash, IconPageBreak, IconFont, IconImage
} from './components/Icons';

// Default markdown placeholder
const DEFAULT_MARKDOWN = `# Markdown to PDF
## Introduction
Welcome to **MarkPrint AI**! This tool allows you to write Markdown and convert it into a beautifully paginated PDF.

## Features
- **Live Preview**: See how your document looks as you type.
- **AI Enhancement**: Use Gemini to fix grammar, improve tone, or summarize.
- **Manual Pagination**: Insert page breaks exactly where you want them.
- **Custom Fonts**: Switch between Serif, Sans-Serif, and more.
- **Image Layouts**: Align images easily using hash tags.
- **Local Images**: Upload images directly from your computer.

## Image Layout Examples
You can control image alignment by adding hash tags to the image URL.

### Standard Alignment
\`#left\`, \`#center\`, \`#right\`, \`#full\`

![Right Aligned](https://via.placeholder.com/150/FF0000/FFFFFF?text=Right#right)
*This image is right aligned.*

### Text Wrapping
Use \`#float-left\` or \`#float-right\` to wrap text around images.

![Float Left](https://via.placeholder.com/150/0000FF/FFFFFF?text=Float+Left#float-left)
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.

### Grid Layout
Use \`#half\` or \`#third\` to place images side-by-side.

![Half Width 1](https://via.placeholder.com/300x150/008000/FFFFFF?text=Half+Width+1#half) ![Half Width 2](https://via.placeholder.com/300x150/FFA500/FFFFFF?text=Half+Width+2#half)

## Typography
> "Design is not just what it looks like and feels like. Design is how it works." - Steve Jobs

### Lists
1. First item
2. Second item
   - Sub item A
   - Sub item B
3. Third item

## Conclusion
Start editing on the left panel to see changes instantly!
`;

// Font options - using standard unquoted names where possible for broad compatibility
const FONT_OPTIONS = [
    { name: 'Inter', value: 'Inter, sans-serif', label: 'Inter (Sans)' },
    { name: 'Merriweather', value: 'Merriweather, serif', label: 'Merriweather (Serif)' },
    { name: 'Roboto', value: 'Roboto, sans-serif', label: 'Roboto (Sans)' },
    { name: 'Lora', value: 'Lora, serif', label: 'Lora (Serif)' },
];

const App: React.FC = () => {
  const [markdown, setMarkdown] = useState<string>(DEFAULT_MARKDOWN);
  const [mode, setMode] = useState<EditorMode>(EditorMode.SPLIT);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showAiMenu, setShowAiMenu] = useState(false);
  const [showFontMenu, setShowFontMenu] = useState(false);
  const [selectedFont, setSelectedFont] = useState(FONT_OPTIONS[0].value);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAiAction = async (action: 'grammar' | 'professional' | 'toc' | 'summarize') => {
    setIsEnhancing(true);
    setShowAiMenu(false);
    try {
        let newText = "";
        if (action === 'toc') {
            const toc = await generateTableOfContents(markdown);
            newText = toc + "\n\n" + markdown;
        } else {
            let instruction = "";
            switch(action) {
                case 'grammar': instruction = "Fix grammar and spelling mistakes."; break;
                case 'professional': instruction = "Rewrite this to sound more professional and authoritative."; break;
                case 'summarize': instruction = "Provide a summary of this content at the beginning."; break;
            }
            newText = await enhanceMarkdown(markdown, instruction);
        }
        setMarkdown(newText);
    } catch (e) {
        alert("AI enhancement failed. Please check console.");
    } finally {
        setIsEnhancing(false);
    }
  };

  const handleDownload = async () => {
    setIsGeneratingPdf(true);
    // Small delay to allow UI to update status
    setTimeout(async () => {
        await downloadPDF('pdf-export-container', 'my-document.pdf');
        setIsGeneratingPdf(false);
    }, 100);
  };

  const insertPageBreak = () => {
    const breakMarker = '\n\n<div class="page-break"></div>\n\n';
    if (textareaRef.current) {
        const start = textareaRef.current.selectionStart;
        const end = textareaRef.current.selectionEnd;
        const newMarkdown = markdown.substring(0, start) + breakMarker + markdown.substring(end);
        setMarkdown(newMarkdown);
        
        // Return focus to textarea after state update
        setTimeout(() => {
            if(textareaRef.current) {
                textareaRef.current.focus();
                const newCursorPos = start + breakMarker.length;
                textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
            }
        }, 0);
    } else {
        setMarkdown(markdown + breakMarker);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const base64 = e.target?.result as string;
        const imageName = file.name.split('.')[0] || 'Image';
        // Create markdown syntax: ![ImageName](data:image/png;base64,...)
        const imageMarkdown = `![${imageName}](${base64})`;

        if (textareaRef.current) {
            const start = textareaRef.current.selectionStart;
            const end = textareaRef.current.selectionEnd;
            const newMarkdown = markdown.substring(0, start) + imageMarkdown + markdown.substring(end);
            setMarkdown(newMarkdown);
            
            // Restore focus but don't select the huge base64 string to avoid scrolling issues
            setTimeout(() => {
                if(textareaRef.current) {
                    textareaRef.current.focus();
                    const newCursorPos = start + imageMarkdown.length;
                    textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
                }
            }, 0);
        } else {
            setMarkdown(markdown + '\n' + imageMarkdown);
        }
    };
    reader.readAsDataURL(file);
    
    // Reset input value so the same file can be selected again if needed
    if (event.target.value) event.target.value = '';
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 text-slate-900 overflow-hidden">
      {/* Hidden File Input */}
      <input 
        type="file" 
        accept="image/*" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={handleFileChange}
      />

      {/* Header */}
      <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                <span className="font-bold text-xl text-white">M</span>
            </div>
            <h1 className="font-bold text-xl tracking-tight text-slate-800">MarkPrint AI</h1>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button 
                onClick={() => setMode(EditorMode.WRITE)}
                className={`p-2 rounded-md transition-all ${mode === EditorMode.WRITE ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                title="Editor Only"
            >
                <IconPen />
            </button>
            <button 
                onClick={() => setMode(EditorMode.SPLIT)}
                className={`hidden sm:block p-2 rounded-md transition-all ${mode === EditorMode.SPLIT ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                title="Split View"
            >
                <IconSplit />
            </button>
            <button 
                onClick={() => setMode(EditorMode.PREVIEW)}
                className={`p-2 rounded-md transition-all ${mode === EditorMode.PREVIEW ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                title="Preview Only"
            >
                <IconEye />
            </button>
        </div>

        <div className="flex items-center gap-3">
            {/* Font Menu Dropdown */}
            <div className="relative">
                <button
                    onClick={() => setShowFontMenu(!showFontMenu)}
                    className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-medium transition-all"
                    title="Change Font"
                >
                    <IconFont />
                    <span className="hidden lg:inline text-sm">{FONT_OPTIONS.find(f => f.value === selectedFont)?.name}</span>
                </button>

                {showFontMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden z-50 ring-1 ring-black/5">
                         <div className="p-2 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50">Select Font</div>
                        {FONT_OPTIONS.map((option) => (
                            <button
                                key={option.name}
                                onClick={() => {
                                    setSelectedFont(option.value);
                                    setShowFontMenu(false);
                                }}
                                className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center justify-between ${
                                    selectedFont === option.value 
                                    ? 'bg-blue-50 text-blue-700 font-medium' 
                                    : 'text-slate-700 hover:bg-slate-50'
                                }`}
                                style={{ fontFamily: option.value }}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* AI Menu Dropdown */}
            <div className="relative">
                <button 
                    onClick={() => setShowAiMenu(!showAiMenu)}
                    disabled={isEnhancing}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-all shadow-md shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isEnhancing ? <IconRefresh className="animate-spin" /> : <IconWand />}
                    <span className="hidden sm:inline">{isEnhancing ? 'Enhancing...' : 'AI Enhance'}</span>
                </button>
                
                {showAiMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden z-50 ring-1 ring-black/5">
                        <div className="p-2 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50">Improvement</div>
                        <button onClick={() => handleAiAction('grammar')} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors">Fix Grammar</button>
                        <button onClick={() => handleAiAction('professional')} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors">Make Professional</button>
                        <div className="border-t border-slate-100 my-1"></div>
                        <div className="p-2 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50">Structure</div>
                        <button onClick={() => handleAiAction('summarize')} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors">Add Summary</button>
                        <button onClick={() => handleAiAction('toc')} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors">Generate Table of Contents</button>
                    </div>
                )}
            </div>

            <button 
                onClick={handleDownload}
                disabled={isGeneratingPdf}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-all shadow-md shadow-slate-800/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isGeneratingPdf ? <IconRefresh className="animate-spin" /> : <IconDownload />}
                <span className="hidden sm:inline">{isGeneratingPdf ? 'Exporting...' : 'Export PDF'}</span>
            </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Backdrop for mobile mode toggle */}
        {(showAiMenu || showFontMenu) && (
             <div className="fixed inset-0 z-40 bg-transparent" onClick={() => { setShowAiMenu(false); setShowFontMenu(false); }}></div>
        )}

        {/* Editor Panel */}
        <div className={`
            flex flex-col border-r border-slate-200 bg-white
            ${mode === EditorMode.SPLIT ? 'w-1/2' : mode === EditorMode.WRITE ? 'w-full' : 'hidden'}
            transition-all duration-300
        `}>
            <div className="bg-slate-50 px-4 py-2 text-xs font-mono text-slate-500 flex justify-between items-center border-b border-slate-200">
                <span className="font-semibold tracking-wider">MARKDOWN</span>
                <div className="flex gap-3 items-center">
                    <button 
                        onClick={handleImageClick} 
                        className="text-slate-600 hover:text-blue-600 flex items-center gap-1 transition-colors"
                        title="Insert Local Image"
                    >
                        <IconImage className="w-3 h-3" /> Image
                    </button>
                    <div className="w-px h-4 bg-slate-300"></div>
                    <button 
                        onClick={insertPageBreak} 
                        className="text-slate-600 hover:text-blue-600 flex items-center gap-1 transition-colors"
                        title="Insert Page Break for PDF"
                    >
                        <IconPageBreak className="w-3 h-3" /> Page Break
                    </button>
                    <div className="w-px h-4 bg-slate-300"></div>
                    <button onClick={() => setMarkdown('')} className="text-slate-600 hover:text-red-500 flex items-center gap-1 transition-colors">
                        <IconTrash className="w-3 h-3" /> Clear
                    </button>
                </div>
            </div>
            <textarea
                ref={textareaRef}
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                className="flex-1 w-full bg-white text-slate-800 p-6 resize-none outline-none font-mono text-sm leading-relaxed focus:bg-slate-50/50 transition-colors"
                placeholder="# Start typing your markdown here..."
                spellCheck={false}
            />
        </div>

        {/* Preview Panel */}
        <div className={`
            relative bg-slate-100
            ${mode === EditorMode.SPLIT ? 'w-1/2' : mode === EditorMode.PREVIEW ? 'w-full' : 'hidden'}
            transition-all duration-300
        `}>
             {/* Only render preview if we have content or we need to maintain layout */}
            <Preview markdown={markdown} font={selectedFont} />
        </div>
      </main>
    </div>
  );
};

export default App;