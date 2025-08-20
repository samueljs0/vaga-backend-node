import { Request, Response } from 'express';
import knex from '../../database';
export const cardController = {
    // Index
    async index(req: Request, res: Response): Promise<void> {
        try {
            const data = await knex('cards')
                .select('id', 'type', 'number', 'accountId', 'createdAt', 'updatedAt')
                .orderBy('createdAt');

            // Only return last 4 digits of card number
            const maskedData = data.map(card => ({
                ...card,
                number: card.number.slice(-4)
            }));

            res.send({ data: maskedData });
        } catch (err) {
            res.status(400).json({
                message: 'card.index.nok',
                error: err,
            });
        }
    },

    // Show
    async show(req: Request<{ id: string }>, res: Response): Promise<void> {
        const accountId = req.params.id;

        try {
            const cards = await knex('cards')
                .select('id', 'type', 'number', 'accountId', 'createdAt', 'updatedAt')
                .where({ accountId });

            if (!cards || cards.length === 0) {
                res.status(404).json({ message: 'card.show.notfound' });
                return;
            }

            // Get all card ids for this accountId
            const relatedIds = cards.map(card => card.id);

            res.send({ data: cards, relatedIds });
        } catch (err) {
            res.status(400).json({
                message: 'card.show.nok',
                error: err,
            });
        }
    },
    // Create
    async create(req: Request, res: Response): Promise<void> {
        const {
            type,
            number,
            cvv,
            accountId,
        }: {
            type: 'physical' | 'virtual';
            number: string;
            cvv: string;
            accountId: string;
        } = req.body;

        try {
            const [data]: { id: string }[] = await knex('cards')
                .insert({
                    type,
                    number,
                    cvv,
                    accountId,
                })
                .returning('id');

            // Retorna apenas os 4 últimos dígitos do número do cartão
            res.send({
                data: {
                    ...data,
                    number: number.slice(-4)
                },
                message: 'card.create.ok'
            });
        } catch (err: any) {
            res.status(400).json({
                message: 'card.create.nok',
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
        req: Request<{ id: string }, any, { type?: 'physical' | 'virtual'; number?: string; cvv?: string; accountId?: string; }>,
        res: Response
    ): Promise<void> {
        const { id } = req.params;
        const { type, number, cvv, accountId } = req.body;

        try {
            const [data]: { id: string }[] = await knex('cards')
                .where({ id })
                .update({
                    type,
                    number,
                    cvv,
                    accountId,
                    updatedAt: knex.fn.now(),
                })
                .returning('id');

            res.send({
                data: {
                    ...data,
                    number: number ? number.slice(-4) : undefined
                },
                message: 'card.update.ok'
            });
        } catch (err: any) {
            res.status(400).json({
                message: 'card.update.nok',
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
            await knex('cards')
                .where({ id })
                .del();

            res.send({ message: 'card.delete.ok' });
        } catch (err) {
            res.status(400).json({
                message: 'card.delete.nok',
                error: err,
            });
        }
    }
};