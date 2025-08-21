import { Router } from 'express';
import { authController } from '../../controllers/auth/authController';
// Routes
const router = Router();

router.post('/login/', authController.login);
router.post('/refresh/', authController.refresh);
router.post('/logout/', authController.logout);

export default router;
