import { Router, Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../middlewares/authMiddleware';
import { getUsers, getUserById, createUser, updateUser, deleteUser } from '../controllers/userController';

const router = Router();

const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }
  return next();
};

router.use(authenticateToken);
router.use(requireAdmin);

router.get('/', getUsers);
router.get('/:id', getUserById);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;

