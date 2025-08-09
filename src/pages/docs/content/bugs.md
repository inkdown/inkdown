# 🐛 Relatório de Bugs e Feedback - Inkdown

## Como Reportar um Bug

Encontrou um problema no Inkdown? Sua contribuição é fundamental para melhorarmos o aplicativo! Este guia te ajudará a reportar bugs de forma eficiente.

## Antes de Reportar

### 1. Verifique se é um Bug Conhecido
- Consulte as [Issues abertas](https://github.com/inkdown/inkdown-desktop/issues)
- Verifique se o problema já foi reportado
- Leia as notas de versão para problemas conhecidos

### 2. Reproduza o Problema
- Tente reproduzir o bug consistentemente
- Anote os passos exatos que levaram ao problema
- Teste em diferentes cenários quando possível

## Canais de Reporte

### GitHub Issues (Recomendado)
**URL**: https://github.com/inkdown/inkdown-desktop/issues

**Quando usar**: 
- Bugs confirmados
- Requests de features
- Problemas técnicos
- Issues de performance

### Email Direto
**Email**: bugs@inkdown.app

**Quando usar**:
- Problemas de segurança
- Bugs críticos que impedem uso
- Questões sensíveis

## Template de Bug Report

Ao reportar um bug, inclua as seguintes informações:

### Informações do Sistema
```
**SO**: Windows 11 / macOS Ventura / Ubuntu 22.04
**Versão do Inkdown**: 0.1.0
**Arquitetura**: x64 / ARM64
**RAM**: 8GB / 16GB / etc.
**Resolução**: 1920x1080 / 2560x1440 / etc.
```

### Descrição do Bug
```
**Resumo**: Descrição breve e clara do problema

**Comportamento Esperado**: O que deveria acontecer

**Comportamento Atual**: O que realmente acontece

**Impacto**: Crítico / Alto / Médio / Baixo
```

### Reprodução
```
**Passos para Reproduzir**:
1. Abrir o Inkdown
2. Criar um novo arquivo
3. Digitar texto específico
4. Executar ação X
5. Bug aparece

**Frequência**: Sempre / Às vezes / Raramente
```

### Evidências
```
**Screenshots**: Anexar imagens se aplicável
**Logs de Erro**: Copiar mensagens de erro
**Arquivo Problemático**: Anexar arquivo .md se relevante
```

## Coletando Informações de Debug

### 1. Logs do Console
**Windows**:
```powershell
# Executar Inkdown com logs
$env:RUST_LOG="debug"
./inkdown.exe > logs.txt 2>&1
```

**macOS/Linux**:
```bash
# Executar Inkdown com logs
RUST_LOG=debug ./inkdown > logs.txt 2>&1
```

### 2. Informações do Sistema
```bash
# Informações do Tauri
bunx tauri info

# Versão do Bun
bun --version

# Informações do sistema (Linux)
uname -a
lscpu | grep -E "Model name|Architecture"
free -h
```

### 3. Logs de Desenvolvimento
Se você tem o ambiente de desenvolvimento:
```bash
# Executar em modo debug
bun run dev
# Em outro terminal
RUST_LOG=debug bunx tauri dev
```

## Tipos de Problemas Comuns

### 🔥 Críticos (Reportar Imediatamente)
- Aplicação trava/congela
- Perda de dados
- Falhas de segurança
- Impossibilidade de abrir arquivos

### ⚠️ Altos
- Features principais não funcionam
- Performance severely impacted
- Problemas de sincronização
- Bugs que afetam fluxo de trabalho

### 📋 Médios
- Features secundárias com problemas
- Pequenos problemas de UI/UX
- Problemas de formatting
- Bugs esporádicos

### 🔧 Baixos
- Melhorias de usabilidade
- Pequenos problemas visuais
- Requests de features
- Problemas de documentação

## Bugs Específicos do Inkdown

### Editor
```markdown
**Problema com Markdown**: Descrever formatação incorreta
**Problema de Sintaxe**: Highlighting não funciona
**Problema de Performance**: Lentidão ao digitar
**Vim Mode**: Issues com comandos vim
```

### Interface
```markdown
**Sidebar**: Problemas na árvore de arquivos
**Temas**: Cores não aplicadas corretamente
**Redimensionamento**: Problemas de layout
**Modais**: Comportamento incorreto
```

### Arquivo/Sistema
```markdown
**Salvamento**: Falhas ao salvar arquivos
**Abertura**: Problemas para abrir arquivos/pastas
**Sincronização**: Issues de watchdog
**Performance**: Lentidão com arquivos grandes
```

## Informações Úteis para Debug

### Para Problemas de Performance
- Tamanho do arquivo em edição
- Quantidade de arquivos no workspace
- Uso de CPU/RAM durante o problema
- Tempo para reproduzir o problema

### Para Problemas de UI/Tema
- Tema em uso (light/dark/personalizado)
- Resolução da tela
- Nível de zoom
- Screenshot do problema

### Para Problemas de Editor
- Texto sendo editado
- Modo vim ativo/inativo
- Extensions ativas
- Configurações personalizadas

## Workflow de Resolução

1. **Triagem** (1-2 dias)
   - Validação do bug
   - Classificação de prioridade
   - Atribuição de labels

2. **Investigação** (3-7 dias)
   - Reprodução do problema
   - Identificação da causa raiz
   - Planejamento da correção

3. **Desenvolvimento** (varia)
   - Implementação da correção
   - Testes internos
   - Code review

4. **Validação** (1-3 dias)
   - Testes com o reporter
   - Testes de regressão
   - Preparação para release

5. **Release**
   - Deploy da correção
   - Notificação ao reporter
   - Documentação da correção

## Agradecimentos

Todo bug reportado nos ajuda a melhorar o Inkdown. Como forma de agradecimento:

- **Contribuidores frequentes**: Menção no changelog
- **Bug críticos**: Reconhecimento especial
- **Melhorias**: Créditos na documentação

## Contato

- **GitHub**: https://github.com/inkdown/inkdown-desktop/issues
- **Email**: bugs@inkdown.app
- **Discord**: https://discord.gg/inkdown (em breve)

---

**Juntos fazemos o Inkdown melhor! 🚀**