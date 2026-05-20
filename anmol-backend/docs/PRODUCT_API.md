# Product & category tRPC API

Base URL: `http://localhost:3001/trpc`

Pricing on every product response:

- `netPrice` — list/MRP price you enter
- `discountPercent` — discount (0–100)
- `sellingPrice` — computed: `netPrice × (1 - discountPercent/100)`

## Categories (`category.*`)

| Procedure | Type | Description |
|-----------|------|-------------|
| `category.list` | query | List categories (`includeInactive`, `search`) |
| `category.getById` | query | `{ id }` |
| `category.getBySlug` | query | `{ slug }` |
| `category.create` | mutation | `{ name, slug?, description?, imageUrl? }` |
| `category.update` | mutation | `{ id, name?, slug?, ... }` |
| `category.delete` | mutation | `{ id, hard? }` — default soft (`isActive: false`) |

## Products (`product.*`)

| Procedure | Type | Description |
|-----------|------|-------------|
| `product.list` | query | Paginated list + filters |
| `product.getById` | query | Full product + variants + images |
| `product.getBySlug` | query | By URL slug |
| `product.create` | mutation | See example below |
| `product.update` | mutation | Partial update |
| `product.delete` | mutation | Soft or hard delete |
| `product.setActive` | mutation | Show/hide on storefront |
| `product.upsertVariant` | mutation | Add/update color-size stock |
| `product.deleteVariant` | mutation | Remove variant |
| `product.adjustStock` | mutation | `{ variantId, delta }` |
| `product.uploadImage` | mutation | `{ dataUri }` → Cloudinary |
| `product.addImage` | mutation | Attach URL to product |
| `product.removeImage` | mutation | Remove DB row (+ optional Cloudinary delete) |

### Product kinds

- **`SAREE`** — variants: **color only**. Optional `allowsExtraSaya` + `extraSayaPrice` (customer can add extra saya piece at checkout later).
- **`STANDARD`** — variants: **color + size** (`M` | `L` | `XL` | `XXL`).

### Create saree example

```json
{
  "name": "Banarasi Silk Saree",
  "categoryId": "<category-id>",
  "kind": "SAREE",
  "netPrice": 4999,
  "discountPercent": 10,
  "allowsExtraSaya": true,
  "extraSayaPrice": 450,
  "variants": [
    { "color": "Red", "stockQty": 5 },
    { "color": "Maroon", "stockQty": 3 }
  ]
}
```

### Create kurti example

```json
{
  "name": "Cotton Kurti",
  "categoryId": "<category-id>",
  "kind": "STANDARD",
  "netPrice": 1299,
  "discountPercent": 15,
  "variants": [
    { "color": "Blue", "size": "M", "stockQty": 10 },
    { "color": "Blue", "size": "L", "stockQty": 8 }
  ]
}
```

## Staff roles

`User.role` is `ADMIN` or `STAFF`. JWT login to be wired on `staffProcedure` next.

## Cloudinary

Add to `anmol-backend/.env`:

```
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

Upload flow: `product.uploadImage` → `product.addImage` with returned `url` and `publicId`.
