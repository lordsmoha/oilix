# Findings register

Severity: Critical / High / Medium / Low. Status updated during remediation.

| ID | Sev | Area | Finding | Status |
|----|-----|------|---------|--------|
| C1 | Critical | Oil sales cancel | Double-cancel race restores stock/cash twice | Fixed |
| C2 | Critical | Cash open | OPEN session not season-scoped; leftover blocks sales | Fixed |
| C3 | Critical | Payments | Concurrent overpay; no row lock | Fixed |
| C4 | Critical | Auth | Weak/default JWT secret risk in prod | Fixed |
| H1 | High | Cancel + cash | Refund into CLOSED session corrupts expected cash | Fixed |
| H2 | High | listSales | No register scoping for cashiers | Fixed |
| H3 | High | createSale | Only OIL_SALES_ACCESS required | Fixed |
| H4 | High | Receipt | findSale season-scoped → 404 other season | Fixed |
| H5 | High | Auth | No login rate limit | Fixed |
| H6 | High | Seasons API | OLIVE_READ blocks sales-only users | Fixed |
| H7 | High | Dashboard | Mill dashboard JWT-only, no mill permission | Fixed |
| H8 | High | Cash presentSession | open/adjust leak diffs as ADMIN | Fixed |
| H9 | High | findSession | IDOR when device has no register | Fixed |
| H10 | High | Stock adjust | Negative adjust inflates totalSold | Fixed |
| H11 | High | Filtration | White screen `return null`; no /auth/me | Fixed |
| H12 | High | Devices enable | ACTIVE without register check | Fixed |
| H13 | High | Sale create UX | Double-submit risk | Fixed |
| H14 | High | Unique OPEN session | No DB constraint | Fixed (partial unique index) |
| M1 | Medium | Web TS | Button size/variant + devices-admin | Fixed |
| M2 | Medium | Sales shell | Missing SeasonViewBanner | Fixed |
| M3 | Medium | Incomplete perms | EDIT/DELETE/EXPORT catalog-only | Deferred |
| M4 | Medium | Payments API | Create-only | Deferred |
| M5 | Medium | Container adjust | Positive adjust inflated totalAdded; summary ignored stored theoretical | Fixed |
| M6 | Medium | Cash registers | list-only; no create UI/API | Fixed |
| L1 | Low | JWT logout | Token valid until expiry | Deferred (needs denylist) |
