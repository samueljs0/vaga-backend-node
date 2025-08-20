import { Request, Response } from 'express';
import knex from '../../database';
import bcrypt from 'bcrypt';

interface AuthenticatedRequest extends Request {
    user?: { id: number; [key: string]: any };
}

export const accountController = {
    // Index
    async index(req: Request, res: Response): Promise<void> {
        try {
            const data = await knex('accounts')
                .select('id', 'account', 'branch', 'createdAt', 'updatedAt')
                .orderBy('account');

            res.send({ data });
        } catch (err) {
            res.status(400).json({
                message: 'account.index.nok',
                error: err,
            });
        }
    },

    // Show
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

    // Create
    async create(req: AuthenticatedRequest, res: Response): Promise<void> {
        const {
            account,
            branch,
        }: {
            account: string;
            branch: string;
        } = req.body;

        try {
            const [inserted]: { id: number }[] = await knex('accounts')
                .insert({
                    account,
                    branch,
                    user_id: req.user?.id,
                })
                .returning('id');

            const created = await knex('accounts')
                .select('id', 'account', 'branch', 'createdAt', 'updatedAt')
                .where({ id: inserted.id ?? inserted })
                .first();

            res.send({ data: created, message: 'account.create.ok' });
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
    // Update
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
                    user_id: req.user?.id,
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

    // Delete
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