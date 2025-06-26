import { api } from "@/lib/api";
import type { UpdateSettingRequest } from "../types/settings-types";
import type { AxiosError } from "axios";
import Cookies from "js-cookie";

export function getEditorSettings() {
  return {
    lineNumbers: localStorage.getItem("lineNumbers") === "true",
    vimMode: localStorage.getItem("vimMode") === "true",
    autocompletion: localStorage.getItem("autocompletion") === "true",
    markdownLineStyler: localStorage.getItem("markdownLineStyler") === "true",
    bracketMathing: localStorage.getItem("bracketMathing") === "true",
    syntaxHighlighting: localStorage.getItem("syntaxHighlighting") === "true",
    hightlightActiveLine: localStorage.getItem("hightlightActiveLine") === "true",
    hightlightSelectionMatches: localStorage.getItem("hightlightSelectionMatches") === "true",
  }
};

export async function changeUserSetting(data : UpdateSettingRequest) {

  try {
    const token = Cookies.get("inkdown-auth");

    await api.put("/settings/update", {
        theme : data.theme,
        markdownLineStyler : data.markdownLineStyler,
        vimMode : data.vimMode,
        syntaxHighlighting : data.syntaxHighlighting,
        bracketMathing : data.bracketMathing,
        autocompletion : data.autocompletion,
        hightlightSelectionMatches : data.hightlightSelectionMatches,
        hightlightActiveLine : data.hightlightActiveLine,
        lineNumbers : data.lineNumbers,
    }, {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });

    return {
        theme: data.theme,
        markdownLineStyler: data.markdownLineStyler,
        vimMode: data.vimMode,
        syntaxHighlighting: data.syntaxHighlighting,
        bracketMathing: data.bracketMathing,
        autocompletion: data.autocompletion,
        hightlightSelectionMatches: data.hightlightSelectionMatches,
        hightlightActiveLine: data.hightlightActiveLine,
        lineNumbers: data.lineNumbers,
    };

  } catch (err) {
    const axiosError = err as AxiosError;

    console.log(axiosError);

    throw new Error(axiosError.response?.data as string);
  }
} 