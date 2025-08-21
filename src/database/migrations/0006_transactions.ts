import { Knex } from 'knex';

// migration msg
console.log('Migration: TRANSACTIONS');

// Up model in the database - CREATE TABLE
export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('transactions', (table) => {
        // ID
        table.increments('id').primary();

        // Foreign key to balance table
        table.integer('balanceIDTransfer').notNullable()
            .references('id').inTable('balance')
            .onDelete('CASCADE');

        table.integer('balanceIDReceive').nullable()
            .references('id').inTable('balance')
            .onDelete('CASCADE');

        // type: credit or debit 
        table.enu('type', ['credit', 'debit']).notNullable();
        
        // Value: positive for credit, negative for debit
        table.decimal('value', 14, 2).notNullable();

        // Description
        table.string('description', 255).notNullable();

        // Reversed From ID
        table.integer('reversedFromId').nullable()
            .references('id').inTable('transactions')
            .onDelete('SET NULL');

        // Foreign key to accounts table
        table.integer('accountId').notNullable()
            .references('id').inTable('accounts')
            .onDelete('CASCADE');

        // Timestamps
        table.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
        table.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    });
}

// Down model in the database - DROP TABLE
export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable('transactions');
}