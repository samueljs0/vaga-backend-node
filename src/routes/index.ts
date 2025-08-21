import { Router } from 'express';
import { authController } from '../controllers/auth/authController';
import userRoute from './user/userRoute';
import authRoute from './auth/authRoute';
import accountRoute from './account/accountRoute';
import cardsRoute from './cards/cardsRoute';
// import transactions from './transactions/transactionsRoute';
// Uncomment and fix the path if the file exists, e.g.:
import transactionsRoute from './transactions/transactionsRouter';
import { userController } from '../controllers/user/userController';
import { accountController } from '../controllers/account/accountControllers';
import { cardController } from '../controllers/cards/cardsControllers';
import { transactionsController } from '../controllers/transactions/transactionsControllers';

// Routes
const router = Router();
const authenticated = authController.auth;

// // Auth routes
// router.use('/auth', authRoute);
// // User routes
// router.use('/user', userRoute);
// // Account routes
// router.use('/account', authenticated, accountRoute);
// // Card routes
// router.use('/cards', authenticated, cardsRoute);
// // Transaction routes
// router.use('/transactions', authenticated, transactionsRoute);

router.post("/people", userController.create);
router.post("/login", authController.login);

router.post("/accounts", authenticated, accountController.create);
router.get("/accounts", authenticated, accountController.indexNoPagination);
router.post("/accounts/:accountId/cards", authenticated, cardController.create);
router.get("/accounts/:accountId/cards", authenticated, cardController.show);
router.get("/cards", authenticated, cardController.index);
router.post("/accounts/:accountId/transactions", authenticated, transactionsController.create);
router.post("/accounts/:accountId/transactions/internal", authenticated, transactionsController.createTransfer);
router.get("/accounts/:accountId/transactions", authenticated, transactionsController.index);
router.get("/accounts/:accountId/balance", authenticated, transactionsController.getBalance);
router.post("/accounts/:accountId/transactions/:transactionId/revert", authenticated, transactionsController.reverseTransaction);


export default router;
