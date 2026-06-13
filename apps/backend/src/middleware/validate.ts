import type { Request, RequestHandler, Response } from 'express';
import { ZodError, type ZodTypeAny } from 'zod';

import { HttpError } from '../utils/http-error.js';

interface RequestSchemas {
  params?: ZodTypeAny;
  query?: ZodTypeAny;
  body?: ZodTypeAny;
}

/**
 * Validates `params`/`query`/`body` against Zod schemas. Parsed (and coerced)
 * values are stashed on `res.locals` so handlers read typed, sanitized data via
 * `getValidated`. A schema failure becomes a 400 with a readable message.
 */
export function validate(schemas: RequestSchemas): RequestHandler {
  return (req: Request, res: Response, next) => {
    try {
      if (schemas.params) res.locals.params = schemas.params.parse(req.params);
      if (schemas.query) res.locals.query = schemas.query.parse(req.query);
      if (schemas.body) res.locals.body = schemas.body.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        next(HttpError.badRequest(formatZodError(err)));
      } else {
        next(err);
      }
    }
  };
}

/** Typed accessor for values placed on `res.locals` by `validate`. */
export function getValidated<T>(res: Response, key: keyof RequestSchemas): T {
  return res.locals[key] as T;
}

function formatZodError(error: ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.join('.');
      return path ? `${path}: ${issue.message}` : issue.message;
    })
    .join('; ');
}
