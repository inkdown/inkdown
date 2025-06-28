import { useChangeUserSetting } from "@/features/author/queries/author-query";
import { getEditorSettings } from "@/features/settings/services/settings-service";
import { useState } from "react";

export const EditorPage = () => {
  const [settings, setSettings] = useState(getEditorSettings);

  const updateSettingMutation = useChangeUserSetting();

  const toggleSetting = (key: keyof typeof settings) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    localStorage.setItem(key, String(updated[key]));

    updateSettingMutation.mutate(updated);
  };

  const renderSwitch = (
    key: keyof typeof settings,
    label: string,
    description: string
  ) => (
    <div className="space-y-2">
      <h3 className="font-semibold">{label}</h3>
      <span className="w-full flex justify-between">
        <p className="text-muted-foreground text-sm">{description}</p>
        <button
          onClick={() => toggleSetting(key)}
          className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${
            settings[key] ? "bg-theme-accent" : "bg-gray-400"
          }`}
        >
          <div
            className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${
              settings[key] ? "translate-x-3" : "translate-x-0"
            }`}
          />
        </button>
      </span>
    </div>
  );

  return (
    <div className="space-y-10 h-full flex flex-col">
      <p>Escolha as melhores configurações para você</p>
      {renderSwitch("lineNumbers", "Numerações nas linhas", "Indicador de linhas no editor")}
      {renderSwitch("hightlightActiveLine", "Destaque de linha atual.", "Marca a linha atual com uma coloração")}
      {renderSwitch("autocompletion", "Completar automaticamente", "Identifica o que está tentando escrever e completa com uma ação.")}
      {renderSwitch("markdownLineStyler", "Estilização markdown", "Estiliza o markdown automaticamente sem preview.")}
      {renderSwitch("bracketMathing", "Parear chaves", "Indica o outro lado da chave atual.")}
      {renderSwitch("syntaxHighlighting", "Estilização de sintaxe", "Estiliza o markdown com base na sintaxe.")}
      {renderSwitch("vimMode", "Modo vim", "Habilita o modo vim de edição de texto")}
      {renderSwitch("hightlightSelectionMatches", "Destacar seleções semelhantes", "Destaque visual de palavras semelhantes à seleção.")}
    </div>
  );
};