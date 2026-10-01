# İYB Bubble Waffle Yenimahalle — Kare kare mutluluk.

İYB Bubble Waffle Yenimahalle şubesi için tek sayfalık site: gerçek zamanlı çizilen bir waffle, katman katman açılan
**Bardakta Waffle**, ziyaretçinin kendi waffle'ını tasarladığı bir atölye, menü ve Instagram yönlendirmesi
([@iybwaffleyenimahalle](https://www.instagram.com/iybwaffleyenimahalle/)).

## Çalıştırma

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # tip kontrolü + dist/ içine üretim derlemesi
npm run preview
```

Vercel'e olduğu gibi yüklenebilir (`vercel.json` hazır: Vite, `dist/`, önbellek ve güvenlik başlıkları).

## Nasıl kurulu

- **Hero** (`src/gl/waffle.frag.glsl`, `src/gl/hero.ts`): fotoğraf değil, tek bir WebGL2 shader. Koyu bir taş üzerinde
  yuvarlak bir waffle'ı yükseklik alanı olarak çizer: cepler, kabarık kenar, pudra şekeri, buhar ve açılışta dökülen,
  ceplere süzülen parlak çikolata. Işık imleci izler, kaydırınca kamera yaklaşır. Dikey ekranlarda ayrı bir kadraj kullanır.
  Kare süresine göre çözünürlüğü kendisi düşürür, çikolata döküldükten sonra 30 fps'e iner, ekran dışındayken durur.
  WebGL2 yoksa CSS ile çizilmiş bir ızgara görünür.
- **Bardak illüstrasyonu** (`src/art/kova.ts`): seçilen sos, meyve ve son dokunuştan SVG üretir. Her katman ayrı bir
  grup (`data-layer`), böylece sahneler katmanları ayırabiliyor.
- **Bardak sahnesi** (`src/scenes/signature.ts`): bölüm sabitlenir, bardak katmanlarına ayrılır, her katman sırayla tanıtılır,
  sonra bardak yeniden birleşir.
- **Atölye** (`src/ui/builder.ts`): sos (en fazla 2), meyve (en fazla 3), son dokunuş (en fazla 2). Bardağa bir isim
  verilir ("Kara Orman Bardak" gibi). Paylaş düğmesi Web Share API'yi ya da panoya kopyalamayı kullanır. Bağlantı seçimi
  taşır: `?bardak=bitter.karamel-cilek.kivi-antep#tasarla`.
- **İçerik** statik ve anlamsal HTML'de (`index.html`, JSON-LD `FoodEstablishment` + `Menu`), JavaScript olmadan da okunur.
  Atölye seçenekleri `src/content.ts` içinde.
- **Yazı tipleri**: Fraunces (başlıklar) ve Instrument Sans (metin), kendi sunucumuzda, Latin + Türkçe + ₺ olarak
  küçültülmüş (`scripts/fonts.py`, toplam ~155 KB).
- **Erişilebilirlik**: içeriğe geç bağlantısı, görünür odak, klavye ile çalışan mobil menü (Esc, odak tuzağı),
  `prefers-reduced-motion` desteği (sabitleme yok, animasyon yok, waffle tek kare).

## İçerik kaynakları ve yayından önce doğrulanacaklar

Instagram, iybwaffle.com ve QR menü (iybbubblewaffle.parita.tr) derleme ortamından erişilebilir değildi (ağ politikası).
Bilgiler arama motoru sonuçlarından alındı:

- **Waffle çeşitleri** (iybwaffle.com menüsünün arama kopyaları): Açık Bubble, Bardakta, Çiçek, Fondü, Belçika, Çubuk,
  Sandwich. Çikolata, meyve ve süslemenin müşteri tarafından seçildiği de oradan.
- **İçecekler**: çay, Türk kahvesi, caffè latte, cappuccino, ice tea, meyveli soda. **Dondurma** bir TikTok tanıtımından.
- **Fiyatlar sitede yok.** Kaynaklar birbirini tutmuyor: örneğin Açık Bubble Waffle bir yerde 420 ₺, bir yerde 260 ₺;
  Fondü 450 ₺ ve 300 ₺; Bardak Waffle 250 ₺, 190 ₺ ve 110 ₺. Şubenin güncel fiyatları gelince menüye ve JSON-LD'ye
  `offers` olarak eklenmeli.
- **Ürün açıklamaları** ürün adından yazıldı (çiçek biçimi, çubukta, fondü gibi). Şubeyle teyit edilmeli, özellikle
  Sandwich Waffle'ın içeriği.
- **Yenimahalle şubesinin adresi, saatleri ve telefonu bulunamadı.** Sitede şehir de yazmıyor (Yenimahalle adında
  birden çok semt var). "Bizi bul" bölümü Instagram'a yönlendiriyor. Bilgiler geldiğinde bu bölüme ve JSON-LD'ye
  `address` ve `openingHoursSpecification` eklenmeli.
- **Atölyedeki çikolata/meyve/süsleme seçenekleri örnektir.** Sitede de bu not var. Gerçek seçkiyle `src/content.ts`
  güncellenmeli.
- **Logo**: resmi logo dosyası yoktu. Üst menüdeki işaret, "İYB *Bubble Waffle*" yazısı ve bardak üzerindeki "İYB WAFFLE"
  tipografik yer tutucular. Resmi logo SVG'si geldiğinde değiştirilmeli.
- **Alan adı** bilinmediği için `canonical`, `og:url` ve sitemap yok. Alan adı belli olunca eklenmeli; `og:image` de mutlak
  adrese çevrilmeli.

## Görseller

Markanın fotoğrafları elimizde olmadığı için hiçbir yerde stok ya da yapay zekâ fotoğrafı kullanılmadı. Waffle shader ile,
bardak SVG ile çiziliyor. `public/og.jpg` sosyal medya paylaşım görseli, hero'nun kendisinden alınmış bir kare.
