# 🎨 Criação e Publicação de Temas - Inkdown

## Visão Geral

O Inkdown suporta temas completamente personalizáveis através de CSS variables. Este guia te ensina como criar, testar e publicar seus próprios temas.

## Sistema de Temas

### Arquitetura
O Inkdown utiliza CSS Custom Properties (variables) para permitir tematização completa da interface. Cada tema define cores, tipografia, espaçamentos e outros aspectos visuais.

### Arquivo Base: `theme.css`
O arquivo principal está localizado em `src/styles/theme.css` e contém:
- Variáveis para tema claro e escuro
- Classes para componentes da interface
- Sistema de tipografia
- Configurações do editor CodeMirror

## Estrutura de um Tema

### Exemplo de Repositório
Baseado no tema [inkdown-gruvbox](https://github.com/l-furquim/inkdown-gruvbox), um tema completo deve conter:

```
meu-tema-inkdown/
├── light.css          # Variáveis do tema claro
├── dark.css           # Variáveis do tema escuro
├── light.png          # Preview do tema claro
├── dark.png           # Preview do tema escuro
├── theme.json         # Metadados do tema
└── README.md          # Descrição do tema
```

### 1. Arquivo `theme.json`
```json
{
  "name": "Meu tema personalizado",
  "author": "Author",
  "description": "Meu tema feito para o inkdown",
  "variants": [
    {
      "id": "tema-dark",
      "name": "Tema Dark",
      "mode": "dark",
      "cssFile": "dark.css"
    },
    {
      "id": "tema-light", 
      "name": "Tema Light",
      "mode": "light",
      "cssFile": "light.css"
    }
  ],
  "version": "1.0.0",
  "homepage": "Deixe aqui sua home page !"
}
```

### 2. Estrutura CSS: `light.css` e `dark.css`

#### Variáveis Essenciais do Tema

```css
:root,
[data-theme="meu-tema-light"],
.theme-meu-tema-light {
  color-scheme: light;
  
  /* === UI Base === */
  --theme-primary: #6366f1;
  --theme-primary-foreground: #ffffff;
  --theme-secondary: #f1f5f9;
  --theme-secondary-foreground: #0f172a;
  --theme-background: #ffffff;
  --theme-foreground: #0f172a;
  --theme-muted: #f8fafc;
  --theme-muted-foreground: #64748b;
  --theme-accent: #f1f5f9;
  --theme-accent-foreground: #0f172a;
  --theme-border: #e2e8f0;
  --theme-input: #ffffff;
  --theme-ring: #6366f1;
  --theme-destructive: #ef4444;
  --theme-destructive-foreground: #ffffff;
  
  /* === Sidebar === */
  --theme-sidebar-background: #f8fafc;
  --theme-sidebar-foreground: #334155;
  --theme-sidebar-border: #e2e8f0;
  --theme-sidebar-hover: #f1f5f9;
  --theme-sidebar-active: #e2e8f0;
  
  /* === Editor === */
  --theme-editor-background: #ffffff;
  --theme-editor-foreground: #24292f;
  --theme-editor-selection: #6366f133;
  --theme-editor-cursor: #24292f;
  --theme-editor-border: #e2e8f0;
  --theme-editor-line-number: #8c959f;
  --theme-editor-active-line: #f6f8fa;
  --theme-editor-scrollbar: #e2e8f0;
  
  /* === Syntax Highlighting === */
  --syntax-keyword: #6366f1;
  --syntax-string: #059669;
  --syntax-number: #dc2626;
  --syntax-comment: #64748b;
  --syntax-strong: #0f172a;
  --syntax-emphasis: #374151;
  --syntax-heading: #dc2626;
  --syntax-link: #6366f1;
  --syntax-url: #6366f1;
  --syntax-strikethrough: #64748b;
  --syntax-monospace: #dc2626;
  --syntax-monospace-bg: #f8fafc;
  
  /* === Headings === */
  --syntax-heading-h1: #dc2626;
  --syntax-heading-h2: #ea580c;
  --syntax-heading-h3: #d97706;
  --syntax-heading-h4: #65a30d;
  --syntax-heading-h5: #059669;
  --syntax-heading-h6: #0891b2;
}
```

#### Variáveis para Tema Escuro (`dark.css`)
```css
[data-theme="meu-tema-dark"],
.theme-meu-tema-dark {
  color-scheme: dark;
  
  /* Adapte todas as cores para o tema escuro */
  --theme-background: #0f172a;
  --theme-foreground: #f8fafc;
  /* ... resto das variáveis adaptadas ... */
}
```

## Guia de Criação

### 1. Planejamento
- **Paleta de cores**: Defina 5-8 cores principais
- **Contraste**: Garanta acessibilidade (WCAG 2.1)
- **Consistência**: Mantenha harmonia visual
- **Temas**: Decida se terá versões clara e escura

### 2. Ferramentas Recomendadas
- **Paletas**: [Coolors.co](https://coolors.co), [Adobe Color](https://color.adobe.com)
- **Contraste**: [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- **Preview**: Use o próprio Inkdown para testar

### 3. Desenvolvimento Local

#### Clone o Inkdown
```bash
git clone https://github.com/inkdown/inkdown-desktop.git
cd inkdown-desktop
bun install
```

#### Modifique o `theme.css`
1. Abra `src/styles/theme.css`
2. Adicione suas variáveis no final:

```css
/* === MEU TEMA PERSONALIZADO === */
[data-theme="meu-tema"],
.theme-meu-tema {
  /* Suas variáveis aqui */
}
```

#### Teste o Tema
```bash
# Executar em desenvolvimento
bun run dev
# Em outro terminal
bunx tauri dev
```

### 4. Validação

#### Checklist Obrigatório
- [ ] Todas as variáveis `--inkdown-*` definidas
- [ ] Testado em tema claro e escuro
- [ ] Syntax highlighting legível
- [ ] Sidebar e modais funcionais
- [ ] Scrollbars estilizadas
- [ ] Seleção de texto visível

#### Testes Recomendados
```markdown
# Teste com este conteúdo Markdown
# Heading 1
## Heading 2
### Heading 3

**Texto em negrito** e *texto em itálico*

`código inline` e blocos:

```javascript
function test() {
  return "Hello World";
}
\```

> Citação em bloco
> Segunda linha

- Lista item 1
- Lista item 2
  - Sub-item

1. Lista numerada
2. Segundo item

[Link teste](https://example.com)

---

| Coluna 1 | Coluna 2 |
|----------|----------|
| Célula   | Célula   |
```

## Publicação do Tema

### 1. Criar Repositório
```bash
# Estrutura final do repositório
mkdir inkdown-meu-tema
cd inkdown-meu-tema

# Arquivos obrigatórios
touch light.css dark.css theme.json README.md
# Adicionar screenshots
# light.png, dark.png
```

### 2. Screenshot dos Temas
- **Resolução**: 1200x800 pixels
- **Formato**: PNG
- **Conteúdo**: Editor com markdown de exemplo
- **Nomes**: `light.png`, `dark.png`

### 3. README.md
```markdown
# Meu Tema Inkdown

Uma breve descrição do seu tema.

## Preview

### Light Theme
![Light Theme](light.png)

### Dark Theme  
![Dark Theme](dark.png)

## Instalação

1. Download dos arquivos CSS
2. Substitua em `src/styles/theme.css`
3. Rebuilde o aplicativo

## Cores

- Primary: #6366f1
- Secondary: #f1f5f9
- Accent: #ec4899

## Inspiração

Baseado em [inspiração/referência].
```

### 4. Submissão do Tema

#### Preparação
1. Certifique-se de que seu tema está funcionando corretamente
2. Crie screenshots em alta qualidade (PNG, 1200x800px)
3. Prepare o repositório público com seu tema no GitHub

#### Submissão via Pull Request
1. Acesse o repositório [inkdown-plugins](https://github.com/inkdown/inkdown-plugins)
2. Faça um fork do repositório
3. Edite o arquivo `themes.json` adicionando sua entrada:

```json
{
  "name": "Nome do Seu Tema",
  "author": "seu-usuario-github",
  "repo": "seu-usuario-github/nome-do-repositorio-tema",
  "screenshot": "nome-do-arquivo-screenshot.png",
  "modes": [
    "dark",
    "light"
  ]
}
```

**Exemplo real:**
```json
{
  "name": "Gruvbox",
  "author": "l-furquim",
  "repo": "l-furquim/inkdown-gruvbox",
  "screenshot": "dark.png",
  "modes": [
    "dark",
    "light"
  ]
}
```

#### Campos obrigatórios:
- **name**: Nome do seu tema (como aparecerá na lista)
- **author**: Seu username do GitHub
- **repo**: URL do repositório no formato `usuario/nome-repo`
- **screenshot**: Nome do arquivo de imagem no seu repositório
- **modes**: Array com os modos disponíveis (`["dark"]`, `["light"]` ou `["dark", "light"]`)

#### Commit e envio
```bash
git add themes.json
git commit -m "feat: adiciona tema [Nome do Tema]"
git push origin main
```

Após isso, abra um Pull Request no repositório principal.

#### Template de PR
```markdown
## Novo Tema: Meu Tema Personalizado

### Descrição
Uma breve descrição do tema e sua inspiração.

### Screenshots
- [x] Light theme preview incluído
- [x] Dark theme preview incluído

### Checklist
- [x] Todas variáveis Inkdown definidas
- [x] Testado localmente
- [x] README.md incluído
- [x] theme.json válido
- [x] Estrutura de pastas correta

### Testes
Testado com:
- Windows 11 / macOS / Linux
- Diferentes tamanhos de fonte
- Markdown complexo
- Modo vim ativo/inativo

### Paleta
- Primary: #6366f1
- Background: #ffffff / #0f172a
- Accent: #ec4899
```

## Processo de Aprovação

### 1. Review Automatizado
- Validação da estrutura de arquivos
- Verificação de variáveis obrigatórias
- Teste de build automático

### 2. Review Manual
- Qualidade visual
- Contraste e acessibilidade
- Consistência com guidelines
- Originalidade

### 3. Timeline
- **Review inicial**: 3-5 dias úteis
- **Feedback/correções**: 1-2 iterações
- **Aprovação final**: 1-2 dias úteis
- **Merge e publicação**: Próximo release

## Diretrizes e Melhores Práticas

### Acessibilidade
- **Contraste mínimo**: 4.5:1 para texto normal
- **Contraste mínimo**: 3:1 para texto grande
- **Cores**: Não dependa apenas de cor para informação
- **Focus indicators**: Visíveis e claros

### Performance
- **CSS otimizado**: Evite propriedades custosas
- **Variáveis**: Use CSS Custom Properties
- **Seletores**: Específicos mas não excessivos

### Consistência
- **Nomenclatura**: Siga padrões existentes
- **Hierarquia**: Respeite estrutura de cores
- **Espaçamentos**: Use valores consistentes

### Temas Populares para Inspiração
- **Gruvbox**: [inkdown-gruvbox](https://github.com/l-furquim/inkdown-gruvbox)
- **Dracula**: Cores escuras vibrantes
- **Nord**: Paleta fria e minimalista
- **One Dark**: Baseado no Atom
- **Material**: Design Google

## Troubleshooting

### CSS não aplica
```bash
# Verificar sintaxe
npx stylelint src/styles/theme.css

# Rebuildar aplicação
bun run build && bunx tauri build
```

### Cores incorretas
- Verificar hierarquia de CSS
- Confirmar especificidade de seletores
- Validar formato de cores (hex, rgb, hsl)

### Performance issues
- Evitar `@import` desnecessários
- Otimizar seletores complexos
- Minimizar reflows/repaints

## Contribuição Contínua

### Atualizações
- **Bugs**: Reportar issues rapidamente
- **Melhorias**: Feedback da comunidade
- **Compatibilidade**: Manter com versões novas

### Comunidade
- **Discord**: https://discord.gg/inkdown (em breve)
- **Discussões**: GitHub Discussions
- **Showcase**: Compartilhe seu tema!

---

**Crie temas incríveis e compartilhe com a comunidade! 🎨✨**