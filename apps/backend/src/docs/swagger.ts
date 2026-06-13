import swaggerUi from 'swagger-ui-express';

import { openApiSpec } from './openapi.js';

/** Swagger UI middleware for /api/docs. */
export const swaggerServe = swaggerUi.serve;
export const swaggerSetup = swaggerUi.setup(openApiSpec as swaggerUi.JsonObject, {
  customSiteTitle: 'PR Intelligence API',
});
