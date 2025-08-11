import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { WindowsLogo } from '@/components/logos/WindowsLogo';
import { AppleLogo } from '@/components/logos/AppleLogo';
import { LinuxLogo } from '@/components/logos/LinuxLogo';
import DownloadCard from '@/components/ui/download-card';
import { Logo } from '@/components/logo';
import { ArrowLeft, Download } from 'lucide-react';

const DownloadsPage: React.FC = () => {
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

   {/* Hero Section */}
   <section className="relative w-full pt-24 pb-16 bg-slate-50 overflow-hidden">
    <div className="absolute top-0 left-0 -z-10 h-full w-full bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
    <div className="container mx-auto px-4 md:px-6">
     <div className="text-center max-w-4xl mx-auto">
      <div className="inline-flex items-center gap-2 rounded-lg bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-600 mb-6">
       <Download className="w-4 h-4" />
       Downloads
      </div>
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 mb-6">
       Baixe o Inkdown para seu sistema
      </h1>
      <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8">
       Disponível para Windows, macOS e Linux. Escolha a versão adequada para sua plataforma e comece a escrever sem distrações.
      </p>
     </div>
    </div>
   </section>

   {/* Downloads Section */}
   <section className="w-full py-20 md:py-28 bg-white ">
    <div className="container mx-auto px-4 md:px-6">
     <div className="max-w-7xl mx-auto">
      {/* Desktop Platforms */}
      <div className="mb-16">
       <div className="flex items-center gap-3 mb-8">
        <div className="w-1 h-8 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full"></div>
        <h3 className="text-2xl font-bold">Plataformas Desktop</h3>
       </div>
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <DownloadCard
         title="Windows"
         logo={<WindowsLogo />}
         options={[
          { label: ".msi", value: "msi" },
         ]}
        />
        <DownloadCard
         title="macOS"
         logo={<AppleLogo />}
         options={[
          { label: "Intel", value: "intel" },
          { label: "Silicon", value: "silicon" },
         ]}
        />
        <DownloadCard
         title="Linux"
         logo={<LinuxLogo />}
         options={[
          { label: ".deb", value: "deb" },
          { label: "AppImage", value: "appimage" },
          { label: "Rpm", value: "rpm" },
         ]}
        />
       </div>
      </div>

      {/* Mobile Platforms - Coming Soon */}
      <div className="mb-16">
       <div className="flex items-center gap-3 mb-8">
        <div className="w-1 h-8 bg-gradient-to-b from-purple-500 to-pink-600 rounded-full"></div>
        <div className="flex items-center gap-3">
         <h3 className="text-2xl font-bold">Plataformas Mobile</h3>
         <span className="inline-block rounded-lg bg-gradient-to-r from-purple-100 to-pink-100  px-3 py-1 text-sm font-medium text-purple-600 ">
          Em Breve
         </span>
        </div>
       </div>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
        {/* Android Card */}
        <div className="relative flex flex-col items-center text-center p-8 bg-gradient-to-br from-slate-50 to-slate-100  rounded-xl border border-slate-200 overflow-hidden">
         <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-400/20 to-green-600/20 rounded-full -mr-12 -mt-12"></div>
         <div className="w-16 h-16 mb-4 text-slate-400 opacity-60">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
           <path d="M17.523 15.3414c-.5665 0-1.0265-.4593-1.0265-1.026 0-.5686.4597-1.0273 1.0265-1.0273.5648 0 1.0246.4587 1.0246 1.0273 0 .5667-.4598 1.026-1.0246 1.026m-11.046 0c-.5665 0-1.0265-.4593-1.0265-1.026 0-.5686.4597-1.0273 1.0265-1.0273.5648 0 1.0246.4587 1.0246 1.0273 0 .5667-.4598 1.026-1.0246 1.026m11.4135-6.7248c-.2809-.4971-.8074-.6772-1.2446-.4472-.4473.2319-.6163.7584-.3954 1.2555.8154 1.3108 1.1324 2.7964 1.1324 4.236 0 .0954-.0093.1879-.0116.2843.0023-.0964.0116-.1889.0116-.2843 0-1.4396-.3152-2.9252-1.1304-4.236-.2302-.4971-.0493-1.0236.4473-1.2555.4372-.23.9637-.0499 1.2446.4472z"/>
          </svg>
         </div>
         <h3 className="text-2xl font-bold mb-4 text-slate-600 ">Android</h3>
         <p className="text-slate-500 text-sm mb-6">
          Aguarde a versão mobile do Inkdown para Android, com todas as funcionalidades que você já conhece.
         </p>
         <button 
          disabled 
          className="w-full px-6 py-3 bg-slate-200 text-slate-400 rounded-lg cursor-not-allowed"
         >
          Em Desenvolvimento
         </button>
        </div>

        {/* iOS Card */}
        <div className="relative flex flex-col items-center text-center p-8 bg-gradient-to-br from-slate-50 to-slate-100  rounded-xl border border-slate-200 overflow-hidden">
         <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-400/20 to-blue-600/20 rounded-full -mr-12 -mt-12"></div>
         <div className="w-16 h-16 mb-4 text-slate-400 opacity-60">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
           <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
          </svg>
         </div>
         <h3 className="text-2xl font-bold mb-4 text-slate-600 ">iOS</h3>
         <p className="text-slate-500 text-sm mb-6">
          A versão para iPhone e iPad está sendo planejada com cuidado para oferecer a melhor experiência mobile.
         </p>
         <button 
          disabled 
          className="w-full px-6 py-3 bg-slate-200 text-slate-400 rounded-lg cursor-not-allowed"
         >
          Em Planejamento
         </button>
        </div>
       </div>
      </div>

     </div>
    </div>
   </section>


   {/* System Requirements */}
   <section className="w-full py-20 md:py-28 bg-white ">
    <div className="container mx-auto px-4 md:px-6">
     <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
       Requisitos do Sistema
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
       <div className="bg-slate-50 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
         <WindowsLogo className="w-8 h-8" />
         <h3 className="text-xl font-semibold">Windows</h3>
        </div>
        <ul className="space-y-2 text-sm text-slate-600 ">
         <li>• Windows 10 ou superior</li>
         <li>• 4GB de RAM</li>
         <li>• 100MB de espaço em disco</li>
        </ul>
       </div>
       
       <div className="bg-slate-50 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
         <AppleLogo className="w-8 h-8" />
         <h3 className="text-xl font-semibold">macOS</h3>
        </div>
        <ul className="space-y-2 text-sm text-slate-600 ">
         <li>• macOS 10.15 ou superior</li>
         <li>• 4GB de RAM</li>
         <li>• 100MB de espaço em disco</li>
        </ul>
       </div>
       
       <div className="bg-slate-50 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
         <LinuxLogo className="w-8 h-8" />
         <h3 className="text-xl font-semibold">Linux</h3>
        </div>
        <ul className="space-y-2 text-sm text-slate-600 ">
         <li>• Ubuntu 18.04+, Debian 10+</li>
         <li>• 4GB de RAM</li>
         <li>• 100MB de espaço em disco</li>
        </ul>
       </div>
      </div>
     </div>
    </div>
   </section>

   {/* Footer */}
   <footer className="w-full bg-white border-t border-slate-200 ">
    <div className="container mx-auto py-8 px-4 md:px-6 flex flex-col md:flex-row items-center justify-between">
     <div className="flex flex-col items-center md:items-start">
      <Logo type="dark" />
      <p className="mt-2 text-xs text-slate-500 ">&copy; 2025 Inkdown. Todos os direitos reservados.</p>
     </div>
     <nav className="flex gap-4 sm:gap-6 mt-4 md:mt-0">
      <Link to="/docs" className="text-xs text-slate-600 hover:underline underline-offset-4">
       Docs
      </Link>
      <Link to="/releases" className="text-xs text-slate-600 hover:underline underline-offset-4">
       Releases
      </Link>
      <Link to="#" className="text-xs text-slate-600 hover:underline underline-offset-4">
       Termos
      </Link>
      <Link to="#" className="text-xs text-slate-600 hover:underline underline-offset-4">
       Privacidade
      </Link>
     </nav>
    </div>
   </footer>
  </div>
 );
};

export default DownloadsPage;