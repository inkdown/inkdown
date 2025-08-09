import { ReleaseCard } from './components/release-card';
import { releasesData } from './releases-data';
import { ReleasesSidebar } from './components/releases-sidebar';
import { useScrollSpy } from '@/hooks/use-scroll-spy';

const formatId = (version: string) => version.replace(/\./g, '-');

export default function ReleasesPage() {
  const releaseIds = releasesData.map(release => formatId(release.version));
  const selectors = releaseIds.map(id => `#${id}`);
  const activeId = useScrollSpy(selectors, {
    rootMargin: '0% 0% -80% 0%',
  });

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white">
      {/* Header Section */}
      <section className="relative w-full pt-24 pb-16 bg-slate-50 dark:bg-slate-950 overflow-hidden">
        <div className="absolute top-0 left-0 -z-10 h-full w-full bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-block rounded-lg bg-indigo-100 dark:bg-indigo-900/30 px-3 py-1 text-sm font-medium text-indigo-600 dark:text-indigo-400 mb-6">
              Notas de Versão
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6">
              Veja o que há de novo no Inkdown
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Acompanhe todas as melhorias, correções e novos recursos que estamos trazendo para tornar sua experiência ainda melhor.
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="w-full py-12 bg-white dark:bg-slate-900">
        <div className="container max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-start gap-12">
            <ReleasesSidebar
              releases={releasesData}
              activeId={activeId || formatId(releasesData[0].version)}
            />
            <main className="flex-1 space-y-16">
              {releasesData.map(release => (
                <section
                  key={release.version}
                  id={formatId(release.version)}
                  className="scroll-mt-24">
                  <ReleaseCard release={release} />
                </section>
              ))}
            </main>
          </div>
        </div>
      </section>
    </div>
  );
}