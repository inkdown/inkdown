"use client";

import { COLORS } from "@/data";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { useEffect, useState } from "react";

export const ColorPicker = ({
	currentColor,
	onColorChange,
}: {
	currentColor: string;
	onColorChange: (color: string) => void;
}) => {
	const [open, setOpen] = useState(false);

	useEffect(() => {}, [open]);

	return (
		<Popover open={open} onOpenChange={setOpen} modal={true}>
			<PopoverTrigger asChild>
				<div
					className="w-6 h-6 rounded-full border cursor-pointer"
					style={{ backgroundColor: currentColor }}
				/>
			</PopoverTrigger>
			<PopoverContent
				className="w-40 p-2 z-[9000]"
				align="end"
				side="right"
				sideOffset={10}
				/*         avoidCollisions={true} */
				onInteractOutside={(e) => e.preventDefault()}
			>
				<div className="grid grid-cols-4 gap-2">
					{COLORS.map((color) => (
						<div
							key={color}
							className="w-7 h-7 rounded-full cursor-pointer hover:scale-120 hover:cursor-pointer transition-transform"
							style={{ backgroundColor: color }}
							onClick={() => {
								onColorChange(color);
								setOpen(false);
							}}
						/>
					))}
				</div>
			</PopoverContent>
		</Popover>
	);
};
