# Remediation log

**Date:** 2026-08-14  
**Scope:** Critical → High/Medium hardening for Oilix oil-sales, cash, auth, stock.

## Critical (prior pass)

| ID | Fix |
|----|-----|
| C1 | Cancel uses `FOR UPDATE` + `updateMany` claim (`status=COMPLETED→CANCELLED`); only winner restores stock/cash |
| C2 | Cash open season-scopes OPEN sessions; stale other-season OPEN auto-closed at expected cash |
| C3 | Payment create locks receivable row before applying amount |
| C4 | Production JWT secret hardening / fail-fast when default |

## High (prior + this pass)

| ID | Fix |
|----|-----|
| H1 | Cancel blocked when cash session is CLOSED (prevents expectedCash drift) |
| H2 | `listSales` / dashboard today scoped by device register unless `VIEW_ALL` |
| H3 | Create sale requires `OIL_SALES_SALES_CREATE` |
| H4 | Receipt `findSale` supports `ignoreSeason` so UUID receipt never 404s cross-season |
| H5 | Login rate limit (8 / 15 min / ip+user); extracted to `login-rate-limit.ts` + unit tests |
| H6 | Seasons list/context accept `OIL_SALES_ACCESS` via `RequireAnyPermissions` |
| H7 | Mill dashboard gated by `OLIVE_READ` |
| H8–H9 | Cash `presentSession` / `findSession` IDOR + difference visibility tightened |
| H10 | Oil stock adjust updates **theoreticalQty only** (no `totalSold` contamination); `computeStockSummary` prefers stored theoretical |
| H11 | Filtration: loading UI + `/auth/me` hydrate (no white screen) |
| H12 | Device enable requires cash register when workspace includes sales |
| H13 | Sale create UX double-submit guard on web |
| H14 | Partial unique index `cash_register_sessions_one_open_*` + advisory lock |

## Medium / follow-ups this pass

| Item | Fix |
|------|-----|
| Container adjust contamination | Same pattern as oil: `adjustContainerStock` no longer increments `totalAdded`; `computeContainerStockSummary` accepts stored `theoreticalQty`; dashboard/list pass it |
| Cash register CRUD | API `POST/PATCH /oil-sales/cash/registers` + `GET ?all=1`; UI `CashRegistersAdmin` on `/sales/devices` |
| Web math duplicate | None — web does not ship `oil-sales.math`; API remains source of truth |
| Permission catalog | `OIL_SALES_SALES_CREATE` present in api + web catalogs; create sale UI gated |
| History scoped list | `/sales/history` uses `/oil-sales/sales` which applies register scope |
| Tests | `login-rate-limit.spec.ts`, `cancel-claim.concurrency.spec.ts`, container theoreticalQty math case |

## Files touched (this hardening wave)

### API
- `api/src/modules/oil-sales/oil-sales.math.ts` — container summary prefers stored theoretical
- `api/src/modules/oil-sales/oil-sales.math.spec.ts` — adjustment regression case
- `api/src/modules/oil-sales/oil-sales.service.ts` — pass theoreticalQty; fix container adjust
- `api/src/modules/oil-sales/cash-register.service.ts` — create/update/list(all)
- `api/src/modules/oil-sales/oil-sales.controller.ts` — register CRUD routes
- `api/src/modules/devices/dto/devices.dto.ts` — Create/UpdateCashRegisterDto
- `api/src/modules/auth/login-rate-limit.ts` — extracted limiter
- `api/src/modules/auth/login-rate-limit.spec.ts`
- `api/src/modules/auth/auth.service.ts` — uses extracted limiter
- `api/src/modules/oil-sales/cancel-claim.concurrency.spec.ts`

### Web
- `web/src/components/devices/cash-registers-admin.tsx` — list/create/toggle
- `web/src/app/(sales)/sales/devices/page.tsx` — mounts registers admin

### Docs
- `docs/audit/16-remediation-log.md` (this file)
- `docs/audit/15-findings-register.md` — statuses

## Remaining risks

1. **Login rate limit is in-process** — multi-instance / restart resets counters; needs Redis (or similar) for production HA.
2. **JWT denylist / logout** still deferred (L1) — tokens valid until expiry.
3. **Incomplete catalog perms** EDIT/DELETE/EXPORT (M3) and payments beyond create (M4) deferred.
4. **Historical balances** that already inflated `totalSold`/`totalAdded` via old adjust code are not backfilled — only new adjustments are clean; consider a one-off reconcile if production data was adjusted.
5. **Cancel claim unit test** models the pattern in-memory; full e2e double-cancel under load still recommended.
6. **No full E2E suite** for Oil Sales / Mill critical paths in CI (CI workflows absent).
7. Set a strong `JWT_SECRET` before any production/LAN deploy (boot fails in `NODE_ENV=production` if weak).