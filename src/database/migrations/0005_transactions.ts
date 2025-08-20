import { Knex } from 'knex';

// migration msg
console.log('Migration: TRANSACTIONS');

// Up model in the database - CREATE TABLE
export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('transactions', (table) => {
        // ID
        table.uuid('id').primary();

        // Foreign key to balance table
        table.uuid('balanceIDTransfer').notNullable()
            .references('id').inTable('balance')
            .onDelete('CASCADE');

        table.uuid('balanceIDReceive').notNullable()
            .references('id').inTable('balance')
            .onDelete('CASCADE');
        

        // type: credit or debit 
        table.enu('type', ['credit', 'debit']).notNullable();
        
        // Value: positive for credit, negative for debit
        table.decimal('value', 14, 2).notNullable();

        // Description
        table.string('description', 255).notNullable();

        // Timestamps
        table.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
        table.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    });
}

// Down model in the database - DROP TABLE
export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable('transactions');
}