// Automatisk provflygning. Enda raketmanövern är ett lugnt, pausat stegbyte.
window.RB = window.RB || {};
RB.flyg = (function () {
  var f = null, paus = false, nedrakning = 0, harVantat = false, klarVisad = false;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function el(id) { return document.getElementById(id); }
  function init() {
    el('btn-paus').addEventListener('click', function () {
      if (!f || f.vantande || nedrakning > 0) return;
      paus = !paus;
      hud();
    });
    el('btn-slapp').addEventListener('click', function () {
      if (!f || !RB.fysik.slapp(f)) return;
      harVantat = false;
      el('live-status').textContent = 'Tom del släppt. Den lättare raketen flyger vidare.';
      el('btn-paus').focus({ preventScroll: true });
      hud();
    });
    el('btn-resultat').addEventListener('click', function () {
      if (!f || nedrakning > 0) return;
      paus = false;
      // Hoppa genom samma fysik. Ett stegbyte måste fortfarande göras av eleven.
      RB.fysik.tick(f, 1201);
      uppdatera();
    });
  }
  function start(config) {
    f = RB.fysik.skapa(config);
    paus = false; harVantat = false; klarVisad = false;
    nedrakning = reduce ? 0 : 1.5;
    el('start-rad').hidden = true;
    el('flyg-kontroller').hidden = false;
    el('flyg-data').hidden = false;
    hud();
    el('btn-paus').focus({ preventScroll: true });
    if (window.innerWidth < 760) el('scen').scrollIntoView({ block: 'center', behavior: reduce ? 'instant' : 'smooth' });
  }
  function hud() {
    if (!f) return;
    var del = f.delar[f.aktiv], procent = Math.max(0, Math.round(100 * del.bransle / del.fullt));
    el('flyg-hojd').textContent = RB.formatHojd(f.h);
    el('flyg-bransle-procent').textContent = procent + ' %';
    el('flyg-bransle').style.width = procent + '%';
    el('flyg-del').textContent = f.config.steg === 2 ? 'Bränsle, del ' + (f.aktiv + 1) : 'Bränsle kvar';
    el('btn-paus').textContent = paus ? 'Fortsätt flyga' : 'Pausa';
    el('btn-paus').setAttribute('aria-pressed', String(paus));
    el('btn-paus').disabled = f.vantande || nedrakning > 0;
    el('btn-resultat').disabled = f.vantande || nedrakning > 0;
    el('btn-slapp').hidden = !f.vantande;
    el('steg-meddelande').hidden = !f.vantande;
    el('nedrakning').hidden = nedrakning <= 0;
    el('nedrakning').textContent = nedrakning > 0 ? Math.ceil(nedrakning * 2) : '';
    var text = f.vantande ? 'Dags att göra raketen lättare.' : paus ? 'Pausat. Fortsätt när du vill.' :
      nedrakning > 0 ? 'Nu kör vi!' : f.h < 1 && f.t > 2 ? 'Bränslet väger. Raketen kämpar för att lyfta.' :
      f.fas === 'glid' ? 'Bränslet är slut. Raketen fortsätter upp av sin fart.' :
      f.slappt ? 'Lättare raket. Nästa motor är igång!' : 'Motorn brinner. Följ höjden!';
    // Ändra live-text bara vid fasbyten, inte för varje bildruta.
    if (el('flyg-status').textContent !== text) el('flyg-status').textContent = text;
    el('scen-meddelande').textContent = paus ? 'Pausat' : f.vantande ? 'Släpp dödvikten.' : f.fas === 'glid' ? 'Hur högt kommer vi?' : 'På väg upp!';
  }
  function uppdatera() {
    hud();
    if (f.vantande && !harVantat) {
      harVantat = true;
      el('btn-slapp').focus({ preventScroll: true });
      el('live-status').textContent = 'Första delen är tom. Spelet är pausat. Tryck på Släpp tom del.';
    }
    if (f.slut && !klarVisad) {
      klarVisad = true;
      RB.main.resultat(f);
    }
  }
  function tick(dt) {
    if (!f) return;
    if (document.querySelector('dialog[open]')) return;
    if (nedrakning > 0) {
      nedrakning = Math.max(0, nedrakning - dt);
      hud();
      return;
    }
    if (!paus && !f.vantande && !f.slut) RB.fysik.tick(f, dt * (f.fas === 'glid' ? 30 : 20));
    uppdatera();
  }
  function rensa() {
    f = null;
    el('flyg-kontroller').hidden = true;
    el('flyg-data').hidden = true;
    el('steg-meddelande').hidden = true;
    el('nedrakning').hidden = true;
    el('start-rad').hidden = false;
    el('scen-meddelande').textContent = 'Liten raket. Stora planer.';
  }
  return { init: init, start: start, tick: tick, rensa: rensa, tillstand: function () { return f; } };
})();
