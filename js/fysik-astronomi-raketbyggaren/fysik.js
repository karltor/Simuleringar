// Raketbyggaren – fysikkonstanter och omloppsmatematik.
// Nedskalad planet (radie 120 km) så att omloppsbanor nås på några minuter
// men ytgravitationen är jordlik (9,82 m/s²).
window.RB = window.RB || {};

RB.K = {
  G0: 9.82,                 // ytgravitation, används även i TWR
  PLANET_R: 120000,         // planetens radie (m)
  MU: 9.82 * 120000 * 120000, // gravitationsparameter μ = g·R²
  ATM_HOJD: 12000,          // atmosfärens topp = "rymdgränsen"
  RHO0: 1.2,                // luftdensitet vid marken (kg/m³)
  SKALHOJD: 2600,           // ρ = ρ0·e^(−h/SKALHOJD)
  AREA: 1.5,                // referensarea för luftmotstånd (m²)
  CD: 0.9,                  // dragkoefficient utan noskon
  CD_NOS: 0.35,             // med noskon
  FALLSKARM_CDA: 600,       // CdA fullt utvecklad fallskärm
  MANE_AVSTAND: 600000,     // månens banradie (m)
  MANE_R: 20000,            // månens radie
  MANE_MU: 1.6 * 20000 * 20000,
  MANE_STARTVINKEL: 0.8
};
RB.K.MANE_PERIOD = 2 * Math.PI * Math.sqrt(Math.pow(RB.K.MANE_AVSTAND, 3) / RB.K.MU);

RB.fysik = {
  manePos: function (t) {
    var v = RB.K.MANE_STARTVINKEL + 2 * Math.PI * t / RB.K.MANE_PERIOD;
    return { x: RB.K.MANE_AVSTAND * Math.cos(v), y: RB.K.MANE_AVSTAND * Math.sin(v) };
  },

  // Total gravitationsacceleration från planet + måne (månen "på räls")
  gravitation: function (px, py, t) {
    var r2 = px * px + py * py;
    var r = Math.sqrt(r2);
    var gp = -RB.K.MU / (r2 * r);
    var ax = gp * px, ay = gp * py;
    var m = RB.fysik.manePos(t);
    var dx = px - m.x, dy = py - m.y;
    var d2 = dx * dx + dy * dy;
    var d = Math.sqrt(d2);
    var gm = -RB.K.MANE_MU / (d2 * d);
    return { x: ax + gm * dx, y: ay + gm * dy };
  },

  densitet: function (hojd) {
    if (hojd >= RB.K.ATM_HOJD || hojd < 0) return 0;
    return RB.K.RHO0 * Math.exp(-hojd / RB.K.SKALHOJD);
  },

  // Banelement ur läge & hastighet (relativt planetens centrum).
  // Ger apoapsis/periapsis som höjd över ytan samt ellipsens geometri.
  banelement: function (px, py, vx, vy) {
    var mu = RB.K.MU;
    var r = Math.sqrt(px * px + py * py);
    var v2 = vx * vx + vy * vy;
    var E = v2 / 2 - mu / r;
    var h = px * vy - py * vx;
    var rv = px * vx + py * vy;
    // excentricitetsvektor pekar mot periapsis
    var ex = ((v2 - mu / r) * px - rv * vx) / mu;
    var ey = ((v2 - mu / r) * py - rv * vy) / mu;
    var e = Math.sqrt(ex * ex + ey * ey);
    var a = -mu / (2 * E); // negativ vid hyperbel
    var hyperbolisk = E >= 0;
    var rP = hyperbolisk ? a * (1 - e) : a * (1 - e);
    var rA = hyperbolisk ? Infinity : a * (1 + e);
    return {
      a: a, e: e, ex: ex, ey: ey, h: h,
      hyperbolisk: hyperbolisk,
      rA: rA, rP: rP,
      apo: hyperbolisk ? Infinity : rA - RB.K.PLANET_R,
      peri: rP - RB.K.PLANET_R,
      period: hyperbolisk ? Infinity : 2 * Math.PI * Math.sqrt(a * a * a / mu)
    };
  },

  formatMeter: function (m) {
    if (!isFinite(m)) return '∞';
    if (Math.abs(m) >= 100000) return (m / 1000).toFixed(0) + ' km';
    if (Math.abs(m) >= 10000) return (m / 1000).toFixed(1) + ' km';
    if (Math.abs(m) >= 1000) return (m / 1000).toFixed(2) + ' km';
    return Math.round(m) + ' m';
  },

  formatKg: function (kg) {
    if (kg >= 10000) return (kg / 1000).toFixed(1) + ' t';
    return Math.round(kg) + ' kg';
  }
};
