import { useState } from "react";

export const EditorPage = () => {
  const [enabled, setEnabled] = useState(false);
  return (
    <div className="space-y-10 flex flex-col" >
      <p>Escolha as melhores configurações para você</p>
      <div className="space-y-2">
        <h3 className="font-semibold">Numerações nas linhas</h3>
        <span className="w-full flex justify-between">
          <p className="text-muted-foreground text-sm">
            Indicador de linhas no editor
          </p>
          <button
            onClick={() => setEnabled(!enabled)}
            className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-300 ${enabled ? "bg-indigo-500" : "bg-gray-400"
              }`}
          >
            <div
              className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${enabled ? "translate-x-6" : "translate-x-0"
                }`}
            />
          </button>
        </span>

      </div>
      <div className="space-y-2">
        <h3 className="font-semibold">Destaque de linha atual.</h3>
        <span className="w-full flex justify-between">
          <p className="text-muted-foreground text-sm">

          </p>
          <button
            onClick={() => setEnabled(!enabled)}
            className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-300 ${enabled ? "bg-indigo-500" : "bg-gray-400"
              }`}
          >
            <div
              className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${enabled ? "translate-x-6" : "translate-x-0"
                }`}
            />
          </button>
        </span>

      </div>
    </div >
  )
}
