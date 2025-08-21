import { Knex } from 'knex';

// migration msg
console.log('Migration: CARDS');

// Up model in the database - CREATE TABLE
export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('cards', (table) => {
        // ID
        table.increments('id').primary();

        // Card type: 'physical' or 'virtual'
        table.enu('type', ['physical', 'virtual']).notNullable();

        // Card number: full number on creation, but only last 4 digits returned in API
        table.string('number', 19).notNullable();

        // cvv: exactly 3 digits
        table.string('cvv', 3).notNullable();

        // Foreign key to accounts table
        table.integer('accountId').notNullable()
            .references('id').inTable('accounts')
            .onDelete('CASCADE')
            ;
        // Foreign key to users table
        table.integer('userId').notNullable()
            .references('id').inTable('users')
            .onDelete('CASCADE');

        // Timestamps
        table.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
        table.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());

        // Unique constraint: only one physical card per account
        table.unique(['accountId', 'type'], {
            indexName: 'unique_physical_card_per_account',
            predicate: knex.queryBuilder().whereRaw("type = 'physical'")
        });
    });
}

// Down model in the database - DROP TABLE
export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable('cards');
}