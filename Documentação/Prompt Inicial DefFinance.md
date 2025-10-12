## Crie um dashboard financeiro moderno e dinâmico para controle de contas a pagar e a receber com os seguintes atributos:

###	Requisitos Visuais e Funcionais
-	Layout limpo, moderno e responsivo.
-	Usar cores para diferenciar Receitas (verde) e Despesas (vermelho).
-	Permitir filtros, ordenações e navegação intuitiva.
-	Atualização em tempo real conforme alterações no Google Sheets.
-	No topo do dashboard de conter logo abaixa do titulo da pagina inicias "SysFina v1.0.0" os seguintes botões: "Dashboard", "Contas a Receber", "Contas a Pagar", "Fluxo de Caixa", "Lançamentos", "Cadastros" e "Relatorios", "Importar", todos agrupados e alinhados simetricamente nessa ordem.
-	Colocar um botão para retorno para pagina anterior quando for necessário.
-	Usar o fuso horário America/sao_paulo.
-	Na tela inicial do dashboard os cards tevem ter a ordem: Total a Receber, Total a Pagar e Resultado Operacional
	
###	Tela Principal
-	Cards com valores totalizadores de quanto tenho a receber a pagar.
-	No Card Total de Contas a Receber indicar separadamente os valores "Em Aberto", "Em Atraso" e "Recebido" separadas).
-	No Card total de Contas a Pagar indicar separadamente os valores "Em Aberto", "Vencido" e "Pago" separadas).
-	crie botoes para acessar o "Contas a Receber", "Contas a Pagar", "Fluxo de Caixa", "Lançamentos", "Cadastros" e "Relatorios", "Importar", todos agrupados e alinhados simetricamente nessa ordem.

###	Tela de Contas a Receber (Botão "Contas a Receber")
-	Lista detalhada dos clientes/devedores, carregada diretamente da aba Contas a Receber.
-	Filtros por período, status e cliente.
-	Destaque visual para recebimentos em atraso.
-	Coloque totalizadores diarios.
-	Deve ser exibido os recebimentos dia a dia, ordenado por data de recebimento assim como no contas a pagar.
-	Coloque totalizadores diarios.
-	Colocar nos cards "Em Aberto" e "Atrasado", as informações tipo de "Unidade" (Casa, Mangaratiba e Angra dos Reis).
-	Deve ter uma opção de filtrar por tipo de "Unidade" (Mangaratiba, Angra dos Reis e Casa)

###	Tela de Contas a Pagar (Botão "Contas a Pagar")
-	Lista detalhada dos fornecedores/obrigações, carregada diretamente da aba Contas a Pagar.
-	Filtros por período, status e fornecedor.
-	Destaque em vermelho para pagamentos vencidos.
-	Coloque totalizadores diarios.
-	Coloque totalizadores diarios.
-	Colocar nos cards "Em Aberto" e "Vencido", as informações por tipo "Unidade" (Casa, Mangaratiba e Angra dos Reis).
-	Deve ter uma opção de filtrar por tipo de "Unidade" (Mangaratiba, Angra dos Reis e Casa)

###	Tela de Fluxo Diário (Botão "Fluxo de Caixa")
-	Linha do tempo ou calendário mostrando diariamente entradas e saídas previstas.
-	Visualização por dia, semana e mês.
-	Gráfico de linha mostrando fluxo de caixa diário acumulado.
-	Botões de navegação "Mes Anterior" e "Próximo Mes" com indicação do mes corrente centralizado.
-	O fluxo de caixa devera ser uma listagem contendo as colunas dias do mes (de 1 a 31) informando quanto tem a receber e quanto a pagar em cada dia e o saldo e acresente o dia "00" que contera os valores em atraso.
-	Coloque ao lado do "saldo do dia" uma coluna com o saldo acumulado.
-	Trazer somente os valores com Status "A Vencer", mas  devesse deixar o dia "00" como atrasado dos mes anterior e exibir todos os dias do mes, mesmo que zerado.
-	Deve ter uma opção de filtrar por tipo de Unidade (Mangaratiba, Angra dos Reis e Casa)
	
###	Tela de Lancamentos (Botão "Lançamentos")
-	Tela para entradas dos dados: "Unidade", "Data", "Tipo", "Cliente/Fornecedor", "Descricao", "Valor", "Status" e "Obs", nessa ordem.
-	A entrada "Tipo" sera um ComboBox com as opções: "Entrada" e "Saida".
-	A entrada "Status" sera um ComboBox com as opções: "A Vencer" e "Pago".
-	A entrada "Data" devera ter a opção de entrada manual e via calendário.
-	A entrada "Unidade" sera um ComboBox com as opções: "CNA Angra dos Reis", "CNA Mangaratiba" e "Casa".
-	A entrada "Cliente/Fornecedor" sera um entrada de texto livre.
-	A entrada "Obs" sera um entrada de texto livre.
-	Deve existir os botões "Cancelar" e "Salvar".
-	O botão "Cancelar" deve abortar a operação e retornar a tela inicial.
	
###	Tela de Cadastros (Botão "Cadastros")
-	Tela para cadastro de "Cliente/Fornecedor" que tera entrada dos seguintes dados: "Tipo", "Descrição"
-	A entrada "Tipo" sera um ComboBox com as opções: "Cliente" e "Fornecedor".
-	Deve existir os botões "Cancelar" e "Salvar".
-	O botão "Cancelar" deve abortar a operação e retornar a tela inicial.
	
###	Tela de Relatórios (Botão "Relatórios")
-	Criar tela com botões de tamanha grande para as seguintes opções: "Fluxo de Caixa Detalhado", "DRE Gerencial"e "Contas A Pagar/Receber"

###	Tela de Login
-	Criar tela de login integrado ao Supabase e com a funcionalidade "Cadastre-se" implantada.
-	Criar a funcionalidade "Cadastre-se".
-	Criar botão de Logoff na tela inicial do Dashboard.

---

## Implemetações de Funcionalidades Dirigidas

###	Importação de Dados
-	crie um botão para realizar a importação dos dados das planilhas do google drive via API do Goole.
-   chave api: defina via variável de ambiente segura (`GOOGLE_API_KEY`)
-   Pagamentos:https://docs.google.com/spreadsheets/d/1VxtIv4kMab66yHC0iVp7uCIJxOg42ZacvY9ehlKrWYA/edit?usp=sharing
        Colunas: Fornecedor, Parcela, Vencimento, Valor, Unidade e Data da Baixa.
-   Recebimentos: https://docs.google.com/spreadsheets/d/1vDw0K8w3qHxYgPo-t9bapMOZ4Q2zlOsWUGaz12cDQRY/edit?usp=sharing
        Colunas : Sacado, CPF/CNPJ,	Contato, Aluno,	Data de Vencimento,	Data da Baixa,	Conta,	Conta Corrente (Boleto), Forma de Pagamento Prevista, Carteira,	Boleto Nº, Categoria, Descrição, Parcela, Valor Original, Desconto,	Valor com Desc. Pont., Multa/Juros, Em aberto (Vencido), Em aberto (A vencer), Recebido e Unidade
-   O formato dos dados da planilha é em pt-br com data DD/MM/AAAA e valor R$ 0.000,00
-   Ao acionar o botão Importação, toda a informação no Supabase da tabela "lancamentos" devera ser apagada e a informação substituida pelos dados das planilhas Recebimento e Pagamentos..
-   A correspondencia da Tabela "lancamentos" com a planilha de Recebimentos é conforme abaixo (Supabase<->planilha):
    -   Data                ->  Data de Vencimento
    -   Tipo                ->  Valor Fixo "Entrada"
    -   Cliente_Fornecedor  ->  Sacado
    -   Descricao           ->  Descrição
    -   Valor               ->  Valor Original
    -   Status              ->  Se Data da Baixa estiver vazio, colocar "A Vencer" senão colocar "Pago"
	-	Unidade				->	Unidade
    -   OBS                 ->  Categoria + " / " + Parcela
	-	datapag				->	Data da Baixa
	-	contato				->	Contato
	-	Aluno				->	Aluno
	-	ValorAberto			->	Em aberto (Vencido)
	-	Parcela				->	Parcela
	-	Desc. Pontua.		->	Valor com Desc. Pont.
	
-   A correspondencia da Tabela "lancamentos" com a planilha de Pagamentos é conforme abaixo (Supabase<->planilha):
    -   Data                ->  Vencimento
    -   Tipo                ->  Valor Fixo "Saida"
    -   Cliente_Fornecedor  ->  Fornecedor
    -   Descricao           ->  Fornecedor
    -   Valor               ->  Valor
    -   Status              ->  Se Data da Baixa estiver vazio, colocar "A Vencer" senão colocar "Pago"
	-	Unidade				->	Unidade
    -   OBS                 ->  Parcela
	-	datapag				->	Data da Baixa
	-	contato				->	Valor vazio
	-	Aluno				->	Valor vazio
	-	ValorAberto			->	Valor vazio
	-	Parcela				->	Parcela
	-	Desc. Pontua.		->	Valor vazio
-   Ignore os valores R$ 0,00 e R$ 0,01 na importação.
-   Todo sistema deve refletir o Supabase.

###	Tela Principal
-	Nos Cards com valores totalizadores de quanto tenho a Receber a Pagar. O metodo de calculo do Total a Receber é "Em Aberto" + "Em Atraso" e do Total a Pagar "Em Aberto" + "Vencido"
-	No Card Total de Contas a Receber indicar separadamente os valores "Em Aberto", "Em Atraso" e "Recebido" separadas).
-	No Card total de Contas a Pagar indicar separadamente os valores "Em Aberto", "Vencido" e "Pago" separadas).
-	O valor Recebido são as Entradas que tem Status "Recebido" e o valor Pago são as saidas com Status "Pago"
-	Resultado final operacional é: Entrada com Status "A Vencer" - Saida com Status "A Vencer".
-	Gráfico de barras mostrando a proporção entre pagar e receber deve seguir o calculo Entrada com Status "A Vencer" - Saida com Status "A Vencer"

### Tela de Contas a Receber (Botão "Contas a Receber")
-	Colocar um botão para indicar valor recebido em cada linha de registro
-	Na tela do Conta a Receber ao precionar o botao "Recebido" deve-se alterar no banco de dados o campo "status" para "Pago" e o campo "data" devesse preencher com a data do dia.

### Tela de Contas a Pagar (Botão "Contas a Pagar")
-	Colocar um botão para indicar valor pago em cada linha de registro
-	Na tela do Conta a Receber ao precionar o botao "Pago" deve-se alterar no banco de dados o campo "status" para "Pago" e o campo "data" devesse preencher com a data do dia.

### Lancamentos
-   Gravar as informações da tela de Lancamentos no Supabase na tabela "lancamentos"

### Cadastros
-   Gravar as informações no tela de Cadastros no Supabase na tabela "clientes_fornecedores"

### Relatorio de Fluxo de Caixa
-   Relatorio devera gerar um relatorio com um cabeçalho e ter fundo branco.
-   Conter um ComboBox para escolha da competencia.
-   Conter um botão para gerar relatorio em PDF na tela.
-	Conter um botão para filtrar por tipo de Unidade (Mangaratiba, Angra dos Reis e Casa)
-   Depois de gerado deve conter um botão para impressão do relatorio.
-	Trazer somente os valores com Status "A Vencer", mas  devesse deixar o dia "00" como atrasado dos mes anterior e exibir todos os dias do mes, mesmo que zerado.

### DRE Gerencial
-	Implementar funcionalidade para relatorio DRE Gerencial.
-   Relatorio devera gerar um relatorio com um cabeçalho e ter fundo branco.

### Relatorio de Contas a Pagar/Receber
-	Implementar funcionalidade par relatorio Contas a Pagar/Receber.
-   Relatorio devera gerar um relatorio com um cabeçalho e ter fundo branco.
-   Conter um ComboBox para escolha da competencia.
-   Conter um botão para gerar relatorio em PDF na tela.
-	Conter um botão para filtrar por tipo de Unidade (Mangaratiba, Angra dos Reis e Casa)
-	Conter um botão para filtrar os valores com Status "A Vencer" e "Pago"
-   Depois de gerado deve conter um botão para impressão do relatorio.
