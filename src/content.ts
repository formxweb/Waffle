/**
 * The single source for every brand fact on the site. The product cards, contact block and
 * JSON-LD in index.html are rendered from here at build time (see vite.config.ts), and the
 * scripts read the same data. Empty fields are simply not shown: nothing is invented.
 */

export const brand = {
  name: 'İYB Bubble Waffle Yenimahalle',
  short: 'İYB Bubble Waffle',
  branch: 'Yenimahalle',
  instagram: 'https://www.instagram.com/iybwaffleyenimahalle/',
  handle: '@iybwaffleyenimahalle',
  /** Opens an Instagram DM thread with the branch. */
  dm: 'https://ig.me/m/iybwaffleyenimahalle',
  /** Fill these when the branch confirms them; every CTA and the contact block pick them up. */
  whatsapp: '', // international format without + or spaces, e.g. '905xxxxxxxxx'
  phone: '', // as it should be shown, e.g. '0 5xx xxx xx xx'
  address: '', // full street address
  mapsUrl: '', // Google Maps link to the branch
  hours: [] as { days: string; time: string }[], // e.g. { days: 'Her gün', time: '13:00–23:00' }
  /** The production URL (with trailing slash) once the domain is known; enables canonical and og:url. */
  url: '',
};

export type ArtId = 'bubble' | 'bardak' | 'cicek' | 'fondu' | 'belcika' | 'cubuk' | 'sandwich';

export interface Product {
  id: string;
  name: string;
  desc: string;
  art: ArtId;
  tag?: string;
  /** Price in TL; null shows "Fiyat şubede" until the branch confirms it. */
  price: number | null;
  /** Optional real photo in /public (e.g. '/urunler/acik-bubble.webp'); replaces the drawing. */
  photo?: string;
}

export const products: Product[] = [
  {
    id: 'acik-bubble',
    name: 'Açık Bubble Waffle',
    tag: 'İmza',
    art: 'bubble',
    price: null,
    desc: 'Baloncuk baloncuk pişen waffle: dışı çıtır, içi yumuşak. Açık sunulur; çikolatası, meyvesi ve süslemesi senden.',
  },
  { id: 'bardakta', name: 'Bardakta Waffle', art: 'bardak', price: null, desc: 'Lokma lokma waffle, çikolata ve meyve; hepsi tek bardakta, elinde.' },
  { id: 'cicek', name: 'Çiçek Waffle', art: 'cicek', price: null, desc: 'Çiçek biçiminde pişen waffle, dilediğin çikolata ve meyveyle.' },
  { id: 'fondu', name: 'Fondü Waffle', art: 'fondu', price: null, desc: 'Waffle lokmaları ve yanında akışkan çikolata. Batır, paylaş.' },
  { id: 'belcika', name: 'Belçika Waffle', art: 'belcika', price: null, desc: 'Derin kareli klasik Belçika waffle’ı; çikolata her kareye dolar.' },
  { id: 'cubuk', name: 'Çubuk Waffle', art: 'cubuk', price: null, desc: 'Çubukta waffle: elde taşınır, her ısırığı çikolatalı.' },
  { id: 'sandwich', name: 'Sandwich Waffle', art: 'sandwich', price: null, desc: 'İki kat waffle, arası senin seçimin.' },
];

export const extras = [
  { name: 'İçecekler', desc: 'Çay, Türk kahvesi, caffè latte, cappuccino; serinlemek için ice tea ve meyveli soda.' },
  { name: 'Dondurma', desc: 'Sıcak waffle’ın yanına bir top soğuk dondurma.' },
];

export const formatPrice = (p: number) => `${p.toLocaleString('tr-TR')} ₺`;

/** Where an order or question goes: WhatsApp with a prefilled message once a number is set, else an Instagram DM. */
export function orderTarget(message: string) {
  if (brand.whatsapp) {
    return { href: `https://wa.me/${brand.whatsapp}?text=${encodeURIComponent(message)}`, channel: 'whatsapp' as const };
  }
  return { href: brand.dm, channel: 'dm' as const };
}

export const orderLabel = () => (brand.whatsapp ? 'WhatsApp’tan sipariş ver' : 'Instagram’dan yaz');

export type Swatch = { id: string; label: string; color: string; shade: string };

/** Builder choices. Example set; the daily selection is decided in store. */
export const sauces: Swatch[] = [
  { id: 'sutlu', label: 'Sütlü çikolata', color: '#6b3519', shade: '#3d1a0a' },
  { id: 'bitter', label: 'Bitter çikolata', color: '#3a1a0c', shade: '#1a0904' },
  { id: 'beyaz', label: 'Beyaz çikolata', color: '#f3e6cf', shade: '#cdb790' },
  { id: 'karamel', label: 'Karamel', color: '#c9802f', shade: '#86460f' },
  { id: 'fistik', label: 'Fıstık kreması', color: '#93a85a', shade: '#5c6e2c' },
];

export const fruits: Swatch[] = [
  { id: 'cilek', label: 'Çilek', color: '#d8333f', shade: '#8f1424' },
  { id: 'muz', label: 'Muz', color: '#f4e3a4', shade: '#d4b465' },
  { id: 'kivi', label: 'Kivi', color: '#86b23a', shade: '#4f7a19' },
  { id: 'yabanmersini', label: 'Yaban mersini', color: '#3c3f78', shade: '#20214a' },
];

export const toppings: Swatch[] = [
  { id: 'findik', label: 'Fındık', color: '#c48b54', shade: '#7d5027' },
  { id: 'antep', label: 'Antep fıstığı', color: '#8fae4c', shade: '#55702a' },
  { id: 'biskuvi', label: 'Bisküvi kırığı', color: '#8a5a2c', shade: '#4f2f12' },
  { id: 'renkli', label: 'Renkli şeker', color: '#e86a8a', shade: '#a33a57' },
  { id: 'pudra', label: 'Pudra şekeri', color: '#fbf6ee', shade: '#d9cfbf' },
];

export const limits = { sauces: 2, fruits: 3, toppings: 2 };

export interface Choice {
  sauces: string[];
  fruits: string[];
  toppings: string[];
}

export const signatureChoice: Choice = {
  sauces: ['sutlu', 'beyaz'],
  fruits: ['cilek', 'muz'],
  toppings: ['findik'],
};
