import { ReleaseCard } from './components/release-card';
import { releasesData } from './releases-data';
import { ReleasesSidebar } from './components/releases-sidebar';
import { useScrollSpy } from '@/hooks/use-scroll-spy';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { ArrowLeft } from 'lucide-react';

const formatId = (version: string) => `v${version.replace(/\./g, '-')}`;

export default function ReleasesPage() {
 const releaseIds = releasesData.map(release => formatId(release.version));
 const selectors = releaseIds.map(id => `#${id}`);
 const activeId = useScrollSpy(selectors, {
  rootMargin: '0% 0% -80% 0%',
 });

 return (
  <div className="min-h-screen bg-white text-slate-900 ">
   {/* Header */}
   <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-sm">
    <div className="container mx-auto flex h-16 items-center px-4 md:px-6">
     <Logo type="dark" />
     <nav className="ml-auto flex items-center space-x-4">
      <Button variant="ghost" asChild>
       <Link to="/" className="flex items-center gap-2 text-slate-600 hover:text-slate-900 ">
        <ArrowLeft className="w-4 h-4" />
        Voltar ao início
       </Link>
      </Button>
     </nav>
    </div>
   </header>

   {/* Header Section */}
   <section className="relative w-full pt-24 pb-16 bg-slate-50 overflow-hidden">
    <div className="absolute top-0 left-0 -z-10 h-full w-full bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
    <div className="container mx-auto px-4 md:px-6">
     <div className="text-center max-w-4xl mx-auto">
      <div className="inline-block rounded-lg bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-600 mb-6">
       Notas de Versão
      </div>
      <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold tracking-tight text-slate-900 mb-6">
       Veja o que há de novo no Inkdown
      </h1>
      <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto">
       Acompanhe todas as melhorias, correções e novos recursos que estamos trazendo para tornar sua experiência ainda melhor.
      </p>
     </div>
    </div>
   </section>

   {/* Content Section */}
   <section className="w-full py-12 bg-white ">
    <div className="container max-w-7xl mx-auto px-4 md:px-6">
     <div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-12">
      <ReleasesSidebar
       releases={releasesData}
       activeId={activeId || formatId(releasesData[0].version)}
      />
      <main className="flex-1 w-full space-y-16">
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