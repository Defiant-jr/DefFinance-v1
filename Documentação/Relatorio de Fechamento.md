# implementar o relatorio de Fechamento seguindo conforme requisitos abaixo:

## Layout
    -   Deve conter um titulo.
    -   Deve ser gerado em fundo Branco.
    -   Deve conter um ComboBox para realizar o filtro da unidade: "Todas" ,"Angra dos Reis", "Mangaratiba" e "Casa"
    -   Deve conter um botão para gerar o relatorio, que sera exibido na tela.
    -   Deve conter um botão para gerar o PDF apos o relatorio ser exibido na tela.
    -   O relatorio deve ser gerado em PDF.

## Processos
    -   Lista de todas as entradas em aberto e a vencer ate o ultimo dia do mes corrente.
    -   Cada linha deve ter Nome, Data Vencimento, Unidade e Valor.
    -   Totalizar os valores das entradas.
    -   Lista de todas as saidas em atraso e em aberto ate o ultimo dia do mes corrente.
    -   Cada linha deve ter Nome, Data Vencimento, Unidade e Valor.
    -   Totalizar os valores das saidas.
    -   Ao final deve conter o Saldo do Fechamento, que é o valor das entradas menos o valor das saidas, nessa ordem.

## Base de Dados
    -   Tabela Lancamentos no Supabase.