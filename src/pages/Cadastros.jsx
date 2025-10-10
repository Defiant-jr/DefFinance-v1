import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Building2, Home, PenLine } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import LancamentoForm from '@/components/forms/LancamentoForm';

const Cadastros = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeCard, setActiveCard] = useState('cliente');

  const [clienteDescricao, setClienteDescricao] = useState('');
  const [fornecedorDescricao, setFornecedorDescricao] = useState('');
  const [unidadeDescricao, setUnidadeDescricao] = useState('');

  const [clienteLoading, setClienteLoading] = useState(false);
  const [fornecedorLoading, setFornecedorLoading] = useState(false);
  const [unidadeLoading, setUnidadeLoading] = useState(false);

  const cardOptions = [
    {
      id: 'cliente',
      title: 'Cliente',
      description: 'Cadastrar novos clientes.',
      icon: Users,
    },
    {
      id: 'fornecedor',
      title: 'Fornecedor',
      description: 'Gerenciar fornecedores parceiros.',
      icon: Building2,
    },
    {
      id: 'unidade',
      title: 'Unidade',
      description: 'Controlar unidades de atendimento.',
      icon: Home,
    },
    {
      id: 'lancamento',
      title: 'Lançamento',
      description: 'Registrar novos lançamentos financeiros.',
      icon: PenLine,
    },
  ];

  const handleSuccess = (message) => {
    toast({ title: 'Sucesso!', description: message });
  };

  const handleError = (description) => {
    toast({
      title: 'Erro ao salvar',
      description,
      variant: 'destructive',
    });
  };

  const saveCliente = async () => {
    const descricao = clienteDescricao.trim();
    if (!descricao) {
      handleError('Informe o nome do cliente.');
      return;
    }

    setClienteLoading(true);
    const { error } = await supabase
      .from('clientes_fornecedores')
      .insert([{ tipo: 'Cliente', descricao }]);

    setClienteLoading(false);

    if (error) {
      handleError(error.message || 'Tente novamente.');
      return;
    }

    handleSuccess('Cliente cadastrado com sucesso.');
    setClienteDescricao('');
  };

  const saveFornecedor = async () => {
    const descricao = fornecedorDescricao.trim();
    if (!descricao) {
      handleError('Informe o nome do fornecedor.');
      return;
    }

    setFornecedorLoading(true);
    const { error } = await supabase
      .from('clientes_fornecedores')
      .insert([{ tipo: 'Fornecedor', descricao }]);

    setFornecedorLoading(false);

    if (error) {
      handleError(error.message || 'Tente novamente.');
      return;
    }

    handleSuccess('Fornecedor cadastrado com sucesso.');
    setFornecedorDescricao('');
  };

  const saveUnidade = async () => {
    const descricao = unidadeDescricao.trim();
    if (!descricao) {
      handleError('Informe o nome da unidade.');
      return;
    }

    setUnidadeLoading(true);
    const { error } = await supabase
      .from('unidades')
      .insert([{ descricao }]);

    setUnidadeLoading(false);

    if (error) {
      handleError(error.message || 'Tente novamente.');
      return;
    }

    handleSuccess('Unidade cadastrada com sucesso.');
    setUnidadeDescricao('');
  };

  const renderForm = () => {
    if (activeCard === 'cliente') {
      return (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-white">Cadastro de Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="cliente-descricao" className="text-gray-300">Nome do cliente</Label>
              <Input
                id="cliente-descricao"
                placeholder="Ex.: Maria Souza"
                value={clienteDescricao}
                onChange={(event) => setClienteDescricao(event.target.value)}
              />
            </div>
            <div className="flex justify-end gap-4 pt-4">
              <Button variant="outline" onClick={() => setClienteDescricao('')} disabled={clienteLoading}>
                Limpar
              </Button>
              <Button onClick={saveCliente} disabled={clienteLoading}>
                {clienteLoading ? 'Salvando...' : 'Salvar Cliente'}
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (activeCard === 'fornecedor') {
      return (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-white">Cadastro de Fornecedor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="fornecedor-descricao" className="text-gray-300">Nome do fornecedor</Label>
              <Input
                id="fornecedor-descricao"
                placeholder="Ex.: Distribuidora XPTO"
                value={fornecedorDescricao}
                onChange={(event) => setFornecedorDescricao(event.target.value)}
              />
            </div>
            <div className="flex justify-end gap-4 pt-4">
              <Button variant="outline" onClick={() => setFornecedorDescricao('')} disabled={fornecedorLoading}>
                Limpar
              </Button>
              <Button onClick={saveFornecedor} disabled={fornecedorLoading}>
                {fornecedorLoading ? 'Salvando...' : 'Salvar Fornecedor'}
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (activeCard === 'unidade') {
      return (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-white">Cadastro de Unidade</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="unidade-descricao" className="text-gray-300">Nome da unidade</Label>
              <Input
                id="unidade-descricao"
                placeholder="Ex.: CNA Angra dos Reis"
                value={unidadeDescricao}
                onChange={(event) => setUnidadeDescricao(event.target.value)}
              />
            </div>
            <div className="flex justify-end gap-4 pt-4">
              <Button variant="outline" onClick={() => setUnidadeDescricao('')} disabled={unidadeLoading}>
                Limpar
              </Button>
              <Button onClick={saveUnidade} disabled={unidadeLoading}>
                {unidadeLoading ? 'Salvando...' : 'Salvar Unidade'}
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (activeCard === 'lancamento') {
      return (
        <LancamentoForm
          onCancel={() => setActiveCard('cliente')}
        />
      );
    }

    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <Helmet>
        <title>Cadastros - SysFina</title>
        <meta name="description" content="Central de cadastros de clientes, fornecedores e unidades." />
      </Helmet>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Voltar</span>
          </Button>
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold gradient-text">Cadastros</h1>
            <span className="text-sm text-gray-300">Escolha o tipo de cadastro para continuar.</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cardOptions.map((card) => {
          const Icon = card.icon;
          const isActive = activeCard === card.id;
          return (
            <Card
              key={card.id}
              className={`glass-card cursor-pointer transition-all ${isActive ? 'border-blue-500 shadow-lg shadow-blue-500/20' : 'border-transparent hover:border-white/20'}`}
              onClick={() => setActiveCard(card.id)}
            >
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${isActive ? 'bg-blue-500/20 text-blue-300' : 'bg-white/10 text-gray-300'}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">{card.title}</h2>
                    <p className="text-sm text-gray-400">{card.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {renderForm()}
    </motion.div>
  );
};

export default Cadastros;
