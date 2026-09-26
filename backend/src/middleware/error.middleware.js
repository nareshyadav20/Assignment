import { AppError } from '../utils/errors.js';
import { env } from '../config/env.js';

export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errors = err.details || null;

  // Handle Prisma Known Request Errors
  if (err.code) {
    switch (err.code) {
      case 'P2002': {
        statusCode = 409;
        const target = err.meta?.target ? ` (${err.meta.target.join(', ')})` : '';
        message = `A resource with this identifier already exists${target}.`;
        break;
      }
      case 'P2025':
        statusCode = 404;
        message = 'The requested resource was not found.';
        break;
      case 'P2003':
        statusCode = 400;
        message = 'Invalid reference: Foreign key constraint violation.';
        break;
      default:
        break;
    }
  }

  // Handle JSON Syntax Error in Body
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    message = 'Malformed JSON in request body.';
  }

  // Log server errors (500) for debugging
  if (statusCode >= 500) {
    console.error('💥 [Server Error]:', {
      method: req.method,
      url: req.originalUrl,
      tenantId: req.tenantId || 'unauthenticated',
      userId: req.user?.id || 'unauthenticated',
      error: err.stack || err.message,
    });
  }

  const response = {
    success: false,
    message,
    ...(errors && { errors }),
    ...(env.NODE_ENV === 'development' && statusCode >= 500 && { stack: err.stack }),
  };

  res.status(statusCode).json(response);
};
