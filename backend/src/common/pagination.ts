export interface PaginationParams {
  page: number;
  limit: number;
}

export const parsePagination = ({ page, limit }: PaginationParams) => ({
  skip: (page - 1) * limit,
  take: limit,
});

export interface PaginatedMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const buildMeta = (page: number, limit: number, total: number): PaginatedMeta => ({
  page,
  limit,
  total,
  totalPages: Math.max(1, Math.ceil(total / limit)),
});
