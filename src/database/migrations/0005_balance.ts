import { Knex } from 'knex';

// migration msg
console.log('Migration: BALANCE');

// Up model in the database - CREATE TABLE
export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('balance', (table) => {
        // ID
        table.increments('id').primary();
        
        // Foreign Key - users
        table.integer('userId').notNullable();
        table.foreign('userId').references('users.id').onDelete('CASCADE');
        
    table.decimal('value', 14, 2).notNullable().defaultTo(0.00);

        // Description
        table.string('description', 255).nullable();

    // Timestamps
    table.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    });
}

// Down model in the database - DROP TABLE
export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable('balance');
}