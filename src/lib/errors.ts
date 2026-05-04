export class AppError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found") {
    super(message, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(message, 403);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Invalid input") {
    super(message, 400);
  }
}
