import type { NotificationDataType } from "@/features/notification/types/notification-types";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { Bell, BellDot } from "lucide-react";
import type React from "react";
import { AcitivitesContext } from "./activities/activities-context";

interface NotificationsProps {
	notifications: NotificationDataType[];
}

export const Notifications: React.FC<NotificationsProps> = ({
	notifications,
}) => {
	return (
		<AcitivitesContext notifications={notifications}>
			<SidebarMenuItem className="flex items-center gap-2">
				<SidebarMenuButton className="pl-0">
					{notifications.length === 0 ? (
						<Bell size={18} className="text-indigo-400" />
					) : (
						<BellDot size={18} className="text-indigo-400" />
					)}
					<span>Atividades</span>
				</SidebarMenuButton>
			</SidebarMenuItem>
		</AcitivitesContext>
	);
};
