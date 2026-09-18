-- Stage 6.11C.5B: PostGIS extension only (no application spatial columns until C.5C).
-- Requires PostgreSQL 16 with PostGIS packages (see infra/docker PostGIS image).
CREATE EXTENSION IF NOT EXISTS postgis;
