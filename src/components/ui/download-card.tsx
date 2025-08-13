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

 let downloadLink = "";

 switch (selected) {
  case("silicon"):
   downloadLink = "https://pub-43c32df55ce445d4b28356d240d95db1.r2.dev/releases/0.2.0/darwin/aarch64/inkdown_0.2.0_aarch64.dmg";
   break;
  case("intel"):
   downloadLink = "https://pub-43c32df55ce445d4b28356d240d95db1.r2.dev/releases/0.2.0/darwin/x86_64/inkdown_0.2.0_x64.dmg";
   break;
  case("msi"):
   downloadLink = "https://pub-43c32df55ce445d4b28356d240d95db1.r2.dev/releases/0.2.0/windows/x86_64/inkdown_0.2.0_x64_en-US.msi";
   break;
  case("exe"):
   downloadLink = "https://pub-43c32df55ce445d4b28356d240d95db1.r2.dev/releases/0.2.0/windows/x86_64/inkdown_0.2.0_x64-setup.exe";
   break;
  case("deb"):
   downloadLink = "https://pub-43c32df55ce445d4b28356d240d95db1.r2.dev/releases/0.2.0/linux/x86_64/inkdown_0.2.0_amd64.deb";
   break;
  case("appimage"):
   downloadLink = "https://pub-43c32df55ce445d4b28356d240d95db1.r2.dev/releases/0.2.0/linux/x86_64/inkdown_0.2.0_amd64.AppImage";
   break;
  case("rpm"):
   downloadLink = "https://pub-43c32df55ce445d4b28356d240d95db1.r2.dev/releases/0.2.0/linux/x86_64/inkdown-0.2.0-1.x86_64.rpm";
   break;
  }

 return (
  <div className="flex flex-col items-center text-center p-8 bg-white rounded-xl border border-slate-200 hover:shadow-lg transition-shadow">
   <div className="w-16 h-16 mb-4 text-slate-800 ">{logo}</div>
   <h3 className="text-2xl font-bold mb-4">{title}</h3>
   <div className="w-full mb-6">
    <SegmentedControl
     options={options}
     value={selected}
     onValueChange={setSelected}
    />
   </div>
   <Button asChild className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
    <Link to={downloadLink}>Download</Link>
   </Button>
  </div>
 );
};

export default DownloadCard;