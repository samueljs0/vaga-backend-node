import { Router } from 'express';
// Make sure the path and filename are correct; adjust if needed, for example:
import { accountController } from '../../controllers/account/accountControllers';

const router = Router();

router.get('/', accountController.index);
router.get('/:id/', accountController.show);
router.post('/create/', accountController.create);
router.put('/update/:id/', accountController.update);
router.delete('/delete/:id/', accountController.delete);

export default router;