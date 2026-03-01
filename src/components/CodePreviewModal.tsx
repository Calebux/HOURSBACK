import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Download, Check, Code2 } from 'lucide-react';
import { Sandpack } from '@codesandbox/sandpack-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';

interface CodePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    files: Record<string, string>;
    primaryFile?: string; // e.g. 'App.tsx' if we specifically want to copy that one
}

export function CodePreviewModal({ isOpen, onClose, files, primaryFile = 'App.tsx' }: CodePreviewModalProps) {
    const [isCopied, setIsCopied] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    if (!isOpen) return null;

    const handleCopy = async () => {
        const contentToCopy = files[primaryFile] || Object.values(files)[0];
        if (!contentToCopy) return;

        try {
            await navigator.clipboard.writeText(contentToCopy);
            setIsCopied(true);
            toast.success('Code copied to clipboard!');
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            toast.error('Failed to copy code');
        }
    };

    const handleDownload = async () => {
        setIsDownloading(true);
        try {
            const zip = new JSZip();

            // Default Vite React Setup files combining user's files

            // Add all AI generated files to an src directory if they aren't already mapped
            Object.entries(files).forEach(([filepath, content]) => {
                const path = filepath.startsWith('/') ? filepath.slice(1) : filepath;
                // Prepend src/ if the filename represents a component or main app
                const finalPath = path.includes('/') ? path : `src/${path}`;
                zip.file(finalPath, content);
            });

            // Add standard boilerplate outside of src
            zip.file('index.html', `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AI Generated App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`);

            zip.file('package.json', JSON.stringify({
                name: "ai-generated-app",
                private: true,
                version: "0.0.0",
                type: "module",
                scripts: {
                    dev: "vite",
                    build: "tsc -b && vite build",
                    preview: "vite preview"
                },
                dependencies: {
                    "react": "^18.3.1",
                    "react-dom": "^18.3.1",
                    "lucide-react": "^0.400.0",
                    "framer-motion": "^11.0.0",
                    "clsx": "^2.1.1",
                    "tailwind-merge": "^2.3.0"
                },
                devDependencies: {
                    "@types/react": "^18.3.3",
                    "@types/react-dom": "^18.3.0",
                    "@vitejs/plugin-react": "^4.3.1",
                    "autoprefixer": "^10.4.19",
                    "postcss": "^8.4.38",
                    "tailwindcss": "^3.4.4",
                    "typescript": "^5.2.2",
                    "vite": "^5.3.1"
                }
            }, null, 2));

            zip.file('vite.config.ts', `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
})`);

            zip.file('tailwind.config.js', `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`);

            zip.file('postcss.config.js', `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`);

            // Ensure there is a main.tsx entrypoint if the AI didn't provide one
            if (!files['main.tsx'] && !files['/main.tsx']) {
                zip.file('src/main.tsx', `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`);
            }

            // Ensure there is a basic index.css if not provided
            if (!files['index.css'] && !files['/index.css']) {
                zip.file('src/index.css', `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply antialiased text-slate-900;
  }
}`);
            }


            const blob = await zip.generateAsync({ type: 'blob' });
            saveAs(blob, 'ai-generated-project.zip');
            toast.success('Project downloaded perfectly!', {
                description: 'Run `npm install` then `npm run dev` to start.'
            });

        } catch (error) {
            console.error(error);
            toast.error('Failed to zip project.');
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-dark/40 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-white w-full max-w-7xl h-[90vh] rounded-3xl shadow-antigravity-2xl overflow-hidden relative flex flex-col border border-brand-dark/10"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-dark/10 bg-brand-light/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-brand-blue/10 text-brand-blue rounded-xl">
                                    <Code2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-brand-dark">Live Code Preview</h2>
                                    <p className="text-xs text-brand-dark/60">Generated by AI running on Vite & React</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleCopy}
                                    className="px-4 py-2 text-sm font-medium text-brand-dark bg-white border border-brand-dark/10 rounded-xl hover:bg-brand-light hover:border-brand-dark/20 transition-all flex items-center gap-2"
                                >
                                    {isCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                    Copy Code
                                </button>
                                <button
                                    onClick={handleDownload}
                                    disabled={isDownloading}
                                    className="px-4 py-2 text-sm font-medium text-white bg-brand-dark rounded-xl hover:bg-brand-dark/90 transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isDownloading ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Download className="w-4 h-4" />
                                    )}
                                    Download Project ZIP
                                </button>
                                <div className="w-px h-8 bg-brand-dark/10 mx-1" />
                                <button
                                    onClick={onClose}
                                    className="p-2 text-brand-dark/50 hover:text-brand-dark hover:bg-brand-dark/5 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Sandpack Environment */}
                        <div className="flex-1 overflow-hidden bg-[#1E1E1E]">
                            <Sandpack
                                template="react-ts"
                                theme="dark"
                                files={{
                                    "/App.tsx": {
                                        code: files['App.tsx'] || files['/src/App.tsx'] || Object.values(files)[0],
                                        active: true
                                    },
                                    // Include any other auxiliary files if they exist
                                    ...Object.entries(files).reduce((acc, [fileName, content]) => {
                                        if (!fileName.includes('App.tsx') && fileName !== Object.keys(files)[0]) {
                                            acc[`/${fileName.replace('/src/', '')}`] = { code: content };
                                        }
                                        return acc;
                                    }, {} as Record<string, any>),
                                }}
                                customSetup={{
                                    dependencies: {
                                        "lucide-react": "^0.378.0",
                                        "framer-motion": "latest",
                                        "clsx": "latest",
                                        "tailwind-merge": "latest"
                                    }
                                }}
                                options={{
                                    showNavigator: true,
                                    showTabs: true,
                                    showLineNumbers: true,
                                    editorHeight: "100%",
                                    classes: {
                                        "sp-layout": "h-full border-none rounded-none rounded-b-3xl bg-transparent",
                                        "sp-editor": "h-full border-none rounded-none",
                                        "sp-preview": "h-full border-l border-white/10 rounded-none bg-white",
                                    }
                                }}
                            />
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
