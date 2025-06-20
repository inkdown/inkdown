import { solarizedDark } from "cm6-theme-solarized-dark"
import { basicLight } from "cm6-theme-basic-light"
import { basicDark } from "cm6-theme-basic-dark"
import { solarizedLight } from "cm6-theme-solarized-light"
import { nord } from "cm6-theme-nord"
import { materialDark } from "cm6-theme-material-dark"
import { gruvboxDark } from "cm6-theme-gruvbox-dark"
import { gruvboxLight } from "cm6-theme-gruvbox-light"

export const themes = [
  {
    extension: basicLight,
    name: "Basic Light"
  },
  {
    extension: basicDark,
    name: "Basic Dark"
  },
  {
    extension: solarizedLight,
    name: "Solarized Light"
  },
  {
    extension: solarizedDark,
    name: "Solarized Dark"
  },
  {
    extension: materialDark,
    name: "Material Dark"
  },
  {
    extension: nord,
    name: "Nord"
  },
  {
    extension: gruvboxLight,
    name: "Gruvbox Light"
  },
  {
    extension: gruvboxDark,
    name: "Gruvbox Dark"
  }
]
