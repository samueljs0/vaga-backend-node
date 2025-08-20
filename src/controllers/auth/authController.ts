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
    async login(req: Request, res: Response): Promise<Response> {
        try {
            const { document, password } = req.body;

            const user: User | undefined = await knex<User>('users')
                .select('id', 'name', 'document', 'password')
                .where('document', document)
                .first();

            if (!user) {
                return res.status(400).json({ message: 'user.notfound' });
            }
            const isMatch = await compare(password, user.password);

            if (isMatch) {
                const { password: _, ...userData } = user;


                                const token = jwt.sign(
                                    userData,
                                    process.env.TOKEN_SECRET as string,
                                    {
                                        expiresIn: process.env.TOKEN_LIFE as jwt.SignOptions['expiresIn'],
                                    }
                                );

                                const refresh_token = jwt.sign(
                                    userData,
                                    process.env.REFRESH_SECRET as string,
                                    {
                                        expiresIn: process.env.REFRESH_LIFE as jwt.SignOptions['expiresIn'],
                                    }
                                );

                await knex('token').where({ user_id: user.id }).del();

                await knex('token').insert({
                    user_id: user.id,
                    token: refresh_token,
                });

                return res.json({ token, refresh_token, message: 'login.ok' });
            } else {

                return res.status(400).json({ message: 'login.nok' });
            }
        } catch (err: any) {
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
    // Refresh
    async refresh(req: Request, res: Response): Promise<Response> {
        try {
            const { refresh_token } = req.body;

            const tokenRecord = await knex('token')
                .select()
                .where({ token: refresh_token })
                .first();

            if (refresh_token && tokenRecord) {
                // Verify and decode the refresh token
                let decoded: any;
                try {
                    jwt.verify(tokenRecord.token, process.env.REFRESH_SECRET as string);
                    decoded = jwt.decode(tokenRecord.token) as jwt.JwtPayload;
                } catch (err) {
                    if (err instanceof jwt.TokenExpiredError) {
                        return res.status(401).send({
                            message: 'user.refresh.expired'
                        });
                    }
                    return res.status(400).json({
                        message: 'user.refresh.error'
                    });
                }

                // Remove iat and exp from decoded payload
                if (decoded) {
                    delete decoded.iat;
                    delete decoded.exp;
                }

                // Generate new access token
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
            } else {
                return res.json({
                    message: 'user.refresh.nok'
                });
            }
        } catch (err: any) {
            if (err instanceof jwt.TokenExpiredError) {
                return res.status(401).send({
                    message: 'user.refresh.expired'
                });
            }
            return res.status(400).json({
                message: 'user.refresh.error'
            });
        }
    },

    // Logout
    async logout(req: Request, res: Response): Promise<Response> {
        const { refresh_token } = req.body;

        try {
            await knex('token').where({ token: refresh_token }).del();
            return res.status(200).send({
                message: 'user.registration.delete.ok'
            });
        } catch (err: any) {
            return res.status(500).send({
                message: 'user.registration.delete.error',
                detail: err.message
            });
        }
    },

    // Auth validate
    async auth(req: Request, res: Response, next: Function): Promise<Response | void> {
        const { authorization } = req.headers;
        if (!authorization) {
            return res.status(401).json({
                message: 'authorization.required'
            });
        }

        try {
            // Verified token JWT validate
            (req as any).user = jwt.verify(authorization, process.env.TOKEN_SECRET as string);
        } catch (err: any) {
            if (err instanceof jwt.TokenExpiredError) {
                return res.status(401).send({
                    expired: true,
                    message: 'authorization.expired'
                });
            }
            return res.status(401).send({
                message: 'authorization.fail'
            });
        }

        next();
    }
};
