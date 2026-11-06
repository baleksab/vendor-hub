# Architecture: `@vendor-hub/ui`

The shared look of the apps. No build step: `exports` points at source (`.`, `./theme`, `./tokens.css`) and consumers bundle it. It is not a federated module.

## Layout

```
packages/ui/
├── src/
│   ├── theme.ts        Mantine theme (Primer-like) and cssVariablesResolver
│   ├── tokens.css      Tailwind `@theme` tokens (fonts)
│   ├── components/     PageHeader, PageSpinner, EmptyState, ErrorAlert, FormField, FormAlert (text props such as `errorText`, `messageText`), and the catalogue set: StarRating, StarRatingInput, ReviewSummary, ReviewList, PriceTag, StockBadge, ProductCard (link component as a prop), ImageGallery
│   └── index.ts
└── tsconfig.json, .oxlintrc.json
```

## Rules of the package

- `react`, `react-dom`, `@mantine/core` and `@mantine/hooks` are `peerDependencies`, so they resolve to the singletons of the app that bundles the package. The same packages are devDependencies only for local typechecking.
- The shell applies the theme in its `MantineProvider`. A remote applies it only in its standalone `main.tsx`.
- Components take all texts as props. No `useT`, no locale logic, no router.
