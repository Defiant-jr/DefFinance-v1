-- Creates an idempotent function to insert/update a Cliente (by CPF/CNPJ) in clientes_fornecedores.
-- Columns expected in table: "CPF_CNPJ", "Tipo", "Sacado", "Aluno".
create or replace function public.upsert_cliente_fornecedor(
  p_cpf_cnpj text,
  p_sacado text,
  p_aluno text default null
)
returns public.clientes_fornecedores
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result public.clientes_fornecedores;
begin
  insert into public.clientes_fornecedores ("CPF_CNPJ", "Tipo", "Sacado", "Aluno")
  values (p_cpf_cnpj, 'Cliente', coalesce(nullif(p_sacado, ''), 'N/A'), nullif(p_aluno, ''))
  on conflict ("CPF_CNPJ") do update
    set "Tipo"   = excluded."Tipo",
        "Sacado" = coalesce(excluded."Sacado", public.clientes_fornecedores."Sacado"),
        "Aluno"  = coalesce(excluded."Aluno", public.clientes_fornecedores."Aluno")
  returning * into v_result;

  return v_result;
end;
$$;

-- Allow client roles to execute the function.
grant execute on function public.upsert_cliente_fornecedor(text, text, text) to anon, authenticated;

