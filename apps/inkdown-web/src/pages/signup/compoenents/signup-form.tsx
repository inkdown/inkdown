"use client";

import { Button } from "@/components/ui/button";
import { DefaultInput } from "@/components/default-input";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ErrorSpan } from "@/components/error-span";
import {
	signUp,
	sendAuthorCodeConfirmation,
	validateCode
} from "@/features/author/services/author-service";
import { useState, type FormEvent, type FormEventHandler } from "react";

export const SignUpForm = () => {
	const [emailSended, setEmailSended] = useState(false);
	const [emailConfirmed, setEmailConfirmed] = useState(false);
	const [token, setToken] = useState("");
	const [feedbackMessage, setFeedbackMessage] = useState(<></>);


	const signUpSchema = z
		.object({
			name: z.string().nonempty("Nome é necessario"),
			password: z.string().nonempty("Senha é necessario"),
			confirmPassword: z.string().nonempty("Confirmar sua senha é necessario"),
		})
		.refine(({ password, confirmPassword }) => password === confirmPassword, {
			message: "As senhas não conhecidem",
			path: ["confirm_password"],
		});

	const confirmSignUpSchema = z.object({
		email: z.string().email("Email é necessário"),
	});

	type signUpFormData = z.infer<typeof signUpSchema>;
	type emailConfirmationData = z.infer<typeof confirmSignUpSchema>;

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<signUpFormData>({
		resolver: zodResolver(signUpSchema),
	});

	const states = useForm<emailConfirmationData>({
		resolver: zodResolver(confirmSignUpSchema),
	});

	const onSubmitEmail = async ({ email }: emailConfirmationData) => {
		const response = await sendAuthorCodeConfirmation({ email });

		if (response.token !== null) {
			setEmailSended(true);
			setToken(response.token.token);

			return;
		}
		setFeedbackMessage(<ErrorSpan>{String(response.errorMessage)}</ErrorSpan>);
	};

	const onSubmit = async ({ name, password }: signUpFormData) => {
		const email = states.getValues("email");

		const response = await signUp({
			name,
			email,
			password,
			accountType: "DEFAULT",
			imageUrl: "none",
		});

		if(response?.status === 200) {
			const navigate = useNavigate();

			navigate("/login");
		};

		setFeedbackMessage(<ErrorSpan>Email ou senhas inválidos</ErrorSpan>);
	};

	const handleCodeSubmit = async (form: FormEvent<HTMLFormElement>) => {
		form.preventDefault();

		console.log(form);

		const formData = new FormData(form.currentTarget);

		const code = String(formData.get("codeInput"));

		console.log(formData);
		console.log(code.length);

		if (code.length === 0 || code.length !== 8) {
			setFeedbackMessage(<ErrorSpan>Insira um código válido</ErrorSpan>);

			return;
		};

		const validCode = await validateCode({ code, token });

		if (!validCode) {
			setFeedbackMessage(<ErrorSpan>Código inválido</ErrorSpan>);

			return;
		};
		setEmailConfirmed(true);
	}

	const berforeEmailForm = () => {
		return (
			<form
				onSubmit={handleSubmit(onSubmit)}
				className="flex flex-col space-y-5"
			>
				<div className="flex w-[full] pt-4 items-center gap-4">
					<hr className="flex-grow border-zinc-800" />
					<span className="text-zinc-800 text-sm">ou</span>
					<hr className="flex-grow border-zinc-800" />
				</div>
				<label className="text-sm" htmlFor="nameInput">
					Nome
				</label>
				<div className="flex flex-col">
					<DefaultInput
						{...register("name")}
						className="border-[1px] border-muted-foreground"
						id="nameInput"
					/>
					{errors.name && <ErrorSpan>{errors.name.message}</ErrorSpan>}
				</div>
				<div className="flex w-full justify-center items-center space-x-3">
					<span>
						<label className="text-sm" htmlFor="passwordInput">
							Senha
						</label>
						<DefaultInput
							{...register("password")}
							className="w-50 border-[1px] border-muted-foreground"
							id="passwordInput"
							type="password"
						/>
						{errors.password && (
							<ErrorSpan>{errors.password.message}</ErrorSpan>
						)}
					</span>

					<span>
						<label className="text-sm" htmlFor="confirmPasswordInput">
							Confirmar senha
						</label>
						<DefaultInput
							{...register("confirmPassword")}
							className="w-50 border-[1px] border-muted-foreground"
							id="confirmPasswordInput"
							type="password"
						/>
						{errors.confirmPassword && (
							<ErrorSpan>{errors.confirmPassword.message}</ErrorSpan>
						)}
					</span>
				</div>
				<Button
					size={"lg"}
					type="submit"
					className="font-bold bg-indigo-600 hover:bg-indigo-800 hover:cursor-pointer"
				>
					Criar conta
				</Button>

				<span className="w-full pt-1 flex items-center text-sm text-muted-foreground">
					Ja possui uma conta ?
					<Link to={"/login"} className="text-indigo-700 pl-2">
						Entrar
					</Link>
				</span>
			</form>
		);
	};

	const afterEmailForm = () => {
		return (

			<>
				{emailSended ? (
					<form onSubmit={(e) => handleCodeSubmit(e)}>
						<div className="flex flex-col">
							<label className="text-sm mt-10" htmlFor="codeInput">
								Código
							</label>
							<DefaultInput
								className="border-[1px] mb-4 border-muted-foreground"
								name="codeInput"
							/>
							<Button
								size={"lg"}
								type="submit"
								className="font-bold w-72 bg-indigo-600 hover:bg-indigo-800 hover:cursor-pointer"
							>
								Enviar
							</Button>
							{feedbackMessage}
						</div>
					</form>
				) : (
					<form
						onSubmit={states.handleSubmit(onSubmitEmail)}
						className="flex flex-col space-y-5"
					>
						<div className="flex w-[full] pt-4 items-center gap-4">
							<hr className="flex-grow border-zinc-800" />
							<span className="text-zinc-800 text-sm">ou</span>
							<hr className="flex-grow border-zinc-800" />
						</div>
						<div className="flex flex-col">
							<label className="text-sm" htmlFor="emailInput">
								Email
							</label>
							<DefaultInput
								{...states.register("email")}
								className="border-[1px] border-muted-foreground"
								id="emailInput"
							/>
							{states.formState.errors.email && (
								<ErrorSpan>{states.formState.errors.email.message}</ErrorSpan>
							)}
						</div>

						<Button
							size={"lg"}
							type="submit"
							className="font-bold w-72 bg-indigo-600 hover:bg-indigo-800 hover:cursor-pointer"
						>
							Continuar
						</Button>



						{feedbackMessage}
						<span className="w-full pt-1 flex items-center text-sm text-muted-foreground">
							Ja possui uma conta ?
							<Link to={"/login"} className="text-indigo-700 pl-2">
								Entrar
							</Link>
						</span>
					</form>
				)}
			</>
		);
	};

	return <>{emailConfirmed ? berforeEmailForm() : afterEmailForm()}</>;
};
