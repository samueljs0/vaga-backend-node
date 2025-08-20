import { Request, Response } from 'express';
import knex from '../../database';
interface AuthenticatedRequest extends Request {
    user?: { id: number; [key: string]: any };
}

export const transactionsController = {
    // Index
    async index(req: Request, res: Response): Promise<void> {
        try {
            const data = await knex('transactions')
                .select('id', 'value', 'description', 'createdAt', 'updatedAt')
                .orderBy('createdAt', 'desc');

            res.send({ data });
        } catch (err) {
            res.status(400).json({
                message: 'transactions.index.nok',
                error: err,
            });
        }
    },

    // Show
    async show(req: Request<{ id: string }>, res: Response): Promise<void> {
        const { id } = req.params;

        try {
            const transaction = await knex('transactions')
                .select('id', 'value', 'description', 'createdAt', 'updatedAt')
                .where({ id })
                .first();

            if (!transaction) {
                res.status(404).json({ message: 'transactions.show.notfound' });
                return;
            }

            res.send({ data: transaction });
        } catch (err) {
            res.status(400).json({
                message: 'transactions.show.nok',
                error: err,
            });
        }
    },

    // Create
    async create(req: AuthenticatedRequest, res: Response): Promise<void> {
        const {
            
            value,
            description,
            type,
        }: {
            value: string;
            description: string;
            type: 'credit' | 'debit';
        } = req.body;

        try {

            const isDebit = Number(value) < 0;
            if (isDebit) {

                const balanceRow = await knex('balance').select('amount').first();
                const currentBalance = balanceRow?.amount ?? 0;

            if (currentBalance + Number(value) < 0) {
                res.status(400).json({
                message: 'transactions.create.nok',
                detail: {
                    code: 'BALANCE_NEGATIVE',
                    message: 'Saldo insuficiente para débito',
                }
                });
                return;
            }
            }
            const [data]: { id: string }[] = await knex('transactions')
                .insert({
                    value,
                    description,
                    type: isDebit ? 'debit' : 'credit',
                })
                .returning('id');

            const userId = req.user?.id;
            if (userId && isDebit) {
                await knex('balance')
                    .where({ userId })
                    .decrement('amount', Number(value));
            }

            res.send({ data, message: 'transactions.create.ok' });
        } catch (err: any) {
            res.status(400).json({
                message: 'transactions.create.nok',
                detail: {
                    code: err.code,
                    message: err.detail,
                    constraint: err.constraint?.replaceAll('_', '.')
                }
            });
        }
    },

    // Create
    async createTransfer(req: AuthenticatedRequest, res: Response): Promise<void> {
        const {
            receiverId,
            value,
            description,
            type,
        }: {
            receiverId: string;
            value: string;
            description: string;
            type: 'credit' | 'debit';
        } = req.body;

        try {

            const isDebit = Number(value) < 0;
            if (isDebit) {

                const balanceRow = await knex('balance').select('amount').first();
                const currentBalance = balanceRow?.amount ?? 0;

            if (currentBalance + Number(value) < 0) {
                res.status(400).json({
                message: 'transactions.create.nok',
                detail: {
                    code: 'BALANCE_NEGATIVE',
                    message: 'Saldo insuficiente para débito',
                }
                });
                return;
            }
            }
            const [data]: { id: string }[] = await knex('transactions')
                .insert({
                    value,
                    description,
                    type: isDebit ? 'debit' : 'credit',
                })
                .returning('id');

            const userId = req.user?.id;
            if (userId && isDebit) {
                await knex('balance')
                    .where({ userId })
                    .decrement('amount', Number(value));

                    await knex('balance')
                        .where({ userId: receiverId })
                        .increment('amount', Math.abs(Number(value)));
            }

            res.send({ data, message: 'transactions.create.ok' });
        } catch (err: any) {
            res.status(400).json({
                message: 'transactions.create.nok',
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
        req: Request<{ id: string }, any, { value?: string; description?: string }>,
        res: Response
    ): Promise<void> {
        const { id } = req.params;
        const { value, description } = req.body;

        try {
            const [data]: { id: string }[] = await knex('transactions')
                .where({ id })
                .update({
                    value,
                    description,
                    updatedAt: knex.fn.now(),
                })
                .returning('id');

            res.send({ data, message: 'transactions.update.ok' });
        } catch (err: any) {
            res.status(400).json({
                message: 'transactions.update.nok',
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
            await knex('transactions')
                .where({ id })
                .del();

            res.send({ message: 'transactions.delete.ok' });
        } catch (err) {
            res.status(400).json({
                message: 'transactions.delete.nok',
                error: err,
            });
        }
    }
};