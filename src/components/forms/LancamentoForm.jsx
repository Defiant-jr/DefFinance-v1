import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

const initialDate = new Date();

const LancamentoForm = ({ onCancel = () => {}, onSuccess = () => {}, initialData = null }) => {
  const { toast } = useToast();
  const isEditing = Boolean(initialData?.id);

  const parseDate = (value) => (value ? new Date(value + 'T00:00:00') : new Date());

  const [date, setDate] = useState(() => parseDate(initialData?.data) ?? initialDate);
  const [tipo, setTipo] = useState(initialData?.tipo || '');
  const [unidade, setUnidade] = useState(initialData?.unidade || '');
  const [clienteFornecedor, setClienteFornecedor] = useState(initialData?.cliente_fornecedor || '');
  const [descricao, setDescricao] = useState(initialData?.descricao || '');
  const [valor, setValor] = useState(initialData?.valor?.toString() || '');
  const [aluno, setAluno] = useState(initialData?.aluno || '');
  const [parcela, setParcela] = useState(initialData?.parcela || '');
  const [descPontual, setDescPontual] = useState(initialData?.desc_pontual?.toString() || '');
  const [status, setStatus] = useState(initialData?.status || '');
  const [obs, setObs] = useState(initialData?.obs || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setDate(parseDate(initialData?.data));
    setTipo(initialData?.tipo || '');
    setUnidade(initialData?.unidade || '');
    setClienteFornecedor(initialData?.cliente_fornecedor || '');
    setDescricao(initialData?.descricao || '');
    setValor(initialData?.valor?.toString() || '');
    setAluno(initialData?.aluno || '');
    setParcela(initialData?.parcela || '');
    setDescPontual(initialData?.desc_pontual?.toString() || '');
    setStatus(initialData?.status || '');
    setObs(initialData?.obs || '');
  }, [initialData]);

  const resetForm = () => {
    setDate(new Date());
    setTipo('');
    setUnidade('');
    setClienteFornecedor('');
    setDescricao('');
    setValor('');
    setAluno('');
    setParcela('');
    setDescPontual('');
    setStatus('');
    setObs('');
  };

  const handleCancel = () => {
    resetForm();
    if (typeof onCancel === 'function') {
      onCancel();
    }
  };

  const handleSave = async () => {
    if (!date || !tipo || !unidade || !clienteFornecedor || !descricao || !valor || !status) {
      toast({
        title: 'Erro de Validação',
        description: 'Por favor, preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    const descPontualValor = descPontual.trim();
    const parsedDescPontual = descPontualValor !== '' ? parseFloat(descPontualValor) : null;

    if (descPontualValor !== '' && Number.isNaN(parsedDescPontual)) {
      toast({
        title: 'Valor inválido',
        description: 'Informe um valor numérico válido para Desconto Pontual.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    const newEntry = {
      data: format(date, 'yyyy-MM-dd'),
      tipo,
      unidade,
      cliente_fornecedor: clienteFornecedor,
      descricao,
      valor: parseFloat(valor),
      status,
      obs,
      aluno: aluno.trim() || null,
      parcela: parcela.trim() || null,
      desc_pontual: parsedDescPontual,
    };

    let error;
    if (isEditing) {
      ({ error } = await supabase
        .from('lancamentos')
        .update(newEntry)
        .eq('id', initialData.id));
    } else {
      ({ error } = await supabase.from('lancamentos').insert([newEntry]));
    }

    setLoading(false);

    if (error) {
      toast({
        title: 'Erro ao salvar',
        description: `Não foi possível salvar o lançamento. Erro: ${error.message}`,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: isEditing ? 'Atualizado!' : 'Sucesso!',
      description: isEditing ? 'Lançamento atualizado com sucesso.' : 'Lançamento salvo com sucesso.',
    });

    if (!isEditing) {
      resetForm();
    }

    if (typeof onSuccess === 'function') {
      onSuccess();
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-white">Adicionar Nova Transação</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="data" className="text-gray-300">Data</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !date && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP', { locale: ptBR }) : <span>Escolha uma data</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(selectedDate) => selectedDate && setDate(selectedDate)}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tipo" className="text-gray-300">Tipo</Label>
            <Select onValueChange={setTipo} value={tipo}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Entrada">Entrada</SelectItem>
                <SelectItem value="Saida">Saída</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="unidade" className="text-gray-300">Unidade</Label>
            <Select onValueChange={setUnidade} value={unidade}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione a unidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CNA Angra dos Reis">CNA Angra dos Reis</SelectItem>
                <SelectItem value="CNA Mangaratiba">CNA Mangaratiba</SelectItem>
                <SelectItem value="Casa">Casa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="clienteFornecedor" className="text-gray-300">Cliente/Fornecedor</Label>
            <Input
              id="clienteFornecedor"
              placeholder="Nome do cliente ou fornecedor"
              value={clienteFornecedor}
              onChange={(event) => setClienteFornecedor(event.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="descricao" className="text-gray-300">Descrição</Label>
            <Input
              id="descricao"
              placeholder="Ex: Venda de produto X"
              value={descricao}
              onChange={(event) => setDescricao(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="valor" className="text-gray-300">Valor</Label>
            <Input
              id="valor"
              type="number"
              placeholder="0,00"
              value={valor}
              onChange={(event) => setValor(event.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="aluno" className="text-gray-300">Aluno</Label>
            <Input
              id="aluno"
              placeholder="Nome do aluno"
              value={aluno}
              onChange={(event) => setAluno(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="parcela" className="text-gray-300">Parcela</Label>
            <Input
              id="parcela"
              placeholder="Ex: 1/12"
              value={parcela}
              onChange={(event) => setParcela(event.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="status" className="text-gray-300">Status</Label>
            <Select onValueChange={setStatus} value={status}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A Vencer">A Vencer</SelectItem>
                <SelectItem value="Pago">Pago</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="descPontual" className="text-gray-300">Desc. Pontual</Label>
            <Input
              id="descPontual"
              type="number"
              inputMode="decimal"
              step="0.01"
              placeholder="0,00"
              value={descPontual}
              onChange={(event) => setDescPontual(event.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="obs" className="text-gray-300">Observações</Label>
          <Textarea
            id="obs"
            placeholder="Detalhes adicionais sobre o lançamento (opcional)"
            value={obs}
            onChange={(event) => setObs(event.target.value)}
          />
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <Button variant="outline" onClick={handleCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar Lançamento'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default LancamentoForm;
