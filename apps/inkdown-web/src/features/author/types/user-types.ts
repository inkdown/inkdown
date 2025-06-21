export interface UserDataType {
	id: string;
	name: string;
	email: string;
	emailVerified: boolean;
	createdAt: Date;
	updatedAt: Date;
	image?: string | null | undefined;
}

export interface SignUpData {
	name: string;
	email: string;
	password: string;
	accountType: string;
	imageUrl: string;
}

export interface LoginData {
	email: string,
	password: string,
};

export interface ConfirmCode {
	code: string,
	token: string
}


export interface SendCodeResponse {
	token: { token: string } | null;
	errorMessage?: string;
}

export interface ErrorMessage {
	message: string;
}

export interface AuthAuthorSocial {
	type: "google" | "github";
}