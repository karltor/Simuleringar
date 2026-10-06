// 2D-inertialkoordinater, roterande mark, variabel massa och velocity-Verlet.
// Motorns impuls integreras med exakt massförhållande inom varje tidssteg.
window.RB = window.RB || {};
RB.fysik = (function () {
  var K = RB.K, TURN = Math.PI / 6;
  function delar(config) {
    var motor = RB.motor(config.motor);
    var antal = config.steg === 2 ? [Math.ceil(config.bransle * .6), Math.floor(config.bransle * .4)] : [config.bransle];
    return antal.map(function (n) { return { block: n, torr: motor.massa + n * K.TANK, bransle: n * K.BRANSLE, fullt: n * K.BRANSLE }; });
  }
  function massa(f) {
    return K.KAPSEL + f.delar.reduce(function (sum, del, i) { return sum + (i < f.aktiv ? 0 : del.torr + del.bransle); }, 0);
  }
  function grav(x, y) { var r = Math.hypot(x, y), a = -K.MU / (r * r * r); return { x: a * x, y: a * y }; }
  function wrap(v) { return Math.atan2(Math.sin(v), Math.cos(v)); }
  function bana(x, y, vx, vy) {
    var r = Math.hypot(x, y), v2 = vx * vx + vy * vy, rv = x * vx + y * vy;
    var energi = v2 / 2 - K.MU / r, moment = x * vy - y * vx;
    var ex = ((v2 - K.MU / r) * x - rv * vx) / K.MU;
    var ey = ((v2 - K.MU / r) * y - rv * vy) / K.MU;
    var e = Math.hypot(ex, ey), p = moment * moment / K.MU;
    var peri = p / (1 + e) - K.R;
    var apo = energi < 0 ? -K.MU / (2 * energi) * (1 + e) - K.R : Infinity;
    return { energi: energi, moment: moment, e: e, p: p, riktning: Math.atan2(ey, ex), peri: peri, apo: apo,
      bunden: energi < 0, saker: energi < 0 && peri >= K.SAKER_BANA };
  }
  function uppdatera(f, dt) {
    var r = Math.hypot(f.x, f.y);
    f.h = Math.max(0, r - K.R - 2);
    var markVX = K.OMEGA * f.y, markVY = -K.OMEGA * f.x;
    f.fart = Math.hypot(f.vx - markVX, f.vy - markVY);
    f.radialfart = (f.x * f.vx + f.y * f.vy) / r;
    f.sidofart = (f.y * (f.vx - markVX) - f.x * (f.vy - markVY)) / r;
    f.maxHojd = Math.max(f.maxHojd, f.h); f.maxFart = Math.max(f.maxFart, f.fart);
    f.maxSidofart = Math.max(f.maxSidofart, Math.abs(f.sidofart));
    f.bana = bana(f.x, f.y, f.vx, f.vy);
    var motorBrinner = f.gas && f.delar[f.aktiv].bransle > 0;
    if (f.bana.saker && !motorBrinner) {
      f.banTid += dt;
      if (f.banTid >= 5) f.iBana = true;
      if (f.iBana) f.varv += Math.abs(f.bana.moment) / (r * r) * dt;
    } else { f.banTid = 0; f.varv = 0; }
  }
  function skapa(config) {
    config = RB.konfig(config);
    var r = K.R + 2;
    var f = { config: config, motor: RB.motor(config.motor), delar: delar(config), aktiv: 0,
      x: 0, y: r, vx: K.OMEGA * r, vy: 0, angle: 0, target: 0, gas: true,
      t: 0, h: 0, fart: 0, radialfart: 0, sidofart: 0, maxHojd: 0, maxFart: 0, maxSidofart: 0,
      lyft: false, slappt: false, iBana: false, banTid: 0, varv: 0, slut: null, rest: 0,
      spar: [{ x: 0, y: r }], sparTid: 0, nyaMarken: [], poang: 0 };
    uppdatera(f, 0); return f;
  }
  function data(config) {
    var f = skapa(config), vikt = massa(f);
    var fuel = f.delar.reduce(function (sum, del) { return sum + del.bransle; }, 0);
    return { vikt: vikt, bransle: fuel, torr: vikt - fuel };
  }
  function slapp(f) {
    if (f.slut || f.aktiv >= f.delar.length - 1) return false;
    f.aktiv++; f.slappt = true; return true;
  }
  function sikta(f, vinkel) { f.target = wrap(vinkel); }
  function steg(f, dt) {
    if (f.slut) return;
    var turn = wrap(f.target - f.angle);
    f.angle = wrap(f.angle + Math.max(-TURN * dt, Math.min(TURN * dt, turn)));
    var del = f.delar[f.aktiv], fore = massa(f);
    var brukat = f.gas ? Math.min(del.bransle, f.motor.kraft / f.motor.ve * dt) : 0;
    del.bransle = Math.max(0, del.bransle - brukat);
    var dv = brukat > 0 ? f.motor.ve * Math.log(fore / (fore - brukat)) : 0;
    var ax = Math.sin(f.angle) * dv / 2, ay = Math.cos(f.angle) * dv / 2;
    var g = grav(f.x, f.y);
    f.vx += g.x * dt / 2 + ax; f.vy += g.y * dt / 2 + ay;
    f.x += f.vx * dt; f.y += f.vy * dt;
    g = grav(f.x, f.y);
    f.vx += g.x * dt / 2 + ax; f.vy += g.y * dt / 2 + ay;
    f.t += dt;
    var r = Math.hypot(f.x, f.y);
    if (r <= K.R + 2) {
      if (f.lyft) {
        var relativa = Math.hypot(f.vx - K.OMEGA * f.y, f.vy + K.OMEGA * f.x);
        f.slut = relativa < 3 ? 'landning' : 'krasch'; f.gas = false;
        f.x *= (K.R + 2) / r; f.y *= (K.R + 2) / r;
      } else {
        // Startplattans normalkraft håller raketen kvar tills den verkligen lyfter.
        f.x = (K.R + 2) * Math.sin(K.OMEGA * f.t); f.y = (K.R + 2) * Math.cos(K.OMEGA * f.t);
        f.vx = K.OMEGA * f.y; f.vy = -K.OMEGA * f.x;
      }
    }
    if (r - K.R > 4) f.lyft = true;
    uppdatera(f, dt);
    f.sparTid += dt;
    if (f.sparTid >= 1) {
      f.sparTid = 0; f.spar.push({ x: f.x, y: f.y }); if (f.spar.length > 1500) f.spar.shift();
    }
    // Ingen höjd, topp eller bränsleförbrukning avslutar en fri flygning.
  }
  function tick(f, sekunder) {
    if (f.slut) return;
    f.rest += Math.max(0, sekunder);
    while (f.rest + 1e-12 >= K.DT && !f.slut) { steg(f, K.DT); f.rest -= K.DT; }
    if (f.slut) f.rest = 0;
  }
  return { skapa: skapa, tick: tick, slapp: slapp, sikta: sikta, massa: massa, data: data, bana: bana, grav: grav, uppdatera: uppdatera, wrap: wrap };
})();
