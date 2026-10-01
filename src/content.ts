/**
 * Every brand fact the scripts use lives here. The static copy in index.html
 * (menu, prices, JSON-LD) mirrors it — change both together.
 */

export const brand = {
  name: 'İYB Bubble Waffle Yenimahalle',
  instagram: 'https://www.instagram.com/iybwaffleyenimahalle/',
  handle: '@iybwaffleyenimahalle',
};

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
