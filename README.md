# Portfolio Jobs API

A small REST API for sample job listings. It includes query and type filters, pagination, request validation, health checks, tests, and Docker deployment configuration.

## Run locally

Requires Node.js 20 or newer. No third-party packages are needed.

```bash
npm test
npm start
```

Then open `http://localhost:3000/health` or `http://localhost:3000/api/v1/jobs?q=remote&page=1&limit=10`.

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Process health check |
| GET | `/api/v1/jobs?q=engineer&type=Full-time&page=1&limit=10` | Search and paginate listings |
| GET | `/api/v1/jobs/:id` | Read one listing |
| POST | `/api/v1/jobs` | Validate and add a listing |

POST JSON example:

```json
{"title":"API Engineer","company":"Example Co","location":"Remote","type":"Full-time","tags":["Node.js","REST"]}
```

The in-memory dataset resets on restart. This is a learning/demo service, not a production job board. A production version needs persistent storage, authentication and authorization for writes, rate limiting, structured logging, monitoring, and a privacy/security review.

## Deploy

The included Dockerfile and `render.yaml` provide a starting point for a Render Web Service. Push this folder to a Git repository, connect the repository in Render, and deploy from the folder root. `PORT` is read from the environment and `/health` is configured as the health-check route. Verify the provider's current runtime and plan details before deployment.

The API has a small open CORS policy for portfolio demos; restrict allowed origins before using it with real users.
