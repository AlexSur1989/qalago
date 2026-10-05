# Media upload architecture (6.16U.1)

**Status:** Implemented (local storage hardening)
**Audit:** `6.16U.0` — HARDENING REQUIRED BEFORE PUBLIC RELEASE
**Schema:** unchanged (no `MediaObject` table)

## Storage model

- Files: `UPLOAD_DIR` (default `./uploads`) on catalog-api host
- Public HTTP: `GET /uploads/{uuid}.webp` via `ServeStaticModule`
- Consumer/Business/Admin Web rewrite `/uploads/*` to API origin
- **No S3 / presigned uploads** in this stage

## Secure upload pipeline

1. Authenticated `POST /uploads` (multipart `file`) or `POST /users/me/avatar`
2. Authorization + rate limits (business `businessId` or staff `uploadContext=platform-catalog`)
3. `processUploadedImage()` — magic bytes (JPEG/PNG/WebP only), sharp decode, dimension/pixel caps, WebP re-encode (metadata stripped)
4. Store as `{uuid}.webp`
5. DB references via trusted URL validation on **writes**

## Policies

| Context | Max input | Max dimensions | Output |
|---------|-----------|----------------|--------|
| Business gallery / ads | 5 MiB | 4096×4096, 16M px | WebP |
| Avatar | 5 MiB | decode caps | WebP 512×512 cover |
| Category icon (staff) | 2 MiB | 512×512, 256px fit | WebP |

GIF/SVG and other formats are **rejected**.

## Trusted URL policy (writes)

New/updated fields must be canonical **`/uploads/{uuid}.webp`** that **exists** on disk:

- `AttachBusinessImageDto.imageUrl` (attach also allows legacy local `.jpg/.png` **on disk** for pre-hardening blobs)
- `Business.coverImageUrl`, `ServiceItem.imageUrl`, `AdCreative.imageUrl`, `Category.icon`, `Subcategory.icon`

Rejected on write: `javascript:`, `data:`, arbitrary external `http(s)://`, path traversal.

**Read path:** legacy external URLs already in DB continue to render (Consumer Web uses `<img>` fallback for untrusted hosts).

## Authorization

- Business uploads: `businessId` query + `PHOTOS_EDIT`
- Staff catalog icons: `uploadContext=platform-catalog` + staff role + rate limit `upload:staff:{userId}`
- Avatar: session user only

## 6.16U.1A — upload ownership binding

New canonical `/uploads/{uuid}.webp` blobs are **publicly readable** but **not attachable cross-tenant** without proof of upload context.

### Upload receipt (`uploadToken`)

`POST /uploads` returns:

```json
{ "url": "/uploads/{uuid}.webp", "uploadToken": "<signed-receipt>" }
```

Receipt payload (HMAC-SHA256 with `JWT_SECRET`, 15-minute TTL, **single-use** `jti`):

- `url` — must match write/attach target
- `sub` — uploader user id
- `businessId` **or** `uploadContext=platform-catalog`
- consumed `jti` tracked in-memory; Redis `SET NX` when `app.redisUrl` / `REDIS_URL` is configured

**Production note:** For **multi-instance** catalog-api deployments, **Redis is required** for globally consistent single-use receipt enforcement. With in-memory tracking only, a process **restart** clears consumed-`jti` state until tokens expire (up to 15 minutes), so replay protection is best-effort per instance until expiry.

### Where required

- `POST /uploads/business/:businessId` attach (`uploadToken` in body)
- Business-scoped media writes (`coverImageUrl`, `ServiceItem.imageUrl`, `AdCreative.imageUrl`) when setting canonical WebP
- Staff taxonomy icon writes with platform receipt

### Legacy attach

- Existing DB rows keep their URLs on read/unrelated edits.
- **New** attach of legacy local `.jpg/.png` without receipt: allowed only for **platform staff**, or when the **same business** already references that URL; otherwise rejected (blocks cross-business legacy hijack).
- Orphan legacy files on disk cannot be attached by arbitrary businesses.

### Cross-business protection

File existence alone does **not** authorize attach. Business B cannot attach Business A’s canonical URL even if the URL is known (UPLOAD-013 closed for new uploads).

## Deletion and references

Before unlinking a local upload, `countMediaUrlReferences()` checks BusinessImage, Business.coverImageUrl, ServiceItem, AdCreative, Category, Subcategory, User.avatarUrl, Promotion.

## Orphan risk (remaining)

- Multipart upload without subsequent attach still leaves a blob (no scheduled GC in 6.16U.1)
- Abandoned staff uploads mitigated by rate limits, not sweeper

## Static headers

`/uploads` responses include `X-Content-Type-Options: nosniff`.

## Future (6.16U.2+)

- Private object storage, signed GET URLs, `MediaObject` registry, scheduled orphan GC, optional CDN
