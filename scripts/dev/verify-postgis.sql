-- Non-destructive PostGIS verification (Stage 6.11C.5B). No Business table writes.
SELECT version();
SELECT PostGIS_Version();
SELECT extname, extversion FROM pg_extension WHERE extname = 'postgis';
SELECT ST_Distance(
  ST_SetSRID(ST_MakePoint(51.3865, 51.2278), 4326)::geography,
  ST_SetSRID(ST_MakePoint(51.3946096, 51.2224711), 4326)::geography
) AS uralsk_qa_distance_meters;
