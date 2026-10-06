window.RB = window.RB || {};
RB.flyg = (function () {
  var f = null, warp = 1, klarVisad = false, hudTid = 0;
  function el(id) { return document.getElementById(id); }
  function luta(delta) { if (f && !f.slut) RB.fysik.sikta(f, f.target + delta * Math.PI / 180); }
  function motor() { if (f && !f.slut) { f.gas = !f.gas; hud(); } }
  function init() {
    el('btn-vanster').addEventListener('click', function () { luta(-15); });
    el('btn-hoger').addEventListener('click', function () { luta(15); });
    el('btn-motor').addEventListener('click', motor);
    el('btn-stega').addEventListener('click', function () { if (f) RB.fysik.slapp(f); hud(); });
    el('tid-val').addEventListener('change', function () { warp = Number(this.value); });
    el('btn-avsluta').addEventListener('click', function () { if (f && !f.slut) { f.slut = 'avslutad'; uppdatera(); } });
    window.addEventListener('keydown', function (event) {
      if (!f || f.slut || document.querySelector('dialog[open]') || /^(SELECT|INPUT)$/.test(event.target.tagName)) return;
      if (event.code === 'ArrowLeft' || event.code === 'ArrowRight') {
        event.preventDefault(); luta((event.code === 'ArrowLeft' ? -1 : 1) * (event.repeat ? 3 : 15));
      }
      if (event.code === 'Space') { event.preventDefault(); if (!event.repeat) motor(); }
    });
  }
  function start(config) {
    f = RB.fysik.skapa(config); warp = 1; klarVisad = false; hudTid = 0;
    el('tid-val').value = '1'; el('start-rad').hidden = true; el('flyg-kontroller').hidden = false;
    el('tid-kontroll').hidden = false; el('flyg-data').hidden = false; el('plats-namn').hidden = true; el('scen-signatur').hidden = true;
    el('raketCanvas').focus({ preventScroll: true }); hud();
    if (window.innerWidth < 760) el('scen').scrollIntoView({ block: 'center', behavior: 'instant' });
  }
  function hud() {
    if (!f) return;
    var del = f.delar[f.aktiv], procent = Math.round(del.bransle / del.fullt * 100);
    el('flyg-hojd').textContent = RB.formatHojd(f.h); el('flyg-fart').textContent = Math.round(f.fart) + ' m/s';
    el('flyg-tid').textContent = RB.formatTid(f.t); el('flyg-del').textContent = f.config.steg === 2 ? 'Bränsle · del ' + (f.aktiv + 1) : 'Bränsle';
    el('flyg-bransle-procent').textContent = procent + ' %'; el('flyg-bransle').style.width = procent + '%';
    var active = f.gas && del.bransle > 0;
    el('btn-motor').textContent = del.bransle <= 0 ? 'Tank tom' : f.gas ? 'Motor på' : 'Motor av';
    el('btn-motor').classList.toggle('av', !active); el('btn-motor').setAttribute('aria-pressed', String(f.gas));
    el('btn-stega').hidden = f.config.steg !== 2; el('btn-stega').disabled = f.aktiv > 0;
    el('btn-stega').textContent = f.aktiv > 0 ? 'Steg släppt' : 'Släpp steg';
    el('flyg-vinkel').textContent = Math.round(RB.fysik.wrap(f.angle - Math.atan2(f.x, f.y)) * 180 / Math.PI) + '°';
    el('ban-data').hidden = RB.rita.vy() !== 'bana';
    el('ban-apo').textContent = f.bana.bunden ? RB.formatHojd(f.bana.apo) : 'Ingen';
    el('ban-peri').textContent = f.bana.peri <= 0 ? 'Under marken' : RB.formatHojd(f.bana.peri);
    el('ban-status').textContent = !f.bana.bunden ? 'På väg från Ceres' : f.bana.saker ? 'Fri bana runt Ceres' : 'Banan korsar marken';
    el('ban-data').classList.toggle('saker', f.bana.saker);
  }
  function uppdatera() {
    if (!f) return;
    RB.main.prestationer(f);
    hud();
    if (f.slut && !klarVisad) { klarVisad = true; RB.main.resultat(f); }
  }
  function tick(dt) {
    if (!f || document.querySelector('dialog[open]')) return;
    RB.fysik.tick(f, dt * warp);
    RB.main.prestationer(f);
    hudTid += dt;
    if (hudTid >= .1 || f.slut) { hudTid = 0; uppdatera(); }
  }
  function rensa() {
    f = null; warp = 1;
    ['flyg-kontroller', 'tid-kontroll', 'flyg-data', 'ban-data'].forEach(function (id) { el(id).hidden = true; });
    el('start-rad').hidden = false; el('plats-namn').hidden = false; el('scen-signatur').hidden = false; el('toast').hidden = true;
  }
  return { init: init, start: start, tick: tick, rensa: rensa, hud: hud, tillstand: function () { return f; } };
})();
