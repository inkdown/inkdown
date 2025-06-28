import { Icon } from "@/components/icon";

import { Link, useNavigate } from "react-router-dom";
import { SignUpForm } from "./components/signup-form";
import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";
import { authAuthorSocial } from "@/features/author/services/author-service";

export default function SignUpPage() {
	const router = useNavigate();

	return (
		<div className="w-full h-full overflow-hidden text-zinc-800 flex items-center justify-center p-5">
			<div className="w-[50%] flex flex-col h-full justify-start items-center space-y-3">
				<div className="w-full flex justify-start items-center h-fit pl-10">
					<Link to={"/"}>
						<Icon />
					</Link>
				</div>
				<h1 className="font-bold text-3xl">Comece agora</h1>
				<p className="pt-4">Entre com sua conta do google ou crie uma nova</p>
				<span className="flex space-x-5 items-center w-full justify-center pt-3">
					<Button
						onClick={() => authAuthorSocial({ type: "github" })} variant={"outline"}						
						className="text-lg hover:cursor-pointer hover:opacity-80 bg-transparent border-[1px] border-muted-foreground p-3 w-43 h-12 flex items-center space-x-3"
					>
						<Github size={40} />
						Github
					</Button>
					<Button
						onClick={() => authAuthorSocial({ type: "google" })} variant={"outline"}
						className="text-lg hover:cursor-pointer hover:opacity-80 bg-transparent border-[1px] border-muted-foreground p-3 w-43 h-12 flex items-center space-x-3"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							fill="currentColor"
							viewBox="0 0 16 16"
						>
							<path d="M15.545 6.558a9.4 9.4 0 0 1 .139 1.626c0 2.434-.87 4.492-2.384 5.885h.002C11.978 15.292 10.158 16 8 16A8 8 0 1 1 8 0a7.7 7.7 0 0 1 5.352 2.082l-2.284 2.284A4.35 4.35 0 0 0 8 3.166c-2.087 0-3.86 1.408-4.492 3.304a4.8 4.8 0 0 0 0 3.063h.003c.635 1.893 2.405 3.301 4.492 3.301 1.078 0 2.004-.276 2.722-.764h-.003a3.7 3.7 0 0 0 1.599-2.431H8v-3.08z" />
						</svg>
						Google
					</Button>
				</span>
				<SignUpForm />
			</div>
			<div className="w-[50%] not-md:hidden h-full rounded bg-gradient-to-br from-zinc-300 via-zinc-300 to-indigo-600"></div>
		</div>
	);
}
