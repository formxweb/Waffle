# İYB Bubble Waffle Yenimahalle — Kare kare mutluluk.

İYB Bubble Waffle Yenimahalle şubesi için tek sayfalık marka sitesi
([@iybwaffleyenimahalle](https://www.instagram.com/iybwaffleyenimahalle/)):
gerçek zamanlı çizilen bir waffle, ürün kartlarıyla menü, ziyaretçinin kendi bardağını tasarladığı bölüm ve iletişim.

## Çalıştırma

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # tip kontrolü + dist/ içine üretim derlemesi
npm run preview
```

Vercel'e olduğu gibi yüklenebilir (`vercel.json` hazır: Vite, `dist/`, önbellek ve güvenlik başlıkları).

## Şube bilgileri tek yerden: `src/content.ts`

Ürün kartları, iletişim bloğu, tüm sipariş butonları ve JSON-LD derleme sırasında bu dosyadan üretilir
(`vite.config.ts` → `src/render.ts`). Boş bırakılan alan sitede görünmez; hiçbir bilgi uydurulmaz.

| Alan | Doldurulunca ne olur |
| --- | --- |
| `brand.whatsapp` (`905xxxxxxxxx`) | Bütün "Instagram'dan yaz" butonları **"WhatsApp'tan sipariş ver"** olur ve ürün adıyla hazır mesaj açar. Kartlardaki "Sor" butonu "Sipariş ver" olur. |
| `brand.phone` | İletişimde tıklanabilir telefon satırı, JSON-LD `telephone`. |
| `brand.address`, `brand.mapsUrl` | İletişimde adres (harita bağlantısıyla), JSON-LD `address`. |
| `brand.hours` | İletişimde çalışma saatleri. |
| `brand.url` | `canonical` ve `og:url`; `og:image` mutlak adrese çevrilmeli. |
| `products[].price` | Kartta "Fiyat şubede" yerine fiyat (`260 ₺`), JSON-LD `offers`. |
| `products[].photo` | Kartta çizim yerine gerçek fotoğraf (`public/` altına koyun, 4:3 önerilir). |

WhatsApp numarası yokken siparişler Instagram DM'e gider. DM'e hazır mesaj iletilemediği için mesaj panoya
kopyalanır ve "DM'e yapıştırıp gönderebilirsin" notu çıkar.

## Nasıl kurulu

- **Hero** (`src/gl/waffle.frag.glsl`, `src/gl/hero.ts`): fotoğraf değil, tek bir WebGL2 shader. Koyu bir taş üzerinde
  yuvarlak bir waffle, açılışta dökülen çikolata, pudra şekeri ve buhar. Işık imleci izler, kaydırınca kamera yaklaşır.
  Kare süresine göre çözünürlüğü düşürür, çikolata döküldükten sonra 30 fps'e iner, ekran dışındayken durur.
  WebGL2 yoksa CSS ile çizilmiş bir ızgara görünür.
- **Ürün kartları** (`src/art/products.ts`): her ürün tipi için ayrı SVG çizim (bubble külah, bardak, çiçek, fondü,
  Belçika, çubuk, sandwich). Derleme sırasında HTML'e gömülür, JavaScript gerekmez. Fotoğraf eklenince yerini alır.
- **Bardakta Waffle / Tasarla** (`src/ui/builder.ts`, `src/art/kova.ts`): çikolata (en fazla 2), meyve (en fazla 3),
  son dokunuş (en fazla 2). Bardağa bir isim verilir ("Kara Orman Bardak" gibi). "Bu bardağı sor/sipariş et" seçimi
  mesaja yazar; "Paylaş" seçimi taşıyan bağlantı üretir: `?bardak=bitter.karamel-cilek.kivi-antep#tasarla`.
- **Hareket**: kaydırma Lenis ile yumuşak; bölümler girerken bir kez yerine oturur; kartlarda kalkma ve çizim
  yakınlaşması, butonlarda ok kayması. Sabitlenen uzun sahneler ve kayan yazı bandı yok.
- **Başlık çubuğu**: koyu bölümlerde koyu, krem menünün üstünde açık renge döner. Masaüstünde hep görünür.
  Telefonda aşağı kaydırırken gizlenir; yerine altta "Menü" ve sipariş butonlu hızlı erişim çubuğu çıkar.
- **SEO**: tek `h1`, bölüm başına `h2`, kartlar `article` + schema.org `MenuItem` mikroverisi, JSON-LD
  `FoodEstablishment` + `Menu`, Open Graph ve Twitter kartı (`public/og.jpg`, hero'dan alınmış kare), `robots.txt`.
- **Performans**: GSAP kaldırıldı (JS 174 KB → 62 KB). Yazı tipleri Latin + Türkçe + ₺ olarak küçültüldü
  (`scripts/fonts.py`, ~155 KB). Tam ekran gren katmanı kaldırıldı.
- **Erişilebilirlik**: içeriğe geç bağlantısı, görünür odak, klavye ile çalışan mobil menü (Esc, odak tuzağı),
  `prefers-reduced-motion` desteği (yumuşak kaydırma ve geçişler kapalı, waffle tek kare).

## İçerik kaynakları ve yayından önce doğrulanacaklar

Instagram, iybwaffle.com ve QR menü derleme ortamından erişilebilir değildi (ağ politikası).
Bilgiler arama motoru sonuçlarından alındı:

- **Waffle çeşitleri** (iybwaffle.com menüsünün arama kopyaları): Açık Bubble, Bardakta, Çiçek, Fondü, Belçika, Çubuk,
  Sandwich. Çikolata, meyve ve süslemenin müşteri tarafından seçildiği de oradan.
- **İçecekler**: çay, Türk kahvesi, caffè latte, cappuccino, ice tea, meyveli soda. **Dondurma** bir TikTok tanıtımından.
- **Fiyatlar sitede yok.** Kaynaklar birbirini tutmuyor (Açık Bubble Waffle bir yerde 420 ₺, bir yerde 260 ₺).
  Şubenin güncel fiyatları `products[].price` alanına girilmeli.
- **Ürün açıklamaları** ürün adından yazıldı. Şubeyle teyit edilmeli, özellikle Sandwich Waffle'ın içeriği.
- **Adres, saat, telefon, WhatsApp** bulunamadı; sitede yok. Gelince `brand` alanlarına girilmeli.
- **Tasarla bölümündeki seçenekler örnektir.** Sitede de bu not var.
- **Logo**: resmi logo dosyası yoktu. Üst menüdeki işaret, "İYB *Bubble Waffle*" yazısı ve bardak üzerindeki
  "İYB WAFFLE" tipografik yer tutucular.
- **Ürün görselleri çizimdir**, fotoğraf değil. Gerçek fotoğraflar `products[].photo` ile eklenmeli.
