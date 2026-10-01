import { brand, products, extras, formatPrice, orderTarget, orderLabel, type Product } from './content.ts';
import { productArt } from './art/products.ts';

/**
 * Build-time HTML for the parts of index.html that come from content.ts: product cards,
 * the contact block and JSON-LD. Pure string functions, no DOM; vite.config.ts injects them.
 */

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

const orderMessage = (p: Product) => `Merhaba, ${p.name} hakkında bilgi almak istiyorum.`;

function card(p: Product, i: number): string {
  const order = orderTarget(orderMessage(p));
  const media = p.photo
    ? `<img src="${p.photo}" alt="${esc(p.name)}" width="800" height="600" loading="lazy" decoding="async">`
    : productArt(p.art, p.name);
  const price = p.price != null
    ? `<data class="product-price" value="${p.price}">${formatPrice(p.price)}</data>`
    : `<span class="product-price is-pending">Fiyat şubede</span>`;
  return `
          <article class="product${i === 0 ? ' product--lead' : ''}" id="urun-${p.id}" itemscope itemtype="https://schema.org/MenuItem">
            <figure class="product-media">${media}</figure>
            <div class="product-body">
              <header class="product-head">
                <h3 class="product-name" itemprop="name">${esc(p.name)}</h3>
                ${p.tag ? `<span class="tag">${esc(p.tag)}</span>` : ''}
              </header>
              <p class="product-desc" itemprop="description">${esc(p.desc)}</p>
              <footer class="product-foot">
                ${price}
                <a class="product-cta" href="${order.href}" target="_blank" rel="noopener" data-order="${esc(orderMessage(p))}" data-channel="${order.channel}">${brand.whatsapp ? 'Sipariş ver' : 'Sor'}<span class="sr-only">: ${esc(p.name)}</span> <span aria-hidden="true">↗</span></a>
              </footer>
            </div>
          </article>`;
}

export function renderProducts(): string {
  return products.map(card).join('');
}

export function renderExtras(): string {
  return extras
    .map((x) => `
          <li class="extra"><h3>${esc(x.name)}</h3><p>${esc(x.desc)}</p></li>`)
    .join('');
}

/** Contact rows: only what the branch has confirmed is shown. */
export function renderContact(): string {
  const rows: string[] = [];
  const order = orderTarget('Merhaba, sipariş vermek istiyorum.');
  rows.push(`
            <li class="contact-row contact-row--primary">
              <span class="contact-label">${brand.whatsapp ? 'Sipariş' : 'Mesaj (DM)'}</span>
              <a class="contact-value" href="${order.href}" target="_blank" rel="noopener" data-order="Merhaba, sipariş vermek istiyorum." data-channel="${order.channel}">${orderLabel()} <span aria-hidden="true">↗</span></a>
            </li>`);
  rows.push(`
            <li class="contact-row">
              <span class="contact-label">Instagram</span>
              <a class="contact-value" href="${brand.instagram}" target="_blank" rel="noopener">${brand.handle} <span aria-hidden="true">↗</span></a>
            </li>`);
  if (brand.phone) {
    rows.push(`
            <li class="contact-row">
              <span class="contact-label">Telefon</span>
              <a class="contact-value" href="tel:${brand.phone.replace(/\s/g, '')}">${esc(brand.phone)}</a>
            </li>`);
  }
  if (brand.address) {
    rows.push(`
            <li class="contact-row">
              <span class="contact-label">Adres</span>
              <address class="contact-value">${brand.mapsUrl ? `<a href="${brand.mapsUrl}" target="_blank" rel="noopener">${esc(brand.address)} <span aria-hidden="true">↗</span></a>` : esc(brand.address)}</address>
            </li>`);
  }
  if (brand.hours.length) {
    rows.push(`
            <li class="contact-row">
              <span class="contact-label">Saatler</span>
              <span class="contact-value">${brand.hours.map((h) => `${esc(h.days)} ${esc(h.time)}`).join('<br>')}</span>
            </li>`);
  }
  return rows.join('');
}

export function renderJsonLd(): string {
  const item = (p: { name: string; desc: string; price?: number | null }) => ({
    '@type': 'MenuItem',
    name: p.name,
    description: p.desc,
    ...(p.price != null ? { offers: { '@type': 'Offer', price: String(p.price), priceCurrency: 'TRY' } } : {}),
  });
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'FoodEstablishment',
    name: brand.name,
    slogan: 'Kare kare mutluluk.',
    servesCuisine: ['Waffle', 'Tatlı'],
    sameAs: [brand.instagram],
    ...(brand.url ? { url: brand.url, image: `${brand.url}og.jpg` } : {}),
    ...(brand.phone ? { telephone: brand.phone } : {}),
    ...(brand.address ? { address: { '@type': 'PostalAddress', streetAddress: brand.address, addressCountry: 'TR' } } : {}),
    hasMenu: {
      '@type': 'Menu',
      name: `${brand.short} menüsü`,
      hasMenuSection: [
        { '@type': 'MenuSection', name: 'Waffle', hasMenuItem: products.map(item) },
        { '@type': 'MenuSection', name: 'Yanına', hasMenuItem: extras.map(item) },
      ],
    },
  };
  return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
}

/** canonical + og:url only once the domain is known */
export function renderUrlMeta(): string {
  if (!brand.url) return '';
  return `<link rel="canonical" href="${brand.url}" />\n  <meta property="og:url" content="${brand.url}" />`;
}
