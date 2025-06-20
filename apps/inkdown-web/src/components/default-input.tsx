import { Input } from "@/components/ui/input";

export const DefaultInput = ({
	className,
	type,
	...props
}: React.ComponentProps<"input">) => {
	return (
		<Input
			className={`border-muted-foreground focus-visible:ring-indigo-600 ${className}`}
			type={type}
			{...props}
		/>
	);
};
