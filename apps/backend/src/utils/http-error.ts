/**
 * Error carrying an HTTP status. Throw this from services/controllers; the
 * central error handler turns it into a clean JSON response with the right code.
 */
export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }

  static badRequest(message = 'Bad Request'): HttpError {
    return new HttpError(400, message);
  }

  static unauthorized(message = 'Unauthorized'): HttpError {
    return new HttpError(401, message);
  }

  static forbidden(message = 'Forbidden'): HttpError {
    return new HttpError(403, message);
  }

  static notFound(message = 'Not Found'): HttpError {
    return new HttpError(404, message);
  }

  static badGateway(message = 'Bad Gateway'): HttpError {
    return new HttpError(502, message);
  }
}
