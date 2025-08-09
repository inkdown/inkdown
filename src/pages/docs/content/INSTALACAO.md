# 📦 Guia de Instalação e Desenvolvimento - Inkdown

## Sobre o Inkdown

O Inkdown é um aplicativo de tomada de notas em Markdown, desenvolvido com foco em performance, responsividade e simplicidade. Construído com tecnologias modernas para oferecer uma experiência de escrita rápida e produtiva.

## Stack Tecnológica

- **Frontend**: React + TypeScript + Vite
- **Desktop**: Tauri (Rust)
- **Styling**: Tailwind CSS 4.0
- **Runtime**: Bun.js
- **Editor**: CodeMirror 6
- **Arquitetura**: Modular e componentizada

## Pré-requisitos

### Sistema Operacional
- Windows 10/11 (x64)
- macOS 10.15+ (x64/ARM64)
- Linux (x64/ARM64)

### Ferramentas Necessárias

#### 1. Bun.js
```bash
# Windows (PowerShell)
powershell -c "irm bun.sh/install.ps1 | iex"

# macOS/Linux
curl -fsSL https://bun.sh/install | bash
```

#### 2. Rust
```bash
# Instalar via rustup
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env
```

#### 3. Dependências do Sistema

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install -y \
    libwebkit2gtk-4.1-dev \
    build-essential \
    curl \
    wget \
    file \
    libxdo-dev \
    libssl-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev \
    pkg-config
```

**Linux (Fedora/RHEL):**
```bash
sudo dnf groupinstall -y "C Development Tools and Libraries" "Development Tools"
sudo dnf install -y \
    webkit2gtk4.1-devel \
    openssl-devel \
    curl \
    wget \
    file \
    libappindicator-gtk3-devel \
    librsvg2-devel
```

**macOS:**
```bash
# Instalar Xcode Command Line Tools
xcode-select --install
```

**Windows:**
- Visual Studio 2019/2022 com C++ Build Tools
- Windows SDK

## Instalação do Projeto

### 1. Clone o Repositório
```bash
git clone https://github.com/inkdown/inkdown-desktop.git
cd inkdown-desktop
```

### 2. Instale as Dependências
```bash
# Instalar dependências do frontend
bun install

# Adicionar Tauri CLI localmente
bun add -d @tauri-apps/cli
```

### 3. Configuração Inicial
```bash
# Verificar se tudo está configurado corretamente
bunx tauri info
```

## Desenvolvimento

### Modo de Desenvolvimento
```bash
# Iniciar o servidor de desenvolvimento
bun run dev

# Em outro terminal, executar o app Tauri
bunx tauri dev
```

O comando `bun run dev` irá:
- Iniciar o Vite dev server na porta 1420
- Habilitar hot reload para mudanças no frontend
- Compilar automaticamente mudanças no código TypeScript

### Comandos Disponíveis

```bash
# Frontend
bun run dev          # Servidor de desenvolvimento
bun run build        # Build de produção
bun run preview      # Preview do build

# Tauri
bunx tauri dev       # Execução em desenvolvimento
bunx tauri build     # Build do executável
bunx tauri info      # Informações do ambiente
```

### Estrutura de Desenvolvimento

```
inkdown-desktop/
├── src/                     # Frontend (React/TypeScript)
│   ├── components/          # Componentes React
│   │   ├── editor/         # Editor de markdown
│   │   ├── sidebar/        # Barra lateral
│   │   ├── settings/       # Configurações
│   │   └── ui/             # Componentes de UI
│   ├── hooks/              # Custom hooks
│   ├── contexts/           # Contextos React
│   ├── styles/             # Estilos CSS
│   │   └── theme.css       # Sistema de temas
│   └── utils/              # Utilitários
├── src-tauri/              # Backend (Rust/Tauri)
│   ├── src/               # Código Rust
│   ├── Cargo.toml         # Dependências Rust
│   ├── tauri.conf.json    # Configuração do Tauri
│   └── icons/             # Ícones da aplicação
└── dist/                   # Build do frontend
```

## Build para Produção

### Build Completo
```bash
# Build do frontend + aplicação desktop
bun run build && bunx tauri build
```

### Artefatos de Build
Os executáveis serão gerados em:
- **Windows**: `src-tauri/target/release/bundle/nsis/` e `msi/`
- **macOS**: `src-tauri/target/release/bundle/dmg/` e `macos/`
- **Linux**: `src-tauri/target/release/bundle/appimage/` e `deb/`

## Resolução de Problemas

### Problemas Comuns

#### Erro: "webkit2gtk not found"
```bash
# Linux: Instalar webkit2gtk
sudo apt install libwebkit2gtk-4.1-dev  # Ubuntu/Debian
sudo dnf install webkit2gtk4.1-devel    # Fedora
```

#### Erro: "failed to run custom build command for 'tauri'"
```bash
# Verificar se o Rust está atualizado
rustup update stable
```

#### Erro: "command not found: bun"
```bash
# Reinstalar Bun e adicionar ao PATH
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc  # ou ~/.zshrc
```

#### Performance Issues
- Certifique-se de ter pelo menos 4GB de RAM disponível
- Use SSD para melhor performance de I/O
- No Linux, considere aumentar `fs.inotify.max_user_watches`

```bash
# Aumentar limite de watchers (Linux)
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### Logs de Debug
```bash
# Executar com logs detalhados
RUST_LOG=debug bunx tauri dev

# No Windows (PowerShell)
$env:RUST_LOG="debug"; bunx tauri dev
```

## Próximos Passos

Após a instalação bem-sucedida:
1. Leia a documentação de [relatório de bugs](BUGS.md)
2. Consulte o guia de [criação de temas](TEMAS.md)
3. Explore o código-fonte para contribuições

## Contribuição

Para contribuir com o projeto:
1. Faça um fork do repositório
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request