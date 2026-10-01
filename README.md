# ESD Waffle — Kare kare mutluluk.

esdwaffle.com için tek sayfalık marka sitesi: gerçek zamanlı çizilen bir waffle, katman katman açılan imza **Kova Waffle**,
ziyaretçinin kendi kovasını tasarladığı bir atölye, menü ve Instagram yönlendirmesi.

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
- **Kova illüstrasyonu** (`src/art/kova.ts`): seçilen sos, meyve ve son dokunuştan SVG üretir. Her katman ayrı bir
  grup (`data-layer`), böylece sahneler katmanları ayırabiliyor.
- **İmza sahnesi** (`src/scenes/signature.ts`): bölüm sabitlenir, kova katmanlarına ayrılır, her katman sırayla tanıtılır,
  sonra kova yeniden birleşir.
- **Atölye** (`src/ui/builder.ts`): sos (en fazla 2), meyve (en fazla 3), son dokunuş (en fazla 2). Kovaya bir isim
  verilir ("Kara Orman Kova" gibi). Paylaş düğmesi Web Share API'yi ya da panoya kopyalamayı kullanır. Bağlantı seçimi
  taşır: `?kova=bitter.karamel-cilek.kivi-antep#tasarla`.
- **İçerik** statik ve anlamsal HTML'de (`index.html`, JSON-LD `FoodEstablishment` + `Menu`), JavaScript olmadan da okunur.
  Atölye seçenekleri `src/content.ts` içinde.
- **Yazı tipleri**: Fraunces (başlıklar) ve Instrument Sans (metin), kendi sunucumuzda, Latin + Türkçe + ₺ olarak
  küçültülmüş (`scripts/fonts.py`, toplam ~155 KB).
- **Erişilebilirlik**: içeriğe geç bağlantısı, görünür odak, klavye ile çalışan mobil menü (Esc, odak tuzağı),
  `prefers-reduced-motion` desteği (sabitleme yok, animasyon yok, waffle tek kare).

## İçerik kaynakları ve yayından önce doğrulanacaklar

esdwaffle.com ve Instagram derleme ortamından erişilebilir değildi (ağ politikası). Bilgiler, markanın sosyal medya
paylaşımlarının arama motoru kopyalarından alındı:

- **Kova Waffle 149 ₺** ve **Kova Waffle + ev yapımı limonata 179 ₺**. Fiyatlar `index.html` içinde üç yerde geçer:
  hero, imza bölümü ve menü, ayrıca JSON-LD.
- **Ev yapımı limonata** tek başına fiyatı bulunamadı, menüde "Şubede" yazıyor.
- **Adres, çalışma saatleri, telefon, sipariş platformları** bulunamadı, sitede yer almıyor. "Bizi bul" bölümü
  Instagram'a yönlendiriyor. Bilgiler geldiğinde bu bölüme ve JSON-LD'ye eklenmeli.
- **Atölyedeki sos/meyve/süsleme seçenekleri örnektir.** Sitede de bu not var. Gerçek seçkiyle `src/content.ts`
  güncellenmeli.
- **Logo**: resmi logo dosyası yoktu. Üst menüdeki işaret ve "ESD *Waffle*" yazısı tipografik bir yer tutucu.
  Bardak üzerindeki yazı da öyle. Resmi logo SVG'si geldiğinde değiştirilmeli.
- Metinlerdeki iddialar ("her kova o an için hazırlanır", "dökülmez, saçılmaz" gibi) ekiple teyit edilmeli.

## Görseller

Markanın fotoğrafları elimizde olmadığı için hiçbir yerde stok ya da yapay zekâ fotoğrafı kullanılmadı. Waffle shader ile,
kova SVG ile çiziliyor. `public/og.jpg` sosyal medya paylaşım görseli, hero'nun kendisinden alınmış bir kare.
