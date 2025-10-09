const GOOGLE_API_KEY = 'AIzaSyBbMzMvBs53gqLuu9nvsjV8lVmjgHt-1qw';

const SPREADSHEET_IDS = {
  pagamentos: '1VxtIv4kMab66yHC0iVp7uCIJxOg42ZacvY9ehlKrWYA',
  recebimentos: '1vDw0K8w3qHxYgPo-t9bapMOZ4Q2zlOsWUGaz12cDQRY'
};

const parseDate = (dateString) => {
  if (!dateString || !/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
    return null;
  }
  const [day, month, year] = dateString.split('/');
  // Create date in UTC to avoid timezone shifts
  return new Date(Date.UTC(year, month - 1, day));
};

const toISODateString = (date) => {
  if (!date) return '';
  return date.toISOString().split('T')[0];
};

export const importGoogleSheetsData = async () => {
  try {
    const pagamentosResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_IDS.pagamentos}/values/A:D?key=${GOOGLE_API_KEY}`
    );
    
    if (!pagamentosResponse.ok) {
      throw new Error('Erro ao buscar dados de pagamentos');
    }
    
    const pagamentosData = await pagamentosResponse.json();
    
    const recebimentosResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_IDS.recebimentos}/values/A:C?key=${GOOGLE_API_KEY}`
    );
    
    if (!recebimentosResponse.ok) {
      throw new Error('Erro ao buscar dados de recebimentos');
    }
    
    const recebimentosData = await recebimentosResponse.json();
    
    const pagamentos = [];
    if (pagamentosData.values && pagamentosData.values.length > 1) {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      for (let i = 1; i < pagamentosData.values.length; i++) {
        const row = pagamentosData.values[i];
        if (row.length >= 4) {
          const valor = parseFloat(row[3]?.replace(/[^\d,-]/g, '').replace(',', '.')) || 0;
          if (valor === 0) {
            continue;
          }
          const vencimentoDate = parseDate(row[2]);
          if (vencimentoDate) {
            pagamentos.push({
              id: `pag_${i}`,
              fornecedor: row[0] || '',
              parcela: row[1] || '',
              vencimento: toISODateString(vencimentoDate),
              valor: valor,
              tipo: 'pagar',
              status: vencimentoDate < today ? 'vencido' : 'aberto'
            });
          }
        }
      }
    }
    
    const recebimentos = [];
    if (recebimentosData.values && recebimentosData.values.length > 1) {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      for (let i = 1; i < recebimentosData.values.length; i++) {
        const row = recebimentosData.values[i];
        if (row.length >= 3) {
          const valor = parseFloat(row[2]?.replace(/[^\d,-]/g, '').replace(',', '.')) || 0;
          if (valor === 0) {
            continue;
          }
          const vencimentoDate = parseDate(row[1]);
          if (vencimentoDate) {
            recebimentos.push({
              id: `rec_${i}`,
              cliente: row[0] || '',
              vencimento: toISODateString(vencimentoDate),
              valor: valor,
              tipo: 'receber',
              status: vencimentoDate < today ? 'atrasado' : 'aberto'
            });
          }
        }
      }
    }
    
    localStorage.setItem('contasPagar', JSON.stringify(pagamentos));
    localStorage.setItem('contasReceber', JSON.stringify(recebimentos));
    
    return {
      pagamentos,
      recebimentos,
      success: true,
      message: 'Dados importados com sucesso!'
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