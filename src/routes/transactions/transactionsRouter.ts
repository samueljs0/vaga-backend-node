import { Router } from 'express';
import { transactionsController } from '../../controllers/transactions/transactionsControllers';

const router = Router();

router.get('/', transactionsController.index);
router.get('/:id/', transactionsController.show);
router.post('/create/', transactionsController.create);
router.put('/update/:id/', transactionsController.update);
router.delete('/delete/:id/', transactionsController.delete);

export default router;
