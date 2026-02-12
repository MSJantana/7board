import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { expand } from 'dotenv-expand';
import path from 'node:path';
import cardRoutes from './routes/cardRoutes';

const myEnv = dotenv.config();
expand(myEnv);

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Servir arquivos estáticos da pasta uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Use routes
app.use('/api', cardRoutes);

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
