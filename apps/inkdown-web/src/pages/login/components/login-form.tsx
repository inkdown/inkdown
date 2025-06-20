import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { ErrorSpan } from "@/components/error-span";
import { login } from "@/features/author/services/author-service";
import { useState } from "react";

export const LoginForm = () => {
  const [feedback, setFeedback] = useState(<></>);

  const schema = z.object({
    email: z.string().email("Email necessário"),
    password: z.string().nonempty("Senha necessária"),
  });

  type loginFormData = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<loginFormData>({
    resolver: zodResolver(schema),
  });

  const handleLoginSubmit = async (data: loginFormData) => {
    const response = await login(data);

    if (response && response.errorMessage) {
      setFeedback(<ErrorSpan>{response.errorMessage}</ErrorSpan>);
    };
  };

  return (
    <form onSubmit={handleSubmit(handleLoginSubmit)} className="w-120 flex flex-col items-center justify-start pt-10 h-100 jp-5">
      <div className="flex justify-center w-full pt-4 items-center gap-4">
        <hr className="w-[40%] border-zinc-800" />
        <span className="text-zinc-800 text-sm">ou</span>
        <hr className="w-[40%] border-zinc-800" />
      </div>
      <div className="flex flex-col">
        <label className=" w-80 pt-10" htmlFor="emailInput">
          Email
        </label>
        <Input
          className="w-80 border-muted-foreground focus-visible:ring-indigo-600"
          id="emailInput"
          {...register("email")}
        />
        {errors.email && <ErrorSpan>{errors.email.message}</ErrorSpan>}
      </div>
      <div className="flex flex-col">
        <label className=" w-80 pt-8" htmlFor="emailInput">
          Senha
        </label>
        <Input
          className="w-80 border-muted-foreground focus-visible:ring-indigo-600"
          id="emailInput"
          {...register("password")}
        />
        {errors.password && <ErrorSpan>{errors.password.message}</ErrorSpan>}
      </div>
      <span className="pt-10">
        <Button
          className="w-80 bg-indigo-700 hover:bg-indigo-800 hover:cursor-pointer text-zinc-200 font-bold"
          type="submit"
        >
          Entrar
        </Button>
      </span>
      {feedback}
      <span className="w-80 pt-5 flex gap-1 items-center text-sm text-muted-foreground">
        Não possui uma conta ?
        <Link to={"/signup"} className="text-indigo-700">
          Criar
        </Link>
      </span>
    </form>
  )
}
