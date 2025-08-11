import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Palette, Bug, BookOpen } from "lucide-react";
import { ThemeToggleCompact } from "@/components/theme-toggle";

interface SidebarProps {
  onLinkClick?: () => void;
}

interface SidebarSection {
  title: string;
  icon: React.ReactNode;
  links: {
    title: string;
    slug: string;
    description?: string;
  }[];
}

const sidebarSections: SidebarSection[] = [
  {
    title: "Começando",
    icon: <BookOpen className="w-4 h-4" />,
    links: [
      {
        title: "Instalação",
        slug: "installation",
        description: "Instalação detalhada com todas as plataformas"
      }
    ]
  },
  {
    title: "Personalização",
    icon: <Palette className="w-4 h-4" />,
    links: [
      {
        title: "Temas",
        slug: "themming",
        description: "Criação e publicação de temas"
      }
    ]
  },
  {
    title: "Suporte",
    icon: <Bug className="w-4 h-4" />,
    links: [
      {
        title: "Relatório de Bugs",
        slug: "bugs",
        description: "Como reportar problemas"
      }
    ]
  }
];

const Sidebar: React.FC<SidebarProps> = ({ onLinkClick }) => {
  const location = useLocation();
  const currentSlug = location.pathname.split('/').pop() || 'installation';

  return (
    <aside className="w-72 h-screen bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 overflow-y-auto sticky top-0">
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Documentação
            </h2>
          </div>
          <ThemeToggleCompact />
        </div>

        <nav className="space-y-6">
          {sidebarSections.map((section) => (
            <div key={section.title} className="space-y-3">
              <div className="flex items-center gap-2 px-2">
                <div className="text-indigo-500 dark:text-indigo-400">
                  {section.icon}
                </div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wide">
                  {section.title}
                </h3>
              </div>

              <ul className="space-y-1">
                {section.links.map((link) => {
                  const isActive = currentSlug === link.slug;
                  return (
                    <li key={link.slug}>
                      <Link
                        to={`/docs/${link.slug}`}
                        className={`group flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                          isActive
                            ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-l-2 border-indigo-500'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                        }`}
                        onClick={onLinkClick}
                      >
                        <div className="flex-1">
                          <div className="font-medium">{link.title}</div>
                          {link.description && (
                            <div className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">
                              {link.description}
                            </div>
                          )}
                        </div>
                        <ChevronRight 
                          className={`w-4 h-4 transition-transform ${
                            isActive ? 'text-indigo-500' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                          }`}
                        />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
