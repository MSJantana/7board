import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';

// Configuração do Multer para Upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Define o caminho absoluto para a pasta de uploads na raiz do backend
    // Assumindo que este arquivo está em src/config/multer.ts
    const uploadPath = path.resolve(__dirname, '..', '..', 'uploads');
    
    // Garantir que diretório existe
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
      console.log(`Pasta criada: ${uploadPath}`);
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Nome único: timestamp + extensão original
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

export default upload;
