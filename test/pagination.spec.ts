/**
 * TODO: Este arquivo de testes ainda será atualizado.
 */


import { describe, it, expect } from 'vitest'
import { parsePagination, makeMeta } from '../src/utils/pagination'

describe('pagination util', () => {
    it('defaults to itemsPerPage=10 and currentPage=1', () => {
        const { page, limit, offset } = parsePagination({})
        expect(page).toBe(1)
        expect(limit).toBe(10)
        expect(offset).toBe(0)
    })

    it('accepts itemsPerPage and currentPage', () => {
        const { page, limit, offset } = parsePagination({ itemsPerPage: '2', currentPage: '2' })
        expect(page).toBe(2)
        expect(limit).toBe(2)
        expect(offset).toBe(2)
    })

    it('falls back to legacy page/limit', () => {
        const { page, limit, offset } = parsePagination({ page: '3', limit: '5' })
        expect(page).toBe(3)
        expect(limit).toBe(5)
        expect(offset).toBe(10)
    })

    it('makeMeta computes totalPages correctly', () => {
        const meta = makeMeta(30, 2, 10)
        expect(meta.total).toBe(30)
        expect(meta.page).toBe(2)
        expect(meta.perPage).toBe(10)
        expect(meta.totalPages).toBe(3)
    })
})
