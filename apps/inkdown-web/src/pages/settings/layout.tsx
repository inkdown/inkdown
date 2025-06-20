import { SidebarProvider } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/providers/theme-provider";
import { Outlet } from "react-router-dom";

export default function SettingsLayout() {
	return (
		<ThemeProvider>
			<SidebarProvider> <Outlet /> </ SidebarProvider>
		</ThemeProvider>

	)
}
