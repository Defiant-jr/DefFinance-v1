const IMPORT_ENDPOINT = '/api/google-sheets/import';

export const importGoogleSheetsData = async () => {
  try {
    const response = await fetch(IMPORT_ENDPOINT, { method: 'POST' });
    if (!response.ok) {
      throw new Error('Erro ao solicitar importação de dados');
    }

    const payload = await response.json();
    if (!payload.success) {
      throw new Error(payload.message || 'Importação de dados falhou');
    }

    const pagamentos = payload.pagamentos ?? [];
    const recebimentos = payload.recebimentos ?? [];

    localStorage.setItem('contasPagar', JSON.stringify(pagamentos));
    localStorage.setItem('contasReceber', JSON.stringify(recebimentos));
    
    return {
      pagamentos,
      recebimentos,
      success: true,
      message: payload.message || 'Dados importados com sucesso!'
    };
    
  } catch (error) {
    console.error('Erro na importação:', error);
    return {
      success: false,
      message: `Erro na importação: ${error.message}`
    };
  }
};

export const getStoredData = () => {
  const contasPagar = JSON.parse(localStorage.getItem('contasPagar') || '[]');
  const contasReceber = JSON.parse(localStorage.getItem('contasReceber') || '[]');
  
  return {
    contasPagar,
    contasReceber
  };
};
