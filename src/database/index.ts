import dotenv from 'dotenv'
import knex from 'knex'

// Import knexfile in a way that works for both CJS (module.exports) and ESM (export default)
import * as knexfileModule from '../../knexfile';

dotenv.config()

const rawKnexfile: any = (knexfileModule as any).default ?? knexfileModule;
const env = process.env.NODE_ENV || 'development';

// Prefer explicit environment key if present on the exported knexfile.
let config: any = rawKnexfile[env] ?? rawKnexfile['development'] ?? rawKnexfile.default ?? rawKnexfile;

// If config still doesn't look like a knex config (missing 'client'), try to
// extract nested config (common when the whole module object was passed).
if (!config || typeof config !== 'object' || !config.client) {
	// If rawKnexfile has top-level keys like 'development', use that.
	if (rawKnexfile[env]) config = rawKnexfile[env];
	else if (rawKnexfile['development']) config = rawKnexfile['development'];
}

if (!config || !config.client) {
	throw new Error("knex: could not resolve a valid configuration object (missing 'client'). Check your knexfile export and NODE_ENV.");
}

const db = knex(config)

export default db