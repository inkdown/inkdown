import { useTheme } from "@/providers/theme-provider";

export const Logo = () => {
  const { theme } = useTheme();

  return (
    <img
      src={theme === "light" ? "/logo.svg" : "/logo-light.svg"}
      alt="logo"
      className="w-40"
    />
  )
}