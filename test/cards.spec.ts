/**
 * TODO: Este arquivo de testes ainda será atualizado.
 */


import { describe, it, expect, vi, beforeEach } from 'vitest'
import { cardController } from '../src/controllers/cards/cardsControllers'

vi.mock('../src/database', () => {
    const fn: any = vi.fn(() => fn);
    fn.select = vi.fn(() => ({ where: vi.fn().mockReturnThis(), first: vi.fn() }));
    fn.insert = vi.fn(() => ({ returning: vi.fn().mockResolvedValue([{ id: 'card-id' }]) }));
    fn.where = vi.fn().mockReturnThis();
    fn.count = vi.fn(() => Promise.resolve([{ count: 0 }]));
    return { default: fn };
});

import knex from '../src/database'

const mockReq = (body = {}) => ({ body }) as any
const mockRes = () => {
    const res: any = {}
    res.status = vi.fn().mockReturnValue(res)
    res.json = vi.fn().mockReturnValue(res)
    res.send = vi.fn().mockReturnValue(res)
    return res
}

describe('cardController.create', () => {
    beforeEach(() => vi.clearAllMocks())

    it('rejects invalid branch', async () => {
        const req = mockReq({ type: 'virtual', number: '1234 1234 1234 1234', branch: '12', accountId: 'acc-1' })
        const res = mockRes()
        await cardController.create(req, res)
        expect(res.status).toHaveBeenCalledWith(400)
        expect(res.json).toHaveBeenCalledWith({ message: 'card.create.branch.invalid' })
    })

    it('rejects second physical card for same account', async () => {
        ; (knex as any).select = vi.fn(() => ({ where: vi.fn().mockReturnThis(), first: vi.fn().mockResolvedValue({ id: 'existing' }) }))
        const req = mockReq({ type: 'physical', number: '1234 1234 1234 1234', branch: '123', accountId: 'acc-1' })
        const res = mockRes()
        await cardController.create(req, res)
        expect(res.status).toHaveBeenCalledWith(409)
        expect(res.json).toHaveBeenCalledWith({ message: 'card.create.physical.exists' })
    })

    it('creates when valid', async () => {
        ; (knex as any).select = vi.fn(() => ({ where: vi.fn().mockReturnThis(), first: vi.fn().mockResolvedValue(undefined) }))
            ; (knex as any).insert = vi.fn(() => ({ returning: vi.fn().mockResolvedValue([{ id: 'card-id' }]) }))

        const req = mockReq({ type: 'virtual', number: '5179 7447 8594 6978', branch: '512', accountId: 'acc-1' })
        const res = mockRes()
        await cardController.create(req, res)
        expect(res.send).toHaveBeenCalled()
    })
})
