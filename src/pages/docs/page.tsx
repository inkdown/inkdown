import React, { useState, useEffect } from 'react';
import MarkdownRenderer from './components/markdown-renderer';
import Sidebar from './components/sidebar';
import { useParams } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const DocsPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [markdownContent, setMarkdownContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const fileName = slug || 'installation'; // Default to installation

  useEffect(() => {
    const fetchMarkdown = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/docs/content/${fileName}.md`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        setMarkdownContent(text);
      } catch (error) {
        console.error("Failed to fetch markdown:", error);
        setMarkdownContent('# Erro\nNão foi possível carregar o conteúdo da documentação.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMarkdown();
  }, [fileName]);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white">
      {/* Header Section */}
      <section className="relative w-full pt-24 pb-16 bg-slate-50 dark:bg-slate-950 overflow-hidden">
        <div className="absolute top-0 left-0 -z-10 h-full w-full bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-block rounded-lg bg-indigo-100 dark:bg-indigo-900/30 px-3 py-1 text-sm font-medium text-indigo-600 dark:text-indigo-400 mb-6">
              Documentação
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6">
              Aprenda a usar o Inkdown
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Guias completos, tutoriais e referências para você aproveitar ao máximo o seu editor de markdown.
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="w-full bg-white dark:bg-slate-900">
        <div className="flex min-h-screen">
          {/* Desktop Sidebar */}
          <div className="hidden md:block">
            <Sidebar />
          </div>

          {/* Mobile Sidebar */}
          {isSidebarOpen && (
            <div className="fixed inset-0 z-50 md:hidden">
              <div className="absolute inset-0 bg-black/50" onClick={() => setIsSidebarOpen(false)} />
              <div className="relative w-72 h-full">
                <Sidebar onLinkClick={() => setIsSidebarOpen(false)} />
              </div>
            </div>
          )}

          <main className="flex-1 overflow-y-auto">
            {/* Mobile Header */}
            <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 sticky top-0 z-40">
              <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Documentação</h1>
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="max-w-4xl mx-auto py-6 md:py-12 px-4 md:px-8">
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-slate-600 dark:text-slate-400">Carregando documentação...</span>
                  </div>
                </div>
              ) : (
                <MarkdownRenderer content={markdownContent} />
              )}
            </div>
          </main>
        </div>
      </section>
    </div>
  );
};

export default DocsPage;
