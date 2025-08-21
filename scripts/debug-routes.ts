import request from 'supertest';

(async () => {
    process.env.NODE_ENV = process.env.NODE_ENV || 'test';
    process.env.APP_VERSION = process.env.APP_VERSION || 'v1';
    process.env.TEST_BYPASS_AUTH = process.env.TEST_BYPASS_AUTH || '1';

    const serverModule: any = await import('../src/server');
    const app = serverModule.app ?? serverModule.default ?? serverModule;
    const BASE = `/${process.env.APP_VERSION}`;

    console.log('Starting debug sequence...');

    const responses: any = {};

    responses.createUser = await request(app)
        .post(`${BASE}/people`)
        .send({ name: 'Teste', document: '12345678901', password: '123456' });
    console.log('/people ->', responses.createUser.status, responses.createUser.body);

    responses.login = await request(app)
        .post(`${BASE}/login`)
        .send({ document: '12345678901', password: '123456' });
    console.log('/login ->', responses.login.status, responses.login.body);

    responses.createAccount = await request(app)
        .post(`${BASE}/accounts`)
        .send({ branch: '000', account: '0000001-1' });
    console.log('/accounts (create) ->', responses.createAccount.status, responses.createAccount.body);

    const accountId = responses.createAccount.body.id ?? 1;

    responses.createCard = await request(app)
        .post(`${BASE}/accounts/${accountId}/cards`)
        .send({ type: 'virtual', number: '1234567890123456', cvv: '123' });
    console.log(`/accounts/${accountId}/cards (create) ->`, responses.createCard.status, responses.createCard.body);

    responses.createTransaction = await request(app)
        .post(`${BASE}/accounts/${accountId}/transactions`)
        .send({ value: '100.00', description: 'Teste', type: 'credit' });
    console.log(`/accounts/${accountId}/transactions (create) ->`, responses.createTransaction.status, responses.createTransaction.body);

    responses.getAccounts = await request(app).get(`${BASE}/accounts`);
    console.log('/accounts (get) ->', responses.getAccounts.status, responses.getAccounts.body);

    responses.getAccountCards = await request(app).get(`${BASE}/accounts/${accountId}/cards`);
    console.log(`/accounts/${accountId}/cards (get) ->`, responses.getAccountCards.status, responses.getAccountCards.body);

    responses.getCards = await request(app).get(`${BASE}/cards`);
    console.log('/cards (get) ->', responses.getCards.status, responses.getCards.body);

    responses.createTransfer = await request(app)
        .post(`${BASE}/accounts/${accountId}/transactions/internal`)
        .send({ receiverId: accountId + 1, value: '50.00', description: 'Transferência', type: 'debit' });
    console.log('/transactions/internal ->', responses.createTransfer.status, responses.createTransfer.body);

    responses.getTransactions = await request(app).get(`${BASE}/accounts/${accountId}/transactions`);
    console.log(`/accounts/${accountId}/transactions (get) ->`, responses.getTransactions.status, responses.getTransactions.body);

    responses.getBalance = await request(app).get(`${BASE}/accounts/${accountId}/balance`);
    console.log(`/accounts/${accountId}/balance (get) ->`, responses.getBalance.status, responses.getBalance.body);

    const transactionId = responses.createTransaction.body.id ?? 1;
    responses.revert = await request(app)
        .post(`${BASE}/accounts/${accountId}/transactions/${transactionId}/revert`);
    console.log(`revert ->`, responses.revert.status, responses.revert.body);

    console.log('Debug sequence finished.');
    process.exit(0);
})();
