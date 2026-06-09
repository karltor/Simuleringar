// Raketbyggaren – delkatalog, milstolpar och tips.
// Allt delas via det globala namnutrymmet RB (vanliga script, funkar via file://).
window.RB = window.RB || {};

// massa = torrvikt (kg), bransle (kg), dragkraft (N), ve = utblåshastighet (m/s)
// kostnad = forskningspoäng för att låsa upp (0 = tillgänglig från start)
// hojd/bredd = ritmått i meter (används av både bygget och flygningen)
RB.DELAR = [
  { id: 'kapsel',     typ: 'kapsel',     namn: 'Kapsel',     ikon: '🧑‍🚀', massa: 800,  kostnad: 0,
    hojd: 2.6, bredd: 2.2, info: 'Krävs för att flyga' },
  { id: 'fallskarm',  typ: 'fallskarm',  namn: 'Fallskärm',  ikon: '🪂', massa: 80,   kostnad: 25,
    hojd: 0.8, bredd: 2.0, info: 'Mjuk landning' },
  { id: 'nos',        typ: 'nos',        namn: 'Noskon',     ikon: '🔺', massa: 100,  kostnad: 15,
    hojd: 1.8, bredd: 2.2, info: 'Mindre luftmotstånd' },

  { id: 'tankS',      typ: 'tank',       namn: 'Tank S',     ikon: '🛢', massa: 150,  bransle: 1200,  kostnad: 0,
    hojd: 2.4, bredd: 2.2 },
  { id: 'tankM',      typ: 'tank',       namn: 'Tank M',     ikon: '🛢', massa: 400,  bransle: 3600,  kostnad: 20,
    hojd: 4.2, bredd: 2.2 },
  { id: 'tankL',      typ: 'tank',       namn: 'Tank L',     ikon: '🛢', massa: 900,  bransle: 9000,  kostnad: 60,
    hojd: 6.5, bredd: 2.6 },
  { id: 'tankXL',     typ: 'tank',       namn: 'Tank XL',    ikon: '🛢', massa: 2000, bransle: 20000, kostnad: 150,
    hojd: 9.0, bredd: 3.2 },

  { id: 'motorMyra',  typ: 'motor',      namn: 'Myra',       ikon: '🔥', massa: 350,  dragkraft: 45000,  ve: 2300, kostnad: 0,
    hojd: 1.6, bredd: 1.6 },
  { id: 'motorBjorn', typ: 'motor',      namn: 'Björn',      ikon: '🔥', massa: 1100, dragkraft: 220000, ve: 2450, kostnad: 40,
    hojd: 2.2, bredd: 2.4 },
  { id: 'motorSvala', typ: 'motor',      namn: 'Svala',      ikon: '🔥', massa: 280,  dragkraft: 28000,  ve: 3400, kostnad: 50,
    hojd: 1.4, bredd: 1.4, info: 'Svag men snål – bäst i rymden' },
  { id: 'motorJatte', typ: 'motor',      namn: 'Jätte',      ikon: '🔥', massa: 3200, dragkraft: 800000, ve: 2600, kostnad: 200,
    hojd: 3.0, bredd: 3.2 },

  { id: 'dekopplare', typ: 'dekopplare', namn: 'Dekopplare', ikon: '✂️', massa: 60, kostnad: 0,
    hojd: 0.5, bredd: 2.2, info: 'Delar raketen i steg' }
];

RB.delDef = function (id) {
  return RB.DELAR.find(function (d) { return d.id === id; });
};

RB.GRUPPNAMN = { kapsel: 'Besättning', nos: 'Nos & skydd', fallskarm: 'Nos & skydd', tank: 'Bränsletankar', motor: 'Motorer', dekopplare: 'Steg' };
RB.GRUPPORDNING = ['Besättning', 'Nos & skydd', 'Bränsletankar', 'Motorer', 'Steg'];

// Milstolpar – engångsmål som ger forskningspoäng.
// villkor(f) får flygtillståndet och returnerar true när målet är nått.
RB.MILSTOLPAR = [
  { id: 'lyft',    namn: 'Lättning!',            ikon: '🛫', poang: 10,
    villkor: function (f) { return f.maxHojd > 50; } },
  { id: 'km1',     namn: '1 km höjd',            ikon: '⛰️', poang: 10,
    villkor: function (f) { return f.maxHojd >= 1000; } },
  { id: 'km5',     namn: '5 km höjd',            ikon: '🏔️', poang: 15,
    villkor: function (f) { return f.maxHojd >= 5000; } },
  { id: 'rymden',  namn: 'Rymden! (12 km)',      ikon: '🌌', poang: 25,
    villkor: function (f) { return f.maxHojd >= RB.K.ATM_HOJD; } },
  { id: 'km50',    namn: '50 km höjd',           ikon: '🛰️', poang: 30,
    villkor: function (f) { return f.maxHojd >= 50000; } },
  { id: 'fart1500',namn: '1500 m/s',             ikon: '⚡', poang: 20,
    villkor: function (f) { return f.maxFart >= 1500; } },
  { id: 'bana',    namn: 'Omloppsbana!',         ikon: '🌍', poang: 60,
    villkor: function (f) { return f.iBana; } },
  { id: 'manen',   namn: 'Månen passerad',       ikon: '🌕', poang: 80,
    villkor: function (f) { return f.nareManen; } },
  { id: 'landning',namn: 'Mjuk landning',        ikon: '🧷', poang: 20,
    villkor: function (f) { return f.mjukLandning && f.maxHojd > 1000; } }
];

RB.TIPS = [
  'Tips: mer bränsle ger inte alltid mer <b>Δv</b> – tanken väger också!',
  'Tips: <b>TWR över 1</b> krävs för att lyfta från marken.',
  'Tips: dela raketen i <b>steg</b> med dekopplare – släpp tomma tankar!',
  'Tips: luta åt <b>höger</b> efter ~2 km – fart i sidled ger omloppsbana.',
  'Tips: <b>periapsis över 12 km</b> = du är i omloppsbana 🌍',
  'Tips: motorn <b>Svala</b> har högt vₑ – perfekt för övre steg.',
  'Tips: Δv = vₑ · ln(m₀/m₁) – Tsiolkovskijs raketekvation.'
];
