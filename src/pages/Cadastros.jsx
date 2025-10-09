import React, { useState } from 'react';
    import { useNavigate } from 'react-router-dom';
    import { Helmet } from 'react-helmet';
    import { motion } from 'framer-motion';
    import { ArrowLeft } from 'lucide-react';
    
    import { Button } from '@/components/ui/button';
    import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { useToast } from '@/components/ui/use-toast';
    import { supabase } from '@/lib/customSupabaseClient';
    
    const Cadastros = () => {
      const navigate = useNavigate();
      const { toast } = useToast();
      const [tipo, setTipo] = useState('');
      const [descricao, setDescricao] = useState('');
      const [loading, setLoading] = useState(false);
    
      const handleCancel = () => {
        navigate('/');
      };
    
      const handleSave = async () => {
        if (!tipo || !descricao) {
          toast({
            title: 'Erro de Validação',
            description: 'Por favor, preencha todos os campos.',
            variant: 'destructive',
          });
          return;
        }
    
        setLoading(true);
    
        const { error } = await supabase
          .from('clientes_fornecedores')
          .insert([{ tipo, descricao }]);
    
        setLoading(false);
    
        if (error) {
          toast({
            title: 'Erro ao Salvar',
            description: `Não foi possível salvar o cadastro. Erro: ${error.message}`,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Sucesso!',
            description: 'Cadastro salvo com sucesso.',
          });
          setTipo('');
          setDescricao('');
        }
      };
    
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <Helmet>
            <title>Cadastros - SysFina</title>
            <meta name="description" content="Tela para cadastro de clientes e fornecedores." />
          </Helmet>
    
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-5 w-5" />
                    <span className="sr-only">Voltar</span>
                </Button>
                <h1 className="text-3xl font-bold gradient-text">Cadastro de Clientes e Fornecedores</h1>
            </div>
          </div>
    
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-white">Novo Cadastro</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="tipo" className="text-gray-300">Tipo</Label>
                  <Select onValueChange={setTipo} value={tipo}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cliente">Cliente</SelectItem>
                      <SelectItem value="Fornecedor">Fornecedor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descricao" className="text-gray-300">Descrição</Label>
                  <Input id="descricao" placeholder="Nome do cliente ou fornecedor" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
                </div>
              </div>
    
              <div className="flex justify-end gap-4 pt-4">
                <Button variant="outline" onClick={handleCancel} disabled={loading}>Cancelar</Button>
                <Button onClick={handleSave} disabled={loading}>
                  {loading ? 'Salvando...' : 'Salvar Cadastro'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      );
    };
    
    export default Cadastros;