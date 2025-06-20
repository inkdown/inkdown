"use client";

import type { TagsDataType } from "@/app/@types/note-types";
import { SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { useTagsActions } from "../../../../hooks/use-tags";
import { TagContext } from "./tag-context";
import { useTagsContext } from "@/providers/tags-provider";
import { useEffect } from "react";

export const TagList = () => {
	const { tags, handleRenameTag, handleChangeColor, handleDeleteTag } =
		useTagsContext();

	return (
		<div className="max-h-[60vh] overflow-hidden">
			{tags.map((tag) => (
				<div key={tag.id} className="context-menu-no-close">
					<TagContext
						tag={tag}
						onRename={handleRenameTag}
						onChangeColor={handleChangeColor}
						onDelete={handleDeleteTag}
					>
						<SidebarMenuItem className="list-none">
							<SidebarMenuButton>
								<div
									style={{ backgroundColor: tag.colorHex }}
									className="w-5 h-5 border-muted-foreground rounded-md border-[1px]"
								/>
								<span className="truncate">{tag.name}</span>
							</SidebarMenuButton>
						</SidebarMenuItem>
					</TagContext>
				</div>
			))}
		</div>
	);
};
