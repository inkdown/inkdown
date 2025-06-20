interface LogoProps {
  type: "light" | "dark";
}

export const Logo: React.FC<LogoProps> = ({ type }) => {
  return (
    <img
      src={`${type === "light" ? "logo-light.svg" : "logo.svg"}`}
      width={200}
      height={200}
      alt="Ink down logo"
    />
  );
};
