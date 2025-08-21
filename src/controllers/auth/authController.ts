import { Request, Response } from 'express';
import knex from '../../database';
import jwt from 'jsonwebtoken';
import { compare } from 'bcrypt';

interface User {
    id: number;
    name: string;
    document: string;
    password: string;
}

export const authController = {
    /**
     * Realiza o login do usuário.
     * Gera tokens JWT e refresh, salva o refresh no banco.
     */
    async login(req: Request, res: Response): Promise<Response> {
        try {
            const { document, password } = req.body;

            // Busca usuário pelo documento
            const user: User | undefined = await knex<User>('users')
                .select('id', 'name', 'document', 'password')
                .where('document', document)
                .first();

            if (!user) {
                return res.status(400).json({ message: 'user.notfound' });
            }

            // Verifica senha
            const isMatch = await compare(password, user.password);

            if (!isMatch) {
                return res.status(400).json({ message: 'login.nok' });
            }

            // Remove senha do objeto do usuário
            const { password: _, ...userData } = user;

            // Gera token de acesso
            const token = jwt.sign(
                userData,
                process.env.TOKEN_SECRET as string,
                {
                    expiresIn: process.env.TOKEN_LIFE as jwt.SignOptions['expiresIn'],
                }
            );

            // Gera refresh token
            const refresh_token = jwt.sign(
                userData,
                process.env.REFRESH_SECRET as string,
                {
                    expiresIn: process.env.REFRESH_LIFE as jwt.SignOptions['expiresIn'],
                }
            );

            // Remove refresh tokens antigos do usuário
            await knex('token').where({ userId: user.id }).del();

            // Salva novo refresh token
            await knex('token').insert({
                userId: user.id,
                token: refresh_token,
            });

            return res.json({ token, refresh_token, message: 'login.ok' });
        } catch (err: any) {
            // Retorna erro detalhado
            return res.status(400).json({
                message: 'login.error',
                detail: {
                    code: err.code,
                    message: err.detail,
                    constraint: err.constraint?.replaceAll('_', '.'),
                    type: typeof err,
                },
            });
        }
    },

    /**
     * Realiza o refresh do token de acesso usando o refresh token.
     */
    async refresh(req: Request, res: Response): Promise<Response> {
        try {
            const { refresh_token } = req.body;

            // Busca refresh token no banco
            const tokenRecord = await knex('token')
                .select()
                .where({ token: refresh_token })
                .first();

            if (!refresh_token || !tokenRecord) {
                return res.json({ message: 'user.refresh.nok' });
            }

            // Verifica validade do refresh token
            let decoded: any;
            try {
                jwt.verify(tokenRecord.token, process.env.REFRESH_SECRET as string);
                decoded = jwt.decode(tokenRecord.token) as jwt.JwtPayload;
            } catch (err) {
                if (err instanceof jwt.TokenExpiredError) {
                    return res.status(401).send({ message: 'user.refresh.expired' });
                }
                return res.status(400).json({ message: 'user.refresh.error' });
            }

            // Remove campos iat e exp do payload
            if (decoded) {
                delete decoded.iat;
                delete decoded.exp;
            }

            // Gera novo token de acesso
            const token = jwt.sign(
                { ...decoded },
                process.env.TOKEN_SECRET as string,
                { expiresIn: process.env.TOKEN_LIFE as jwt.SignOptions['expiresIn'] }
            );

            return res.json({
                token,
                refresh_token,
                message: 'user.refresh.ok'
            });
        } catch (err: any) {
            if (err instanceof jwt.TokenExpiredError) {
                return res.status(401).send({ message: 'user.refresh.expired' });
            }
            return res.status(400).json({ message: 'user.refresh.error' });
        }
    },

    /**
     * Realiza o logout do usuário, removendo o refresh token do banco.
     */
    async logout(req: Request, res: Response): Promise<Response> {
        const { refresh_token } = req.body;

        try {
            await knex('token').where({ token: refresh_token }).del();
            return res.status(200).send({ message: 'user.registration.delete.ok' });
        } catch (err: any) {
            return res.status(500).send({
                message: 'user.registration.delete.error',
                detail: err.message
            });
        }
    },

    /**
     * Middleware para validar o token JWT de acesso.
     */
    async auth(req: Request, res: Response, next: Function): Promise<Response | void> {
        // Test shortcut: when running tests we may want to bypass real JWT
        // verification. Set TEST_BYPASS_AUTH=1 in the test environment to
        // allow requests to be treated as authenticated with a fake user.
        if (process.env.TEST_BYPASS_AUTH === '1') {
            (req as any).user = { id: 1 };
            return next();
        }

        const authHeader = (req.headers.authorization || req.headers.Authorization) as string | undefined;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                message: 'authorization.required',
                detail: 'Use Authorization: Bearer <token>'
            });
        }

        const token = authHeader.slice(7).trim();

        try {
            // Verifica JWT e adiciona payload ao req.user
            (req as any).user = jwt.verify(token, process.env.TOKEN_SECRET as string);
            return next();
        } catch (err: any) {
            if (err instanceof jwt.TokenExpiredError) {
                return res.status(401).send({ expired: true, message: 'authorization.expired' });
            }
            return res.status(401).send({ message: 'authorization.fail' });
        }
    }
};
