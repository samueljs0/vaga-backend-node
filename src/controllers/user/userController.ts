import { Request, Response } from 'express';
import knex from '../../database';
import bcrypt from 'bcrypt';
import { authControllerSystem } from '../auth/authControllerSystem';
import axios from 'axios';
import { parsePagination, makeMeta } from '../../utils/pagination';

// Obtém o token do sistema via API externa
async function getSystemToken(): Promise<string> {
    try {

        // Obtém o código de autenticação
        const apiLogin = {
            email: process.env.CON_USER_EMAIL,
            password: process.env.CON_USER_PASSWORD,
        };

        // Define a interface for the response
        interface CodeResponse {
            success: boolean;
            data?: {
                authCode?: string;
                userId?: string;
            };
        }

        // Faz a requisição para obter o código de autenticação
        const codeResp = await axios.post<CodeResponse>('https://compliance-api.cubos.io/auth/code', apiLogin);

        // Verifica se a resposta contém o código de autenticação
        if (codeResp.data?.success && codeResp.data.data?.authCode) {

            // Define a interface for the response
            interface TokenResponse {
                success: boolean;
                data?: {
                    accessToken: string;
                    refreshToken: string;
                    [key: string]: any;
                };
            }

            // Faz a requisição para obter o token de acesso
            const tokenResp = await axios.post<TokenResponse>('https://compliance-api.cubos.io/auth/token', {
                authCode: codeResp.data.data.authCode,
            });

            // Verifica se a resposta contém o token de acesso
            if (tokenResp.data?.data?.accessToken) {
                return tokenResp.data.data.accessToken;
            }
        }

        // Se não conseguiu obter o token
        throw new Error('Falha ao obter token do sistema');
    } catch (err) {
        console.error('Erro ao obter token do sistema:', err);
        throw new Error('Erro na autenticação do sistema.');
    }
}

export const userController = {

    // Lista usuários com paginação
    async index(req: Request, res: Response): Promise<void> {
        try {
            const { page, limit, offset } = parsePagination(req.query);
            const [{ count }] = await knex('users').count<{ count: number }[]>('* as count');
            const data = await knex('users')
                .select('id', 'name', 'document', 'createdAt', 'updatedAt')
                .orderBy('createdAt', 'desc')
                .limit(limit)
                .offset(offset);

            res.send({ data, meta: makeMeta(Number(count), page, limit) });
        } catch (err) {
            res.status(400).json({
                message: 'user.index.nok',
                error: err,
            });
        }
    },

    // Busca usuário por ID
    async show(req: Request<{ id: string }>, res: Response): Promise<void> {
        const { id } = req.params;

        try {
            const data = await knex('users')
                .select('id', 'name', 'document', 'createdAt', 'updatedAt')
                .where({ id })
                .first();

            if (!data) {
                res.status(404).json({ message: 'user.show.notfound' });
                return;
            }

            res.send({ data });
        } catch (err) {
            res.status(400).json({
                message: 'user.show.nok',
                error: err,
            });
        }
    },

    // Cria novo usuário após validação de CPF
    async create(req: Request, res: Response, next: () => void): Promise<void> {
        const systemToken = await getSystemToken();

        const {
            name,
            document,
            password,
        }: {
            name: string;
            document: string;
            password: string;
        } = req.body;

        try {
            const doc = document.replace(/[.\-]/g, '');

            // Valida CPF via API externa antes de criar usuário
            const response = await fetch('https://compliance-api.cubos.io/cpf/validate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${systemToken}`,
                },
                body: JSON.stringify({ document: doc })
            });

            const result = await response.json();

            const valid = response.ok && (result?.valid === true || Number(result?.data?.status) === 1);

            if (!valid) {
                res.status(400).json({
                    message: 'user.create.cpf.invalid',
                    detail: result
                });
                return;
            }

            // Criação do usuário e saldo inicial em transação
            await knex.transaction(async trx => {
                const [data]: { id: number }[] = await trx('users')
                    .insert({
                        name,
                        document: doc,
                        password: bcrypt.hashSync(password, Number(process.env.SALT))
                    })
                    .returning('id');

                const created = await trx('users')
                    .select('id', 'name', 'document', 'createdAt', 'updatedAt')
                    .where({ id: data.id ?? data })
                    .first();

                await trx('balance').insert({
                    userId: created.id,
                    value: 0.00,
                    description: 'Saldo inicial',
                    createdAt: new Date(),
                    updatedAt: new Date()
                });

                res.status(201).json(created);
                next();
            });
        } catch (err: any) {
            res.status(400).json({
                message: 'user.create.nok',
                detail: {
                    code: err.code,
                    message: err.detail,
                    constraint: err.constraint?.replaceAll('_', '.')
                }
            });
        }
    },

    // Atualiza dados do usuário, validando CPF se necessário
    async update(
        req: Request<{ id: string }, any, { name?: string; document?: string; password?: string }>,
        res: Response
    ): Promise<void> {
        const { id } = req.params;
        const { name, document, password } = req.body;

        try {
            let doc = document?.replace(/[.\-]/g, '');

            // Valida CPF se informado
            if (doc) {
                const systemToken = await getSystemToken();
                const response = await fetch('https://compliance-api.cubos.io/cpf/validate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${systemToken}`,
                    },
                    body: JSON.stringify({ document: doc })
                });

                const result = await response.json();

                const valid = response.ok && (result?.valid === true || Number(result?.data?.status) === 1);

                if (!valid) {
                    res.status(400).json({
                        message: 'user.update.cpf.invalid',
                        detail: result
                    });
                    return;
                }
            }

            // Monta dados para atualização
            const updateData: Record<string, any> = {};
            if (name) updateData.name = name;
            if (doc) updateData.document = doc;
            if (password) updateData.password = bcrypt.hashSync(password, Number(process.env.SALT));

            // Atualiza usuário
            await knex('users')
                .update(updateData)
                .where({ id });

            res.send({ message: 'user.update.ok' });
        } catch (err: any) {
            res.status(400).json({
                message: 'user.update.nok',
                detail: {
                    code: err.code,
                    message: err.detail,
                    constraint: err.constraint?.replaceAll('_', '.')
                }
            });
        }
    },

    // Remove usuário pelo ID
    async delete(req: Request<{ id: string }>, res: Response): Promise<void> {
        const { id } = req.params;

        try {
            await knex('users')
                .where({ id })
                .del();

            res.send({ message: 'user.delete.ok' });
        } catch (err) {
            res.status(400).json({
                message: 'user.delete.nok',
                error: err,
            });
        }
    }
};
