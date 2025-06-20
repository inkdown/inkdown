import {
	Globe,
	Menu,
	Paperclip,
	Paintbrush,
	ArrowLeft,
	Palette,
} from "lucide-react";
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
} from "@/components/ui/sidebar";
import { Link } from "react-router-dom";

const data = {
	nav: [
		{ name: "Editor", icon: Menu },
		{ name: "Privacidade", icon: Paintbrush },
		{ name: "Idiomas", icon: Globe },
		{ name: "Documentação", icon: Paperclip },
		{ name: "Temas", icon: Palette }
	],
};

export function SettingsSidebar({ option }: { option: string }) {
	return (
		<Sidebar variant="floating">
			<SidebarHeader>
				<Link className="pt-2 pl-2"  to={"/notebook"}>
					<ArrowLeft size={19} />
				</Link>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Configurações</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{data.nav.map((item) => (
								<Link to={`?option=${item.name}`} key={item.name}>
									<SidebarMenuItem>
										<SidebarMenuButton
											className={`${item.name === option && "bg-indigo-700 text-zinc-200 hover:bg-indigo-800 hover:text-zinc-200"}`}
										>
											<item.icon />
											<span>{item.name}</span>
										</SidebarMenuButton>
									</SidebarMenuItem>
								</Link>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarRail />
		</Sidebar>
	);
}
