import type { Knex } from "knex";
import bcrypt from 'bcrypt';

// Read salt rounds from env, fallback to a safe default (10) when invalid
const _envSalt = Number(process.env.SALT);
const SALT_ROUNDS = Number.isInteger(_envSalt) && _envSalt > 0 ? _envSalt : 10;

function hashSync(password: string, saltRounds: number): string {
    return bcrypt.hashSync(password, saltRounds);
}

export async function seed(knex: Knex): Promise<void> {
    await knex('users').del();

    await knex('users').insert([
        {
            document: '54047439053',
            password: hashSync('root', SALT_ROUNDS),
            name: 'Felipe Lucas',
        },
        {
            document: '08717684021',
            password: hashSync('root', SALT_ROUNDS),
            name: 'Wesley Vitor',
        },
        {
            document: '23583918088',
            password: hashSync('root', SALT_ROUNDS),
            name: 'Caio Henrrique',
        },
        {
            document: '24747805052',
            password: hashSync('root', SALT_ROUNDS),
            name: 'Samuel Silva',
        },
        {
            document: '25451478007',
            password: hashSync('root', SALT_ROUNDS),
            name: 'Bruno Lucas',
        },
    ]).returning('id');
}

