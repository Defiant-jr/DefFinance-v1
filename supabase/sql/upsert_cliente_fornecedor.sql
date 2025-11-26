-- Cleans up old overloads to avoid ambiguity.
drop function if exists public.upsert_cliente_fornecedor(text, text, text);
drop function if exists public.upsert_cliente_fornecedor(p_cpf_cnpj text, p_sacado text, p_aluno text);

-- Creates an idempotent function to insert/update a Cliente (by CPF/CNPJ) in clientes_fornecedores.
-- Columns expected in table: "CPF_CNPJ", "Tipo", "Sacado".
create or replace function public.upsert_cliente_fornecedor(
  p_cpf_cnpj text,
  p_sacado text
)
returns public.clientes_fornecedores
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result public.clientes_fornecedores;
begin
  insert into public.clientes_fornecedores ("CPF_CNPJ", "Tipo", "Sacado")
  values (p_cpf_cnpj, 'Cliente', coalesce(nullif(p_sacado, ''), 'N/A'))
  on conflict ("CPF_CNPJ") do update
    set "Tipo"   = excluded."Tipo",
        "Sacado" = coalesce(excluded."Sacado", public.clientes_fornecedores."Sacado")
  returning * into v_result;

  return v_result;
end;
$$;

-- Allow client roles to execute the function.
grant execute on function public.upsert_cliente_fornecedor(text, text) to anon, authenticated;
