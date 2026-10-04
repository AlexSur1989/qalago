# Prisma generate — pre-deploy prerequisite (Windows)

**Stage:** 6.15L.3 audit

## Observed error

```
EPERM: operation not permitted, rename
'...\node_modules\.prisma\client\query_engine-windows.dll.node.tmpXXXX'
-> '...\node_modules\.prisma\client\query_engine-windows.dll.node'
```

Typical cause: Node/Nest/Prisma/IDE process holding the query engine DLL on Windows.

## Manual remediation (operator / dev)

1. Stop local **catalog-api**, tests, and other Node processes using Prisma Client.
2. Close IDE terminals running watch mode if needed.
3. From `services/catalog-api` (or repo root per project convention):

   ```powershell
   npx prisma validate
   npx prisma generate
   ```

4. Confirm `node_modules/.prisma/client` updated (timestamp).
5. Run focused legal tests / smoke API boot.
6. On staging deploy: run `prisma migrate deploy` then **generate on build agent** (Linux CI often avoids EPERM).

## Status (6.15L.3)

- `prisma validate`: expected PASS when schema committed (6.15L.2 migration present).
- `prisma generate`: **EPERM on Windows dev machine** — treat as **deploy prerequisite**, not legal content blocker.

**Do not** delete arbitrary DLLs or kill unrelated processes without operator approval.
