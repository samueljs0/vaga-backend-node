import request from 'supertest';
import { describe, it, expect, beforeAll } from 'vitest';

// Ensure APP_VERSION and TEST_BYPASS_AUTH are set before importing the server
// Ensure test environment so server doesn't auto-listen and knex uses test config
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.APP_VERSION = process.env.APP_VERSION || 'v1';
process.env.TEST_BYPASS_AUTH = process.env.TEST_BYPASS_AUTH || '1';

// We'll import the server inside the test lifecycle (beforeAll) so the
// module is fully loaded before Supertest creates requests.
let app: any;

const BASE = `/${process.env.APP_VERSION}`;

let personId: number;
let accountId: number;
let cardId: number;
let transactionId: number;

describe('API Endpoints', () => {
	beforeAll(async () => {
		// Import server module here so app is defined before Supertest usage
		const serverModule: any = await import('../src/server');
		app = serverModule.app ?? serverModule.default ?? serverModule;

		// Cria usuário
		await request(app)
			.post(`${BASE}/people`)
			.send({ name: 'Teste', document: '12345678901', password: '123456' });

		// Autentica usuário
		await request(app)
			.post(`${BASE}/login`)
			.send({ document: '12345678901', password: '123456' });

		// Cria conta
		const accountRes = await request(app)
			.post(`${BASE}/accounts`)
			.send({ branch: '000', account: '0000001-1' });
		accountId = accountRes.body.id || 1;

		// Cria cartão
		const cardRes = await request(app)
			.post(`${BASE}/accounts/${accountId}/cards`)
			.send({ type: 'virtual', number: '1234567890123456', cvv: '123' });
		cardId = cardRes.body.id || 1;

		// Cria transação
		const transactionRes = await request(app)
			.post(`${BASE}/accounts/${accountId}/transactions`)
			.send({ value: '100.00', description: 'Teste', type: 'credit' });
		transactionId = transactionRes.body.id || 1;
	});

	it('GET /accounts - lista contas', async () => {
		const res = await request(app).get(`${BASE}/accounts`);
		expect(res.statusCode).toBeGreaterThanOrEqual(200);
		expect(res.statusCode).toBeLessThan(300);
	});

	it('GET /accounts/:accountId/cards - lista cartões da conta', async () => {
		const res = await request(app).get(`${BASE}/accounts/${accountId}/cards`);
		expect(res.statusCode).toBeGreaterThanOrEqual(200);
		expect(res.statusCode).toBeLessThan(300);
	});

	it('GET /cards - lista todos cartões', async () => {
		const res = await request(app).get(`${BASE}/cards`);
		expect(res.statusCode).toBeGreaterThanOrEqual(200);
		expect(res.statusCode).toBeLessThan(300);
	});

	it('POST /accounts/:accountId/transactions/internal - cria transferência', async () => {
		const res = await request(app)
			.post(`${BASE}/accounts/${accountId}/transactions/internal`)
			.send({ receiverId: accountId + 1, value: '50.00', description: 'Transferência', type: 'debit' });
		expect(res.statusCode).toBeGreaterThanOrEqual(200);
		expect(res.statusCode).toBeLessThan(300);
	});

	it('GET /accounts/:accountId/transactions - lista transações', async () => {
		const res = await request(app).get(`${BASE}/accounts/${accountId}/transactions`);
		expect(res.statusCode).toBeGreaterThanOrEqual(200);
		expect(res.statusCode).toBeLessThan(300);
	});

	it('GET /accounts/:accountId/balance - consulta saldo', async () => {
		const res = await request(app).get(`${BASE}/accounts/${accountId}/balance`);
		expect(res.statusCode).toBeGreaterThanOrEqual(200);
		expect(res.statusCode).toBeLessThan(300);
	});

	it('POST /accounts/:accountId/transactions/:transactionId/revert - reverte transação', async () => {
		const res = await request(app)
			.post(`${BASE}/accounts/${accountId}/transactions/${transactionId}/revert`);
		expect(res.statusCode).toBeGreaterThanOrEqual(200);
		expect(res.statusCode).toBeLessThan(300);
	});
});
