// Raketbyggaren – spelstatus, poäng, milstolpar, scenbyte och spelloop.
window.RB = window.RB || {};

RB.main = (function () {
  var SPAR_NYCKEL = 'raketbyggaren';
  var spel = { poang: 0, upplasta: [], milstolpar: [], flygningar: 0,
               basta: { hojd: 0, fart: 0 }, raket: [], hjalpVisad: false };
  var slutTimer = null;

  function laddaSpel() {
    try {
      var s = JSON.parse(localStorage.getItem(SPAR_NYCKEL));
      if (s && typeof s.poang === 'number') {
        Object.keys(spel).forEach(function (k) { if (s[k] !== undefined) spel[k] = s[k]; });
      }
    } catch (e) { /* trasig sparning – börja om */ }
  }
  function sparaSpel() {
    try { localStorage.setItem(SPAR_NYCKEL, JSON.stringify(spel)); } catch (e) { /* privat läge */ }
  }

  function harDel(id) {
    var d = RB.delDef(id);
    return d.kostnad === 0 || spel.upplasta.indexOf(id) !== -1;
  }

  function uppdateraPoang() {
    document.getElementById('poang-visning').textContent = spel.poang;
    document.getElementById('forskning-poang').textContent = spel.poang;
  }

  function toast(text) {
    var yta = document.getElementById('toast-yta');
    var el = document.createElement('div');
    el.className = 'toast';
    el.textContent = text;
    yta.appendChild(el);
    setTimeout(function () { el.remove(); }, 3900);
  }

  // ---------- milstolpar ----------
  function kollaMilstolpar(f) {
    RB.MILSTOLPAR.forEach(function (m) {
      if (spel.milstolpar.indexOf(m.id) !== -1) return;
      if (!m.villkor(f)) return;
      spel.milstolpar.push(m.id);
      spel.poang += m.poang;
      f._nya = f._nya || [];
      f._nya.push(m);
      toast(m.ikon + ' ' + m.namn + '  +' + m.poang + ' 🔬');
      uppdateraPoang();
      sparaSpel();
    });
  }

  // ---------- forskning ----------
  function renderForskning() {
    var lista = document.getElementById('forskning-lista');
    lista.innerHTML = '';
    RB.DELAR.filter(function (d) { return d.kostnad > 0; })
      .sort(function (a, b) { return a.kostnad - b.kostnad; })
      .forEach(function (d) {
        var agd = harDel(d.id);
        var kort = document.createElement('div');
        kort.className = 'forsk-kort' + (agd ? ' agd' : '');
        var data = [];
        if (d.typ === 'motor') data.push('🔥 ' + (d.dragkraft / 1000) + ' kN', 'vₑ ' + d.ve);
        if (d.bransle) data.push('⛽ ' + RB.fysik.formatKg(d.bransle));
        data.push('⚖ ' + RB.fysik.formatKg(d.massa));
        if (d.info) data.push(d.info);
        kort.innerHTML = '<span class="ikon">' + d.ikon + '</span>' +
          '<span class="info"><div class="namn">' + d.namn + '</div>' +
          '<div class="data">' + data.join(' · ') + '</div></span>';
        if (!agd) {
          var kop = document.createElement('button');
          kop.className = 'kop';
          kop.textContent = '🔬 ' + d.kostnad;
          kop.disabled = spel.poang < d.kostnad;
          kop.addEventListener('click', function () {
            if (spel.poang < d.kostnad) return;
            spel.poang -= d.kostnad;
            spel.upplasta.push(d.id);
            sparaSpel();
            uppdateraPoang();
            renderForskning();
            RB.bygg.renderPalett();
            toast(d.ikon + ' ' + d.namn + ' upplåst!');
          });
          kort.appendChild(kop);
        }
        lista.appendChild(kort);
      });

    var mal = document.getElementById('mal-lista');
    mal.innerHTML = '';
    RB.MILSTOLPAR.forEach(function (m) {
      var klar = spel.milstolpar.indexOf(m.id) !== -1;
      var rad = document.createElement('div');
      rad.className = 'mal-rad' + (klar ? ' klar' : '');
      rad.innerHTML = '<span>' + m.ikon + ' ' + m.namn + (klar ? ' ✓' : '') + '</span><b>+' + m.poang + ' 🔬</b>';
      mal.appendChild(rad);
    });
  }

  function oppnaForskning() {
    renderForskning();
    document.getElementById('modal-forskning').classList.add('oppen');
  }

  // ---------- scenbyte & flygning ----------
  function visaScen(id) {
    document.querySelectorAll('.scen').forEach(function (s) {
      s.classList.toggle('aktiv', s.id === id);
    });
  }

  function startaFlygning(stack) {
    spel.raket = stack.slice();
    sparaSpel();
    visaScen('scen-flyg');
    RB.rita.nyFlygKamera();
    RB.flyg.start(stack);
    toast('Gas ↑ och lyft! Mellanslag = nästa steg');
  }

  function flygSlut(drojsmal) {
    if (slutTimer) return;
    slutTimer = setTimeout(visaResultat, drojsmal);
  }

  function visaResultat() {
    slutTimer = null;
    var f = RB.flyg.tillstand();
    if (!f || f._resultatVisat) return;
    f._resultatVisat = true;
    if (!f.slut) f.slut = 'avslutad'; // stoppa fysiken bakom modalen

    var hojdPoang = Math.min(40, Math.round(f.maxHojd / 1000));
    spel.poang += hojdPoang;
    spel.flygningar++;
    if (f.maxHojd > spel.basta.hojd) spel.basta.hojd = f.maxHojd;
    if (f.maxFart > spel.basta.fart) spel.basta.fart = f.maxFart;
    sparaSpel();
    uppdateraPoang();

    var rubrik = document.getElementById('resultat-rubrik');
    if (f.slut === 'krasch') rubrik.textContent = '💥 Krasch!';
    else if (f.slut === 'landning') rubrik.textContent = '🧷 Mjuk landning!';
    else rubrik.textContent = '🏁 Flygning avslutad';

    document.getElementById('resultat-stats').innerHTML =
      '<div class="stat-box"><span class="varde">' + RB.fysik.formatMeter(f.maxHojd) + '</span><span class="etikett">Maxhöjd</span></div>' +
      '<div class="stat-box"><span class="varde">' + Math.round(f.maxFart) + '</span><span class="etikett">Maxfart (m/s)</span></div>' +
      '<div class="stat-box"><span class="varde">' + Math.round(f.t) + ' s</span><span class="etikett">Flygtid</span></div>';

    var milDiv = document.getElementById('resultat-milstolpar');
    milDiv.innerHTML = '';
    var milPoang = 0;
    (f._nya || []).forEach(function (m) {
      milPoang += m.poang;
      var rad = document.createElement('div');
      rad.className = 'ny-milstolpe';
      rad.textContent = m.ikon + ' ' + m.namn + '  +' + m.poang;
      milDiv.appendChild(rad);
    });
    document.getElementById('resultat-poang').textContent =
      '+' + (hojdPoang + milPoang) + ' 🔬';

    document.getElementById('modal-resultat').classList.add('oppen');
  }

  function tillBygget() {
    document.getElementById('modal-resultat').classList.remove('oppen');
    RB.flyg.rensa();
    visaScen('scen-bygg');
    RB.bygg.uppdatera();
    RB.bygg.renderPalett();
  }

  // ---------- spelloop ----------
  var forraTid = 0;
  function loop(tid) {
    var dt = Math.min(0.1, (tid - forraTid) / 1000 || 0.016);
    forraTid = tid;
    var f = RB.flyg.tillstand();
    if (f && document.getElementById('scen-flyg').classList.contains('aktiv')) {
      RB.flyg.tick(dt);
      RB.rita.ritaFlyg(f);
    }
    requestAnimationFrame(loop);
  }

  // ---------- tips ----------
  function startaTips() {
    var i = Math.floor(Math.random() * RB.TIPS.length);
    var el = document.getElementById('tips-rad');
    function visa() {
      el.innerHTML = RB.TIPS[i % RB.TIPS.length];
      i++;
    }
    visa();
    setInterval(visa, 9000);
  }

  function init() {
    laddaSpel();
    RB.rita.init();
    RB.flyg.init();
    RB.bygg.init(spel.raket);
    uppdateraPoang();
    startaTips();

    document.getElementById('btn-forskning').addEventListener('click', oppnaForskning);
    document.getElementById('btn-stang-forskning').addEventListener('click', function () {
      document.getElementById('modal-forskning').classList.remove('oppen');
    });
    document.getElementById('btn-hjalp').addEventListener('click', function () {
      document.getElementById('modal-hjalp').classList.add('oppen');
    });
    document.getElementById('btn-stang-hjalp').addEventListener('click', function () {
      document.getElementById('modal-hjalp').classList.remove('oppen');
    });
    document.getElementById('btn-till-bygget').addEventListener('click', tillBygget);
    document.getElementById('btn-avsluta').addEventListener('click', function () {
      if (slutTimer) { clearTimeout(slutTimer); slutTimer = null; }
      visaResultat();
    });
    document.querySelectorAll('.modal-bak').forEach(function (m) {
      m.addEventListener('click', function (e) {
        if (e.target === m && m.id !== 'modal-resultat') m.classList.remove('oppen');
      });
    });

    if (!spel.hjalpVisad) {
      spel.hjalpVisad = true;
      sparaSpel();
      document.getElementById('modal-hjalp').classList.add('oppen');
    }

    requestAnimationFrame(loop);
  }

  document.addEventListener('DOMContentLoaded', init);

  return {
    harDel: harDel,
    oppnaForskning: oppnaForskning,
    startaFlygning: startaFlygning,
    flygSlut: flygSlut,
    kollaMilstolpar: kollaMilstolpar,
    toast: toast,
    sparaRaket: function (stack) { spel.raket = stack.slice(); sparaSpel(); }
  };
})();
