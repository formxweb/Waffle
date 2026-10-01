import { defineConfig, type Plugin } from 'vite';
import { renderProducts, renderExtras, renderContact, renderJsonLd, renderUrlMeta } from './src/render.ts';
import { orderTarget, orderLabel } from './src/content.ts';

const generalOrder = () => orderTarget('Merhaba, sipariş vermek istiyorum.');

/** Fills the <!--slot:name--> markers in index.html from src/content.ts at dev and build time. */
function contentSlots(): Plugin {
  const slots: Record<string, () => string> = {
    products: renderProducts,
    extras: renderExtras,
    contact: renderContact,
    jsonld: renderJsonLd,
    urlmeta: renderUrlMeta,
    orderhref: () => generalOrder().href,
    orderchannel: () => generalOrder().channel,
    orderlabel: orderLabel,
  };
  return {
    name: 'content-slots',
    transformIndexHtml(html) {
      return html.replace(/<!--slot:(\w+)-->/g, (_, name: string) => {
        const render = slots[name];
        if (!render) throw new Error(`unknown slot ${name}`);
        return render();
      });
    },
  };
}

export default defineConfig({
  plugins: [contentSlots()],
  build: {
    target: 'es2020',
    cssCodeSplit: false,
    assetsInlineLimit: 0,
  },
  server: { host: true },
});
