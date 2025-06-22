import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./components/app-side-bar";
import { Outlet } from "react-router-dom";
import { ThemeProvider } from "@/providers/theme-provider";

export default function NotebookLayout() {
  return (
    <ThemeProvider>
      <SidebarProvider>
        <AppSidebar />
        <main className="w-full ">
          <Outlet />
        </main>
      </SidebarProvider>
    </ThemeProvider>
  );
}
