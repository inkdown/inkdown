import { cn } from "@/lib/utils";

interface SegmentedControlProps {
 options: { label: string; value: string }[];
 value: string;
 onValueChange: (value: string) => void;
}

export const SegmentedControl = ({ options, value, onValueChange }: SegmentedControlProps) => {
 return (
  <div className="flex w-full items-center gap-1 rounded-lg bg-slate-100 p-1">
   {options.map((option) => (
    <button
     key={option.value}
     onClick={() => onValueChange(option.value)}
     className={cn(
      "flex-1 rounded-md px-3 py-1 text-sm font-medium transition-colors",
      value === option.value
       ? "bg-indigo-600 text-white shadow-sm"
       : "text-slate-600 hover:bg-slate-200 "
     )}
    >
     {option.label}
    </button>
   ))}
  </div>
 );
};
