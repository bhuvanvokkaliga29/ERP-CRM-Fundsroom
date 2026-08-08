import { Request, Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  message: string = 'Operation completed successfully',
  statusCode: number = 200
): void {
  res.status(statusCode).json({
    success: true,
    data,
    message,
  } as ApiResponse<T>);
}

export function sendCreated<T>(res: Response, data: T, message: string = 'Created successfully'): void {
  sendSuccess(res, data, message, 201);
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  pagination: { page: number; limit: number; total: number },
  message?: string
): void {
  res.status(200).json({
    success: true,
    data,
    pagination: {
      ...pagination,
      pages: Math.ceil(pagination.total / pagination.limit),
    },
    message,
  } as ApiResponse<T[]>);
}

export function sendNoContent(res: Response): void {
  res.status(204).send();
}

export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: Record<string, unknown>
): void {
  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details,
    },
  } as ApiResponse);
}

export function parsePaginationQuery(query: Request['query']): {
  page: number;
  limit: number;
  skip: number;
} {
  const page = Math.max(1, parseInt(query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit as string) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function parseSortQuery(
  query: Request['query'],
  allowedFields: string[]
): { field: string; order: 'asc' | 'desc' } | undefined {
  const sortBy = query.sortBy as string;
  const sortOrder = (query.sortOrder as string)?.toLowerCase();

  if (sortBy && allowedFields.includes(sortBy)) {
    return {
      field: sortBy,
      order: sortOrder === 'desc' ? 'desc' : 'asc',
    };
  }
  return undefined;
}
