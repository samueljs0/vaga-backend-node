import { Request, Response } from 'express';
import knex from '../../database';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export const authControllerSystem = {

    async login(req: Request, res: Response): Promise<Response> {
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
            if (codeResp.data?.success && codeResp.data.data?.authCode && codeResp.data.data?.userId) {
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

                if (tokenResp.data?.data) {
                    return res.json({
                        token: tokenResp.data.data.accessToken
                    });
                }
            }
            return res.status(400).json({ message: 'login.nok' });
        } catch (err: any) {
            if (err.response?.data?.error === 'jwt expired') {
                try {
                    const refreshToken = req.body.refresh;
                    interface RefreshResponse {
                        success: boolean;
                        data?: {
                            accessToken: string;
                            refreshToken: string;
                            [key: string]: any;
                        };
                    }
                    const refreshResp = await axios.post<RefreshResponse>('https://compliance-api.cubos.io/auth/refresh', {
                        refreshToken,
                    });
                    if (refreshResp.data?.success && refreshResp.data.data) {
                        return res.json({
                            token: refreshResp.data.data.accessToken
                        });
                    }
                } catch (refreshErr: any) {
                    return res.status(401).json({ message: 'refresh.nok' });
                }
            }
            return res.status(400).json({ message: 'login.error', detail: err.message });
        }
    }
};
