export class BaseError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public errors?: any[]
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends BaseError {
  constructor(message: string = 'Resource not found') {
    super(404, message);
  }
}

export class ValidationError extends BaseError {
  constructor(message: string = 'Validation failed', errors?: any[]) {
    super(400, message, errors);
  }
}

export class UnauthorizedError extends BaseError {
  constructor(message: string = 'Unauthorized') {
    super(401, message);
  }
}

export class ForbiddenError extends BaseError {
  constructor(message: string = 'Forbidden') {
    super(403, message);
  }
}

export class ConflictError extends BaseError {
  constructor(message: string = 'Resource conflict') {
    super(409, message);
  }
} 