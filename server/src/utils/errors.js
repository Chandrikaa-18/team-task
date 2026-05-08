export class AppError extends Error {
  constructor(status, message, details = null) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function notFound(message = 'Resource not found') {
  return new AppError(404, message);
}

export function forbidden(message = 'You do not have permission to perform this action') {
  return new AppError(403, message);
}

export function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const parsed = schema.safeParse(req[source]);
    if (!parsed.success) {
      next(new AppError(400, 'Validation failed', parsed.error.flatten().fieldErrors));
      return;
    }
    req[source] = parsed.data;
    next();
  };
}
