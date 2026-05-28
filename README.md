# Next.js Image Frozen Config Sort Bug - Reproduction

## Bug

On Vercel, `<Image>` components throw during SSR:

```
TypeError: Cannot assign to read only property '0' of object '[object Array]'
    at Array.sort (<anonymous>)
```

## Root Cause

In `next/dist/shared/lib/get-img-props.js`:

```js
const deviceSizes = c.deviceSizes.sort((a, b) => a - b);  // in-place sort!
const qualities = c.qualities?.sort((a, b) => a - b);      // in-place sort!
```

On Vercel's serverless deployment, `nextConfig` is loaded from `serverFilesManifest`
via `loadManifest()` (`next/dist/server/load-manifest.external.js`), which applies
`deepFreeze()` to the entire manifest — including `config.images.deviceSizes` and
`config.images.qualities` arrays.

When `<Image>` renders during SSR, `.sort()` tries to mutate the frozen arrays → TypeError.

## Why it doesn't reproduce locally

Locally, the full `next-server.js` runs and sets `routerServerContext.nextConfig`
(NOT frozen). On Vercel serverless, `routerServerContext?.nextConfig` is unavailable,
so the code falls back to the deep-frozen `serverFilesManifest.config`.

## Steps to reproduce

1. `npm install`
2. Deploy to Vercel: `npx vercel --prod`
3. Visit the deployed page
4. Check Vercel Function Logs for the TypeError

## Expected

`<Image>` renders without error.

## Fix

```diff
- const deviceSizes = c.deviceSizes.sort((a, b) => a - b);
- const qualities = c.qualities?.sort((a, b) => a - b);
+ const deviceSizes = [...c.deviceSizes].sort((a, b) => a - b);
+ const qualities = c.qualities ? [...c.qualities].sort((a, b) => a - b) : undefined;
```

## Affected files

- `next/dist/shared/lib/get-img-props.js`
- `next/dist/esm/shared/lib/get-img-props.js`
- `next/dist/client/image-component.js`
- `next/dist/client/legacy/image.js`

## Environment

- Next.js: 16.2.6
- React: 19.x
- Node: 24.x
- Deployment: Vercel (serverless)
- Router: Pages Router with `getStaticProps` + ISR
