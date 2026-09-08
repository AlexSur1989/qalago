-- Stage 5M.4: preserve legacy ADMIN privilege as SUPER_ADMIN

UPDATE "User"
SET role = 'SUPER_ADMIN'
WHERE role = 'ADMIN';
