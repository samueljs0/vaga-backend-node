/**
 * TODO: Este arquivo de testes ainda será atualizado.
 */



import { describe, it, expect, vi, beforeEach } from 'vitest'
import { accountController } from '../src/controllers/account/accountControllers'

// We'll mock knex used inside the controller
vi.mock('../src/database', () => {
    const fn: any = vi.fn(() => fn);
    fn.select = vi.fn(() => ({ where: vi.fn().mockReturnThis(), first: vi.fn() }));
    fn.insert = vi.fn(() => ({ returning: vi.fn().mockResolvedValue([{ id: 'new-id' }]) }));
    fn.where = vi.fn().mockReturnThis();
    fn.count = vi.fn(() => Promise.resolve([{ count: 0 }]));
    return { default: fn };
});

import knex from '../src/database'

const mockReq = (body = {}, user = { id: 'user-1' } as any) => ({ body, user }) as any
const mockRes = () => {
    const res: any = {}
    res.status = vi.fn().mockReturnValue(res)
    res.json = vi.fn().mockReturnValue(res)
    res.send = vi.fn().mockReturnValue(res)
    return res
}

describe('accountController.create', () => {
    beforeEach(() => vi.clearAllMocks())

    it('rejects invalid branch', async () => {
        const req = mockReq({ branch: '01', account: '1234567-1' })
        const res = mockRes()
        await accountController.create(req, res)
        expect(res.status).toHaveBeenCalledWith(400)
        expect(res.json).toHaveBeenCalledWith({ message: 'account.create.branch.invalid' })
    })

    it('rejects invalid account mask', async () => {
        const req = mockReq({ branch: '001', account: '1234' })
        const res = mockRes()
        await accountController.create(req, res)
        expect(res.status).toHaveBeenCalledWith(400)
        expect(res.json).toHaveBeenCalledWith({ message: 'account.create.account.invalid' })
    })

    it('creates when valid', async () => {
        // make sure uniqueness check returns falsy
        ; (knex as any).select = vi.fn(() => ({ where: vi.fn().mockReturnThis(), first: vi.fn().mockResolvedValue(undefined) }))
            ; (knex as any).insert = vi.fn(() => ({ returning: vi.fn().mockResolvedValue([{ id: 'new-id' }]) }))

        const req = mockReq({ branch: '001', account: '1234567-1' })
        const res = mockRes()
        await accountController.create(req, res)

        expect(res.send).toHaveBeenCalled()
    })
})
