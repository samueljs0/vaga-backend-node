export function parsePagination(qs: any) {
    // Accept new names: itemsPerPage, currentPage. Fallback to legacy: limit, page.
    const rawPage = qs?.currentPage ?? qs?.page ?? undefined;
    const rawLimit = qs?.itemsPerPage ?? qs?.limit ?? undefined;

    const page = rawPage !== undefined ? Number(rawPage) : 1;
    const limit = rawLimit !== undefined ? Number(rawLimit) : 10;

    const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
    const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 100) : 10;
    const offset = (safePage - 1) * safeLimit;
    return { page: safePage, limit: safeLimit, offset };
}

export function makeMeta(total: number, page: number, limit: number) {
    const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;
    return { total, page, perPage: limit, totalPages };
}
