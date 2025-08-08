import { Logo } from "@/components/logo";
import { Link } from "react-router-dom";
import { LoginForm } from "./components/login-form";

export default function LoginPage() {
  return (
    <div className="w-full lg:grid lg:min-h-[600px] lg:grid-cols-2 xl:min-h-[800px]">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold">Login</h1>
            <p className="text-balance text-muted-foreground">
              Entre com suas credenciais para acessar sua conta
            </p>
          </div>
          <div className="grid gap-4">
            <LoginForm />
          </div>
          <div className="mt-4 text-center text-sm">
            Não tem uma conta?
            <Link to="/signup" className="underline">
              Cadastre-se
            </Link>
          </div>
        </div>
      </div>
      <div className="hidden bg-muted lg:block">
        <div className="w-full h-full bg-zinc-900 text-white flex flex-col justify-between p-10">
          <Logo />
          <div className="flex flex-col gap-4">
            <h2 className="text-4xl font-bold">Leve, seguro e moderno</h2>
            <p className="text-lg text-muted-foreground">
              O editor de texto que te ajuda a se concentrar no que importa.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-500 rounded-full" />
            <div className="flex flex-col">
              <p className="font-bold">John Doe</p>
              <p className="text-sm text-muted-foreground">CEO da Acme Inc.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
