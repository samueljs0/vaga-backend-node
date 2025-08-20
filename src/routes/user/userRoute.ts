import { Router } from 'express';
// Make sure the path and filename are correct; adjust if needed, for example:
import { userController } from '../../controllers/user/userController';

const router = Router();

router.get('/', userController.index);
router.get('/:id/', userController.show);
router.post('/create/', userController.create);
router.put('/update/:id/', userController.update);
router.delete('/delete/:id/', userController.delete);

export default router;
