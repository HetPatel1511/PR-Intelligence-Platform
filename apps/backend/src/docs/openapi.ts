/**
 * Hand-written OpenAPI 3 description of the API, served via Swagger UI at
 * /api/docs. Kept in one place so it evolves alongside the routes.
 */
import { env } from '../config/env.js';

const repositoryIdParam = {
  name: 'repositoryId',
  in: 'path',
  required: true,
  schema: { type: 'string' },
} as const;

const paginationParams = [
  { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
  {
    name: 'pageSize',
    in: 'query',
    schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
  },
] as const;

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'PR Intelligence Platform API',
    version: '0.1.0',
    description:
      'Connect GitHub repositories, sync pull-request data, and read engineering quality metrics. ' +
      'All endpoints except the OAuth flow require the session cookie issued at login.',
  },
  servers: [{ url: `http://localhost:${env.PORT}/api`, description: 'Local' }],
  tags: [
    { name: 'Auth' },
    { name: 'Repositories' },
    { name: 'Pull Requests' },
    { name: 'Engineers' },
    { name: 'Metrics' },
  ],
  security: [{ cookieAuth: [] }],
  paths: {
    '/auth/github': {
      get: {
        tags: ['Auth'],
        summary: 'Start GitHub OAuth',
        security: [],
        responses: { '302': { description: 'Redirect to GitHub' } },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Current user',
        responses: {
          '200': { description: 'The authenticated user' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Refresh session',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/auth/logout': {
      post: { tags: ['Auth'], summary: 'Log out', responses: { '200': { description: 'OK' } } },
    },
    '/repositories': {
      get: {
        tags: ['Repositories'],
        summary: 'List connected repositories',
        parameters: [
          ...paginationParams,
          { name: 'search', in: 'query', schema: { type: 'string' } },
          {
            name: 'sortBy',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['fullName', 'lastSyncedAt', 'createdAt'],
              default: 'fullName',
            },
          },
          {
            name: 'sortOrder',
            in: 'query',
            schema: { type: 'string', enum: ['asc', 'desc'], default: 'asc' },
          },
        ],
        responses: {
          '200': {
            description: 'Paginated repositories',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/Repository' } },
                    pagination: { $ref: '#/components/schemas/Pagination' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/repositories/sync': {
      post: {
        tags: ['Repositories'],
        summary: 'Refresh repository list from GitHub',
        responses: { '200': { description: 'Synced repositories' } },
      },
    },
    '/repositories/{repositoryId}': {
      get: {
        tags: ['Repositories'],
        summary: 'Get a repository',
        parameters: [repositoryIdParam],
        responses: {
          '200': { description: 'Repository' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/repositories/{repositoryId}/sync': {
      post: {
        tags: ['Repositories'],
        summary: 'Historical pull-request sync for a repository',
        parameters: [repositoryIdParam],
        responses: {
          '202': { description: 'Sync result' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/repositories/{repositoryId}/pull-requests': {
      get: {
        tags: ['Pull Requests'],
        summary: 'List pull requests in a repository',
        parameters: [
          repositoryIdParam,
          ...paginationParams,
          {
            name: 'status',
            in: 'query',
            schema: { type: 'string', enum: ['OPEN', 'CLOSED', 'MERGED'] },
          },
          { name: 'authorId', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          {
            name: 'sortBy',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['number', 'createdAt', 'mergedAt', 'updatedAt'],
              default: 'number',
            },
          },
          {
            name: 'sortOrder',
            in: 'query',
            schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
          },
        ],
        responses: { '200': { description: 'Paginated pull requests' } },
      },
    },
    '/pull-requests/{id}': {
      get: {
        tags: ['Pull Requests'],
        summary: 'Pull request detail with metrics',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Pull request detail' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/repositories/{repositoryId}/engineers': {
      get: {
        tags: ['Engineers'],
        summary: 'Engineers active in a repository, with metrics',
        parameters: [repositoryIdParam],
        responses: { '200': { description: 'Engineers with metrics' } },
      },
    },
    '/engineers/{id}': {
      get: {
        tags: ['Engineers'],
        summary: 'Engineer profile',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Engineer' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/repositories/{repositoryId}/metrics/summary': {
      get: {
        tags: ['Metrics'],
        summary: 'Dashboard summary rollup',
        parameters: [repositoryIdParam],
        responses: { '200': { description: 'Dashboard summary' } },
      },
    },
    '/repositories/{repositoryId}/metrics/pull-requests': {
      get: {
        tags: ['Metrics'],
        summary: 'Per-pull-request metrics',
        parameters: [repositoryIdParam],
        responses: { '200': { description: 'PR metrics' } },
      },
    },
    '/repositories/{repositoryId}/metrics/engineers': {
      get: {
        tags: ['Metrics'],
        summary: 'Per-engineer metrics',
        parameters: [repositoryIdParam],
        responses: { '200': { description: 'Engineer metrics' } },
      },
    },
  },
  components: {
    securitySchemes: {
      cookieAuth: { type: 'apiKey', in: 'cookie', name: 'token' },
    },
    schemas: {
      Pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer' },
          pageSize: { type: 'integer' },
          total: { type: 'integer' },
          totalPages: { type: 'integer' },
        },
      },
      Repository: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          githubId: { type: 'string' },
          owner: { type: 'string' },
          name: { type: 'string' },
          fullName: { type: 'string' },
          isPrivate: { type: 'boolean' },
          lastSyncedAt: { type: 'string', nullable: true, format: 'date-time' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Error: {
        type: 'object',
        properties: { error: { type: 'string' } },
      },
    },
    responses: {
      Unauthorized: {
        description: 'Missing or invalid session',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      Forbidden: {
        description: 'Authenticated but not allowed',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      NotFound: {
        description: 'Resource not found',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
    },
  },
} as const;
