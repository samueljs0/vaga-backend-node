import dotenv from 'dotenv';
import path from 'path';



dotenv.config();


const config = {
  development: {
    client: "postgresql",
    connection:  { 
      host: process.env.DB_HOST, 
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432, 
      user: process.env.DB_USER, 
      password: process.env.DB_PASSWORD, 
      database: process.env.DB_DATABASE 
    },
    searchPath: ['knex', 'public'], 
    migrations: { 
      tableName: 'knex_migrations', 
  directory: `${__dirname}/src/database/migrations` 
    }, 
    seeds: { 
      directory: `${__dirname}/src/database/seeds/` 
    }
  },

production: { 
    client: 'pg', 
    connection: { 
      host: process.env.DB_HOST, 
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432, 
      user: process.env.DB_USER, 
      password: process.env.DB_PASSWORD, 
      database: process.env.DB_DATABASE 
    }, 
    searchPath: ['knex', 'public'], 
    migrations: { 
      tableName: 'knex_migrations', 
      directory: path.resolve(__dirname, 'src', 'database', 'migrations')
    }, 
    seeds: { 
      directory: path.resolve(__dirname, 'src', 'database', 'seeds')
    } 
  }
}; 

module.exports = config;
