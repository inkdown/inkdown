import { Globe, Moon, Sun } from "lucide-react"

import { useTheme } from "@/providers/theme-provider"

export function ModeToggle() {
	const { setTheme, theme } = useTheme()

	return (
		<select 
			defaultValue={theme === "system" ? "dark" : theme}
			onChange={(e) => setTheme(e.currentTarget.value === "light" ? "light" : "dark")}
			className="mr-10 flex border-[1px] p-2 rounded-md border-muted-foreground">
			<option value={"dark"}>
				<span>
						Escuro <Moon />
				</span>
			</option>
			<option value={"light"}>
				<span>
					Claro <Sun/>
				</span>
			</option>
		</select>
	)
}