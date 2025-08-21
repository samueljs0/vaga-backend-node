import { Knex } from 'knex';

// Seed message
console.log('Seed: BALANCE');

// Insert 5 balance accounts
export async function seed(knex: Knex): Promise<void> {
    await knex('balance').insert([
        {
            userId: 1,
            value: 1000.00,
            description: 'Saldo inicial',
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            userId: 2,
            value: 500.50,
            description: 'Depósito',
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            userId: 3,
            value: 750.25,
            description: 'Transferência recebida',
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            userId: 4,
            value: 1200.00,
            description: 'Pagamento de salário',
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            userId: 5,
            value: 300.00,
            description: 'Reembolso',
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    ]);
}