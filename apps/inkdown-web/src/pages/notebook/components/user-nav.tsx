import type { UserDataType } from "@/features/author/types/user-types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
	BadgeCheck,
	ChevronsUpDown,
	LogOut,
	Settings,
	Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getAuthorData } from "@/features/author/services/author-service";
import { Skeleton } from "@/components/ui/skeleton";

export function UserNav() {
	const { data, isLoading, error } = useQuery({
		queryFn: getAuthorData,
		queryKey: ["get-author-data"],
	});

	return (
		<SidebarMenu className="absolute bottom-0 pr-5">
			<SidebarMenuItem>
				{isLoading && (
					<Skeleton className="h-6 w-[80%]" />
				)}
				{data && (
					<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton
							size="lg"
							className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
						>
							<Avatar className="h-8 w-8 rounded-lg">
								<AvatarImage src={data.image ? data.image : ""} alt={data.name} />
								<AvatarFallback className="rounded-lg">CN</AvatarFallback>
							</Avatar>
							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="truncate font-semibold">{data.name}</span>
								<span className="truncate text-xs">{data.email}</span>
							</div>
							<ChevronsUpDown className="ml-auto size-4" />
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
						align="end"
						side="right"
						sideOffset={4}
					>
						<DropdownMenuLabel className="p-0 font-normal">
							<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
								<Avatar className="h-8 w-8 rounded-lg">
									<AvatarImage src={data.image ? data.image : ""} alt={data.name} />
									<AvatarFallback className="rounded-lg">CN</AvatarFallback>
								</Avatar>
								<div className="grid flex-1 text-left text-sm leading-tight">
									<span className="truncate font-semibold">{data.name}</span>
									<span className="truncate text-xs">{data.email}</span>
								</div>
							</div>
						</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuGroup>
							<DropdownMenuItem>
								<Sparkles />
								Upgrade to Pro
							</DropdownMenuItem>
						</DropdownMenuGroup>
						<DropdownMenuSeparator />
						<DropdownMenuGroup>
							<DropdownMenuItem className="hover:cursor-pointer" asChild>
								<Link to="/account">
									<BadgeCheck />
									<span>Conta</span>
								</Link>
							</DropdownMenuItem>
							<DropdownMenuItem className="hover:cursor-pointer" asChild>
								<Link to="/settings?option=Editor">
									<Settings />
									<span>Configurações</span>
								</Link>
							</DropdownMenuItem>
						</DropdownMenuGroup>
						<DropdownMenuSeparator />
						<DropdownMenuItem>
							<LogOut />
							Log out
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
				)}
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
