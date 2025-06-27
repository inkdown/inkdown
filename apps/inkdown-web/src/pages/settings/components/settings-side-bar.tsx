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
		// { name: "Privacidade", icon: Paintbrush },
		// { name: "Idiomas", icon: Globe },
		//{ name: "Documentação", icon: Paperclip },
		{ name: "Aparência", icon: Palette }
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
											className={`${item.name === option && "bg-accent text-primary hover:bg-accent-foreground"}`}
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
