window.RB = window.RB || {};
RB.main = (function () {
  var NYCKEL = 'raketbyggaren-ceres-v3', spel, flyger = false, toastTimer = null;
  function el(id) { return document.getElementById(id); }
  function nytt() { return { version: 3, config: RB.konfig(), poang: 0, agda: ['start'], marken: [], logg: [], rekord: 0, totala: 0 }; }
  function giltigLogg(r) { return r && Number.isFinite(r.hojd) && r.hojd >= 0 && r.hojd < 1e12 && Number.isInteger(r.nummer) && r.nummer > 0 && r.config && Number.isFinite(r.fart) && Number.isFinite(r.tid); }
  function sakerKonfig() {
    spel.config = RB.konfig(spel.config);
    if (spel.agda.indexOf(spel.config.motor) === -1) spel.config.motor = 'start';
    if (spel.agda.indexOf('steg') === -1) spel.config.steg = 1;
  }
  function ladda() {
    spel = nytt();
    try {
      var d = JSON.parse(localStorage.getItem(NYCKEL)); if (!d || d.version !== 3) return;
      spel.config = RB.konfig(d.config); spel.poang = Number.isFinite(d.poang) ? Math.max(0, Math.min(1e6, Math.floor(d.poang))) : 0;
      spel.agda = ['start'].concat(RB.UPPGRADERINGAR.filter(function (u) { return Array.isArray(d.agda) && d.agda.indexOf(u.id) !== -1; }).map(function (u) { return u.id; }));
      spel.marken = RB.MARKEN.filter(function (m) { return Array.isArray(d.marken) && d.marken.indexOf(m.id) !== -1; }).map(function (m) { return m.id; });
      spel.logg = Array.isArray(d.logg) ? d.logg.filter(giltigLogg).slice(-40) : [];
      spel.rekord = Number.isFinite(d.rekord) ? Math.max(0, Math.min(1e12, d.rekord)) : 0;
      spel.totala = Math.max(spel.logg.reduce(function (n, r) { return Math.max(n, r.nummer); }, 0), Math.min(1e6, Math.max(0, Math.floor(Number(d.totala) || 0))));
    } catch (error) { /* Ett nytt spel fungerar också när sparningen är trasig eller blockerad. */ }
    sakerKonfig();
  }
  function spara() {
    try { localStorage.setItem(NYCKEL, JSON.stringify(spel)); el('spar-status').textContent = 'Sparas på den här enheten.'; }
    catch (error) { el('spar-status').textContent = 'Sparning avstängd i webbläsaren.'; }
  }
  function oppna(id) { el(id).showModal(); }
  function header() { el('poang').textContent = spel.poang; el('marken-antal').textContent = spel.marken.length + '/8'; el('rekord').textContent = spel.rekord > 0 ? RB.formatHojd(spel.rekord) : '—'; el('flyg-nummer').textContent = String(spel.totala + 1).padStart(2, '0'); }
  function loggKort(r) {
    var kort = document.createElement('div'); kort.className = 'logg-kort';
    var nr = document.createElement('span'); nr.textContent = '#' + r.nummer;
    var hojd = document.createElement('b'); hojd.textContent = RB.formatHojd(r.hojd);
    var meta = document.createElement('small'); meta.textContent = RB.motor(r.config.motor).namn + ' · ' + RB.konfig(r.config).bransle + ' block' + (r.bana ? ' · Bana ✓' : '');
    kort.append(nr, hojd, meta); return kort;
  }
  function logg() { el('logg-lista').replaceChildren(); spel.logg.slice(-3).forEach(function (r) { el('logg-lista').appendChild(loggKort(r)); }); el('btn-logg').hidden = !spel.logg.length; }
  function render() { header(); logg(); RB.bygg.render(spel, flyger); }
  function andra(data) { if (flyger) return; Object.assign(spel.config, data); sakerKonfig(); spara(); render(); }
  function andraBransle(delta) { andra({ bransle: spel.config.bransle + delta }); }
  function verkstad() {
    el('verkstad-poang').textContent = spel.poang; el('verkstad-lista').replaceChildren();
    RB.UPPGRADERINGAR.forEach(function (u) {
      var agd = spel.agda.indexOf(u.id) !== -1, kort = document.createElement('div'); kort.className = 'butik-kort';
      kort.innerHTML = '<svg class="ikon" aria-hidden="true"><use href="#ikon-' + u.ikon + '"/></svg><span class="butik-info"><b>' + u.namn + '</b><small>' + u.text + '</small></span>';
      var btn = document.createElement('button'); btn.className = 'knapp' + (agd ? '' : ' primar'); btn.textContent = agd ? 'Ägd ✓' : '★ ' + u.pris;
      btn.disabled = flyger || agd || spel.poang < u.pris; btn.setAttribute('aria-label', agd ? u.namn + ', ägd' : 'Köp ' + u.namn + ' för ' + u.pris + ' poäng');
      btn.addEventListener('click', function () {
        if (flyger || spel.poang < u.pris || spel.agda.indexOf(u.id) !== -1) return;
        spel.poang -= u.pris; spel.agda.push(u.id);
        if (u.id !== 'steg') spel.config.motor = u.id;
        spara(); render(); verkstad();
      });
      kort.appendChild(btn); el('verkstad-lista').appendChild(kort);
    });
  }
  function marken() {
    el('marken-lista').replaceChildren();
    RB.MARKEN.forEach(function (m) {
      var klar = spel.marken.indexOf(m.id) !== -1, rad = document.createElement('div'); rad.className = 'marke-rad' + (klar ? ' klar' : '');
      rad.innerHTML = '<span class="marke-ikon" aria-hidden="true">' + (klar ? '✓' : '☆') + '</span><span class="marke-info"><b>' + m.namn + '</b><span>' + m.text + '</span></span><b>★ ' + m.poang + '</b>';
      el('marken-lista').appendChild(rad);
    });
  }
  function prestationer(f) {
    var nya = RB.MARKEN.filter(function (m) { return spel.marken.indexOf(m.id) === -1 && m.villkor(f); });
    if (!nya.length) return;
    nya.forEach(function (m) { spel.marken.push(m.id); spel.poang += m.poang; f.poang += m.poang; f.nyaMarken.push(m.id); });
    el('toast').textContent = nya.map(function (m) { return m.namn + '  +' + m.poang + ' ★'; }).join(' · ');
    el('toast').hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(function () { el('toast').hidden = true; }, 3200);
    spara(); header();
    if (spel.marken.indexOf('bana') !== -1) el('bana-rekord').textContent = 'Omloppsbana ✓';
  }
  function starta() {
    if (flyger) return; flyger = true;
    el('btn-verkstad').disabled = true; el('btn-bygga-verkstad').disabled = true;
    RB.bygg.render(spel, true); RB.flyg.start(spel.config);
  }
  function resultat(f) {
    var r = { nummer: ++spel.totala, hojd: Math.round(f.maxHojd), fart: Math.round(f.maxFart), tid: f.t, config: Object.assign({}, f.config), bana: f.iBana };
    el('resultat-tag').textContent = 'FLYGNING ' + String(r.nummer).padStart(2, '0');
    el('resultat-rubrik').textContent = f.slut === 'krasch' ? 'Krasch.' : f.slut === 'landning' ? 'Tillbaka hel.' : f.iBana ? 'Omloppsbana!' : 'Flygning klar.';
    el('resultat-hojd').textContent = RB.formatHojd(r.hojd); el('resultat-fart').textContent = r.fart + ' m/s'; el('resultat-tid').textContent = RB.formatTid(r.tid);
    el('resultat-marken').replaceChildren();
    f.nyaMarken.forEach(function (id) { var chip = document.createElement('span'); chip.textContent = '✓ ' + RB.MARKEN.find(function (m) { return m.id === id; }).namn; el('resultat-marken').appendChild(chip); });
    el('resultat-poang').textContent = f.poang ? '+' + f.poang + ' ★' : '';
    spel.rekord = Math.max(spel.rekord, r.hojd); spel.logg.push(r); spel.logg = spel.logg.slice(-40);
    spara(); header(); logg(); oppna('dialog-resultat');
  }
  function fortsatt() {
    el('dialog-resultat').close(); RB.flyg.rensa(); flyger = false;
    el('btn-verkstad').disabled = false; el('btn-bygga-verkstad').disabled = false;
    render(); el('btn-starta').focus({ preventScroll: true });
    if (window.innerWidth < 760) document.querySelector('.bygg').scrollIntoView({ block: 'start', behavior: 'instant' });
  }
  function init() {
    ladda(); RB.rita.init(); RB.bygg.init(); RB.flyg.init(); spara(); render();
    el('btn-starta').addEventListener('click', starta); el('btn-fortsatt').addEventListener('click', fortsatt);
    ['btn-verkstad', 'btn-bygga-verkstad'].forEach(function (id) { el(id).addEventListener('click', function () { verkstad(); oppna('dialog-verkstad'); }); });
    el('btn-marken').addEventListener('click', function () { marken(); oppna('dialog-marken'); });
    el('btn-hjalp').addEventListener('click', function () { oppna('dialog-hjalp'); });
    el('btn-logg').addEventListener('click', function () { el('historik-lista').replaceChildren(); spel.logg.slice().reverse().forEach(function (r) { el('historik-lista').appendChild(loggKort(r)); }); oppna('dialog-logg'); });
    el('dialog-resultat').addEventListener('cancel', function (event) { event.preventDefault(); fortsatt(); });
    document.querySelectorAll('[data-stang]').forEach(function (btn) { btn.addEventListener('click', function () { el(btn.dataset.stang).close(); }); });
    el('btn-nollstall').addEventListener('click', function () { el('dialog-hjalp').close(); oppna('dialog-nollstall'); });
    el('btn-bekrafta-nollstall').addEventListener('click', function () { RB.flyg.rensa(); flyger = false; spel = nytt(); clearTimeout(toastTimer); el('btn-verkstad').disabled = false; el('btn-bygga-verkstad').disabled = false; spara(); render(); el('dialog-nollstall').close(); });
    var last = null;
    function loop(time) {
      var dt = last === null ? 0 : Math.min(.1, Math.max(0, (time - last) / 1000)); last = time;
      if (flyger && !document.hidden) {
        RB.flyg.tick(dt); var f = RB.flyg.tillstand(); if (f && !document.querySelector('dialog[open]')) RB.rita.rita(f.config, f);
      }
      requestAnimationFrame(loop);
    }
    document.addEventListener('visibilitychange', function () { last = null; });
    requestAnimationFrame(loop);
  }
  document.addEventListener('DOMContentLoaded', init);
  return { andra: andra, andraBransle: andraBransle, prestationer: prestationer, resultat: resultat };
})();
