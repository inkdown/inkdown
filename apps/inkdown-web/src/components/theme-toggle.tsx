import { useTheme } from "@/providers/theme-provider"
import type { Theme, ThemeColors, ThemeMode } from "@/themes/themes"
import { useChangeUserSetting } from "@/features/author/queries/author-query"

export function ModeToggle() {
  const { setTheme, theme } = useTheme()
  const changeUserSettingMutation = useChangeUserSetting()

  const handleChangeTheme = (newThemeColor: ThemeColors) => {
    let newMode: ThemeMode = theme.mode;

    if (newThemeColor === 'default-dark' || newThemeColor === 'gruvbox-dark' || newThemeColor === 'dracula-dark' || newThemeColor === 'solarized-dark') {
      newMode = 'dark';
    } else if (newThemeColor === 'default-light' || newThemeColor === 'gruvbox-light' || newThemeColor === 'solarized-light' || newThemeColor === 'dracula-light') {
      newMode = 'light';
    } else if (newThemeColor === 'system') {
      newMode = 'system';
    }

    const newTheme: Theme = {
      color: newThemeColor,
      mode: newMode
    }
    changeUserSettingMutation.mutate({ theme: newTheme })
    setTheme(newTheme)
  }

  return (
    <select
      value={theme.color}
      onChange={(e) => handleChangeTheme(e.currentTarget.value as ThemeColors)}
      className="mr-10 border p-2 rounded-md border-muted-foreground"
    >
      <option value="default-dark">Padrão Escuro</option>
      <option value="default-light">Padrão Claro</option>
      <option value="gruvbox-dark">Gruvbox Dark</option>
      <option value="gruvbox-light">Gruvbox Light</option>
      <option value="dracula-dark">Dracula Dark</option>
      <option value="dracula-light">Dracula Light</option>
      <option value="solarized-dark">Solarized Dark</option>
      <option value="solarized-light">Solarized Light</option>
    </select>
  )
}
