# RunMoto: e. parduotuvės demo („Dirbtuvės“)

Statinė HTML/CSS/JS demonstracinė versija naujai motorolerių ir motociklų dalių parduotuvei **runmoto.lt** (naujos ir naudotos dalys, B2C ir B2B). Galutinė platforma: **WordPress + WooCommerce + XStore** (Elementor). Taupant biudžetą sukurti tik du puslapiai: **pirmas puslapis** ir **prekės puslapis**.

Užklausa: Edvinas Ivanauskas, e.ivanauskas@yahoo.com, +370 672 34214 (2026-10-13).

Gyva demo versija: <https://arvydastry.github.io/motodalys/>

## Kaip atidaryti

Užtenka atidaryti `index.html` naršyklėje (veikia ir iš failų, be serverio; šriftams reikia interneto). Arba su vietiniu serveriu:

```bash
python3 -m http.server 8771
```

ir naršyklėje atidaryti http://localhost:8771 (`.claude/launch.json` jau sukonfigūruotas).

## Puslapiai

| Failas | Kas tai |
|---|---|
| `index.html` | Pirmas puslapis: hero su dalių paieška (pagal techniką, pagal variklio platformą, pagal OEM kodą), kategorijos, populiariausios dalys su skirtukais, naujos ir naudotos dalys (būklės skalė A/B/C, šiuo metu ardoma technika), B2B juosta su kainų grupės pavyzdžiu, gamintojų juosta, „Kodėl RunMoto“ ir mokėjimai, atsiliepimai, naujienlaiškis su vaizdo fonu |
| `preke.html` | Prekės puslapis: banguotas stabdžių diskas NG Brake Disc Ø 298 mm. Galerija su priartinimu ir peržiūros langu, OEM kodai su kopijavimu, suderinamumo patikra „Ar tiks jūsų motociklui?“, variantai (kiekis ir centro spalva su skirtingu likučiu), Omnibus kainos eilutė, B2B kaina, lojalumo taškai, mokėjimas dalimis, išsiuntimo laikas ir pristatymo data, pristatymo būdai su kainomis, „Radote pigiau?“, naudota originali alternatyva, „Kartu pigiau“ rinkinys, skirtukai (aprašymas, specifikacijos, suderinamumo lentelė su paieška, pristatymas ir grąžinimas, atsiliepimai), susijusios prekės, lipni pirkimo juosta |

Abiejuose puslapiuose veikia:
- **Mano garažas**: išsaugota technika (iki 5), visose kortelėse rodoma „Tinka jūsų Aerox 50“ arba „Netinka“;
- greita paieška su pasiūlymais (randa be lietuviškų raidžių, pagal modelį, pvz. „aerox“, ir pagal OEM kodą);
- kategorijų mega meniu su variklio platformomis;
- **Privatiems / Verslui** perjungiklis: B2B kainos be PVM su kainų grupės nuolaida (demo −15 %);
- valiutos (EUR, PLN, USD) ir kalbos (LT, EN) pasirinkimas;
- krepšelis su nemokamo pristatymo juosta ir taškais, norų sąrašas, greita peržiūra;
- mobili apatinė juosta su garažu.

Visi judesio efektai išjungiami, jei lankytojo sistemoje įjungtas „mažiau judesio“ nustatymas. Puslapiai turi `noindex, nofollow`.

Ekrano nuotraukos klientui (kompiuteris ir telefonas): `docs/perziura/`.

## Dizaino kryptis

- **Koncepcija „Dirbtuvės“:** grafito ir betono pilkos tonai, tamsios nuotaikingos nuotraukos, vienas akcentas: signalinė geltona. Nupjauti kampai (kaip frezuotų detalių) mygtukuose, ženkleliuose ir kortelėse, geltonai juodos įspėjamosios juostos tik dviejose vietose.
- **Spalvos:** fonas `#F1F1EE`, tekstas `#15171A`, tamsios sekcijos `#0E0F11`, akcentas `#FFC21A` (tik užpildai, ant šviesaus fono ne tekstui). Semantinės: akcijos `#CF2A1E`, „tinka“ `#1E7A4C`, „netinka“ `#9A5B00`, naudotos dalys `#2E5F88`.
- **Šriftai (Google Fonts, latin-ext):** Archivo siaurinta (antraštės, didžiosios raidės), Geist (sąsaja), Geist Mono (prekių ir OEM kodai).
- **Logotipas:** naujas žodinis ženklas „RUNMOTO“ (šešiakampė veržlė su rodykle „pirmyn“). Failai `assets/img/brand/` (šviesiam ir tamsiam fonui, favicon). Tai pasiūlymo eskizas, nes klientas logotipo dar neturi.
- **Ikonos:** Phosphor (light), įterptos kaip SVG sprite.

## Įgyvendinimas XStore temoje

Pilnas tyrimas su kainomis ir rizikomis: [`docs/research/xstore.md`](docs/research/xstore.md). Konkurentų apžvalga: [`docs/research/konkurentai.md`](docs/research/konkurentai.md).

Svarbiausia:
- importuoti XStore demo **Car Parts** (vienintelis dalių demo), headerio Departments Menu paimti iš **Industrial Power Tools** per XStudio;
- **Mano garažas** ir suderinamumas: įskiepis *WooCommerce Vehicle Parts Finder* (apie 34 $ vienkartinai), demo duomenų struktūra (`vehicles`, `engines`, `models`) atitinka jo CSV importą;
- naudotos dalys: atributai `pa_bukle` (Nauja / Naudota) ir `pa_bukles_klase` (A/B/C), XStore Custom Product Badges;
- mokėjimai ir siuntimas: **Montonio** (banklinks, kortelės, Apple / Google Pay, lizingas, Omniva, DPD, Venipak, LP Express), **Paysera** kaip alternatyva;
- B2B kainų grupės: B2BKing, VIES: EU VAT Validator, taškai: WPLoyalty, valiutos: CURCY, sąskaitos: PDF Invoices & Packing Slips;
- Fake Live Viewing, Fake Sale Popup ir Fake Sold Counter Car Parts demo **išjungti**.

| Demo blokas | XStore atitikmuo |
|---|---|
| Viršutinė juosta su B2B / valiuta / kalba | Header Builder viršutinė eilutė, Content Display Conditions |
| Headeris: paieška, garažas, krepšelis su suma | Header Builder: Ajax Search, Shortcode (garažas), Cart off-canvas |
| Visos kategorijos | Departments Menu + Mega Menu (Static Blocks) |
| Hero dalių paieška | Banner fonas + Vehicle Parts Finder shortcode (atsarginis variantas: Product Filters) |
| Kategorijų plytelės | Product Categories / Dynamic Categories |
| Populiariausios dalys su skirtukais | Ajax Products Tabs (`et-advanced-tabs`) |
| Naujos / naudotos, B2B juosta | Banner, Icon Box, Content Display Conditions |
| Gamintojų juosta | Marquee arba Brands |
| Atsiliepimai | Testimonials, Sales Booster Advanced Reviews |
| Prekės galerija | Single Product Builder: Product Images (vertikali galerija, zoom, lightbox) |
| Suderinamumo patikra ir lentelė | Vehicle Parts Finder fitment skirtukas + shortcode |
| Variantai | Variation swatches |
| Išsiuntimo laikas, pristatymo data | Sales Booster Estimated Delivery |
| „Kartu pigiau“ | Sales Booster Frequently Bought Together |
| Lipni pirkimo juosta | Sticky Cart (`etheme_sticky_cart`) |

## Ką reikia patvirtinti su klientu

- **Domenas.** 2026-10-13 duomenimis `runmoto.lt` **dar neužregistruotas** (DOMREG statusas „available“). Klientas turėtų jį užsiregistruoti dabar arba tai įtraukiame į pasiūlymą.
- **Kevin.** Užklausoje minimas Kevin, bet Lietuvos bankas 2024-09-26 panaikino „Kevin EU“ licenciją. Demo rodo Montonio ir Paysera.
- **Visi prekių duomenys demonstraciniai:** prekės, kainos, OEM kodai, likučiai, suderinamumas, donorų technika ir atsiliepimai (vardai išgalvoti). Tikri duomenys bus iš tiekėjų ir ERP.
- **Atsiliepimai ir „Patvirtintas pirkimas“.** Demo atsiliepimai sugalvoti. Tikrame tinklapyje ženklas rodomas tik tada, kai pirkimas patikrintas pagal užsakymą (WooCommerce „verified owner“), kitaip tai draudžiama komercinė praktika.
- **Omnibus eilutė.** Perbraukta kaina turi būti tikra mažiausia kaina per 30 d. iki nuolaidos (skaičiuoja įskiepis). Komplekto nuolaida rodoma tik lyginant su pavienėmis prekėmis.
- **Homologacijos ir sertifikatai** (ECE R90, ECE 22.06, CE), EAN ir kilmės šalis demo yra pavyzdiniai: tikrus duomenis imame iš tiekėjo.
- **Sąlygos, kurias reikia patikslinti:** išsiuntimas tą pačią dieną iki 14 val., nemokamas pristatymas nuo 60 €, pristatymo kainos (2,49-4,90 €), 14 d. grąžinimas ir pinigų grąžinimas per 3 darbo dienas, „Radote pigiau?“ kainos peržiūra, darbo laikas, atsiėmimas sandėlyje (adresas nežinomas), el. paštas `info@runmoto.lt` (vietos rezervas).
- **Naudotų dalių būklės skalė A/B/C** ir garantijos terminas naudotoms dalims (ES direktyva leidžia sutrumpinti iki ne mažiau nei 1 metų, jei taip susitarta).
- **B2B:** kainų grupių pavadinimai ir nuolaidos (demo „Servisas“ −15 %), kiekio nuolaidos, ar bus atidėti mokėjimai.
- **Lojalumo taškai** (demo: 1 € = 1 taškas, 100 taškų = 1 €), **lizingo** minimali suma (demo 50 €) ir partneris, **valiutų kursai** (demo orientaciniai). Mėnesinė lizingo įmoka demo sąmoningai nerodoma: rodant kredito kainą privalomas reprezentatyvus pavyzdys, todėl ją turėtų skaičiuoti partnerio (Montonio, Inbank) valdiklis.
- **Nuotraukos** yra Pexels iliustracijos, ne tikrų prekių nuotraukos (žr. [`docs/research/media-credits.md`](docs/research/media-credits.md)). Tiekėjų nuotraukų naudojimo teises reikia patikrinti.

## Struktūra ir redagavimas

```
src/pages/        puslapių turinys (index.html, preke.html)
src/partials/     bendros dalys: layout, topbar, header, footer, overlays, mobilebar, paymarks, icons.svg
assets/css/       base.css (sistema) + home.css, pdp.css
assets/js/        core.js (garažas, kainos, paieška, krepšelis, judesys) + home.js, pdp.js, vendor/ (Motion, Lenis)
assets/data/      catalog.js (window.RM: technika, variklių platformos, kategorijos, demo prekės)
assets/media/     Pexels nuotraukos ir vaizdo įrašas (manifest.json)
assets/img/       prekių nuotraukos ir logotipas
docs/research/    XStore tyrimas, konkurentai, nuotraukų šaltiniai
```

Redaguojami tik failai `src/` ir `assets/` kataloguose. Šakniniai `index.html` ir `preke.html` generuojami:

```bash
python3 build.py
```
