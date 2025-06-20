import { ChartBar, Globe, Linkedin, Palette, Paperclip, Twitter, Users, Youtube } from "lucide-react"
import { Button } from "./components/ui/button"
import { Logo } from "./components/logo"

function App() {

  return (
    <div className="flex w-full h-[350vh] flex-col">
      <div className="flex p-8 w-full items-center">
        <Logo type="dark" />
        <span className="text-sm text-muted-foreground ml-2">beta</span>
        <span className="flex space-x-8 pl-8">
          <a
            href="/download"
            className="text-zinc-600 ml-15 hover:text-indigo-600 transition-all"
          >
            Download
          </a>
          <a
            href="/about"
            className="text-zinc-600 hover:text-indigo-600 transition-all"
          >
            Sobre
          </a>
        </span>
        <a
          href="/account"
          className="text-zinc-600  hover:text-indigo-600 transition-all  ml-auto pr-4"
        >
          Conta
        </a>
        <a href="https://github.com/l-furquim/ink-down" className="h-6 hover:cursor-pointer w-6">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path
              d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
              fill="currentColor"
            />
          </svg>
        </a>
      </div>
      <div className="w-full h-full p-8 flex pt-32">
        <div className="w-[50%] flex flex-col pl-5 space-y-10">
          <h1 className="text-zinc-800 text-4xl font-bold ">
            Liberte suas ideias
          </h1>
          <p className="text-zinc-400 w-[70%] pb-20 text-xl">
            De forma gratuíta, escolha os arquivos que desjea incluir na núvem e
            os que não deseja
          </p>
          <Button
            className="bg-indigo-600 hover:bg-indigo-800 text-zinc-200 h-12 font-bold w-48"
            size={"lg"}
          >
            Começar
          </Button>
        </div>
        <div className="w-[50%]">
          <div className="relative w-80 h-80 bg-zinc-300 rounded-lg overflow-hidden flex items-center justify-center">
            <span className="z-10 font-bold">PRINT SCREEN</span>
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute bottom-0 right-0 w-3/4 h-3/4 bg-gradient-to-tr from-indigo-800 to-transparent" />
            </div>
          </div>
        </div>
      </div>
      <div className="w-full h-full flex pt-30 flex-col pl-8">
        <h1 className="text-indigo-600 font-bold text-3xl">
          Contribua para a comunidade
        </h1>
        <p className="text-zinc-400 text-xl w-[50%] pt-10">
          Crie seus próprios temas, compartilha suas notas e colabore para uma
          comunidade cíclica
        </p>
        <a
          href={"/community"}
          className="pt-10 text-indigo-600 border-b-[1px] w-fit border-indigo-600"
        >
          Ver mais
        </a>
        <div className="w-full flex items-center text-zinc-400 justify-center space-x-6 pt-20">
          <div className="fkex flex-col w-72 h-48 space-y-5 hover:bg-zinc-300 p-2 rounded-md hover:cursor-pointer transition-all">
            <div className="flex items-center gap-2">
              <Globe className="text-indigo-600" />
              <h1 className="font-bold text-zinc-800">Publique suas notas</h1>
            </div>
            <p>
              Escolha as notas que deseja compartilhar, e receba feedback com
              base nelas
            </p>
          </div>
          <div className="fkex flex-col w-72 h-48 space-y-5 hover:bg-zinc-300 p-2 rounded-md hover:cursor-pointer transition-all">
            <div className="flex items-center gap-2">
              <Palette className="text-indigo-600" />
              <h1 className="font-bold text-zinc-800">Troque seus temas</h1>
            </div>
            <p>
              Explore os temas da comunidade e ecolha o que mais faz sua cara.
              Não encontrou nenhum? crie o seu próprio no editor de temas e
              publique para a comunidade.
            </p>
          </div>
          <div className="fkex flex-col w-72 h-48 space-y-5 hover:bg-zinc-300 p-2 rounded-md hover:cursor-pointer transition-all">
            <div className="flex items-center gap-2">
              <ChartBar className="text-indigo-600" />
              <h1 className="font-bold text-zinc-800">Notas otimizadas</h1>
            </div>
            <p>
              Graças ao formato das notas nossa aplicação é capaz de converter
              suas notas com alta performance
            </p>
          </div>
        </div>
        <div className="pt-20  rounded-md h-56">
          <p>SCREEN SHOT AQUI</p>
        </div>
      </div>
      <div className="w-full h-full pb-30 items-center space-y-8 justify-center flex flex-col pl-5 pt-20">
        <h1 className="text-4xl font-bold">Sua hora de brilhar chegou</h1>
        <Button
          size={"lg"}
          className="bg-indigo-600 text-2xl hover:cursor-pointer hover:bg-indigo-800 h-16 text-zinc-200 font-bold rounded-md w-60"
        >
          Ter o app
        </Button>
        <div className="w-full h-72 flex justify-center items-center space-x-10">
          <div className="bg-zinc-300 border-[1px] border-muted-foreground w-72 group hover:cursor-pointer h-48 flex-col flex space-y-4 p-3 rounded-md text-zinc-800">
            <span className="flex space-x-3 items-center group-hover:text-indigo-600">
              <h1 className="text-xl font-bold ">Entre no discord</h1>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                fill="currentColor"
                viewBox="0 0 16 16"
              >
                <path d="M13.545 2.907a13.2 13.2 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.2 12.2 0 0 0-3.658 0 8 8 0 0 0-.412-.833.05.05 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.04.04 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032q.003.022.021.037a13.3 13.3 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019q.463-.63.818-1.329a.05.05 0 0 0-.01-.059l-.018-.011a9 9 0 0 1-1.248-.595.05.05 0 0 1-.02-.066l.015-.019q.127-.095.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.05.05 0 0 1 .053.007q.121.1.248.195a.05.05 0 0 1-.004.085 8 8 0 0 1-1.249.594.05.05 0 0 0-.03.03.05.05 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.2 13.2 0 0 0 4.001-2.02.05.05 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.03.03 0 0 0-.02-.019m-8.198 7.307c-.789 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612m5.316 0c-.788 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612" />
              </svg>
            </span>
            <p>
              Entre em um servidor de pessoas que partilham seus estudos com a
              ink down
            </p>
          </div>
          <div className="bg-zinc-300 border-[1px] border-muted-foreground w-72 group hover:cursor-pointer h-48 flex-col flex space-y-4 p-3 rounded-md text-zinc-800">
            <span className="flex space-x-3 items-center group-hover:text-indigo-600">
              <h1 className="text-xl font-bold ">Documentação</h1>
              <Paperclip />
            </span>
            <p>Documentação contando um pouco sobre como utilizar o ink down</p>
          </div>
          <div className="bg-zinc-300 border-[1px] border-muted-foreground w-72 group hover:cursor-pointer h-48 flex-col flex space-y-4 p-3 rounded-md text-zinc-800">
            <span className="flex space-x-3 items-center group-hover:text-indigo-600">
              <h1 className="text-xl font-bold ">Forum da comunidade</h1>
              <Users />
            </span>
            <p>
              Entre em um servidor de pessoas que partilham seus estudos com a
              ink down
            </p>
          </div>
        </div>
      </div>
      <div className="w-full h-full flex bg-zinc-800 p-8 space-x-10">
        <div className="flex flex-col justify-start items-center w-56 space-y-20">
          <Logo type="light" />
          <span className="flex space-x-6 items-center">
            <Twitter size={30} className="text-zinc-200" />
            <Linkedin size={30} className="text-zinc-200" />
            <Youtube size={30} className="text-zinc-200" />
          </span>
        </div>
        <div className="flex flex-col pt-4 justify-start items-center w-56 space-y-5 text-zinc-200">
          <h1 className="text-xl font-bold ">Documentação</h1>
          <a className="opacity-80" href={""}>
            Lorem
          </a>
          <a className="opacity-80" href={""}>
            Lorem
          </a>
          <a className="opacity-80" href={""}>
            Lorem
          </a>
        </div>
        <div className="flex flex-col pt-4 justify-start items-center w-56 space-y-5 text-zinc-200">
          <h1 className="text-xl font-bold ">Comunidade</h1>
          <a className="opacity-80" href={""}>
            Lorem
          </a>
          <a className="opacity-80" href={""}>
            Lorem
          </a>
          <a className="opacity-80" href={""}>
            Lorem
          </a>
        </div>
        <div className="flex flex-col pt-4 justify-start items-start w-64 space-y-5 text-zinc-200">
          <h1 className="text-xl w-fit font-bold">Realese notes</h1>
          <div className="bg-zinc-600 rounded-md hover:cursor-pointer group p-3 flex flex-col w-full items-start justify-center space-y-3">
            <span className="opacity-80 text-sm group-hover:opacity-100 transition-all">
              versão 1.0b
            </span>
            <h2 className="text-xl font-bold group-hover:text-indigo-500 transition-all">
              Lançamento da beta
            </h2>
            <span className="group-hover:text-indigo-500 transition-all">
              xx-xx-2025
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
