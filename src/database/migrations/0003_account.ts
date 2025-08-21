import { Knex } from 'knex';

// migration msg
console.log('Migration: ACCOUNTS');

// Up model in the database - CREATE TABLE
export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('accounts', (table) => {

        // ID 
        table.increments('id').primary();
        
        // Foreign Key - users
        table.integer('userId').notNullable();
        table.foreign('userId').references('users.id').onDelete('CASCADE');

        // Branch: exatamente 3 dígitos
        table.string('branch', 3).notNullable();

        // Account: máscara XXXXXXX-X, único
        table.string('account', 9).notNullable().unique();
        
        // Timestamps
        table.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
        table.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    });
}

// Down model in the database - DROP TABLE
export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable('accounts');
}
