const knexfile = require('../../knexfile');
import dotenv from 'dotenv'
import knex from 'knex'

dotenv.config()

const environment = process.env.NODE_ENV as keyof typeof knexfile || 'development'
const db = knex(knexfile[environment])

export default db