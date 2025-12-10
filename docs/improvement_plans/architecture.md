# Plano de Melhorias de Arquitetura

Este documento detalha o plano para desacoplar as responsabilidades exclusivas de Desktop (`WindowConfigManager`, `ShortcutManager`) do pacote `core`, aumentando a portabilidade para futuras versões (Mobile) e seguindo padrões de arquitetura inspirados no VS Code (separação de Comandos e Keybindings).

## Visão Geral

O objetivo principal é manter o `@inkdown/core` focado em lógica de negócios, gerenciamento de estado do editor e plugins, removendo dependências diretas de APIs de janela e eventos de teclado globais (DOM).

## 1. WindowConfigManager
**Status:** Completed
**Date:** 2024-05-22

**Problema:** O `WindowConfigManager` gerencia dimensões e posição da janela, algo inexistente ou gerenciado nativamente no Mobile, e específico do ambiente Desktop (Tauri/Electron). Atualmente é instanciado no `App.ts` do Core.

**Solução:** Mover para `apps/desktop` e remover referência direta no Core.

### Plano de Ação

1.  **Mover Arquivo:**
    *   Mover `packages/core/src/managers/WindowConfigManager.ts` para `apps/desktop/src/managers/WindowConfigManager.ts`.
2.  **Refatorar Core (`App.ts`):**
    *   Remover a propriedade `windowConfigManager`.
    *   Remover a importação e instanciação no construtor/init.
3.  **Implementar no Desktop:**
    *   No `apps/desktop/src/main.tsx` (ou ponto de entrada), instanciar o `WindowConfigManager` após criar a instância do `App`.
    *   Passar a instância do `App` para o `WindowConfigManager` (ele precisa do `ConfigManager` do app para salvar/carregar dados).
    *   Inicializá-lo explicitamente.

## 2. ShortcutManager (Separação em CommandService e KeybindingService)

**Problema:** O `ShortcutManager` atual mistura duas responsabilidades:
1.  **Registro de Comandos:** Define o que acontece (ex: "Salvar Arquivo", "Nova Aba").
2.  **Keybindings (Atalhos):** Define qual tecla dispara o comando (ex: "Ctrl+S"). houve e manipula eventos do DOM (`keydown`).

No Mobile, os comandos ("Salvar") continuam existindo (invocados por botões ou menus), mas os atalhos de teclado (DOM global keydown) funcionam diferente ou não existem da mesma forma. O Core deve conter os **Comandos**, mas o Desktop deve gerenciar os **Atalhos**.

**Inspiração VS Code:**
*   `ICommandService`: Registro e execução de comandos (Core).
*   `IKeybindingService`: Resolução de teclas para comandos (Desktop/UI).

### Plano de Ação

1.  **Criar `CommandManager` no Core:**
    *   Criar `packages/core/src/managers/CommandManager.ts`.
    *   Mover a lógica de registro de comandos (`commands` Map) e execução (`executeCommand`) do `ShortcutManager` para cá.
    *   O `App.ts` passará a ter `this.commandManager`.
2.  **Mover `ShortcutManager` para Desktop (KeybindingManager):**
    *   Mover `packages/core/src/ShortcutManager.ts` para `apps/desktop/src/managers/KeybindingManager.ts` (renomear para clareza).
    *   Refatorar para *consumir* o `CommandManager` do App para executar ações.
    *   Ele será responsável apenas por escutar `keydown`, resolver conflitos de teclas e chamar `app.commandManager.executeCommand(id)`.
3.  **Definir Interface de Keybinding no Core (Opcional/Futuro):**
    *   Se o Editor precisar exibir atalhos (tooltips), o Core pode definir uma interface `IKeybindingRegistry` que o Desktop implementa e injeta no Core.
4.  **Refatorar Registro de Comandos:**
    *   Mover `registerCoreCommands` para dentro do `App.ts` ou um arquivo de inicialização de comandos no Core (`core-commands.ts`), registrando-os no `CommandManager`.
    *   Plugins passarão a registrar comandos no `CommandManager`.

## Resumo da Nova Estrutura

*   **@inkdown/core**
    *   `CommandManager`: "O que fazer" (independente de plataforma).
*   **@inkdown/desktop**
    *   `WindowConfigManager`: "Como a janela se comporta".
    *   `KeybindingManager` (antigo ShortcutManager): "Quando acionar comandos via teclado".

## Benefícios

*   **Mobile Ready:** O App Mobile reutilizará todo o Core (incluindo comandos como "Salvar") sem carregar listeners de teclado globais ou lógica de janela inútil.
*   **Testabilidade:** Mais fácil testar comandos unitariamente sem mockar eventos de teclado.
*   **Organização:** Separação clara de responsabilidades seguindo princípios SOLID.
