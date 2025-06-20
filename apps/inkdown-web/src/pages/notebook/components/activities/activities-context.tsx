import type { NotificationDataType } from "@/app/@types/notification-types";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from "@/components/ui/context-menu";

export const AcitivitesContext = ({
	children,
	notifications,
}: {
	children: React.ReactNode;
	notifications: NotificationDataType[];
}) => {
	return (
		<ContextMenu>
			<ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
			<ContextMenuContent className="w-60 dark:text-zinc-200">
				{notifications.map((noti) => (
					<ContextMenuItem
						inset
						key={noti.id}
						className="p-0"
						onSelect={(e) => e.preventDefault()}
					>
						{noti.title}
					</ContextMenuItem>
				))}
			</ContextMenuContent>
		</ContextMenu>
	);
};
