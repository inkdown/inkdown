import { api, type ApiResponse } from "@/lib/api";
import type { AxiosError } from "axios";
import type { AuthAuthorSocial, ConfirmCode, ErrorMessage, LoginData, SendCodeResponse, SignUpData } from "../types/user-types";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";

export async function signUp({
  name,
  email,
  password,
  accountType,
  imageUrl,
}: SignUpData) {

  try {
    const response = await api.post(
      "/authors/create",
      JSON.stringify({
        alias: name,
        email,
        accountType,
        imageUrl,
        password,
      }),
    );

    return response;
  } catch (e) {
    const axiosError = e as AxiosError;
    console.log(axiosError);
  }
}

export async function sendAuthorCodeConfirmation({
  email,
}: { email: string }): Promise<SendCodeResponse> {
  try {
    const response = await api.post("authors/code", { email });

    if (response.status !== 201) {
      return { token: null }
    }

    return { token: response.data };

  } catch (e) {
    const axiosError = e as AxiosError<ErrorMessage>;

    return {
      token: null,
      errorMessage: axiosError.response?.data?.message ?? "Erro desconhecido",
    };
  }
}


export async function validateCode({ code, token }: ConfirmCode) {
  const response = await api.post("/authors/code/validate", {
    token,
    code
  });

  return response.status === 200;
}

export async function login(data: LoginData): Promise<ApiResponse | void> {

  try {
    const response = await api.post("/authors/auth", {
      email: data.email,
      password: data.password,
    });

    if (response.status === 200) {
      const navigate = useNavigate();

      navigate("/notebook");
    };

  } catch (err: any) {
    return {
      errorMessage: err.response?.data.message ?? "Erro inesperado",
    }
  }
}

export async function getAuthorData() {
  try {

    const token = Cookies.get("inkdown-auth");

    const response = await api.get("/authors/data", {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });

    const data = response.data;

    localStorage.setItem("autocompletion", data.settings.autocompletion);
    localStorage.setItem("bracketMathing", data.settings.bracketMathing);
    localStorage.setItem("hightlightActiveLine", data.settings.hightlightActiveLine);
    localStorage.setItem("hightlightSelectionMatches", data.settings.hightlightSelectionMatches);
    localStorage.setItem("lineNumbers", data.settings.lineNumbers);
    localStorage.setItem("markdownLineStyler", data.settings.markdownLineStyler);
    localStorage.setItem("syntaxHighlighting", data.settings.syntaxHighlighting);
    localStorage.setItem("theme", data.settings.theme);
    localStorage.setItem("vimMode", data.settings.vimMode);

    return data;
  } catch (err) {
    const axiosError = err as AxiosError;

    console.log(axiosError);

    throw new Error(axiosError.response?.data as string);
  }
};


export async function authAuthorSocial({ type }: AuthAuthorSocial) {
  window.location.href = `http://localhost:3333/auth/${type}`;
};