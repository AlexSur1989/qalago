-- Stage 5M.4: add SUPER_ADMIN to UserRole enum (must commit before use in next migration)

ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'SUPER_ADMIN';
