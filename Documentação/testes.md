# Ambiente de testes

Este guia explica como preparar e executar a suite de testes automatizados do projeto DefFinance v1 utilizando o runner nativo do Node.js.

## Requisitos
- Node.js 20.19.1 (definido em `.nvmrc`).
- NPM 10.x (instalado junto com o Node 20).
- Acesso ao diretório do projeto.

### Verificando a versão do Node
```bash
node --version
```
Se necessário, use o nvm para instalar/ativar a versão correta:
```bash
nvm install
nvm use
```

## Instalação das dependências
```bash
npm install
```

## Execução dos testes

### Rodada única
Executa todos os testes localizados em `server`.
```bash
npm test
```

### Modo observador
Reexecuta automaticamente ao detectar alterações nos arquivos monitorados.
```bash
npm run test:watch
```

## Variáveis de ambiente
Nenhuma variável extra é necessária para a suite atual. O teste cobre apenas a rota `GET /health`, portanto não faz chamadas externas ao Google Sheets ou Supabase. Caso futuros testes dependam dessas integrações, utilize arquivos `.env` específicos (ex.: `.env.test`) para configurar chaves sem impactar outros ambientes.
