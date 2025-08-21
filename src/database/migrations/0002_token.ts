import { Knex } from 'knex';

// migration msg
console.log('Migration: TOKEN');

// Up model in the database - CREATE TABLE
export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('token', (table) => {
        // ID
        table.increments('id').primary();

        // Foreign Key - users
        table.integer('userId').notNullable();
        table.foreign('userId').references('users.id').onDelete('CASCADE');

        // Data token
        table.string('token', 1024).notNullable();

        // Create and update timestamp
        table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
        table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    });
}

// Down model in the database - DROP TABLE
export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable('token');
}
