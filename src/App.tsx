import { Button } from "./components/ui/button";
import { Logo } from "./components/logo";
import { Link } from "react-router-dom";
import { ArrowRight, Code, Edit, Lock, Palette, Terminal, Users, Menu, X } from "lucide-react";
import { useState } from "react";

function App() {
 const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

 return (
  <div className="flex flex-col min-h-screen bg-white text-slate-900">
   {/* Header */}
   <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-sm">
    <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
     <Logo type="dark" />
     
     {/* Desktop Navigation */}
     <nav className="hidden md:flex items-center space-x-4">
      <a href="https://github.com/inkdown/inkdown" target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-slate-900 transition-colors">
       <svg className="h-5 w-5" viewBox="0 0 16 16"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"></path></svg>
      </a>
      <Link
       to="/docs"
       className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
      >
       Docs
      </Link>
      <Link
       to="/releases"
       className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
      >
       Releases
      </Link>
      <Link
       to="/downloads"
       className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
      >
       Downloads
      </Link>
     </nav>

     {/* Mobile Menu Button */}
     <button
      onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      className="md:hidden p-2 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
      aria-label="Toggle menu"
     >
      {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
     </button>
    </div>

    {/* Mobile Navigation Menu */}
    {isMobileMenuOpen && (
     <div className="md:hidden bg-white border-t border-slate-200">
      <nav className="container mx-auto px-4 py-4 space-y-3">
       <a href="https://github.com/inkdown/inkdown" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 py-2 text-slate-600 hover:text-slate-900 transition-colors">
        <svg className="h-5 w-5" viewBox="0 0 16 16"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"></path></svg>
        GitHub
       </a>
       <Link
        to="/docs"
        className="block py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
        onClick={() => setIsMobileMenuOpen(false)}
       >
        Docs
       </Link>
       <Link
        to="/releases"
        className="block py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
        onClick={() => setIsMobileMenuOpen(false)}
       >
        Releases
       </Link>
       <Link
        to="/downloads"
        className="block py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
        onClick={() => setIsMobileMenuOpen(false)}
       >
        Downloads
       </Link>
      </nav>
     </div>
    )}
   </header>

   {/* Main Content */}
   <main className="flex-1">
    {/* Hero Section */}
    <section className="relative w-full pt-24 pb-32 md:pt-32 md:pb-40 bg-slate-50 overflow-hidden">
     <div className="absolute top-0 left-0 -z-10 h-full w-full bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
     <div className="container mx-auto px-4 md:px-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
       <div className="flex flex-col items-start space-y-6 text-center md:text-left">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900">
         Sua nova experiência de escrita.
        </h1>
        <p className="max-w-xl text-lg text-slate-600">
         Inkdown é um editor de markdown elegante, construído para ser <span className="text-indigo-500 font-semibold">leve</span> e <span className="text-indigo-500 font-semibold">seguro</span>. Foco total no que importa: suas ideias.
        </p>
        <Button asChild size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white group">
         <Link to="/downloads">
          Começar agora
          <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
         </Link>
        </Button>
       </div>
       <div className="relative flex items-center justify-center">
        <div className="absolute w-full h-full bg-indigo-500/20 blur-3xl rounded-full"></div>
        <div className="relative w-full max-w-md h-auto bg-white/30 rounded-2xl shadow-2xl border border-slate-200/50 p-4 backdrop-blur-xl">
         <div className="w-full h-8 bg-slate-200 rounded-t-lg flex items-center px-2">
          <div className="w-3 h-3 bg-red-500 rounded-full mr-1.5"></div>
          <div className="w-3 h-3 bg-yellow-500 rounded-full mr-1.5"></div>
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
         </div>
         <div className="p-4 text-left">
          <p className="text-sm text-slate-500 font-mono"># Bem-vindo ao Inkdown</p>
          <p className="text-sm text-slate-500 font-mono mt-2">- Escreva sem distrações.</p>
          <p className="text-sm text-slate-500 font-mono">- Organize suas notas.</p>
          <p className="text-sm text-slate-500 font-mono">- Exporte com facilidade.</p>
          <div className="w-full h-2 bg-indigo-500 rounded-full mt-4"></div>
         </div>
        </div>
       </div>
      </div>
     </div>
    </section>

    {/* Features Section */}
    <section id="features" className="w-full py-20 md:py-28 bg-white ">
     <div className="container mx-auto px-4 md:px-6">
      <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
       <div className="inline-block rounded-lg bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-600 ">
        Recursos Poderosos
       </div>
       <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
        Projetado para performance e prazer
       </h2>
       <p className="max-w-2xl text-slate-600 md:text-lg">
        Ferramentas que melhoram seu fluxo de trabalho sem nunca atrapalhar seu caminho.
       </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
       <div className="p-8 bg-slate-100 rounded-2xl">
        <div className="w-full h-64 bg-slate-200 rounded-lg flex items-center justify-center">
         <Edit className="w-16 h-16 text-indigo-500" />
        </div>
       </div>
       <div className="space-y-4">
        <h3 className="text-2xl font-bold">Editor Focado</h3>
        <p className="text-slate-600 ">
         Uma interface limpa e minimalista que coloca seu conteúdo em primeiro lugar. Sem sinos e assobios desnecessários, apenas um espaço para você pensar e escrever.
        </p>
       </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mt-16">
       <div className="space-y-4 md:order-2">
        <h3 className="text-2xl font-bold">Segurança Total</h3>
        <p className="text-slate-600 ">
         Suas notas são suas. Com criptografia de ponta a ponta e a opção de auto-hospedagem, você tem controle total sobre seus dados. Sem rastreamento, sem análise, sem preocupações.
        </p>
       </div>
       <div className="p-8 bg-slate-100 rounded-2xl md:order-1">
        <div className="w-full h-64 bg-slate-200 rounded-lg flex items-center justify-center">
         <Lock className="w-16 h-16 text-indigo-500" />
        </div>
       </div>
      </div>
     </div>
    </section>

    {/* Community & Extensibility Section */}
    <section id="community" className="w-full py-20 md:py-28 bg-slate-50 ">
     <div className="container mx-auto px-4 md:px-6">
      <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
       <div className="inline-block rounded-lg bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-600 ">
        Para a Comunidade
       </div>
       <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
        Construído para ser seu, de verdade.
       </h2>
       <p className="max-w-2xl text-slate-600 md:text-lg">
        Inkdown é de código aberto e prospera com a colaboração. Personalize, estenda e contribua.
       </p>
      </div>
      <div className="mx-auto grid max-w-5xl grid-cols-1 sm:grid-cols-2 gap-8">
       <div className="p-6 bg-white rounded-xl border border-slate-200 ">
        <Palette className="h-8 w-8 text-indigo-500 mb-3" />
        <h3 className="text-xl font-bold">Temas e Plugins</h3>
        <p className="text-slate-600 mt-2">
         Deixe o Inkdown com a sua cara. Crie e compartilhe temas, ou adicione novas funcionalidades com um sistema de plugins em desenvolvimento.
        </p>
       </div>
       <div className="p-6 bg-white rounded-xl border border-slate-200 ">
        <Users className="h-8 w-8 text-indigo-500 mb-3" />
        <h3 className="text-xl font-bold">Comunidade Ativa</h3>
        <p className="text-slate-600 mt-2">
         Junte-se a outros escritores e desenvolvedores. Compartilhe suas notas, peça feedback e ajude a moldar o futuro da plataforma.
        </p>
       </div>
       <div className="p-6 bg-white rounded-xl border border-slate-200 ">
        <Code className="h-8 w-8 text-indigo-500 mb-3" />
        <h3 className="text-xl font-bold">100% Código Aberto</h3>
        <p className="text-slate-600 mt-2">
         Transparência total. Inspecione o código, contribua com melhorias e tenha a certeza de que seus dados estão seguros e sob seu controle.
        </p>
       </div>
       <div className="p-6 bg-white rounded-xl border border-slate-200 ">
        <Terminal className="h-8 w-8 text-indigo-500 mb-3" />
        <h3 className="text-xl font-bold">API Extensível</h3>
        <p className="text-slate-600 mt-2">
         Para os desenvolvedores, estamos construindo uma API robusta para que você possa integrar o Inkdown com suas ferramentas e fluxos de trabalho.
        </p>
       </div>
      </div>
     </div>
    </section>

    <section id="editor-features" className="w-full py-20 md:py-28 bg-white ">
     <div className="container mx-auto px-4 md:px-6">
      <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
       <div className="inline-block rounded-lg bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-600 ">
        Editor Intuitivo
       </div>
       <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
        Todas as ferramentas que você precisa
       </h2>
       <p className="max-w-2xl text-slate-600 md:text-lg">
        Um editor completo que se adapta ao seu fluxo de trabalho, sem sobrecarregar sua experiência.
       </p>
      </div>
      <div className="mx-auto grid max-w-6xl grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
       <div className="p-6 bg-slate-50 rounded-xl border border-slate-200/50 ">
        <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
         <Edit className="w-6 h-6 text-indigo-600" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Markdown Nativo</h3>
        <p className="text-sm text-slate-600 ">
         Suporte completo ao Markdown com preview ao vivo e syntax highlighting.
        </p>
       </div>
       <div className="p-6 bg-slate-50 rounded-xl border border-slate-200/50 ">
        <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
         <Palette className="w-6 h-6 text-indigo-600" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Temas Personalizáveis</h3>
        <p className="text-sm text-slate-600 ">
         Modo escuro/claro automático e temas personalizados para sua preferência.
        </p>
       </div>
       <div className="p-6 bg-slate-50 rounded-xl border border-slate-200/50 ">
        <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
         <Terminal className="w-6 h-6 text-indigo-600" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Atalhos Inteligentes</h3>
        <p className="text-sm text-slate-600 ">
         Comandos de teclado otimizados para uma escrita mais rápida e eficiente.
        </p>
       </div>
       <div className="p-6 bg-slate-50 rounded-xl border border-slate-200/50 ">
        <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
         <Lock className="w-6 h-6 text-indigo-600" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Offline Sempre</h3>
        <p className="text-sm text-slate-600 ">
         Funciona completamente offline. Seus dados nunca saem do seu dispositivo.
        </p>
       </div>
      </div>
      <div className="flex flex-col items-center mt-12">
       <Button asChild size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white group">
        <Link to="/downloads">
         Baixar Inkdown
         <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
        </Link>
       </Button>
      </div>
     </div>
    </section>
   </main>

   {/* Footer */}
   <footer className="w-full bg-white border-t border-slate-200 ">
    <div className="container mx-auto py-8 px-4 md:px-6 flex flex-col md:flex-row items-center justify-between">
     <div className="flex flex-col items-center md:items-start">
      <Logo type="dark"/>
      <p className="mt-2 text-xs text-slate-500">&copy; 2025 Inkdown. Todos os direitos reservados.</p>
     </div>
     <nav className="flex gap-4 sm:gap-6 mt-4 md:mt-0">
      <Link to="/docs" className="text-xs text-slate-600 hover:underline underline-offset-4">
       Docs
      </Link>
      <Link to="/releases" className="text-xs text-slate-600 hover:underline underline-offset-4">
       Releases
      </Link>
      <Link to="/downloads" className="text-xs text-slate-600 hover:underline underline-offset-4">
       Downloads
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
}

export default App;
