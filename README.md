# DefFinance v1

DefFinance é um dashboard financeiro completo para pequenas e médias empresas acompanharem contas a pagar e a receber, fluxo de caixa, relatórios gerenciais e cadastros de apoio. A aplicação combina uma SPA React com backend Node/Express para servir os assets em produção e integrações com Supabase (autenticação, banco e Edge Functions) e Google Sheets.

## Sumário
- [Escopo funcional](#escopo-funcional)
- [Arquitetura](#arquitetura)
- [Requisitos técnicos](#requisitos-técnicos)
- [Instalação e execução](#instalação-e-execução)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Fluxos principais](#fluxos-principais)
- [Integrações externas](#integrações-externas)
- [Padrões de código e UI](#padrões-de-código-e-ui)
- [Testes](#testes)
- [Próximos passos sugeridos](#próximos-passos-sugeridos)

## Escopo funcional
- **Autenticação Supabase**: cadastro, login e logout com proteção de rotas via `PrivateRoute` e `SupabaseAuthContext`.
- **Dashboard consolidado**: visão geral de métricas (previstos, realizados, atrasados) e gráficos de barras mensais usando dados da tabela `lancamentos` no Supabase.
- **Módulo Contas a Receber**: filtros por status/período, marcação de recebimentos, exportação em PDF/planilha e indicadores.
- **Módulo Contas a Pagar**: gerenciamento de vencimentos, status e fornecedores com widgets de resumo e geração de relatórios.
- **Fluxo de Caixa**: projeções e comparativos entre entradas e saídas com controles de período e detalhamento de categorias.
- **Lançamentos**: criação/edição de lançamentos financeiros com validação, formulários dinâmicos e integração com o Supabase.
- **Cadastros de apoio**: administração de clientes, fornecedores, categorias e meios de pagamento.
- **Relatórios**: geração de relatórios analíticos (Fluxo de Caixa detalhado, DRE gerencial, Contas consolidadas), exportação para PDF e impressão.
- **Importação Google Sheets**: botão no Dashboard que aciona a Supabase Edge Function `import-google-sheets` para sincronizar planilhas externas com o banco.
- **Notificações**: feedback visual unificado via componente `Toaster`, informando sucesso, erros ou avisos em toda a aplicação.

## Arquitetura
- **Frontend**: React 18 + Vite, roteamento com `react-router-dom`, gerenciamento de estado contextual (auth) e UI construída sobre Tailwind CSS com componentes Radix UI/shadcn. Gráficos alimentados por Recharts, animações com Framer Motion e formulários com componentes reutilizáveis (`button`, `input`, `select`, `calendar`, etc.).
- **Backend de entrega**: servidor Express (`server/app.js`) que expõe `GET /health`, serve os arquivos estáticos do build (produção) ou delega para Vite em modo middleware (desenvolvimento). Compressão habilitada em produção.
- **Serviços auxiliares**: camada em `src/services/googleSheetsService.js` que aciona o endpoint interno `/api/google-sheets/import`, persistindo os últimos dados no `localStorage` como fallback local.
- **Supabase**: cliente centralizado em `src/lib/customSupabaseClient.js` compartilhado entre contextos e páginas. O fluxo de importação utiliza Supabase Functions (Edge) e tabelas como `lancamentos` para armazenar movimentações.
- **Ferramentas de build**: Vite personalizado (`vite.config.js`) com plugins internos (modo editor, restauração de rotas em iframes) e interceptação de logs/erros para integração com ambientes de edição visual.

## Requisitos técnicos
- **Node.js**: 20.19.1 (ver `.nvmrc`).
- **NPM**: 10.x (instalado junto com Node 20).
- **Supabase**: projeto com autenticação por email/senha habilitada, tabela `lancamentos` (campos como `tipo`, `status`, `data`, `valor`) e função Edge `import-google-sheets` disponível.
- **Credenciais**: substituir valores de exemplo antes de publicar:
  - `src/lib/customSupabaseClient.js` → use variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` via `import.meta.env`.
  - Configuração do Google Sheets via `GOOGLE_API_KEY`, `GOOGLE_SHEET_PAGAMENTOS_ID` e `GOOGLE_SHEET_RECEBIMENTOS_ID` (consumidos apenas pelo backend Express).
- **Ferramentas opcionais**: Supabase CLI (para deploy de funções) e editor de planilhas que publique dados acessíveis pela API do Google.

## Instalação e execução
```bash
npm install          # instala dependências
npm run dev          # inicia Vite em modo desenvolvimento (http://localhost:3000)
npm run build        # gera build estático em ./dist
npm run preview      # pré-visualiza build com servidor da Vite
npm run start        # inicia servidor Express servindo ./dist (após build)
npm run test:server  # sobe o servidor de teste (API sem frontend, porta 3100)
npm run test         # executa testes de unidade do backend (Node test runner)
```

### Variáveis de ambiente sugeridas
Crie um arquivo `.env` na raiz com os valores reais e ajuste os imports do Supabase/Google Sheets para consumi-los:
```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
GOOGLE_API_KEY=...
GOOGLE_SHEET_PAGAMENTOS_ID=...
GOOGLE_SHEET_RECEBIMENTOS_ID=...
```
> ⚠️ Os arquivos atuais usam chaves hardcoded apenas para desenvolvimento. Remova-as antes de distribuir ou publicar o projeto.

## Estrutura de pastas
```
DefFinance-v1/
├── public/                  # assets estáticos
├── src/
│   ├── components/          # blocos reutilizáveis (UI e seções)
│   ├── contexts/            # contexto de autenticação Supabase
│   ├── lib/                 # clientes e utilitários
│   ├── pages/               # telas principais protegidas por rota
│   ├── services/            # integrações externas (Google Sheets)
│   ├── App.jsx              # definição de rotas e layout
│   └── main.jsx             # bootstrap do React + Tailwind
├── server/
│   ├── app.js               # fábrica do servidor Express
│   ├── index.js             # entrypoint (npm run start)
│   └── app.test.js          # testes do backend
├── plugins/                 # plugins customizados utilizados no Vite
├── tools/                   # utilitários para build (ex.: generate-llms)
├── tailwind.config.js
├── vite.config.js
└── package.json
```

## Fluxos principais
- **Login / Cadastro** (`src/pages/Login.jsx`, `src/pages/SignUp.jsx`): formulários com Radix UI, validação básica e chamadas ao `SupabaseAuthContext` (funções `signIn`, `signUp`).
- **Dashboard** (`src/pages/Dashboard.jsx`): carrega `lancamentos` do Supabase, consolida indicadores, renderiza gráfico e aciona importação de planilhas.
- **Contas a Pagar/Receber** (`src/pages/ContasPagar.jsx`, `src/pages/ContasReceber.jsx`): exibem tabelas filtráveis, contadores por status e ações de exportação via `jspdf`/`html2canvas`.
- **Fluxo de Caixa** (`src/pages/FluxoCaixa.jsx`, `src/pages/FluxoCaixaDetalhado.jsx`): combina dados previstos vs realizados, segmentação por período e exportação.
- **Relatórios** (`src/pages/Relatorios.jsx`, `RelatorioContas.jsx`, `DreGerencial.jsx`): agregações e análises para tomada de decisão, geração de PDFs e impressão.
- **Lançamentos** (`src/pages/Lancamentos.jsx`): CRUD simplificado com formulário dinâmico e persistência Supabase.
- **Cadastros** (`src/pages/Cadastros.jsx`): gerenciamento de entidades auxiliares para alimentar os demais módulos.

## Integrações externas
- **Supabase**:
  - Autenticação e sessões via `supabase.auth.*`, com listener `onAuthStateChange` dentro de `SupabaseAuthContext`.
  - CRUD de lançamentos e outras entidades pela tabela `lancamentos` (ajuste nomes/colunas conforme schema do seu projeto Supabase).
  - Edge Function `import-google-sheets` é invocada pelo Dashboard (`supabase.functions.invoke`) e deve retornar `{ message: string }` em caso de sucesso.
- **Google Sheets API v4**:
  - Endpoint `/api/google-sheets/import` no backend Express realiza as chamadas à API oficial usando as variáveis de ambiente privadas e devolve os dados consolidados ao frontend.
  - Serviço `importGoogleSheetsData` consome esse endpoint e armazena os resultados recentes no `localStorage` como fallback offline.
  - Espera planilhas com cabeçalhos (linha 1) e colunas padronizadas: fornecedor/parcela/vencimento/valor (pagamentos) e cliente/vencimento/valor (recebimentos).
- **Bibliotecas principais**: Radix UI, lucide-react (ícones), Framer Motion, Recharts, Tailwind Merge, React Day Picker, date-fns, html2canvas, jspdf/jspdf-autotable, class-variance-authority.

## Padrões de código e UI
- **Estilos**: Tailwind CSS com gradientes e glassmorphism, tokens definidos em `tailwind.config.js` e utilitários globais no `index.css`.
- **Componentes reutilizáveis**: baseados em shadcn/ui, com variantes controladas por `class-variance-authority` (botões, cartões, seletor, toast etc.).
- **Toast global**: `useToast` + `Toaster` para mensagens consistentes (`variant` default/destructive).
- **Roteamento protegido**: wrapper `PrivateRoute` redireciona visitantes não autenticados para `/login` e exibe spinner durante carregamento do estado de sessão.
- **Tratamento de erros**: notificações amigáveis em operações de importação/autenticação e logs de falhas no console para depuração.

## Testes
- **Backend**: testes com `node --test` para o servidor Express (`server/app.test.js`), cobrindo rota de saúde e comportamento básico.
- **Frontend**: ainda não há suíte automatizada; recomenda-se incluir testes com Vitest/Testing Library para páginas críticas e hooks.

## Próximos passos sugeridos
1. Parametrizar chaves Supabase/Google Sheets via variáveis de ambiente e remover segredos do código-fonte.
2. Documentar o schema das tabelas Supabase (campos, tipos, relacionamentos) e automatizar migrações.
3. Adicionar testes de frontend (ex.: fluxos de login e dashboard) e cobertura para importação de planilhas.
4. Configurar CI para lint, testes e build automatizados antes de deploy.
