# Architecture: `@mfe/vendor-administrator`

Remote for vendor management. Vite + React, Module Federation 2 (`@module-federation/vite`), client-only. Unlike `user-administrator` it is for every logged-in user, because the API returns only the vendors the caller can manage.

## Layout

```
packages/vendor-administrator/
├── src/
│   ├── VendorAdministrator.tsx   exposed component: contexts, lazy <Routes>, 401 handler
│   ├── main.tsx                  standalone entry: BrowserRouter, ui theme, MantineProvider
│   ├── paths.ts                  VENDORS_PATH, vendorPath (the remote is mounted at /manage)
│   ├── api/                      client.ts, queryKeys.ts (vendorKeys, productKeys, categoryKeys, orderKeys), vendors.ts, products.ts, orders.ts
│   ├── hooks/                    useManagedVendors, useVendor, useUpdateVendor, useDeleteVendor,
│   │                             useAddOperator, useRemoveOperator, product hooks, useVendorOrders, useOrder,
│   │                             useOrderMutation, useDeliverOrder, useApproveReturn, useRejectReturn
│   ├── context/                  ApiContext, LocaleContext, MessagesContext
│   ├── components/               RoleBadge, SeoSection (SEO fields and preview, with the i18n texts)
│   ├── i18n/messages.ts          en and sr texts, createT(locale)
│   ├── orderLabels.ts            order statuses, timeline and payment texts
│   └── pages/
│       ├── VendorList/           VendorList, VendorTable, VendorQuickView, filters.ts
│       ├── VendorDetail/         VendorDetail, VendorForm, MembersTable, AddOperatorForm, DeleteVendor
│       ├── ProductList/          ProductList (table, inline stock edit, delete modal), filters.ts
│       ├── ProductForm/         ProductForm (create and edit), ImagesEditor, ReviewsModeration
│       ├── OrderList/           OrderList (table from sm, cards below), filters.ts (status, page)
│       └── OrderDetail/         OrderDetail (items, shipping, timeline, payments, deliver, approve and reject return)
├── env.ts, vite.config.ts, index.html
├── .env / .env.local / .env.secret.example
└── tsconfig.json, .oxlintrc.json
```

## What it exposes

`./VendorAdministrator` with the props `{ locale, apiBaseUrl, onUnauthorized }` (type `VendorAdministratorProps` in `@vendor-hub/types`). It renders `<Routes>` with `vendors`, `vendors/:id` and a catch-all redirect to `vendors`. Both pages are `React.lazy` chunks.

The shared modules are the same as in `user-administrator`: `react`, `react-dom`, `react-router`, `@tanstack/react-query`, `@mantine/core` and `@mantine/hooks` are `singleton`. The `QueryClient` comes from the shell, so the cache is shared with the other remotes. `useUnauthorizedHandler` subscribes to the caches and calls `onUnauthorized` on a `401`. Only standalone mode (`main.tsx`) creates its own client.

## Data

- All calls use `createApiClient` and `unwrap` with `apiBaseUrl` as base URL. In the shell that is the shell origin, where the `/api/v1/*` proxy adds the token.
- `queryKeys.ts` is the only place that builds query keys. Mutations write the vendor response into the detail cache and invalidate the lists. Deleting removes the detail query and invalidates the lists.
- The list state (`q`, `relation`, `sort`, `order`, `size`, `page`) lives in the URL (`pages/VendorList/filters.ts`), search is debounced, and any filter change goes back to page 1. Filtering, sorting and paging happen on the API (`GET /vendors/managed`). The response `scope` (`all` or `mine`) picks the page title.
- `viewerRole`, `memberRole` and `canDelete` come from the API. The role badge shows `memberRole`, and an administrator who is not a member of the vendor sees a gray "Not affiliated". The delete section renders only when `canDelete` is true, and the owner row has no remove button.
- The list is a table from the `sm` breakpoint up and a stack of cards below it. A row opens the quick view drawer through a real button in the name cell, and the drawer links to the detail page.
- Members (`memberRole` not null) see a **View insights** button on the vendor detail page and on the product form that links to the `insights` remote (`/insights/vendors/:id`, `.../products/:productId`). Administrators who are not members do not, because insights are membership only.
- Delete asks the user to type the slug before the button enables. `404` on the detail shows the not-found state.

### Products

Reached from the vendor detail page: `/manage/vendors/:id/products`, `.../products/new` and `.../products/:productId`. The list reads the public search (`GET /vendors/by-slug/:slug/products`, the slug comes from the vendor), its state (`q`, `category`, `inStock`, `sort`, `order`, `page`) lives in the URL (`pages/ProductList/filters.ts`) and the stock cell saves on blur. The vendor and product forms have two tabs, details and SEO (`?tab=seo`, `useFormTab`), sharing one save button. The SEO tab is a section (`SeoSection`, built from `SeoFields` and `SeoPreview` in `packages/ui`): a meta title and description with counters, for products a preview image picker (disabled until the product has images) and a live Google (desktop and mobile) and social card preview. The placeholders and the preview show the default that applies when a field is empty. Emptying a field sends `null`. The preview address is built from the current origin and the vendor slug and product id. The limits (60 and 160) are mirrored from the server in `packages/ui`. The form sends only changed fields, and after a create it navigates to the edit page where images can be added. `ImagesEditor` uploads one file per request as multipart through the shell proxy and shows a readable message per file for `413`, `415` and `409`, images are reordered with buttons and the first one is the cover. `ReviewsModeration` lists the product reviews with a delete button. Query keys come from `productKeys` and `categoryKeys`, mutations update the detail with `setQueryData` and invalidate `productKeys.lists()`.

### Orders

Reached from the vendor detail page by the Orders section: `/manage/vendors/:id/orders` and `.../orders/:orderId`. The list reads `GET /vendors/:id/orders` (order number, buyer name from the shipping snapshot, total, status, date), with the status and the page in the URL (`pages/OrderList/filters.ts`). The detail reads `GET /orders/:id` and shows the shipping details the vendor needs to ship. Its buttons come only from `allowedActions`: Mark as delivered, Approve return (confirm modal, because it refunds) and Reject return (a modal with a required reason). Mutations write the returned order into `orderKeys.detail` and invalidate `orderKeys.lists()`. The routes are in the shell proxy allowlist.

## Two ways to run

- **Embedded:** the shell loads the component after hydration and relies on its Mantine provider and CSS.
- **Standalone:** `main.tsx` adds the `@vendor-hub/ui` theme, `MantineProvider` and Mantine CSS, and mounts the component at `manage/*`. The Vite dev server proxies `/api/v1` to the API and adds `VENDOR_ADMINISTRATOR_DEV_TOKEN` from the gitignored `.env.secret`.

## Rules specific to this package

- Texts live in `i18n/messages.ts`, chosen by the `locale` prop.
- Mantine CSS and the theme are imported only in `main.tsx`.
- CORS on dev and preview allows only `VENDOR_ADMINISTRATOR_ALLOWED_ORIGINS` (the shell origin).
