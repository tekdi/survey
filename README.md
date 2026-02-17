# Survey Service

Multi-tenant survey service with media upload support, built with NestJS + TypeORM + PostgreSQL.

## Features

- **Survey CRUD** — Create, update, publish, close, duplicate, and delete surveys
- **Sections & Fields** — Organize surveys into sections with configurable field types (20+ types including media uploads)
- **Response Management** — Start, save progress, submit, and validate survey responses
- **Media Upload** — Image and video uploads with processing, thumbnails, presigned URLs
- **Multi-tenancy** — Row Level Security (RLS) with tenant isolation
- **Storage** — S3, MinIO, or local file storage with configurable quotas
- **Security** — Virus scanning integration, file validation, rate limiting

## Quick Start

### With Docker Compose (recommended)

```bash
cp .env.example .env
docker-compose up -d
```

The API will be available at `http://localhost:3000/api/v1` and Swagger docs at `http://localhost:3000/docs`.

### Manual Setup

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your database credentials

# Run the migration
psql -U postgres -d survey_service -f src/database/migrations/001_initial_schema.sql

# Start in development mode
npm run start:dev
```

## Project Structure

```
src/
├── config/                     # Configuration modules (app, database, storage, auth, redis)
├── common/                     # Shared utilities
│   ├── decorators/             # @Tenant, @CurrentUser
│   ├── guards/                 # AuthGuard, TenantGuard
│   ├── filters/                # GlobalExceptionFilter
│   ├── interceptors/           # TransformInterceptor
│   └── dto/                    # PaginationDto
├── database/
│   ├── migrations/             # SQL migrations
│   └── database.module.ts
├── modules/
│   ├── tenant/                 # Tenant management + storage quotas
│   ├── survey/                 # Survey CRUD (surveys, sections, fields)
│   ├── response/               # Response collection + validation
│   ├── storage/                # S3/MinIO/local storage abstraction
│   └── file-upload/            # Media upload, processing, virus scanning
├── app.module.ts
└── main.ts
```

## API Endpoints

### Surveys
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /surveys | Create survey |
| GET | /surveys | List surveys (paginated) |
| GET | /surveys/:id | Get survey with sections & fields |
| PUT | /surveys/:id | Update survey |
| POST | /surveys/:id/publish | Publish draft survey |
| POST | /surveys/:id/close | Close published survey |
| POST | /surveys/:id/duplicate | Duplicate survey |
| DELETE | /surveys/:id | Delete survey |

### Responses
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /surveys/:id/responses | Start response |
| GET | /surveys/:id/responses | List responses |
| GET | /surveys/:id/responses/stats | Response statistics |
| GET | /surveys/:id/responses/:rid | Get response |
| PUT | /surveys/:id/responses/:rid | Update (partial save) |
| POST | /surveys/:id/responses/:rid/submit | Submit response |

### File Uploads
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /surveys/:id/files/upload | Upload image/video |
| GET | /surveys/:id/files/:fid | Get file metadata |
| GET | /surveys/:id/files/:fid/url | Get presigned URL |
| DELETE | /surveys/:id/files/:fid | Soft delete file |

## Configuration

All configuration is managed through environment variables (see `.env.example`). Key settings:

- **Storage provider**: `STORAGE_PROVIDER` — `local`, `s3`, or `minio`
- **File limits**: `MAX_IMAGE_SIZE_MB`, `MAX_VIDEO_SIZE_MB`
- **Virus scanning**: `VIRUS_SCAN_ENABLED`, `CLAMAV_ENDPOINT`
- **Rate limiting**: `THROTTLE_TTL`, `THROTTLE_LIMIT`

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: NestJS 10
- **ORM**: TypeORM 0.3
- **Database**: PostgreSQL 16
- **Storage**: S3 / MinIO / Local
- **Queue**: Bull (Redis-backed) — for async file processing
- **Image Processing**: Sharp
- **Docs**: Swagger/OpenAPI
