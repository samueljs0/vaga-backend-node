import { Knex } from 'knex';

// migration msg
console.log('Migration: BALANCE');

// Up model in the database - CREATE TABLE
export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('balance', (table) => {
        // ID
        table.uuid('id').primary();
        
        // Foreign Key - users
        table.integer('user_id').notNullable();
        table.foreign('user_id').references('users.id').onDelete('CASCADE');
        
        table.decimal('value', 14, 2).notNullable().checkPositive('value');

        // Description
        table.string('description', 255).notNullable();
    
        // Timestamps
        table.timestamp('createdAt', { useTz: false }).notNullable();
        table.timestamp('updatedAt', { useTz: false }).notNullable();
    });
}

// Down model in the database - DROP TABLE
export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable('balance');
}