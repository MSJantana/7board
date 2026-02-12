import fs from 'node:fs';
import axios from 'axios';
import path from 'node:path';
import FormData from 'form-data';

const API_URL = 'http://localhost:3001/api/cards';

async function testCreateCard() {
  try {
    const formData = new FormData();
    formData.append('departamento', 'Marketing');
    formData.append('email', 'teste@exemplo.com');
    formData.append('tipoSolicitacao', 'Vídeo (30 dias)');
    formData.append('descricao', 'Teste automatizado de criação de card com anexo');
    formData.append('veiculacao', JSON.stringify(['Digital', 'Impresso']));
    formData.append('dataEntrega', '2023-12-25');
    formData.append('horarioEntrega', '14:00');
    formData.append('observacoes', 'Urgente');

    // Create a dummy file for testing if it doesn't exist
    const filePath = path.join(__dirname, 'test-image.png');
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, 'fake image content');
    }

    formData.append('arquivo', fs.createReadStream(filePath));

    console.log('Enviando solicitação...');
    const response = await axios.post(API_URL, formData, {
      headers: {
        ...formData.getHeaders()
      }
    });

    console.log('Solicitação criada com sucesso!');
    console.log('ID:', response.data.id);
    console.log('Protocolo:', response.data.protocolo);

    // Cleanup
    if (fs.existsSync(filePath) && fs.readFileSync(filePath).toString() === 'fake image content') {
      fs.unlinkSync(filePath);
    }

  } catch (error: any) {
    console.error('Erro ao criar solicitação:', error.response?.data || error.message);
  }
}

// Execução com IIFE para compatibilidade com CommonJS (simulando top-level await)
(async () => {
  await testCreateCard();
})();
