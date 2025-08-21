import { Request, Response } from 'express';
import knex from '../../database';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Controller responsável pela autenticação no sistema.
 */
export const authControllerSystem = {

    /**
     * Realiza o login do usuário utilizando as credenciais do sistema.
     * Caso o token expire, tenta realizar o refresh do token.
     */
    async login(req: Request, res: Response): Promise<Response> {
        try {
            // Dados de login obtidos das variáveis de ambiente
            const apiLogin = {
                email: process.env.CON_USER_EMAIL,
                password: process.env.CON_USER_PASSWORD,
            };

            // Interface da resposta do endpoint de código de autenticação
            interface CodeResponse {
                success: boolean;
                data?: {
                    authCode?: string;
                    userId?: string;
                };
            }

            // Solicita o código de autenticação
            const codeResp = await axios.post<CodeResponse>('https://compliance-api.cubos.io/auth/code', apiLogin);

            // Verifica se o código de autenticação foi obtido com sucesso
            if (codeResp.data?.success && codeResp.data.data?.authCode && codeResp.data.data?.userId) {

                // Interface da resposta do endpoint de token
                interface TokenResponse {
                    success: boolean;
                    data?: {
                        accessToken: string;
                        refreshToken: string;
                        [key: string]: any;
                    };
                }

                // Solicita o token de acesso usando o código de autenticação
                const tokenResp = await axios.post<TokenResponse>('https://compliance-api.cubos.io/auth/token', {
                    authCode: codeResp.data.data.authCode,
                });

                // Retorna o token de acesso se obtido com sucesso
                if (tokenResp.data?.data) {
                    return res.json({
                        token: tokenResp.data.data.accessToken
                    });
                }
            }

            // Retorna erro caso o login não seja bem-sucedido
            return res.status(400).json({ message: 'login.nok' });

        } catch (err: any) {
            // Caso o token esteja expirado, tenta realizar o refresh
            if (err.response?.data?.error === 'jwt expired') {
                try {
                    const refreshToken = req.body.refresh;

                    // Interface da resposta do endpoint de refresh
                    interface RefreshResponse {
                        success: boolean;
                        data?: {
                            accessToken: string;
                            refreshToken: string;
                            [key: string]: any;
                        };
                    }

                    // Solicita novo token usando o refresh token
                    const refreshResp = await axios.post<RefreshResponse>('https://compliance-api.cubos.io/auth/refresh', {
                        refreshToken,
                    });

                    // Retorna o novo token de acesso se obtido com sucesso
                    if (refreshResp.data?.success && refreshResp.data.data) {
                        return res.json({
                            token: refreshResp.data.data.accessToken
                        });
                    }
                } catch (refreshErr: any) {
                    // Retorna erro caso o refresh falhe
                    return res.status(401).json({ message: 'refresh.nok' });
                }
            }

            // Retorna erro genérico de login
            return res.status(400).json({ message: 'login.error', detail: err.message });
        }
    }
};
