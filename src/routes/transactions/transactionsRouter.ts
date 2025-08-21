import { Router } from 'express';
import { transactionsController } from '../../controllers/transactions/transactionsControllers';

const router = Router();

router.get('/:accountId/transactions/', transactionsController.index);
router.get('/:accountId/transactions/:transactionId/', transactionsController.show);
router.post('/:accountId/transactions/', transactionsController.create);
router.post('/:accountId/transactions/internal/', transactionsController.createTransfer);
router.post('/:accountId/transactions/:transactionId/revert/', transactionsController.reverseTransaction);
router.delete('/delete/:id/', transactionsController.delete);
router.put('/update/:id/', transactionsController.update);

export default router;
