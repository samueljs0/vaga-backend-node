import { Request, Response } from 'express';
import knex from '../../database';
import { parsePagination, makeMeta } from '../../utils/pagination';

// Interface para request autenticada
interface AuthenticatedRequest extends Request {
    user?: { id: number;[key: string]: any };
}

// Controller de transações
export const transactionsController = {
    /**
     * Lista transações com paginação e filtro por conta
     */
    async index(req: Request<{ accountId: string }> & AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { accountId } = req.params;
            const type = req.query.type ? String(req.query.type).toLowerCase() : undefined;
            const { page, limit, offset } = parsePagination(req.query);

            // Query base de transações
            const base = knex('transactions as t')
                .select('t.id', 't.type', 't.value', 't.description', 't.createdAt', 't.accountId')
                .orderBy('t.createdAt', 'desc');

            if (accountId) base.whereRaw('?? = ?', ['t.accountId', accountId]);
            if (type) base.whereRaw('?? = ?', ['t.type', type]);

            // Conta total de registros para paginação
            const countQuery = knex('transactions').count('* as count');
            if (accountId) countQuery.whereRaw('?? = ?', ['accountId', accountId]);
            if (type) countQuery.whereRaw('?? = ?', ['type', type]);

            const [result] = await countQuery;
            const count = result.count;
            // Busca dados paginados
            const data = await base.limit(limit).offset(offset);

            res.send({ data, meta: makeMeta(Number(count), page, limit) });
        } catch (err) {
            res.status(400).json({
                message: 'transactions.index.nok',
                error: err,
            });
        }
    },

    /**
     * Busca detalhes de uma transação pelo id
     */
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

    /**
     * Cria uma transação (crédito ou débito)
     */
    async create(req: Request<{ accountId: string }> & AuthenticatedRequest, res: Response): Promise<void> {
        let {
            value,
            description,
            type,
            balanceIDTransfer,
            accountId: bodyAccountId,
            balanceIDReceive
        }: {
            value: string;
            description: string;
            type?: 'credit' | 'debit';
            balanceIDTransfer?: number;
            accountId: number;
            balanceIDReceive?: number;
        } = req.body;
        const { accountId } = req.params;

        try {
            const isDebit = Number(value) < 0;
            const userId = req.user?.id;

            // Valida saldo para débito
            if (isDebit) {
                const balanceRow = await knex('balance').where({ userId }).select('value').first();
                const currentBalance = balanceRow?.value ?? 0;

                if (currentBalance < Math.abs(Number(value))) {
                    res.status(400).json({
                        message: 'transactions.create.nok',
                        detail: {
                            code: 'BALANCE_NEGATIVE',
                            message: 'Saldo insuficiente para débito',
                        },
                    });
                    return;
                }
            }

            // Busca ou cria saldo do usuário
            let balanceRow = await knex('balance').where({ userId }).first();
            if (!balanceRow) {
                const [newBalance] = await knex('balance').insert({ userId, value: 0 }).returning('id');
                balanceIDTransfer = newBalance.id;
            } else {
                balanceIDTransfer = balanceRow.id;
            }

            // Cria transação
            const [data]: { id: string }[] = await knex('transactions')
                .insert({
                    value,
                    description,
                    type: isDebit ? 'debit' : 'credit',
                    balanceIDTransfer,
                    accountId: accountId ?? bodyAccountId,
                    balanceIDReceive: balanceIDTransfer
                })
                .returning('id');

            // Atualiza saldo do usuário
            if (userId) {
                if (isDebit) {
                    await knex('balance').where({ userId }).decrement('value', Math.abs(Number(value)));
                } else {
                    await knex('balance').where({ userId }).increment('value', Math.abs(Number(value)));
                }
            }

            // Retorna transação criada
            const created = await knex('transactions')
                .select('id', 'value', 'description', 'createdAt', 'updatedAt')
                .where({ id: data.id ?? data })
                .first();

            res.send(created);
        } catch (err: any) {
            res.status(400).json({
                message: 'transactions.create.nok',
                detail: {
                    code: err.code,
                    message: err.detail,
                    constraint: err.constraint?.replaceAll('_', '.'),
                },
            });
        }
    },

    /**
     * Cria uma transferência entre usuários
     */
    async createTransfer(req: Request<{ accountId: string }> & AuthenticatedRequest, res: Response): Promise<void> {
        let {
            receiverId,
            value,
            description,
            type,
        }: {
            receiverId: number;
            value: string;
            description: string;
            type?: 'credit' | 'debit';
        } = req.body;
        const { accountId } = req.params;
        try {
            // Busca usuário destinatário pela conta
            const receiverAccount = await knex('accounts').where('id', accountId).select('userId').first();
            if (!receiverAccount) {
                res.status(404).json({ message: 'transactions.transfer.receiverAccount.notfound' });
                return;
            }
            const receiverUserId = receiverAccount.userId;

            // Busca ou cria saldo do remetente
            const senderUserId = req.user?.id;
            let senderBalanceRow = await knex('balance').where({ userId: senderUserId }).first();
            if (!senderBalanceRow) {
                const [newSenderBalance] = await knex('balance').insert({ userId: senderUserId, value: 0 }).returning('id');
                senderBalanceRow = { id: newSenderBalance.id, value: 0 };
            }

            // Busca ou cria saldo do destinatário
            let receiverBalanceRow = await knex('balance').where({ userId: receiverUserId }).first();
            if (!receiverBalanceRow) {
                const [newReceiverBalance] = await knex('balance').insert({ userId: receiverUserId, value: 0 }).returning('id');
                receiverBalanceRow = { id: newReceiverBalance.id, value: 0 };
            }

            // Valida saldo do remetente
            const senderCurrentBalance = senderBalanceRow?.value ?? 0;
            const isDebit = Number(value) < 0;
            if (isDebit && senderCurrentBalance < Math.abs(Number(value))) {
                res.status(400).json({
                    message: 'transactions.create.nok',
                    detail: {
                        code: 'BALANCE_NEGATIVE',
                        message: 'Saldo insuficiente para débito',
                    },
                });
                return;
            }

            // Cria transação de transferência
            const [data]: { id: string }[] = await knex('transactions')
                .insert({
                    value,
                    description,
                    type: isDebit ? 'debit' : 'credit',
                    balanceIDTransfer: senderBalanceRow.id,
                    balanceIDReceive: receiverBalanceRow.id,
                    accountId: senderUserId,
                })
                .returning('id');

            // Atualiza saldos
            await knex('balance').where({ userId: senderUserId }).decrement('value', Math.abs(Number(value)));
            await knex('balance').where({ userId: receiverUserId }).increment('value', Math.abs(Number(value)));

            // Retorna transação criada
            const created = await knex('transactions')
                .select('id', 'value', 'description', 'createdAt', 'updatedAt')
                .where({ id: data.id ?? data })
                .first();

            res.send(created);
        } catch (err: any) {
            res.status(400).json({
                message: 'transactions.create.nok',
                detail: {
                    code: err.code,
                    message: err.detail,
                    constraint: err.constraint?.replaceAll('_', '.'),
                },
            });
        }
    },

    /**
     * Atualiza uma transação
     */
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

    /**
     * Remove uma transação
     */
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
    },

    /**
     * Reverte uma transação (estorno)
     */
    async reverseTransaction(req: Request<{ accountId: string, transactionId: string }> & AuthenticatedRequest, res: Response): Promise<void> {
        const { accountId, transactionId } = req.params;
        // try {
            // Busca transação original
            const original = await knex('transactions').where({ id: transactionId }).first();
            if (!original) {
                res.status(404).json({ message: 'transactions.reverse.notfound' });
                return;
            }

            // Verifica se já foi revertida
            const alreadyReversed = await knex('transactions').where({ reversedFromId: transactionId }).first();
            if (alreadyReversed) {
                res.status(400).json({ message: 'transactions.reverse.already' });
                return;
            }

            // Busca saldos envolvidos
            const senderBalance = await knex('balance').where({ id: original.balanceIDTransfer }).first();
            const receiverBalance = await knex('balance').where({ id: original.balanceIDReceive }).first();

            const value = Math.abs(Number(original.value));
            let canReverse = false;

            // Valida saldo para reversão
            if (original.type === 'credit') {
                canReverse = receiverBalance.value >= value;
            } else {
                canReverse = senderBalance.value >= value;
            }

            if (!canReverse) {
                res.status(400).json({ message: 'transactions.reverse.nobalance' });
                return;
            }

            // Cria transação inversa
            const reversedType = original.type === 'credit' ? 'debit' : 'credit';
            const [reversed]: { id: string }[] = await knex('transactions')
                .insert({
                    value: original.value,
                    description: `Estorno de cobrança indevida. ${transactionId}`,
                    type: reversedType,
                    balanceIDTransfer: original.balanceIDTransfer,
                    balanceIDReceive: original.balanceIDReceive,
                    reversedFromId: transactionId,
                    accountId: accountId
                })
                .returning('id');

            // Atualiza saldos
            await knex('balance').where({ id: original.balanceIDReceive }).decrement('value', value);
            await knex('balance').where({ id: original.balanceIDTransfer }).increment('value', value);

            // Retorna transação de estorno
            const created = await knex('transactions')
                .select('id', 'value', 'description', 'createdAt', 'updatedAt')
                .where({ id: reversed.id })
                .first();

            res.send(created);
        // } catch (err: any) {
        //     res.status(400).json({
        //         message: 'transactions.reverse.nok',
        //         detail: {
        //             code: err.code,
        //             message: err.detail,
        //             constraint: err.constraint?.replaceAll('_', '.'),
        //         },
        //     });
        // }
    },
    getBalance: async (req: Request<{ accountId: string }> & AuthenticatedRequest, res: Response): Promise<void> => {
        const { accountId } = req.params;

        try {
            // Busca o usuário pelo accountId
            const account = await knex('accounts').where({ id: accountId }).select('userId').first();
            if (!account) {
                res.status(404).json({ message: 'transactions.balance.account.notfound' });
                return;
            }

            // Busca o saldo pelo userId
            const balance = await knex('balance').where({ userId: account.userId }).select('value').first();
            if (!balance) {
                res.status(404).json({ message: 'transactions.balance.notfound' });
                return;
            }
            const data = {
                balance: balance.value
            };
            res.send(data);
        } catch (err: any) {
            res.status(400).json({
                message: 'transactions.balance.nok',
                detail: {
                    code: err.code,
                    message: err.detail,
                    constraint: err.constraint?.replaceAll('_', '.'),
                },
            });
        }
    }
};