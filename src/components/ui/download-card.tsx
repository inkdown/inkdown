import { Link } from "react-router-dom";
import { Button } from "./button";
import { SegmentedControl } from "./segmented-control";
import { useState } from "react";

interface DownloadCardProps {
  logo: React.ReactElement,
  title: string,
  options: OptionsProps[]
}

interface OptionsProps {
  label: string,
  value: string
}

const DownloadCard = ({ logo, title, options }: DownloadCardProps) => {
  const [selected, setSelected] = useState(options[0].value);

  return (
    <div className="flex flex-col items-center text-center p-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:shadow-lg transition-shadow">
      <div className="w-16 h-16 mb-4 text-slate-800 dark:text-white">{logo}</div>
      <h3 className="text-2xl font-bold mb-4">{title}</h3>
      <div className="w-full mb-6">
        <SegmentedControl
          options={options}
          value={selected}
          onValueChange={setSelected}
        />
      </div>
      <Button asChild className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
        <Link to={`/download/${title.toLowerCase()}/${selected}`}>Download</Link>
      </Button>
    </div>
  );
};

export default DownloadCard;