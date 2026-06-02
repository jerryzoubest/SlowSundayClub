# Slow Sunday Club Shopify Theme

This workspace is a Shopify Online Store theme rebuilt around the Slow Sunday Club reference design: calm neutral palette, editorial homepage, product detail page, cart, search, collections, blog, contact, and standard content pages.

## Shopify Upload

Use Shopify CLI from this folder when available:

```sh
shopify theme dev
shopify theme push
```

If you prefer a manual upload, zip the theme folders and files at the workspace root, then upload the zip in Shopify Admin under Online Store > Themes.

## Image Setup

The theme is wired for real Shopify content:

- Homepage hero and feature images are editable in the Shopify theme editor.
- Product, collection, journal, and cart imagery comes from Shopify products, collections, and blog articles.
- If images are missing, the theme shows neutral placeholders so the layout remains usable.

## Checkout

The cart page is fully themed and sends customers to Shopify's secure checkout. Shopify checkout and thank-you pages are controlled through Shopify Admin branding settings unless the store has advanced checkout customization access. A `page.checkout-preview` template is included as a visual reference only.

## Main Files

- `layout/theme.liquid`
- `assets/ssc-theme.css`
- `assets/ssc-theme.js`
- `sections/ssc-*.liquid`
- `templates/*.json`
