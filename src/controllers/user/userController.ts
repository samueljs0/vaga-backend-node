import { Request, Response } from 'express';
import knex from '../../database';
import bcrypt from 'bcrypt';
// Import authControllerSystem from its module
import { authControllerSystem } from '../auth/authControllerSystem';
import axios from 'axios';


async function getSystemToken(): Promise<string> {
    try {
        const apiLogin = {
            email: process.env.CON_USER_EMAIL,
            password: process.env.CON_USER_PASSWORD,
        };

        interface CodeResponse {
            success: boolean;
            data?: {
                authCode?: string;
                userId?: string;
            };
        }

        const codeResp = await axios.post<CodeResponse>('https://compliance-api.cubos.io/auth/code', apiLogin);

        if (codeResp.data?.success && codeResp.data.data?.authCode) {
            interface TokenResponse {
                success: boolean;
                data?: {
                    accessToken: string;
                    refreshToken: string;
                    [key: string]: any;
                };
            }
            const tokenResp = await axios.post<TokenResponse>('https://compliance-api.cubos.io/auth/token', {
                authCode: codeResp.data.data.authCode,
            });

            if (tokenResp.data?.data?.accessToken) {
                return tokenResp.data.data.accessToken;
            }
        }

        throw new Error('Falha ao obter token do sistema');
    } catch (err) {
        console.error('Erro ao obter token do sistema:', err);
        throw new Error('Erro na autenticação do sistema.');
    }
}
export const userController = {

    // Index
    async index(req: Request, res: Response): Promise<void> {
        try {
            const data = await knex('users')
                .select('id', 'name', 'document', 'createdAt', 'updatedAt')
                .orderBy('name');

            res.send({ data });
        } catch (err) {
            res.status(400).json({
                message: 'user.index.nok',
                error: err,
            });
        }
    },

    // Show
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
    // Create
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
        // Validate before creating
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

        const [data]: { id: number }[] = await knex('users')
            .insert({
                name,
                document: doc,
                password: bcrypt.hashSync(password, Number(process.env.SALT))
            })
            .returning('id');

        res.send({ data, message: 'user.create.ok' });
        next();
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
    // Update
    async update(
        req: Request<{ id: string }, any, { name?: string; document?: string; password?: string }>,
        res: Response
    ): Promise<void> {
        const { id } = req.params;
        const { name, document, password } = req.body;

        try {
            let doc = document?.replace(/[.\-]/g, '');

            // Validate document if provided
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

            // Prepare update data
            const updateData: Record<string, any> = {};
            if (name) updateData.name = name;
            if (doc) updateData.document = doc;
            if (password) updateData.password = bcrypt.hashSync(password, Number(process.env.SALT));

            // Update user
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

    // delete
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



