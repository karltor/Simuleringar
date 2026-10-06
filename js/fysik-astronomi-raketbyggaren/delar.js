window.RB = window.RB || {};
// Sfärisk Ceres med verklig medelradie, massa och rotationsperiod.
// JPL: https://ssd.jpl.nasa.gov/planets/phys_par.html (kontrollerat 2026-10-06).
// Idealiserad tvåkroppsmodell: inga berg, ingen atmosfär, inga andra kroppar.
RB.K = { R: 469700, MU: 6.67430e-11 * 938.416e18, ROTATION: .37809042 * 86400,
  KAPSEL: 400, TANK: 60, BRANSLE: 120, DT: 1 / 60, SAKER_BANA: 1000 };
RB.K.OMEGA = 2 * Math.PI / RB.K.ROTATION;
// Fiktiva, fysikaliskt rimliga raketmotorer. Alla krafter/massor är i SI-enheter.
RB.MOTORER = [
  { id: 'start', namn: 'Puls', massa: 120, kraft: 10000, ve: 2200, pris: 0 },
  { id: 'kraft', namn: 'Atlas', massa: 300, kraft: 22000, ve: 2400, pris: 175 },
  { id: 'snal', namn: 'Nova', massa: 140, kraft: 9000, ve: 3200, pris: 300 }
];
RB.UPPGRADERINGAR = [
  { id: 'kraft', namn: 'Atlas', text: '22 kN · 300 kg', pris: 175, ikon: 'motor' },
  { id: 'snal', namn: 'Nova', text: '9 kN · 140 kg · effektivare', pris: 300, ikon: 'motor' },
  { id: 'steg', namn: 'Två raketsteg', text: 'En del kan släppas under flygningen.', pris: 250, ikon: 'steg' }
];
// Oberoende prestationer. Ingen föreskriven ordning, motor eller bränslemängd.
RB.MARKEN = [
  { id: 'lyft', namn: 'Första lyftet', text: '100 m', poang: 75, villkor: function (f) { return f.maxHojd >= 100; } },
  { id: 'km1', namn: 'Ovanför kratern', text: '1 km', poang: 100, villkor: function (f) { return f.maxHojd >= 1000; } },
  { id: 'km10', namn: 'Högt över Ceres', text: '10 km', poang: 150, villkor: function (f) { return f.maxHojd >= 10000; } },
  { id: 'sid100', namn: 'På väg runt', text: '100 m/s i sidled', poang: 100, villkor: function (f) { return f.maxSidofart >= 100; } },
  { id: 'sid250', namn: 'Full fart', text: '250 m/s i sidled', poang: 150, villkor: function (f) { return f.maxSidofart >= 250; } },
  { id: 'bana', namn: 'Omloppsbana!', text: 'Fri bana runt Ceres', poang: 750, villkor: function (f) { return f.iBana; } },
  { id: 'varv', namn: 'Ett helt varv', text: 'Ett varv i omloppsbana', poang: 1000, villkor: function (f) { return f.varv >= 2 * Math.PI; } },
  { id: 'landning', namn: 'Tillbaka hel', text: 'Landning under 3 m/s', poang: 200, villkor: function (f) { return f.slut === 'landning' && f.maxHojd >= 100; } }
];
RB.motor = function (id) { return RB.MOTORER.find(function (m) { return m.id === id; }) || RB.MOTORER[0]; };
RB.konfig = function (data) {
  data = data || {};
  var steg = data.steg === 2 ? 2 : 1;
  return { motor: RB.motor(data.motor).id, bransle: Math.max(steg, Math.min(8, Math.round(Number(data.bransle) || 2))), steg: steg };
};
RB.formatHojd = function (m) {
  if (!Number.isFinite(m)) return '—';
  return Math.abs(m) >= 10000 ? (m / 1000).toLocaleString('sv-SE', { maximumFractionDigits: 1 }) + ' km' : Math.round(m).toLocaleString('sv-SE') + ' m';
};
RB.formatVikt = function (m) { return Math.round(m).toLocaleString('sv-SE') + ' kg'; };
RB.formatTid = function (t) { return Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0'); };
