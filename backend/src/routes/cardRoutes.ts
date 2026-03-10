import { Router } from 'express';
import upload from '../config/multer';
import { getCards, createCard, updateCardStatus } from '../controllers/cardController';

const router = Router();

router.get('/cards', getCards);
router.post('/cards', upload.single('arquivo'), createCard);
router.put('/cards/:id/status', updateCardStatus);

export default router;
