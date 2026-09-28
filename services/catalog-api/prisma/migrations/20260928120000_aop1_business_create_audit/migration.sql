-- AOP.1 — staff catalog create audit action
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'BUSINESS_CREATE';
