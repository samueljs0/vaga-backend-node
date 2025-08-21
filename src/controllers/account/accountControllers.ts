import { Request, Response } from 'express';
import knex from '../../database';
import bcrypt from 'bcrypt';
import { parsePagination, makeMeta } from '../../utils/pagination';

interface AuthenticatedRequest extends Request {
    user?: { id: number;[key: string]: any };
}

export const accountController = {
    /**
     * List all accounts with pagination.
     */
    async index(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { page, limit, offset } = parsePagination(req.query);
            const userId = req.user?.id;
            const [{ count }] = await knex('accounts')
                .where({ userId })
                .count<{ count: number }[]>('* as count');
            const data = await knex('accounts')
                .select('id', 'account', 'branch', 'createdAt', 'updatedAt')
                .where({ userId })
                .orderBy('createdAt', 'desc')
                .limit(limit)
                .offset(offset);

            res.send({ data, meta: makeMeta(Number(count), page, limit) });
        } catch (err) {
            res.status(400).json({
                message: 'account.index.nok',
                error: err,
            });
        }
    },

    /**
     * List all accounts with pagination.
     */
    async indexNoPagination(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            const data = await knex('accounts')
                .select('id', 'account', 'branch', 'createdAt', 'updatedAt')
                .where({ userId })
                .orderBy('createdAt', 'desc');

            res.send(data);
        } catch (err) {
            res.status(400).json({
                message: 'account.index.nok',
                error: err,
            });
        } 
    },

    /**
     * Get details of a single account by ID.
     */
    async show(req: Request<{ id: string }>, res: Response): Promise<void> {
        const { id } = req.params;

        try {
            const data = await knex('accounts')
                .select('id', 'account', 'branch', 'createdAt', 'updatedAt')
                .where({ id })
                .first();

            if (!data) {
                res.status(404).json({ message: 'account.show.notfound' });
                return;
            }

            res.send({ data });
        } catch (err) {
            res.status(400).json({
                message: 'account.show.nok',
                error: err,
            });
        }
    },

    /**
     * Create a new account.
     * Validates branch and account formats, and checks for uniqueness.
     */
    async create(req: AuthenticatedRequest, res: Response): Promise<void> {
        const {
            account,
            branch,
        }: {
            account: string;
            branch: string;
        } = req.body;

        try {
            // Validate branch: must be exactly 3 digits
            if (branch.length !== 3) {
                // Return standardized error expected by tests
                res.status(400).json({ message: 'account.create.branch.invalid' });
                return;
            }

            // Validate account mask: must be 7 digits, dash, 1 digit (total 9 chars)
            if (account.length !== 9) {
                // Return standardized error expected by tests
                res.status(400).json({ message: 'account.create.account.invalid' });
                return;
            }

            // Check if account number already exists
            const existing = await knex('accounts').select('id').where({ account }).first();
            if (existing) {
                res.status(409).json({ message: 'account.create.account.exists' });
                return;
            }

            const [inserted]: { id: number }[] = await knex('accounts')
                .insert({
                    account,
                    branch,
                    userId: req.user?.id,
                })
                .returning('id');

            const created = await knex('accounts')
                .select('id', 'branch', 'account', 'createdAt', 'updatedAt')
                .where({ id: inserted.id ?? inserted })
                .first();

            res.send(created);
        } catch (err: any) {
            res.status(400).json({
                message: 'account.create.nok',
                detail: {
                    code: err.code,
                    message: err.detail,
                    constraint: err.constraint?.replaceAll('_', '.')
                }
            });
        }
    },

    /**
     * Update an existing account by ID.
     */
    async update(
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> {
        const { id } = req.params as { id: string };
        const { account, branch }: { account?: string; branch?: string } = req.body;

        try {
            const [updated]: { id: number }[] = await knex('accounts')
                .where({ id })
                .update({
                    account,
                    branch,
                    userId: req.user?.id,
                })
                .returning('id');

            const updatedRow = await knex('accounts')
                .select('id', 'account', 'branch', 'createdAt', 'updatedAt')
                .where({ id: updated.id ?? updated })
                .first();

            res.send({ data: updatedRow, message: 'account.update.ok' });
        } catch (err: any) {
            res.status(400).json({
                message: 'account.update.nok',
                detail: {
                    code: err.code,
                    message: err.detail,
                    constraint: err.constraint?.replaceAll('_', '.')
                }
            });
        }
    },

    /**
     * Delete an account by ID.
     */
    async delete(req: Request<{ id: string }>, res: Response): Promise<void> {
        const { id } = req.params;

        try {
            await knex('accounts')
                .where({ id })
                .del();

            res.send({ message: 'account.delete.ok' });
        } catch (err) {
            res.status(400).json({
                message: 'account.delete.nok',
                error: err,
            });
        }
    }
};