import type { Knex } from "knex";

// Migration msg
console.log('Migration: USER');

// Up model in the database - CREATE TABLE
export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('users', function (table: Knex.TableBuilder) {

        // ID
        table.increments('id').primary();

        // Access
        table.string('document', 14).unique().notNullable();
        table.string('password', 100).notNullable();

        // Data
        table.string('name', 100).notNullable();

        table.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
        table.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    });
}

// Down model in the database - DROP TABLE
export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable('users');
}
