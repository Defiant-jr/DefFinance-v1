import React, { useState } from 'react';
    import { useNavigate } from 'react-router-dom';
    import { Helmet } from 'react-helmet';
    import { motion } from 'framer-motion';
    import { format } from 'date-fns';
    import { ptBR } from 'date-fns/locale';
    import { Calendar as CalendarIcon, ArrowLeft } from 'lucide-react';
    
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
    
    const Lancamentos = () => {
      const navigate = useNavigate();
      const { toast } = useToast();
      const [date, setDate] = useState(new Date());
      const [tipo, setTipo] = useState('');
      const [unidade, setUnidade] = useState('');
      const [clienteFornecedor, setClienteFornecedor] = useState('');
      const [descricao, setDescricao] = useState('');
      const [valor, setValor] = useState('');
      const [aluno, setAluno] = useState('');
      const [parcela, setParcela] = useState('');
      const [descPontual, setDescPontual] = useState('');
      const [status, setStatus] = useState('');
      const [obs, setObs] = useState('');
      const [loading, setLoading] = useState(false);
    
      const handleCancel = () => {
        navigate('/');
      };
    
      const handleSave = async () => {
        if (!date || !tipo || !unidade || !clienteFornecedor || !descricao || !valor || !status) {
          toast({
            title: 'Erro de Validacao',
            description: 'Por favor, preencha todos os campos obrigatorios.',
            variant: 'destructive',
          });
          return;
        }

        const descPontualValor = descPontual.trim();
        const parsedDescPontual = descPontualValor !== '' ? parseFloat(descPontualValor) : null;

        if (descPontualValor !== '' && Number.isNaN(parsedDescPontual)) {
          toast({
            title: 'Valor invalido',
            description: 'Informe um valor numerico valido para Desconto Pontual.',
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
          parcel: parcela.trim() || null,
          desc_pontual: parsedDescPontual,
        };

        const { error } = await supabase.from('lancamentos').insert([newEntry]);

        setLoading(false);

        if (error) {
          toast({
            title: 'Erro ao Salvar',
            description: `Nao foi possivel salvar o lancamento. Erro: ${error.message}`,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Sucesso!',
            description: 'Lancamento salvo com sucesso.',
          });
          navigate('/');
        }
      };

      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <Helmet>
            <title>Novo Lançamento - SysFina</title>
            <meta name="description" content="Tela para adicionar novos lançamentos financeiros." />
          </Helmet>
    
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-5 w-5" />
                    <span className="sr-only">Voltar</span>
                </Button>
                <h1 className="text-3xl font-bold gradient-text">Novo Lançamento</h1>
            </div>
          </div>
    
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
                        variant={'outline'}
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
                        onSelect={setDate}
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
                  <Input id="clienteFornecedor" placeholder="Nome do cliente ou fornecedor" value={clienteFornecedor} onChange={(e) => setClienteFornecedor(e.target.value)} />
                </div>
              </div>
    
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                  <Label htmlFor="descricao" className="text-gray-300">Descrição</Label>
                  <Input id="descricao" placeholder="Ex: Venda de produto X" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valor" className="text-gray-300">Valor</Label>
                  <Input id="valor" type="number" placeholder="0,00" value={valor} onChange={(e) => setValor(e.target.value)} />
                </div>
              </div>
    
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="aluno" className="text-gray-300">Alunos</Label>
                  <Input id="aluno" placeholder="Nome do aluno" value={aluno} onChange={(e) => setAluno(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parcela" className="text-gray-300">Parcela</Label>
                  <Input id="parcela" placeholder="Ex: 1/12" value={parcela} onChange={(e) => setParcela(e.target.value)} />
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
                  <Input id="descPontual" type="number" inputMode="decimal" step="0.01" placeholder="0,00" value={descPontual} onChange={(e) => setDescPontual(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="obs" className="text-gray-300">Observações</Label>
                <Textarea id="obs" placeholder="Detalhes adicionais sobre o lançamento (opcional)" value={obs} onChange={(e) => setObs(e.target.value)} />
              </div>
    
              <div className="flex justify-end gap-4 pt-4">
                <Button variant="outline" onClick={handleCancel} disabled={loading}>Cancelar</Button>
                <Button onClick={handleSave} disabled={loading}>
                  {loading ? 'Salvando...' : 'Salvar Lançamento'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      );
    };
    
    export default Lancamentos;