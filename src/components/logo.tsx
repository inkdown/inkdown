interface LogoProps {
  type: "dark" | "light"
};


export const Logo = ({ type }: LogoProps) => {
  return (
    <img
      src={`/logo-${type}.svg`}
      alt="logo"
      className="w-40"
    />
  )
}