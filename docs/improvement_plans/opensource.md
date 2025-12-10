# Plano de Melhorias para Open Source e CI/CD

Este documento detalha as etapas para tornar o repositório amigável para a comunidade Open Source e estabelecer pipelines de integração contínua (CI).

## 1. Pipelines de CI (GitHub Actions)

Atualmente o projeto carece de automação para validar Pull Requests.

**Fluxo Sugerido (`.github/workflows/ci.yml`):**
1.  **Triggers:** Push na `main`, Pull Requests.
2.  **Jobs:**
    *   **Lint & Format:** Rodar `biome check`. Falhar se houver erros.
    *   **Typecheck:** Rodar `bun run typecheck`. Falhar se houver erros de TS.
    *   **Unit Tests:** Rodar `vitest`.
    *   **Build Check:** Tentar rodar o build do Desktop (`bun run build`) para garantir que compila (sem necessariamente gerar o instalador final em todo PR).

**Fluxo de Release (`release.yml`):**
*   Disparado por tags (v*).
*   Usa `tauri-action` para compilar binários (Mac/Win/Linux) e criar Draft Release.

## 2. Documentação para Comunidade

Para aceitar contribuições, precisamos definir as regras do jogo.

*   **CONTRIBUTE.md:**
    *   Como abrir Issues (Bug Report vs Feature Request).
    *   Padrão de Commits (Conventional Commits?).
    *   Processo de PR (necessita aprovação, passar no CI).
*   **PULL_REQUEST_TEMPLATE.md:**
    *   Checklist: "Testei localmente?", "Adicionei testes?", "Atualizei docs?".
*   **ISSUE_TEMPLATE/:**
    *   Templates estruturados para Bugs e Features.

## 3. Qualidade de Código (Enforcement)

*   **Husky + Lint-staged:** Configurar hooks de git para rodar lint apenas nos arquivos modificados antes do commit (`pre-commit`). Isso evita que código sujo entre no repo.

## Ações Imediatas

1.  Criar o arquivo `.github/workflows/ci.yml` básico com Lint e Typecheck.
2.  Criar `CONTRIBUTING.md` na raiz.
