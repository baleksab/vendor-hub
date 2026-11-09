# Architecture: `@vendor-hub/ui`

The shared look of the apps. No build step: `exports` points at source (`.`, `./theme`, `./tokens.css`) and consumers bundle it. It is not a federated module.

## Layout

```
packages/ui/
├── src/
│   ├── theme.ts        Mantine theme (Inter, indigo brand, zinc grays) and cssVariablesResolver
│   ├── tokens.css      Tailwind `@theme` tokens (fonts)
│   ├── components/     PageHeader, PageSpinner, EmptyState, ErrorAlert, FormField, FormAlert (text props such as `errorText`, `messageText`), KpiCard (value with a delta badge), TimeSeriesChart (`@mantine/charts` area chart), PeriodCurrencyBar (period and currency selects) and BackLink (chevron link back, link component as a prop), and the catalogue set: StarRating, StarRatingInput, ReviewSummary, ReviewList, PriceTag, StockBadge, ProductCard (link component and an optional `action` slot below the link, e.g. an add to cart form), ImageGallery, and the cart and order set: QuantityStepper (a real named number input with 44px − and + buttons, so a plain form still submits it), AddToCartButton (disabled when stock is 0, same rule as StockBadge), CartLine (quantity and remove controls as slots), CartSummary (totals per currency), OrderStatusBadge and `orderNumber`, OrderItemsTable (table from `sm`, a list below), OrderTimeline and `orderEventKind`, ShippingDetails, PaymentAttemptList
│   └── index.ts
└── tsconfig.json, .oxlintrc.json
```

## Rules of the package

- `@mantine/charts` and `recharts` are `peerDependencies` too (only `TimeSeriesChart` uses them), and an app that renders it must import `@mantine/charts/styles.layer.css`.
- `react`, `react-dom`, `@mantine/core` and `@mantine/hooks` are `peerDependencies`, so they resolve to the singletons of the app that bundles the package. The same packages are devDependencies only for local typechecking.
- The shell applies the theme in its `MantineProvider`. A remote applies it only in its standalone `main.tsx`.
- Components take all texts as props. No `useT`, no locale logic, no router.
