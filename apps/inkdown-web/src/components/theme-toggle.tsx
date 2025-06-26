import { Globe, Moon, Sun } from "lucide-react"

import { useTheme, type Theme } from "@/providers/theme-provider"
import { useChangeUserSetting } from "@/features/author/queries/author-query"

export function ModeToggle() {
	const { setTheme, theme } = useTheme()
	const changeUserSettingMutation = useChangeUserSetting();

	const handleChangeTheme = (newTheme: Theme) => {
		console.log(newTheme);

		changeUserSettingMutation.mutate({ theme: newTheme })
		setTheme(newTheme);
	}

	return (
		<select 
			defaultValue={theme === "system" ? "dark" : theme}
			onChange={(e) => handleChangeTheme(e.currentTarget.value as Theme)}
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
			<option value={"gruvbox-dark"}>
				<span>
					gruvbox-dark
				</span>
			</option>
			<option value={"dracula"}>
				<span>
					dracula
				</span>
			</option>
			<option value={"solarized-dark"}>
				<span>
					solarized-dark
				</span>
			</option>
			<option value={"nord"}>
				<span>
					nord
				</span>
			</option>
			<option value={"one-dark"}>
				<span>
					one-dark
				</span>
			</option>
		</select>
	)
}