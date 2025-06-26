import { useTheme, type Theme } from "@/providers/theme-provider"
import { useChangeUserSetting } from "@/features/author/queries/author-query"

export function ModeToggle() {
  const { setTheme, theme } = useTheme();
  const changeUserSettingMutation = useChangeUserSetting();

  const handleChangeTheme = (newTheme: Theme) => {
    changeUserSettingMutation.mutate({ theme: newTheme });
    setTheme(newTheme);
  };

  return (
    <select
      value={theme}
      onChange={(e) => handleChangeTheme(e.currentTarget.value as Theme)}
      className="mr-10 border p-2 rounded-md border-muted-foreground"
    >
      <option value="system">Sistema</option>
      <option value="dark">Escuro</option>
      <option value="light">Claro</option>
      <option value="gruvbox-dark">Gruvbox Dark</option>
      <option value="dracula">Dracula</option>
      <option value="solarized-dark">Solarized Dark</option>
      <option value="nord">Nord</option>
      <option value="one-dark">One Dark</option>
    </select>
  );
}