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
  className: 'text-emerald-600 ',
  bgClassName: 'bg-emerald-50 ',
  borderClassName: 'border-emerald-200 ',
 },
 fix: {
  label: 'Correção',
  icon: AlertCircle,
  className: 'text-red-600 ',
  bgClassName: 'bg-red-50 ',
  borderClassName: 'border-red-200 ',
 },
 docs: {
  label: 'Documentação',
  icon: FileText,
  className: 'text-blue-600 ',
  bgClassName: 'bg-blue-50 ',
  borderClassName: 'border-blue-200 ',
 },
 style: {
  label: 'Estilo',
  icon: Palette,
  className: 'text-pink-600 ',
  bgClassName: 'bg-pink-50 ',
  borderClassName: 'border-pink-200 ',
 },
 refactor: {
  label: 'Refatoração',
  icon: RefreshCw,
  className: 'text-indigo-600 ',
  bgClassName: 'bg-indigo-50 ',
  borderClassName: 'border-indigo-200 ',
 },
 perf: {
  label: 'Performance',
  icon: Zap,
  className: 'text-yellow-600 ',
  bgClassName: 'bg-yellow-50 ',
  borderClassName: 'border-yellow-200 ',
 },
 test: {
  label: 'Testes',
  icon: TestTube,
  className: 'text-purple-600 ',
  bgClassName: 'bg-purple-50 ',
  borderClassName: 'border-purple-200 ',
 },
 build: {
  label: 'Build',
  icon: Package,
  className: 'text-orange-600 ',
  bgClassName: 'bg-orange-50 ',
  borderClassName: 'border-orange-200 ',
 },
 ci: {
  label: 'CI/CD',
  icon: GitBranch,
  className: 'text-teal-600 ',
  bgClassName: 'bg-teal-50 ',
  borderClassName: 'border-teal-200 ',
 },
 chore: {
  label: 'Manutenção',
  icon: Settings,
  className: 'text-slate-600 ',
  bgClassName: 'bg-slate-50 ',
  borderClassName: 'border-slate-200 ',
 },
 revert: {
  label: 'Reversão',
  icon: Undo2,
  className: 'text-amber-600 ',
  bgClassName: 'bg-amber-50 ',
  borderClassName: 'border-amber-200 ',
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
   <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-6 lg:p-8 shadow-sm hover:shadow-lg transition-all duration-300 backdrop-blur-sm">
    {/* Header */}
    <div className="flex flex-col sm:flex-row items-start justify-between mb-6 gap-4">
     <div className="flex-1 w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mb-2">
       <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 ">
        {release.title}
       </h2>
       <Badge 
        variant="secondary"
        className="bg-indigo-100 text-indigo-700 border-indigo-200 w-fit"
       >
        {release.version}
       </Badge>
      </div>
      <div className="flex items-center gap-2 text-slate-500 text-sm">
       <Calendar className="h-4 w-4" />
       <span>{release.date}</span>
      </div>
     </div>
    </div>

    {/* Description */}
    <div className="mb-6 md:mb-8">
     <p className="text-slate-600 text-sm md:text-base leading-relaxed">
      {release.description}
     </p>
    </div>

    {/* Changes */}
    <div>
     <div className="flex items-center gap-2 mb-4 md:mb-6">
      <Tag className="h-4 w-4 md:h-5 md:w-5 text-slate-500 " />
      <h3 className="text-base md:text-lg font-semibold text-slate-900 ">
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
          <p className="text-slate-700 text-sm leading-relaxed">
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
