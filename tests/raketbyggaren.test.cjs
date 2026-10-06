// Kör med: node --test tests/raketbyggaren.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const context = {};
context.window = context;
vm.createContext(context);
for (const filename of ['delar.js', 'fysik.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'fysik-astronomi-raketbyggaren', filename), 'utf8'), context);
}
const RB = context.RB;

test('samma motor når lägre med sex block än med två', () => {
  const light = RB.fysik.prova({ motor: 'start', bransle: 2, steg: 1 });
  const heavy = RB.fysik.prova({ motor: 'start', bransle: 6, steg: 1 });
  assert.ok(light.maxHojd > heavy.maxHojd);
  assert.ok(heavy.markTid > light.markTid + 10);
  assert.equal(light.delar[0].bransle, 0);
  assert.equal(heavy.delar[0].bransle, 0);
});

test('varje uppdrags höjdmål går att nå med tillgängliga delar', () => {
  for (const [mission, config] of [
    [0, { motor: 'start', bransle: 1, steg: 1 }],
    [2, { motor: 'kraft', bransle: 3, steg: 1 }],
    [3, { motor: 'snal', bransle: 3, steg: 1 }],
    [4, { motor: 'snal', bransle: 4, steg: 2 }],
    [5, { motor: 'kraft', bransle: 7, steg: 2 }]
  ]) {
    assert.ok(RB.motor(config.motor).upplasning <= mission);
    assert.ok(RB.fysik.prova(config).maxHojd >= RB.UPPDRAG[mission].mal, `Uppdrag ${mission + 1}`);
  }
});

test('stegbyte väntar utan bränsleförbrukning och släpper bara torr massa', () => {
  const f = RB.fysik.skapa({ motor: 'snal', bransle: 4, steg: 2 });
  assert.equal(RB.fysik.slapp(f), false);
  RB.fysik.tick(f, 1201);
  assert.equal(f.vantande, true);
  assert.equal(f.aktiv, 0);
  const before = { mass: RB.fysik.massa(f), time: f.t, height: f.h, velocity: f.v };
  RB.fysik.tick(f, 500);
  assert.equal(f.t, before.time);
  assert.equal(f.h, before.height);
  assert.equal(RB.fysik.slapp(f), true);
  assert.ok(Math.abs(RB.fysik.massa(f) - (before.mass - f.delar[0].torr)) < 1e-8);
  assert.equal(f.v, before.velocity);
  assert.equal(f.rest, 0);
  assert.equal(RB.fysik.slapp(f), false);
  RB.fysik.tick(f, 1201);
  assert.equal(f.slut, true);
  assert.equal(f.slappt, true);
});

test('varierande bildfrekvens ändrar inte fysikresultatet', () => {
  const config = { motor: 'kraft', bransle: 6, steg: 1 };
  const expected = RB.fysik.prova(config);
  const f = RB.fysik.skapa(config);
  const frames = [.008, .023, .016, .051, .1];
  let i = 0;
  while (!f.slut) RB.fysik.tick(f, frames[(i++) % frames.length]);
  assert.ok(Math.abs(expected.maxHojd - f.maxHojd) < 1e-8);
  assert.equal(expected.t, f.t);
});

test('alla val ger ändliga resultat, positiv massa och aldrig negativt bränsle', () => {
  for (const motor of RB.MOTORER) for (const stage of [1, 2]) for (let fuel = stage; fuel <= 8; fuel++) {
    const config = { motor: motor.id, bransle: fuel, steg: stage };
    const data = RB.fysik.data(config);
    assert.equal(data.bransle, fuel * 500);
    assert.equal(data.vikt, data.torr + data.bransle);
    const f = RB.fysik.prova(config);
    assert.ok(Number.isFinite(f.maxHojd));
    assert.ok(Number.isFinite(f.v));
    assert.ok(f.maxHojd >= 0 && f.h >= 0);
    assert.ok(RB.fysik.massa(f) > 0);
    assert.ok(f.delar.every(d => d.bransle >= 0));
    assert.equal(f.slut, true);
    assert.ok(f.t <= 1201);
  }
});
