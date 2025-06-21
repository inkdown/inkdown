import { api, type ApiResponse } from "@/lib/api";
import type { AxiosError } from "axios";
import type { AuthAuthorSocial, ConfirmCode, ErrorMessage, LoginData, SendCodeResponse, SignUpData } from "../types/user-types";
import { useNavigate } from "react-router-dom";

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
  console.log("oiqwjjowqejqwoeqw");
/* const data

  const { image, email, name, id, } = data.user as UserDataType;

  return {
    image,
    email,
    name,
    id
  }; */
};


export async function authAuthorSocial({ type }: AuthAuthorSocial) {
  window.location.href = `http://localhost:3333/auth/${type}`;
};