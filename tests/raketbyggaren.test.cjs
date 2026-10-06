// Fysikregressioner. Kör: node --test tests/raketbyggaren.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const context = {}; context.window = context; vm.createContext(context);
for (const file of ['delar.js', 'fysik.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js/fysik-astronomi-raketbyggaren', file), 'utf8'), context);
const RB = context.RB, K = RB.K;

test('Ceres har rätt storlek och låg, höjdberoende gravitation', () => {
  assert.equal(K.R, 469700);
  const surface = Math.abs(RB.fysik.grav(0, K.R).y);
  assert.ok(surface > .28 && surface < .29);
  const high = Math.abs(RB.fysik.grav(0, K.R * 2).y);
  assert.ok(Math.abs(high / surface - .25) < 1e-12);
  assert.ok(Math.sqrt(K.MU / K.R) > 360 && Math.sqrt(K.MU / K.R) < 370);
});

test('två verkliga sekunder ger meter, inte tiotusentals meter', () => {
  const f = RB.fysik.skapa({ motor: 'start', bransle: 2, steg: 1 });
  const initialFuel = f.delar[0].bransle;
  assert.equal(f.fart, 0);
  RB.fysik.tick(f, 2);
  assert.ok(Math.abs(f.t - 2) < 1e-9);
  assert.ok(f.h > 3 && f.h < 10);
  assert.ok(Math.abs(initialFuel - f.delar[0].bransle - 2200 / 1500 * 2) < 1e-8);
  assert.equal(f.iBana, false);
});

test('fri cirkelbana bevarar energi och rörelsemängdsmoment under ett varv', () => {
  const f = RB.fysik.skapa({ motor: 'start', bransle: 2, steg: 1 });
  const r = K.R + 10000;
  Object.assign(f, { x: 0, y: r, vx: Math.sqrt(K.MU / r), vy: 0, gas: false, lyft: true });
  RB.fysik.uppdatera(f, 0);
  const E = f.bana.energi, L = f.bana.moment;
  const period = 2 * Math.PI * Math.sqrt(r ** 3 / K.MU);
  RB.fysik.tick(f, period + 1);
  assert.equal(f.slut, null);
  assert.equal(f.iBana, true);
  assert.ok(Math.abs((f.bana.energi - E) / E) < 1e-8);
  assert.ok(Math.abs((f.bana.moment - L) / L) < 1e-8);
  assert.ok(Math.abs(Math.hypot(f.x, f.y) - r) < 1);
  assert.ok(Math.abs(f.bana.peri - 10000) < 1);
});

test('höjd ensam eller flykthastighet räknas aldrig som omloppsbana', () => {
  for (const speed of [0, Math.sqrt(2 * K.MU / (K.R + 100000)) * 1.1]) {
    const f = RB.fysik.skapa();
    Object.assign(f, { x: 0, y: K.R + 100000, vx: speed, vy: 0, gas: false, lyft: true });
    RB.fysik.uppdatera(f, 0); RB.fysik.tick(f, 20);
    assert.equal(f.iBana, false);
    assert.equal(f.bana.saker, false);
  }
  const radial = RB.fysik.bana(0, K.R + 100000, 0, 0);
  assert.ok(Math.abs(radial.apo - 100000) < 1e-6);
});

test('första raketen kan nå en verklig, måttlig omloppsbana med två manövrer', () => {
  const f = RB.fysik.skapa({ motor: 'start', bransle: 2, steg: 1 });
  let phase = 0;
  // Testpilot, inte en autopilot i spelet: lyft, bygg sidofart, glid, bränn vid toppen.
  for (let t = 0; t < 1000 && !f.slut && !f.iBana; t++) {
    if (t === 20) RB.fysik.sikta(f, Math.PI / 2);
    if (phase === 0 && f.sidofart > 180) { f.gas = false; phase = 1; }
    if (phase === 1 && f.radialfart < 0) { f.gas = true; phase = 2; }
    if (phase === 2) RB.fysik.sikta(f, Math.atan2(f.x, f.y) + Math.PI / 2);
    if (phase === 2 && f.bana.saker) { f.gas = false; phase = 3; }
    RB.fysik.tick(f, 1);
  }
  assert.equal(f.iBana, true);
  assert.ok(f.bana.peri >= 1000);
  assert.ok(f.bana.apo < 20000);
  assert.ok(f.delar[0].bransle > 0);
});

test('stegbyte tappar faktisk massa, ger ingen gratis fart och pausar inte', () => {
  const f = RB.fysik.skapa({ motor: 'start', bransle: 4, steg: 2 });
  RB.fysik.tick(f, 5);
  const mass = RB.fysik.massa(f), shed = f.delar[0].torr + f.delar[0].bransle, vx = f.vx, vy = f.vy, time = f.t;
  assert.equal(RB.fysik.slapp(f), true);
  assert.ok(Math.abs(RB.fysik.massa(f) - (mass - shed)) < 1e-9);
  assert.equal(f.vx, vx); assert.equal(f.vy, vy);
  assert.equal(RB.fysik.slapp(f), false);
  RB.fysik.tick(f, 1); assert.ok(f.t > time + .9);
});

test('avstängd motor förbrukar inget bränsle och flygningen fortsätter genom toppen', () => {
  const f = RB.fysik.skapa();
  Object.assign(f, { x: 0, y: K.R + 1000, vx: 0, vy: 2, gas: false, lyft: true });
  const fuel = f.delar[0].bransle;
  RB.fysik.tick(f, 20);
  assert.equal(f.delar[0].bransle, fuel);
  assert.ok(f.radialfart < 0);
  assert.equal(f.slut, null);
});

test('bildfrekvensen ändrar inte fysiken och samtliga byggval ger ändliga värden', () => {
  const a = RB.fysik.skapa(), b = RB.fysik.skapa();
  RB.fysik.tick(a, 60);
  for (let i = 0; i < 3600; i++) RB.fysik.tick(b, 1 / 60);
  assert.ok(Math.abs(a.x - b.x) < 1e-8 && Math.abs(a.y - b.y) < 1e-8);
  for (const motor of RB.MOTORER) for (const stage of [1, 2]) for (let fuel = stage; fuel <= 8; fuel++) {
    const f = RB.fysik.skapa({ motor: motor.id, bransle: fuel, steg: stage }); RB.fysik.tick(f, 60);
    assert.ok([f.x,f.y,f.vx,f.vy,f.h,RB.fysik.massa(f)].every(Number.isFinite));
    assert.ok(f.delar.every(d => d.bransle >= 0));
  }
});
