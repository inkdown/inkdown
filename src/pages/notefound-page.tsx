import { Logo } from "@/components/logo";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Search, FileText } from "lucide-react";
import { useEffect } from "react";

export default function NotFoundPage() {
  useEffect(() => {
    document.title = "404 - Página não encontrada | Inkdown";
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col">
      {/* Header minimalista */}
      <header className="absolute top-0 left-0 right-0 z-10 p-6">
        <div className="container mx-auto">
          <Logo type="dark" />
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Ilustração 404 */}
          <div className="mb-8 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 opacity-20 blur-3xl rounded-full"></div>
            <div className="relative">
              <h1 className="text-8xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 mb-2 leading-none">
                404
              </h1>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <FileText className="w-16 h-16 text-slate-300 opacity-50" />
              </div>
            </div>
          </div>

          {/* Mensagem principal */}
          <div className="mb-8 space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
              Oops! Página não encontrada
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              A página que você está procurando pode ter sido movida, removida ou não existe. 
              Mas não se preocupe, vamos te ajudar a encontrar o que você precisa!
            </p>
          </div>

          {/* Sugestões úteis */}
          <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/50 transition-colors">
              <FileText className="w-6 h-6 text-indigo-600 mb-2 mx-auto" />
              <h3 className="font-semibold text-sm mb-1">Documentação</h3>
              <p className="text-xs text-slate-600">Aprenda como usar o Inkdown</p>
            </div>
            
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/50 transition-colors">
              <Search className="w-6 h-6 text-indigo-600 mb-2 mx-auto" />
              <h3 className="font-semibold text-sm mb-1">Releases</h3>
              <p className="text-xs text-slate-600">Veja as novidades</p>
            </div>
            
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/50 transition-colors">
              <Home className="w-6 h-6 text-indigo-600 mb-2 mx-auto" />
              <h3 className="font-semibold text-sm mb-1">Downloads</h3>
              <p className="text-xs text-slate-600">Baixe o Inkdown</p>
            </div>
          </div>

          {/* Botões de ação */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button asChild size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white group">
              <Link to="/">
                <Home className="w-4 h-4 mr-2" />
                Voltar ao Início
              </Link>
            </Button>
            
            <Button asChild variant="outline" size="lg" className="border-slate-200 text-slate-600 hover:bg-slate-50 group">
              <Link to="/docs">
                <FileText className="w-4 h-4 mr-2" />
                Ver Documentação
              </Link>
            </Button>
          </div>

          {/* Mensagem adicional */}
          <div className="mt-8 pt-8 border-t border-slate-200">
            <p className="text-sm text-slate-500">
              Se você acredita que esta página deveria existir, 
              <a 
                href="https://github.com/inkdown/inkdown/issues" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-700 font-medium ml-1 transition-colors"
              >
                reporte um problema no GitHub
              </a>
            </p>
          </div>
        </div>
      </main>

      {/* Decoração de fundo */}
      <div className="absolute top-0 left-0 -z-10 h-full w-full">
        <div className="absolute top-20 left-10 w-2 h-2 bg-indigo-400 rounded-full opacity-40"></div>
        <div className="absolute top-40 right-20 w-3 h-3 bg-purple-400 rounded-full opacity-30"></div>
        <div className="absolute bottom-32 left-20 w-2 h-2 bg-pink-400 rounded-full opacity-40"></div>
        <div className="absolute bottom-20 right-10 w-1 h-1 bg-indigo-500 rounded-full opacity-50"></div>
        <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-purple-500 rounded-full opacity-40"></div>
      </div>
    </div>
  );
}