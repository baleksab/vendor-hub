# Architecture: `@mfe/insights`

Remote for vendor and product analytics. Vite + React, Module Federation 2 (`@module-federation/vite`), client-only, read-only. It is for every logged-in user, because the API returns only the vendors the caller owns or operates. Administrators get no extra access here.

## Layout

```
packages/insights/
├── src/
│   ├── Insights.tsx              exposed component: contexts, lazy <Routes>, 401 handler
│   ├── main.tsx                  standalone entry: BrowserRouter, ui theme, MantineProvider, Mantine and charts CSS
│   ├── paths.ts                  INSIGHTS_PATH and path builders (the remote is mounted at /insights)
│   ├── period.ts                 periods (7d, 30d, 90d, 12m, all), reading period and currency from the URL
│   ├── api/                      client.ts, queryKeys.ts (insightsKeys), insights.ts
│   ├── hooks/                    useInsightsVendors, useVendorInsights, useProductInsights, usePeriodCurrency
│   ├── context/                  ApiContext, LocaleContext, MessagesContext
│   ├── components/               InsightsBar, RoleBadge, Trend
│   ├── i18n/messages.ts          en and sr texts, createT(locale)
│   └── pages/
│       ├── VendorList/           table (cards below `sm`), filters.ts
│       ├── VendorInsights/       KPIs, revenue chart, orders by status, catalog, top products and countries
│       └── ProductInsights/      KPIs, sales, units and review charts, rating distribution
└── vite.config.ts, env.ts, .env, .env.local
```

## Routes

`/insights/vendors` (table), `/insights/vendors/:id` (vendor dive-in), `/insights/vendors/:id/products/:productId` (product dive-in). Unknown paths redirect to the table. The vendor page links to the product pages through the top products table and to the matching management page, and the product page links back to the vendor.

## Data and state

- All calls use `createApiClient` and `unwrap` with `apiBaseUrl` as base URL. In the shell that is the shell origin, where the `/api/v1/*` proxy adds the token. The endpoints are `GET /insights/vendors`, `/insights/vendors/:id` and `/insights/products/:id`.
- `queryKeys.ts` is the only place that builds query keys. The queries keep the previous data while a new period or currency loads.
- List state (`q`, `relation`, `sort`, `order`, `size`, `page`, `period`, `currency`) lives in the URL (`pages/VendorList/filters.ts`), search is debounced and any filter change goes back to page 1. The detail pages keep only `period` and `currency` in the URL.
- When no currency is in the URL the API picks the one with the most paid orders and returns it with the list of available currencies in `meta`, and the currency select is built from that. Every amount is shown in that one currency.
- KPI cards compare with the previous period of the same length (`previous` is `null` for all time, so no badge). Revenue is net of refunds, the API owns the rules.

## Charts

Charts are `@mantine/charts`. `TimeSeriesChart` (area), `KpiCard` and `PeriodCurrencyBar` come from `@vendor-hub/ui`, the bar charts are used directly. The stylesheet is not imported by exposed modules: the shell's `app.css` provides it, and `main.tsx` imports it when the remote runs standalone. Charts have a fixed height and fill the width, and the page works from 320px.

## Module Federation

- **Name and exposed module:** `insights`, exposes `./Insights`.
- **Shared:** `react`, `react-dom`, `react-router`, `@tanstack/react-query`, `@mantine/core` and `@mantine/hooks` as singletons. `@mantine/charts` and `recharts` are bundled in the remote.
- **Standalone:** `main.tsx` mounts the component at `insights/*`. The Vite dev server proxies `/api/v1` to `INSIGHTS_API_URL` and adds `INSIGHTS_DEV_TOKEN` from `.env.secret`.
