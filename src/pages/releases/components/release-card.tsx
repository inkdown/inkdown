import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Tag, 
  CheckCircle, 
  AlertCircle, 
  Settings, 
  RefreshCw, 
  FileText, 
  Palette, 
  Zap, 
  TestTube, 
  Package, 
  GitBranch, 
  Undo2 
} from 'lucide-react';
import type { Release } from '../releases-data';

interface ReleaseCardProps {
  release: Release;
}

const changeTypeConfig = {
  feat: {
    label: 'Nova Funcionalidade',
    icon: CheckCircle,
    className: 'text-emerald-600 dark:text-emerald-400',
    bgClassName: 'bg-emerald-50 dark:bg-emerald-900/20',
    borderClassName: 'border-emerald-200 dark:border-emerald-800',
  },
  fix: {
    label: 'Correção',
    icon: AlertCircle,
    className: 'text-red-600 dark:text-red-400',
    bgClassName: 'bg-red-50 dark:bg-red-900/20',
    borderClassName: 'border-red-200 dark:border-red-800',
  },
  docs: {
    label: 'Documentação',
    icon: FileText,
    className: 'text-blue-600 dark:text-blue-400',
    bgClassName: 'bg-blue-50 dark:bg-blue-900/20',
    borderClassName: 'border-blue-200 dark:border-blue-800',
  },
  style: {
    label: 'Estilo',
    icon: Palette,
    className: 'text-pink-600 dark:text-pink-400',
    bgClassName: 'bg-pink-50 dark:bg-pink-900/20',
    borderClassName: 'border-pink-200 dark:border-pink-800',
  },
  refactor: {
    label: 'Refatoração',
    icon: RefreshCw,
    className: 'text-indigo-600 dark:text-indigo-400',
    bgClassName: 'bg-indigo-50 dark:bg-indigo-900/20',
    borderClassName: 'border-indigo-200 dark:border-indigo-800',
  },
  perf: {
    label: 'Performance',
    icon: Zap,
    className: 'text-yellow-600 dark:text-yellow-400',
    bgClassName: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderClassName: 'border-yellow-200 dark:border-yellow-800',
  },
  test: {
    label: 'Testes',
    icon: TestTube,
    className: 'text-purple-600 dark:text-purple-400',
    bgClassName: 'bg-purple-50 dark:bg-purple-900/20',
    borderClassName: 'border-purple-200 dark:border-purple-800',
  },
  build: {
    label: 'Build',
    icon: Package,
    className: 'text-orange-600 dark:text-orange-400',
    bgClassName: 'bg-orange-50 dark:bg-orange-900/20',
    borderClassName: 'border-orange-200 dark:border-orange-800',
  },
  ci: {
    label: 'CI/CD',
    icon: GitBranch,
    className: 'text-teal-600 dark:text-teal-400',
    bgClassName: 'bg-teal-50 dark:bg-teal-900/20',
    borderClassName: 'border-teal-200 dark:border-teal-800',
  },
  chore: {
    label: 'Manutenção',
    icon: Settings,
    className: 'text-slate-600 dark:text-slate-400',
    bgClassName: 'bg-slate-50 dark:bg-slate-800/20',
    borderClassName: 'border-slate-200 dark:border-slate-700',
  },
  revert: {
    label: 'Reversão',
    icon: Undo2,
    className: 'text-amber-600 dark:text-amber-400',
    bgClassName: 'bg-amber-50 dark:bg-amber-900/20',
    borderClassName: 'border-amber-200 dark:border-amber-800',
  },
};

export function ReleaseCard({ release }: ReleaseCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="group"
    >
      <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 md:p-6 lg:p-8 shadow-sm hover:shadow-lg transition-all duration-300 backdrop-blur-sm">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start justify-between mb-6 gap-4">
          <div className="flex-1 w-full">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mb-2">
              <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {release.title}
              </h2>
              <Badge 
                variant="secondary"
                className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 w-fit"
              >
                {release.version}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
              <Calendar className="h-4 w-4" />
              <span>{release.date}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mb-6 md:mb-8">
          <p className="text-slate-600 dark:text-slate-300 text-sm md:text-base leading-relaxed">
            {release.description}
          </p>
        </div>

        {/* Changes */}
        <div>
          <div className="flex items-center gap-2 mb-4 md:mb-6">
            <Tag className="h-4 w-4 md:h-5 md:w-5 text-slate-500 dark:text-slate-400" />
            <h3 className="text-base md:text-lg font-semibold text-slate-900 dark:text-white">
              Principais mudanças
            </h3>
          </div>
          <div className="grid gap-2 md:gap-3">
            {release.changes.map((change, index) => {
              const config = changeTypeConfig[change.type];
              const Icon = config.icon;
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className={`flex items-start gap-3 md:gap-4 p-3 md:p-4 rounded-xl border ${config.bgClassName} ${config.borderClassName} hover:scale-[1.02] transition-transform duration-200`}
                >
                  <div className={`flex-shrink-0 mt-0.5 ${config.className}`}>
                    <Icon className="h-4 w-4 md:h-5 md:w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold uppercase tracking-wider ${config.className}`}>
                        {config.label}
                      </span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-200 text-sm leading-relaxed">
                      {change.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
