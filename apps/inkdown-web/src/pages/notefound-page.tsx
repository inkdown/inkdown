import { Logo } from "@/components/logo";
import { Link, useSearchParams } from "react-router-dom";

export default function NotFoundPage() {

  const [searchParams] = useSearchParams();

  const message = searchParams.get("message");

  document.title = "404 - Not found";
  return (
    <div className="w-full h-[100vh] space-y-5 flex flex-col justify-center items-center">
      <Logo type="dark" />
      <h1 className="font-bold text-4xl pt-3 text-indigo-700">
        404 - Pagina não encontrada
      </h1>
      <p className="text-xl text-muted-foreground">
        {message}
      </p>
      <p className="flex gap-1">
        Me leve para o 
        <Link 
        to={"/notebook"} 
        className="border-b-[1px] border-indigo-700 text-indigo-700 hover:transition-colors"
        >
          inicio
        </Link>
      </p>
    </div>
  )
}