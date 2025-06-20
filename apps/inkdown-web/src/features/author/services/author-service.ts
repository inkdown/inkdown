import { api, type ApiResponse } from "@/lib/api";
import type { AxiosError } from "axios";
import type { ConfirmCode, ErrorMessage, LoginData, SendCodeResponse, SignUpData, UserDataType } from "../types/user-types";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { authClient } from "@/lib/better-auth";

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

		if(response.status !== 201) {
			return { token: null }
		}

		return { token: response.data };

	} catch (e) {
		if (axios.isAxiosError(e)) {
			const axiosError = e as AxiosError<ErrorMessage>;

			return {
				token: null,
				errorMessage: axiosError.response?.data?.message ?? "Erro desconhecido",
			};
		}
		return {
			token: null,
			errorMessage: "Erro inesperado ao tentar enviar código de confirmação.",
		};
	}
}


export async function validateCode({ code, token }: ConfirmCode) {
  const response =  await api.post("/authors/code/validate", {
    token,
    code
  });

  return response.status === 200;
}

export async function login(data: LoginData): Promise<ApiResponse | void> {
  
  try{
    const response = await api.post("/authors/auth", {
      email: data.email,
      password: data.password,
    });
  
    if(response.status === 200) {
      const navigate = useNavigate();
  
      navigate("/notebook");
    };

  } catch(err: any) {
    return {
      errorMessage: err.response?.data.message ?? "Erro inesperado",
    }
  }
}

export async function getAuthorData() {
  const { data, error } = await authClient.getSession();

  if(!data) {
    return;
  };

  const { image, email, name, id, } = data.user as UserDataType;

  return {
    image,
    email,
    name,
    id
  };
} 
