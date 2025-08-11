import { cn } from '@/lib/utils';
import { Laptop, Smartphone } from 'lucide-react';
import type { Release } from '../releases-data';

interface ReleasesSidebarProps {
 releases: Release[];
 activeId: string;
}

const platformIcons = {
 Desktop: <Laptop className="h-4 w-4" />,
 Mobile: <Smartphone className="h-4 w-4" />,
 'Cross-platform': (
  <div className="flex">
   <Laptop className="h-4 w-4" />
   <Smartphone className="h-4 w-4 ml-1" />
  </div>
 ),
};

const formatId = (version: string) => `v${version.replace(/\./g, '-')}`;

export function ReleasesSidebar({ releases, activeId }: ReleasesSidebarProps) {
 return (
  <aside className="lg:sticky lg:top-32 h-fit w-full lg:w-72 flex-shrink-0">
   <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-6 backdrop-blur-sm">
    <nav>
     <h3 className="mb-4 md:mb-6 text-lg font-semibold tracking-tight text-slate-900 ">
      Versões
     </h3>
     <ul className="space-y-2 lg:max-h-[60vh] lg:overflow-y-auto lg:pr-2">
      {releases.map(release => {
       const formattedId = formatId(release.version);
       const isActive = activeId === formattedId;
       return (
        <li key={release.version}>
         <a
          href={`#${formattedId}`}
          className={cn(
           'block rounded-lg px-2 md:px-3 py-2 md:py-3 transition-all duration-200 group',
           isActive
            ? 'bg-indigo-50 border-l-4 border-indigo-500'
            : 'hover:bg-slate-50  border-l-4 border-transparent hover:border-slate-300 ',
          )}>
          <div className="flex items-center justify-between mb-1">
           <span
            className={cn(
             'font-semibold text-sm',
             isActive 
              ? 'text-indigo-600 ' 
              : 'text-slate-900 group-hover:text-indigo-600 ',
            )}>
            {release.version}
           </span>
           <div
            className={cn(
             'flex items-center gap-1',
             isActive
              ? 'text-indigo-500 '
              : 'text-slate-400 group-hover:text-indigo-500',
            )}>
            {platformIcons[release.platform]}
           </div>
          </div>
          <p className={cn(
           "text-xs font-medium",
           isActive 
            ? 'text-indigo-600/80 ' 
            : 'text-slate-500 '
          )}>
           {release.title}
          </p>
          <p className={cn(
           "text-xs mt-1",
           isActive 
            ? 'text-indigo-500/70 ' 
            : 'text-slate-400 '
          )}>
           {release.date}
          </p>
         </a>
        </li>
       );
      })}
     </ul>
    </nav>
   </div>
  </aside>
 );
}
