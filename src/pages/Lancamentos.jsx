﻿import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import LancamentoForm from '@/components/forms/LancamentoForm';

const Lancamentos = () => {
  const navigate = useNavigate();

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

      <LancamentoForm
        onCancel={() => navigate(-1)}
        onSuccess={() => navigate('/')}
      />
    </motion.div>
  );
};

export default Lancamentos;
