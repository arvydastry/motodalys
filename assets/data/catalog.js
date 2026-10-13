/* RunMoto demo katalogas. Visi prekių duomenys, kainos, OEM kodai ir atsiliepimai yra DEMONSTRACINIAI.
   Kainos su PVM (EUR). Verslo kaina skaičiuojama iš kainos: be PVM ir su kainų grupės nuolaida (meta.b2b). */
window.RM = {
  meta: {
    phone: '+37067234214', phoneDisplay: '+370 672 34214', email: 'info@runmoto.lt',
    vat: 0.21,
    b2b: { group: 'Servisas', discount: 0.15 },
    freeShippingFrom: 60,
    shipCutoffHour: 14,
    pointsPerEuro: 1, pointValue: 0.01,
    leasingFrom: 50, leasingMonths: 24, leasingRate: 0.0125,
    currencies: { EUR: { rate: 1, symbol: '€' }, PLN: { rate: 4.26, symbol: 'zł' }, USD: { rate: 1.09, symbol: '$' } },
    shipping: [
      { id: 'omniva', name: 'Omniva paštomatas', price: 2.49, days: [1, 2] },
      { id: 'lpexpress', name: 'LP Express paštomatas', price: 2.49, days: [1, 2] },
      { id: 'dpd', name: 'DPD Pickup paštomatas', price: 2.99, days: [1, 2] },
      { id: 'venipak', name: 'Venipak paštomatas', price: 2.99, days: [1, 2] },
      { id: 'courier', name: 'Kurjeris į namus', price: 4.90, days: [1, 2] },
      { id: 'pickup', name: 'Atsiėmimas sandėlyje', price: 0, days: [0, 0] }
    ]
  },

  grades: {
    A: { label: 'A', name: 'Puiki būklė', text: 'Minimalios naudojimo žymės, patikrinta ir paruošta montuoti.', dots: 3 },
    B: { label: 'B', name: 'Gera būklė', text: 'Matomos naudojimo žymės, funkcionalumas patikrintas.', dots: 2 },
    C: { label: 'C', name: 'Su defektais', text: 'Kosmetiniai defektai arba reikalingas smulkus remontas. Aprašyta prie prekės.', dots: 1 }
  },

  engines: {
    'MIN-H-AC': 'Minarelli horizontalus AC',
    'MIN-H-LC': 'Minarelli horizontalus LC',
    'MIN-V': 'Minarelli vertikalus',
    'PIA-2T': 'Piaggio 2T (Hi-Per2)',
    'PEU-H': 'Peugeot horizontalus',
    'PEU-V': 'Peugeot vertikalus',
    'GY6-50': 'GY6 139QMB (50 4T)',
    'GY6-125': 'GY6 152/157QMJ (125/150 4T)',
    'AM6': 'Minarelli AM6',
    'D50B0': 'Derbi D50B0'
  },

  /* Populiariausios technikos selektoriui (iš konkurentų tyrimo). engine: platformos kodas (jei taikoma) */
  vehicles: [
    { id: 'yam-aerox', type: 'scooter', make: 'Yamaha', model: 'Aerox 50', years: [1997, 2012], engine: 'MIN-H-LC' },
    { id: 'yam-bws', type: 'scooter', make: 'Yamaha', model: 'BWS 50', years: [1999, 2017], engine: 'MIN-V' },
    { id: 'yam-jogr', type: 'scooter', make: 'Yamaha', model: 'Jog R', years: [2002, 2012], engine: 'MIN-H-AC' },
    { id: 'yam-neos', type: 'scooter', make: 'Yamaha', model: "Neo's 50", years: [1997, 2012], engine: 'MIN-H-AC' },
    { id: 'yam-nmax', type: 'scooter', make: 'Yamaha', model: 'NMAX 125', years: [2015, 2024], engine: null },
    { id: 'mbk-nitro', type: 'scooter', make: 'MBK', model: 'Nitro 50', years: [1997, 2012], engine: 'MIN-H-LC' },
    { id: 'mbk-booster', type: 'scooter', make: 'MBK', model: 'Booster 50', years: [1999, 2017], engine: 'MIN-V' },
    { id: 'mbk-ovetto', type: 'scooter', make: 'MBK', model: 'Ovetto 50', years: [1997, 2012], engine: 'MIN-H-AC' },
    { id: 'pia-zip', type: 'scooter', make: 'Piaggio', model: 'Zip 50 2T', years: [2000, 2018], engine: 'PIA-2T' },
    { id: 'pia-typhoon', type: 'scooter', make: 'Piaggio', model: 'Typhoon 50', years: [1995, 2017], engine: 'PIA-2T' },
    { id: 'pia-liberty', type: 'scooter', make: 'Piaggio', model: 'Liberty 50 2T', years: [1998, 2015], engine: 'PIA-2T' },
    { id: 'gil-runner', type: 'scooter', make: 'Gilera', model: 'Runner 50 SP', years: [1998, 2017], engine: 'PIA-2T' },
    { id: 'gil-stalker', type: 'scooter', make: 'Gilera', model: 'Stalker 50', years: [1998, 2007], engine: 'PIA-2T' },
    { id: 'apr-sr50', type: 'scooter', make: 'Aprilia', model: 'SR50 R', years: [2004, 2017], engine: 'PIA-2T' },
    { id: 'peu-sf2', type: 'scooter', make: 'Peugeot', model: 'Speedfight 2', years: [2000, 2009], engine: 'PEU-H' },
    { id: 'peu-viva', type: 'scooter', make: 'Peugeot', model: 'Vivacity 50', years: [1999, 2008], engine: 'PEU-H' },
    { id: 'peu-ludix', type: 'scooter', make: 'Peugeot', model: 'Ludix', years: [2004, 2013], engine: 'PEU-V' },
    { id: 'hon-sh125', type: 'scooter', make: 'Honda', model: 'SH 125', years: [2013, 2024], engine: null },
    { id: 'hon-pcx', type: 'scooter', make: 'Honda', model: 'PCX 125', years: [2010, 2024], engine: null },
    { id: 'kym-agility', type: 'scooter', make: 'Kymco', model: 'Agility 50 4T', years: [2005, 2018], engine: 'GY6-50' },
    { id: 'bao-bt49', type: 'scooter', make: 'Baotian', model: 'BT49QT', years: [2008, 2020], engine: 'GY6-50' },
    { id: 'rom-727', type: 'scooter', make: 'Romet', model: '727 50', years: [2012, 2020], engine: 'GY6-50' },
    { id: 'sym-jet4', type: 'scooter', make: 'Sym', model: 'Jet 4 125', years: [2010, 2020], engine: 'GY6-125' },

    { id: 'hon-cbr125', type: 'moto', make: 'Honda', model: 'CBR125R', years: [2004, 2016], engine: null },
    { id: 'hon-cb500f', type: 'moto', make: 'Honda', model: 'CB500F', years: [2013, 2024], engine: null },
    { id: 'hon-at', type: 'moto', make: 'Honda', model: 'Africa Twin CRF1100L', years: [2020, 2024], engine: null },
    { id: 'yam-r125', type: 'moto', make: 'Yamaha', model: 'YZF-R125', years: [2008, 2024], engine: null },
    { id: 'yam-mt07', type: 'moto', make: 'Yamaha', model: 'MT-07', years: [2014, 2024], engine: null },
    { id: 'yam-xsr700', type: 'moto', make: 'Yamaha', model: 'XSR700', years: [2016, 2024], engine: null },
    { id: 'yam-tracer7', type: 'moto', make: 'Yamaha', model: 'Tracer 7', years: [2016, 2024], engine: null },
    { id: 'yam-r7', type: 'moto', make: 'Yamaha', model: 'YZF-R7', years: [2021, 2024], engine: null },
    { id: 'yam-mt09', type: 'moto', make: 'Yamaha', model: 'MT-09', years: [2014, 2024], engine: null },
    { id: 'yam-t7', type: 'moto', make: 'Yamaha', model: 'Ténéré 700', years: [2019, 2024], engine: null },
    { id: 'ktm-390', type: 'moto', make: 'KTM', model: '390 Duke', years: [2013, 2023], engine: null },
    { id: 'ktm-125', type: 'moto', make: 'KTM', model: '125 Duke', years: [2011, 2023], engine: null },
    { id: 'ktm-exc', type: 'moto', make: 'KTM', model: 'EXC 300', years: [2017, 2023], engine: null },
    { id: 'suz-sv650', type: 'moto', make: 'Suzuki', model: 'SV650', years: [2016, 2024], engine: null },
    { id: 'suz-gsxr600', type: 'moto', make: 'Suzuki', model: 'GSX-R600', years: [2011, 2024], engine: null },
    { id: 'kaw-z650', type: 'moto', make: 'Kawasaki', model: 'Z650', years: [2017, 2024], engine: null },
    { id: 'kaw-z900', type: 'moto', make: 'Kawasaki', model: 'Z900', years: [2017, 2024], engine: null },
    { id: 'bmw-r1250gs', type: 'moto', make: 'BMW', model: 'R 1250 GS', years: [2019, 2023], engine: null },
    { id: 'rie-mrt', type: 'moto', make: 'Rieju', model: 'MRT 50', years: [2009, 2020], engine: 'AM6' },
    { id: 'der-senda', type: 'moto', make: 'Derbi', model: 'Senda 50 DRD', years: [2006, 2017], engine: 'D50B0' }
  ],

  categories: [
    { slug: 'variklis', name: 'Variklio dalys', icon: 'engine', image: 'assets/media/cat-variklis.jpg', sub: ['Cilindrų komplektai', 'Stūmokliai ir žiedai', 'Alkūniniai velenai', 'Cilindrų galvos', 'Tarpinės ir riebokšliai', 'Guoliai', 'Aušinimo sistema'] },
    { slug: 'kuras', name: 'Kuro ir oro sistema', icon: 'gas-can', image: 'assets/media/cat-variklis.jpg', sub: ['Karbiuratoriai', 'Oro filtrai', 'Įsiurbimo kolektoriai', 'Lapeliniai vožtuvai', 'Kuro siurbliai ir filtrai', 'Žikleriai'] },
    { slug: 'transmisija', name: 'Transmisija', icon: 'gear-six', image: 'assets/media/cat-transmisija.jpg', sub: ['Variatoriai', 'Variatoriaus svareliai', 'Variatoriaus diržai', 'Sankabos ir būgnai', 'Spyruoklės', 'Grandinės ir žvaigždės', 'Reduktoriai'] },
    { slug: 'duslintuvai', name: 'Duslintuvai', icon: 'wrench', image: 'assets/media/cat-variklis.jpg', sub: ['Motorolerių standartiniai', 'Motorolerių sportiniai', 'Motociklų duslintuvai', 'Priedai ir tarpinės'] },
    { slug: 'stabdziai', name: 'Stabdžiai', icon: 'circles-three', image: 'assets/media/cat-stabdziai.jpg', sub: ['Stabdžių diskai', 'Stabdžių kaladėlės', 'Būgninės kaladėlės', 'Suportai', 'Stabdžių trosai ir žarnos'] },
    { slug: 'elektra', name: 'Elektronika ir apšvietimas', icon: 'lightning', image: 'assets/media/cat-elektra.jpg', sub: ['Akumuliatoriai', 'CDI ir degimas', 'Uždegimo žvakės', 'Starteriai', 'Žibintai', 'Posūkių žibintai', 'Spidometrai', 'Rėlės'] },
    { slug: 'vaziuokle', name: 'Važiuoklė ir rėmas', icon: 'nut', image: 'assets/media/cat-stabdziai.jpg', sub: ['Amortizatoriai', 'Šakės ir riebokšliai', 'Vairai', 'Trosai', 'Kojelės', 'Veidrodėliai'] },
    { slug: 'plastikai', name: 'Plastikai ir išorė', icon: 'motorcycle', image: 'assets/media/cat-kebulas.jpg', sub: ['Plastikai', 'Sėdynės', 'Stiklai', 'Lipdukai ir grafikos'] },
    { slug: 'padangos', name: 'Ratai ir padangos', icon: 'tire', image: 'assets/media/cat-padangos.jpg', sub: ['Motorolerių padangos R10-R17', 'Motociklų padangos', 'Kameros', 'Ratlankiai'] },
    { slug: 'chemija', name: 'Alyvos ir chemija', icon: 'drop', image: 'assets/media/cat-chemija.jpg', sub: ['2T alyva', '4T alyva', 'Transmisinė alyva', 'Stabdžių skystis', 'Aušinimo skystis', 'Priežiūros priemonės'] },
    { slug: 'apranga', name: 'Ekipiruotė', icon: 'hard-hat', image: 'assets/media/cat-ekipiruote.jpg', sub: ['Šalmai', 'Striukės', 'Pirštinės', 'Akiniai', 'Apsaugos'] },
    { slug: 'irankiai', name: 'Įrankiai ir aksesuarai', icon: 'toolbox', image: 'assets/media/garage.jpg', sub: ['Variatoriaus įrankiai', 'Daiktadėžės', 'Telefono laikikliai', 'Spynos'] },
    { slug: 'naudotos', name: 'Naudotos dalys', icon: 'recycle', image: 'assets/media/used-parts.jpg', used: true, sub: ['Varikliai ir jų dalys', 'Plastikai', 'Ratai ir ratlankiai', 'Elektra', 'Važiuoklė', 'Išardoma technika'] }
  ],

  partBrands: ['Malossi', 'Athena', 'Airsal', 'Stage6', 'Polini', 'Top Performances', 'Naraku', 'NGK', 'Motul', 'EBC', 'NG Brake Disc', 'DID', 'Yuasa', 'Michelin', "Dell'Orto", 'Alpinestars'],

  products: [
    {
      id: 1001, slug: 'ng-banguotas-stabdziu-diskas-298', pdp: 'preke.html',
      title: 'Banguotas priekinis stabdžių diskas, Ø 298 mm', brand: 'NG Brake Disc', cat: 'stabdziai', sub: 'Stabdžių diskai',
      condition: 'new', price: 89, old: 109, sku: 'RM-NG1043', oem: ['1WS-F582U-00', 'B4C-F582T-00'],
      images: ['assets/img/products/stabdziu-diskas.jpg', 'assets/img/products/stabdziu-diskas-2.jpg', 'assets/img/products/stabdziu-diskas-3.jpg', 'assets/img/products/stabdziu-diskas-4.jpg'],
      models: [['yam-mt07', 2014, 2024], ['yam-xsr700', 2016, 2024], ['yam-tracer7', 2016, 2024], ['yam-r7', 2021, 2024], ['yam-mt09', 2014, 2020]],
      stock: 6, rating: 4.8, reviews: 23, tags: ['sale', 'bestseller']
    },
    {
      id: 1002, slug: 'airsal-cilindro-komplektas-70-minarelli-lc',
      title: 'Cilindro komplektas 70 cm³ Sport, Minarelli horizontalus LC', brand: 'Airsal', cat: 'variklis', sub: 'Cilindrų komplektai',
      condition: 'new', price: 119, sku: 'RM-AS0701', oem: [],
      images: ['assets/img/products/cilindras.jpg', 'assets/img/products/stumoklis.jpg'],
      engines: ['MIN-H-LC'], stock: 12, rating: 4.7, reviews: 41, tags: ['bestseller'], tuning: true
    },
    {
      id: 1003, slug: 'athena-stumoklis-40-minarelli',
      title: 'Stūmoklis Ø 40 mm su žiedais, Minarelli 50 cm³', brand: 'Athena', cat: 'variklis', sub: 'Stūmokliai ir žiedai',
      condition: 'new', price: 24.9, sku: 'RM-AT4001', oem: ['3KJ-11631-00'],
      images: ['assets/img/products/stumoklis.jpg', 'assets/img/products/cilindras.jpg'],
      engines: ['MIN-H-AC', 'MIN-H-LC', 'MIN-V'], stock: 18, rating: 4.6, reviews: 17, tags: ['bestseller']
    },
    {
      id: 1004, slug: 'ebc-stabdziu-kaladeles-organines',
      title: 'Priekinės stabdžių kaladėlės, organinės', brand: 'EBC', cat: 'stabdziai', sub: 'Stabdžių kaladėlės',
      condition: 'new', price: 16.9, sku: 'RM-EB0193', oem: ['5BR-W0045-00'],
      images: ['assets/img/products/stabdziu-kaladeles.jpg', 'assets/img/products/stabdziu-diskas-2.jpg'],
      engines: ['MIN-H-LC', 'MIN-H-AC', 'PIA-2T'], models: [['yam-mt07', 2014, 2024], ['yam-xsr700', 2016, 2024], ['yam-tracer7', 2016, 2024]],
      stock: 34, rating: 4.9, reviews: 58, tags: ['bestseller']
    },
    {
      id: 1005, slug: 'did-grandines-komplektas-520-vx3',
      title: 'Grandinės komplektas 520 VX3 X-žiedinė, 16/43', brand: 'DID', cat: 'transmisija', sub: 'Grandinės ir žvaigždės',
      condition: 'new', price: 149, old: 169, sku: 'RM-DD5203', oem: [],
      images: ['assets/img/products/grandine.jpg', 'assets/img/products/stabdziu-diskas-3.jpg'],
      models: [['yam-mt07', 2014, 2024], ['yam-xsr700', 2016, 2024], ['yam-tracer7', 2016, 2024]],
      stock: 3, rating: 4.8, reviews: 12, tags: ['sale']
    },
    {
      id: 1006, slug: 'ngk-uzdegimo-zvake-br8hs',
      title: 'Uždegimo žvakė BR8HS', brand: 'NGK', cat: 'elektra', sub: 'Uždegimo žvakės',
      condition: 'new', price: 4.5, sku: 'RM-NGK8HS', oem: ['BR8HS'],
      images: ['assets/img/products/uzdegimo-zvake.jpg'],
      engines: ['MIN-H-AC', 'MIN-H-LC', 'MIN-V', 'PIA-2T', 'PEU-H', 'PEU-V', 'AM6', 'D50B0'], stock: 140, rating: 4.9, reviews: 96, tags: ['bestseller']
    },
    {
      id: 1007, slug: 'stage6-duslintuvas-pro-replica',
      title: 'Sportinis duslintuvas Pro Replica, Minarelli horizontalus', brand: 'Stage6', cat: 'duslintuvai', sub: 'Motorolerių sportiniai',
      condition: 'new', price: 169, sku: 'RM-S6PR01', oem: [],
      images: ['assets/img/products/duslintuvas.jpg'],
      engines: ['MIN-H-AC', 'MIN-H-LC'], stock: 2, rating: 4.5, reviews: 9, tags: ['new'], tuning: true
    },
    {
      id: 1008, slug: 'malossi-oro-filtras-e5',
      title: 'Sportinis oro filtras E5, 32-38 mm', brand: 'Malossi', cat: 'kuras', sub: 'Oro filtrai',
      condition: 'new', price: 39, sku: 'RM-ML0415', oem: [],
      images: ['assets/img/products/oro-filtras.jpg'],
      engines: ['MIN-H-AC', 'MIN-H-LC', 'MIN-V', 'PIA-2T', 'PEU-H', 'PEU-V'], stock: 9, rating: 4.4, reviews: 14, tags: ['new'], tuning: true
    },
    {
      id: 1009, slug: 'dellorto-karbiuratorius-phbg-19',
      title: 'Karbiuratorius PHBG 19 BS', brand: "Dell'Orto", cat: 'kuras', sub: 'Karbiuratoriai',
      condition: 'new', price: 74, old: 89, sku: 'RM-DO1902', oem: [],
      images: ['assets/img/products/karbiuratorius.jpg'],
      engines: ['MIN-H-AC', 'MIN-H-LC', 'MIN-V', 'PIA-2T', 'PEU-H', 'PEU-V'], stock: 7, rating: 4.6, reviews: 21, tags: ['sale']
    },
    {
      id: 1010, slug: 'yuasa-akumuliatorius-ytx7a-bs',
      title: 'Akumuliatorius YTX7A-BS, 12 V 6 Ah', brand: 'Yuasa', cat: 'elektra', sub: 'Akumuliatoriai',
      condition: 'new', price: 59, sku: 'RM-YU7ABS', oem: ['YTX7A-BS'],
      images: ['assets/img/products/akumuliatorius.jpg'],
      engines: ['GY6-50', 'GY6-125'], models: [['hon-sh125', 2013, 2024], ['yam-nmax', 2015, 2024]], stock: 11, rating: 4.7, reviews: 33, tags: []
    },
    {
      id: 1011, slug: 'michelin-city-grip-2-130-70-12',
      title: 'Padanga City Grip 2, 130/70-12', brand: 'Michelin', cat: 'padangos', sub: 'Motorolerių padangos R10-R17',
      condition: 'new', price: 54, sku: 'RM-MI13070', oem: [], universal: 'Tinka pagal dydį 130/70-12',
      images: ['assets/img/products/padanga.jpg'], stock: 16, rating: 4.8, reviews: 27, tags: []
    },
    {
      id: 1012, slug: 'retro-integralus-salmas',
      title: 'Retro integralus šalmas, šachmatų raštas', brand: 'RunMoto Selection', cat: 'apranga', sub: 'Šalmai',
      condition: 'new', price: 149, old: 179, sku: 'RM-HL0218', oem: [], universal: 'Universalu, ECE 22.06',
      images: ['assets/img/products/salmas.jpg', 'assets/img/products/salmas-2.jpg'],
      sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], stock: 8, rating: 4.6, reviews: 11, tags: ['sale', 'new']
    },
    {
      id: 1013, slug: 'alpinestars-pirstines-smx-1-air',
      title: 'Vasarinės pirštinės SMX-1 Air v2', brand: 'Alpinestars', cat: 'apranga', sub: 'Pirštinės',
      condition: 'new', price: 59.9, sku: 'RM-AL1AIR', oem: [], universal: 'Universalu',
      images: ['assets/img/products/pirstines.jpg'], sizes: ['S', 'M', 'L', 'XL', 'XXL'], stock: 14, rating: 4.7, reviews: 19, tags: []
    },
    {
      id: 1014, slug: 'motul-7100-4t-10w40',
      title: 'Variklio alyva 7100 4T 10W-40, 1 l', brand: 'Motul', cat: 'chemija', sub: '4T alyva',
      condition: 'new', price: 15.9, sku: 'RM-MT7110', oem: [], universal: 'JASO MA2, 4T varikliams',
      images: ['assets/img/products/alyva.jpg'], stock: 60, rating: 4.9, reviews: 74, tags: ['bestseller']
    },
    {
      id: 1015, slug: 'veidrodelis-chromuotas-m8-m10',
      title: 'Chromuotas ovalus veidrodėlis, M8 / M10', brand: 'Naraku', cat: 'vaziuokle', sub: 'Veidrodėliai',
      condition: 'new', price: 19.9, sku: 'RM-NR0810', oem: [], universal: 'Universalus, M8 / M10 sriegis',
      images: ['assets/img/products/veidrodelis.jpg'], stock: 22, rating: 4.3, reviews: 8, tags: []
    },
    {
      id: 1016, slug: 'led-priekinis-zibintas-7',
      title: 'LED priekinis žibintas 7 col., E ženklinimas', brand: 'Highsider', cat: 'elektra', sub: 'Žibintai',
      condition: 'new', price: 69, sku: 'RM-HS0700', oem: [], universal: 'Universalus, 7 col. korpusas',
      images: ['assets/img/products/zibintas.jpg'], stock: 5, rating: 4.5, reviews: 6, tags: ['new']
    },
    {
      id: 1017, slug: 'naudotas-ratlankis-21-ktm-exc',
      title: 'Naudotas priekinis ratlankis 21 col.', brand: 'KTM originalas', cat: 'naudotos', sub: 'Ratai ir ratlankiai',
      condition: 'used', grade: 'B', price: 129, sku: 'RM-U21733', oem: ['7820900104430'], donor: 'KTM EXC 300, 2019',
      images: ['assets/img/products/ratlankis.jpg'], models: [['ktm-exc', 2017, 2023]], stock: 1, tags: ['used']
    },
    {
      id: 1018, slug: 'naudotas-variklis-minarelli-50-ac',
      title: 'Naudotas variklis Minarelli 50 cm³ AC, patikrintas', brand: 'Minarelli originalas', cat: 'naudotos', sub: 'Varikliai ir jų dalys',
      condition: 'used', grade: 'A', price: 249, sku: 'RM-U50812', oem: [], donor: 'MBK Booster, 2011', note: 'Suspaudimas 9 bar, užsiveda ir dirba tolygiai.',
      images: ['assets/img/products/variklis-naudotas.jpg'], engines: ['MIN-V'], stock: 1, tags: ['used']
    },
    {
      id: 1019, slug: 'naudotas-priekinis-plastikas-r125',
      title: 'Naudotas priekinis plastikas su stiklu', brand: 'Yamaha originalas', cat: 'naudotos', sub: 'Plastikai',
      condition: 'used', grade: 'C', price: 59, sku: 'RM-U12509', oem: ['5D7-F835K-00'], donor: 'Yamaha YZF-R125, 2011', note: 'Įbrėžimai kairėje pusėje, tvirtinimai sveiki.',
      images: ['assets/img/products/plastikai.jpg'], models: [['yam-r125', 2008, 2013]], stock: 1, tags: ['used']
    },
    {
      id: 1020, slug: 'odine-striuke-retro',
      title: 'Odinė motociklininko striukė, retro juostos', brand: 'Rebelhorn', cat: 'apranga', sub: 'Striukės',
      condition: 'new', price: 249, old: 289, sku: 'RM-RH0412', oem: [], universal: 'Universalu, CE AA apsaugos',
      images: ['assets/img/products/striuke.jpg'], sizes: ['S', 'M', 'L', 'XL', 'XXL', '3XL'], stock: 4, rating: 4.8, reviews: 7, tags: ['sale']
    },
    {
      id: 1021, slug: 'naudotas-originalus-stabdziu-diskas-mt07',
      title: 'Naudotas originalus priekinis stabdžių diskas, Ø 298 mm', brand: 'Yamaha originalas', cat: 'naudotos', sub: 'Važiuoklė',
      condition: 'used', grade: 'B', price: 49, sku: 'RM-U07298', oem: ['1WS-F582U-00'], donor: 'Yamaha MT-07, 2018', note: 'Storis 4,3 mm (min. 4,0 mm), nedeformuotas.',
      images: ['assets/img/products/stabdziu-diskas-4.jpg'], models: [['yam-mt07', 2014, 2024], ['yam-xsr700', 2016, 2024], ['yam-tracer7', 2016, 2024]], stock: 1, tags: ['used']
    },
    {
      id: 1022, slug: 'motul-dot-4-stabdziu-skystis',
      title: 'Stabdžių skystis DOT 4, 0,5 l', brand: 'Motul', cat: 'chemija', sub: 'Stabdžių skystis',
      condition: 'new', price: 8.9, sku: 'RM-MTDOT4', oem: [], universal: 'DOT 4, tinka daugumai hidraulinių stabdžių',
      images: ['assets/img/products/alyva.jpg'], stock: 48, rating: 4.9, reviews: 31, tags: []
    }
  ],

  collections: {
    bestseller: [1004, 1002, 1006, 1001, 1014, 1003, 1009, 1012],
    new: [1007, 1016, 1008, 1012, 1013, 1010, 1011, 1015],
    sale: [1001, 1005, 1009, 1012, 1020],
    used: [1018, 1017, 1019, 1021],
    related: [1004, 1022, 1005, 1021, 1013, 1012, 1014, 1016],
    bundle: [1001, 1004, 1022]
  },

  /* Šiuo metu ardoma technika (naudotų dalių donorai), demo */
  donors: [
    { name: 'Yamaha Aerox 50', year: 2008, parts: 46, image: 'assets/media/scooter.jpg' },
    { name: 'Yamaha YZF-R125', year: 2011, parts: 63, image: 'assets/img/products/plastikai.jpg' },
    { name: 'KTM EXC 300', year: 2019, parts: 38, image: 'assets/img/products/ratlankis.jpg' }
  ],

  reviews: [
    { name: 'Mantas K.', city: 'Kaunas', rating: 5, product: 1004, text: 'Užsisakiau antradienį po pietų, trečiadienį jau atsiėmiau paštomate. Kaladėlės tiko be jokių pakeitimų.' },
    { name: 'Greta P.', city: 'Vilnius', rating: 5, product: 1012, text: 'Pagal dydžių lentelę pasirinkau M ir pataikiau. Šalmas tylus, gerai vėdinamas.' },
    { name: 'Motociklų servisas', city: 'Šiauliai', rating: 5, product: 1006, text: 'Servisui patogu: verslo kainos matomos iškart prisijungus, sąskaitos faktūros ateina automatiškai.' },
    { name: 'Tomas R.', city: 'Klaipėda', rating: 4, product: 1018, text: 'Naudotas variklis atitiko aprašymą, būklė tikrai A. Būtų smagu dar daugiau nuotraukų iš apačios.' }
  ]
};
