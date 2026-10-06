// Uppdrag, jämförelser och lokal progression. Ingen inloggning eller nätanslutning.
window.RB = window.RB || {};
RB.main = (function () {
  var NYCKEL = 'raketbyggaren-klassrum-v2';
  var spel, sparar = true, flyger = false, uppdragVidStart = 0, nasta = false;
  function el(id) { return document.getElementById(id); }
  function nyttSpel() {
    return { version: 2, config: RB.konfig(), klara: [], aktuell: 0, logg: [], totala: 0,
      rekord: 0, jamforelse: { tva: null, sex: null } };
  }
  function giltigtForsok(r) {
    return r && Number.isFinite(r.hojd) && r.hojd >= 0 && r.hojd < 10000000 &&
      Number.isInteger(r.nummer) && r.nummer > 0 &&
      r.config && RB.MOTORER.some(function (m) { return m.id === r.config.motor; }) &&
      Number.isInteger(r.config.bransle) && r.config.bransle >= 1 && r.config.bransle <= 8 &&
      (r.config.steg === 1 || r.config.steg === 2) && (r.config.steg === 1 || r.config.bransle >= 2);
  }
  function ladda() {
    spel = nyttSpel();
    try {
      var data = JSON.parse(localStorage.getItem(NYCKEL));
      if (!data || data.version !== 2) return;
      if (Array.isArray(data.klara)) {
        for (var i = 0; i < 6; i++) { if (data.klara.indexOf(i) === -1) break; spel.klara.push(i); }
      }
      spel.aktuell = Math.max(0, Math.min(5, spel.klara.length, Math.floor(Number(data.aktuell) || 0)));
      spel.config = RB.konfig(data.config);
      if (Array.isArray(data.logg)) spel.logg = data.logg.filter(giltigtForsok).slice(-40);
      spel.totala = Math.max(spel.logg.reduce(function (max, r) { return Math.max(max, r.nummer); }, 0), Math.min(1000000, Math.max(0, Math.floor(Number(data.totala) || 0))));
      spel.rekord = Number.isFinite(data.rekord) && data.rekord >= 0 && data.rekord < 10000000 ? data.rekord : 0;
      spel.rekord = Math.max(spel.rekord, spel.logg.reduce(function (max, r) { return Math.max(max, r.hojd); }, 0));
      ['tva', 'sex'].forEach(function (key) {
        var r = data.jamforelse && data.jamforelse[key];
        if (giltigtForsok(r) && r.config.motor === 'start' && r.config.steg === 1 && r.config.bransle === (key === 'tva' ? 2 : 6)) spel.jamforelse[key] = r;
      });
    } catch (error) {
      // Trasig sparning ska inte hindra ett nytt spel. Åtkomstfel upptäcks vid spara.
    }
    sakerKonfig();
  }
  function sakerKonfig() {
    spel.config = RB.konfig(spel.config);
    if (RB.motor(spel.config.motor).upplasning > spel.klara.length) spel.config.motor = 'start';
    if (spel.klara.length < 4) spel.config.steg = 1;
    if (spel.aktuell === 1) { spel.config.motor = 'start'; spel.config.steg = 1; }
    if (spel.config.steg === 2) spel.config.bransle = Math.max(2, spel.config.bransle);
  }
  function spara() {
    try { localStorage.setItem(NYCKEL, JSON.stringify(spel)); sparar = true; }
    catch (error) { sparar = false; }
    el('spar-status').textContent = sparar ? 'Dina framsteg sparas i den här webbläsaren.' :
      'Sparning är avstängd här. Framstegen finns kvar så länge sidan är öppen.';
  }
  function oppna(id) { el(id).showModal(); }
  function renderUppdrag() {
    var u = RB.UPPDRAG[spel.aktuell], klar = spel.klara.indexOf(spel.aktuell) !== -1;
    el('uppdrag-nummer').textContent = spel.klara.length === 6 && spel.aktuell === 5 ? 'ALLA UPPDRAG KLARA · FORTSÄTT UTFORSKA' :
      'UPPDRAG ' + String(spel.aktuell + 1).padStart(2, '0') + ' / 06' + (klar ? ' · KLART' : '');
    el('uppdrag-rubrik').textContent = u.namn;
    el('uppdrag-text').textContent = spel.klara.length === 6 && spel.aktuell === 5 ?
      'Ditt rymdprogram är igång. Kan du slå ditt höjdrekord med mindre bränsle?' : u.text;
    el('start-tips').textContent = spel.totala === 0 ? 'Redo när du är. Första försöket börjar här.' : u.tips;
    el('mal-etikett').textContent = u.mal ? 'Mål: ' + RB.formatHojd(u.mal) : 'Uppdrag: jämför 2 och 6 block';
    el('uppdrag-framsteg').textContent = spel.klara.length + ' av 6 klara ↗';
    el('uppdrag-prickar').replaceChildren();
    RB.UPPDRAG.forEach(function (uppdrag, i) {
      var prick = document.createElement('span');
      prick.className = (spel.klara.indexOf(i) !== -1 ? 'klar ' : '') + (i === spel.aktuell ? 'aktuell' : '');
      prick.textContent = spel.klara.indexOf(i) !== -1 ? '✓' : i + 1;
      el('uppdrag-prickar').appendChild(prick);
    });
    el('rekord').textContent = spel.rekord > 0 ? RB.formatHojd(spel.rekord) : '—';
  }
  function loggKort(r, max, aktuell, prefix) {
    var kort = document.createElement('div'); kort.className = 'logg-kort' + (aktuell ? ' ny' : '');
    var rad = document.createElement('div'); rad.className = 'logg-label';
    var label = document.createElement('span'); label.textContent = prefix || 'FÖRSÖK ' + String(r.nummer).padStart(2, '0');
    var hojd = document.createElement('strong'); hojd.textContent = RB.formatHojd(r.hojd);
    rad.append(label, hojd);
    var meta = document.createElement('p'); meta.className = 'logg-meta';
    meta.textContent = RB.motor(r.config.motor).namn + ' · ' + r.config.bransle + ' block · ' + (r.config.steg === 2 ? 'Två steg' : 'Ett steg');
    var bar = document.createElement('div'); bar.className = 'logg-bar'; bar.setAttribute('aria-hidden', 'true');
    var fyllning = document.createElement('span'); fyllning.style.width = (100 * r.hojd / Math.max(1, max)) + '%';
    bar.appendChild(fyllning); kort.append(rad, meta, bar); return kort;
  }
  function renderLogg() {
    el('logg-lista').replaceChildren();
    el('btn-logg').hidden = spel.logg.length === 0;
    if (!spel.logg.length) {
      var text = document.createElement('p'); text.className = 'tom-logg';
      text.textContent = 'Här hamnar dina försök. Ändra en sak i taget och se vad som händer med höjden.';
      el('logg-lista').appendChild(text); return;
    }
    spel.logg.slice(-3).forEach(function (r, i, lista) { el('logg-lista').appendChild(loggKort(r, spel.rekord, i === lista.length - 1)); });
  }
  function render() { renderUppdrag(); renderLogg(); RB.bygg.render(spel, flyger); }
  function andra(data) {
    if (flyger) return;
    Object.assign(spel.config, data); sakerKonfig(); spara(); render();
  }
  function andraBransle(antal) { andra({ bransle: spel.config.bransle + antal }); }
  function starta() {
    if (flyger) return;
    flyger = true; uppdragVidStart = spel.aktuell; nasta = false;
    RB.bygg.render(spel, true);
    el('btn-uppdrag').disabled = true;
    RB.flyg.start(spel.config);
  }
  function klarat(f, id) {
    if (id === 1) return !!(spel.jamforelse.tva && spel.jamforelse.sex);
    if (f.maxHojd < RB.UPPDRAG[id].mal) return false;
    if (id === 2) return f.config.motor === 'kraft';
    if (id === 3) return f.config.bransle <= 3 && f.config.steg === 1;
    if (id === 4) return f.config.steg === 2 && f.slappt;
    return true;
  }
  function jamforForsok(r) {
    var tidigare = spel.logg.slice().reverse();
    if (uppdragVidStart === 1) return r.config.bransle === 2 ? spel.jamforelse.sex : spel.jamforelse.tva;
    return tidigare.find(function (p) {
      return p.config.motor === r.config.motor && p.config.steg === r.config.steg && p.config.bransle !== r.config.bransle;
    }) || tidigare.find(function (p) { return p.config.bransle === r.config.bransle; }) || tidigare[0] || null;
  }
  function insikt(f, tidigare) {
    if (uppdragVidStart === 1 && spel.jamforelse.tva && spel.jamforelse.sex) {
      var tva = spel.jamforelse.tva.hojd, sex = spel.jamforelse.sex.hojd;
      return '2 block nådde ' + RB.formatHojd(tva) + '. 6 block nådde ' + RB.formatHojd(sex) +
        '. Samma motor, mer bränsle – men lägre höjd! Det extra bränslet måste också lyftas.';
    }
    if (tidigare && tidigare.config.motor === f.config.motor && tidigare.config.steg === f.config.steg && tidigare.config.bransle !== f.config.bransle) {
      var mer = f.config.bransle > tidigare.config.bransle, diff = f.maxHojd - tidigare.hojd;
      if (mer && diff < -1) return 'Du tog mer bränsle, men nådde ' + RB.formatHojd(-diff) + ' lägre med samma motor. Bränslet gjorde också raketen tyngre. Testa lite mindre.';
      if (!mer && diff > 1) return 'Mindre bränsle, högre höjd! Den lättare raketen nådde ' + RB.formatHojd(diff) + ' högre med samma motor.';
      if (mer) return 'Mer bränsle hjälpte den här gången. Du nådde ' + RB.formatHojd(Math.max(0, diff)) + ' högre, men raketen blev också tyngre. Finns det en ännu bättre mängd?';
      return 'Den lättare raketen nådde lägre den här gången. Lite mer bränsle kan hjälpa – tills vikten börjar bromsa dig. Testa en mängd mitt emellan.';
    }
    if (f.markTid > 10) return 'Raketen var för tung för att lyfta direkt. Bränsle förbrukades på startplattan. En starkare motor eller mindre bränsle kan hjälpa.';
    if (f.slappt) {
      return 'Du släppte ' + RB.formatVikt(f.delar[0].torr) + ' tom tank och motor. Den vikten behövde nästa motor inte längre lyfta. Jämför gärna med samma bränsle i en enda del.';
    }
    if (tidigare && tidigare.config.bransle === f.config.bransle && tidigare.config.steg === f.config.steg && tidigare.config.motor !== f.config.motor) {
      return 'Samma bränslemängd, en annan motor. ' + RB.motor(f.config.motor).namn + ' nådde ' + RB.formatHojd(f.maxHojd) + '. Både motorns styrka och hur den använder bränslet spelar roll.';
    }
    return 'Raketen blev lättare när bränslet förbrukades. När tanken var tom fortsatte den upp av sin fart. Ändra bara bränslet i nästa försök och jämför höjden.';
  }
  function resultat(f) {
    var record = f.maxHojd > spel.rekord + .5;
    var r = { nummer: spel.totala + 1, hojd: Math.round(f.maxHojd), config: Object.assign({}, f.config),
      uppdrag: uppdragVidStart, slappt: f.slappt };
    var tidigare = jamforForsok(r);
    if (uppdragVidStart === 1 && f.config.motor === 'start' && f.config.steg === 1) {
      if (f.config.bransle === 2) spel.jamforelse.tva = r;
      if (f.config.bransle === 6) spel.jamforelse.sex = r;
    }
    var klar = klarat(f, uppdragVidStart);
    var nyKlar = klar && uppdragVidStart === spel.klara.length;
    if (nyKlar) spel.klara.push(uppdragVidStart);
    nasta = nyKlar && uppdragVidStart < 5;
    el('resultat-tag').textContent = klar ? 'UPPDRAG ' + (uppdragVidStart + 1) + ' KLART' : 'FÖRSÖK ' + r.nummer + ' · TESTET ÄR KLART';
    el('resultat-rubrik').textContent = nyKlar && uppdragVidStart === 5 ? 'Du nådde rymden!' : klar ?
      uppdragVidStart === 1 ? 'Mindre kan vara mer.' : 'Där satt den!' : record ? 'Nytt personbästa!' : 'En ny ledtråd.';
    el('resultat-hojd').textContent = r.hojd.toLocaleString('sv-SE');
    el('resultat-rekord').hidden = !record;
    el('resultat-insikt').textContent = insikt(f, tidigare);
    el('resultat-jamforelse').replaceChildren();
    if (tidigare) el('resultat-jamforelse').appendChild(loggKort(tidigare, Math.max(r.hojd, tidigare.hojd), false,
      'FÖRRA: ' + tidigare.config.bransle + ' BLOCK'));
    el('resultat-jamforelse').appendChild(loggKort(r, Math.max(r.hojd, tidigare ? tidigare.hojd : 0), true,
      'NU: ' + r.config.bransle + ' BLOCK'));
    el('resultat-mal').classList.toggle('ej-klar', !klar);
    el('resultat-mal').textContent = nyKlar ? RB.UPPDRAG[uppdragVidStart].beloning : klar ? 'Uppdraget klarat igen. Fortsätt experimentera!' :
      uppdragVidStart === 1 ? 'Ett försök till! Testa ' + (spel.jamforelse.tva ? '6' : '2') + ' block med startmotorn.' :
      'Nästa försök: ' + RB.UPPDRAG[uppdragVidStart].text;
    el('btn-fortsatt').innerHTML = (nasta ? 'Nästa uppdrag' : 'Förbättra raketen') + ' <svg class="ikon" aria-hidden="true"><use href="#ikon-pil"/></svg>';
    spel.totala = r.nummer; spel.rekord = Math.max(spel.rekord, r.hojd);
    spel.logg.push(r); spel.logg = spel.logg.slice(-40); spara(); renderUppdrag(); renderLogg();
    oppna('dialog-resultat');
  }
  function fortsatt() {
    el('dialog-resultat').close();
    RB.flyg.rensa(); flyger = false;
    el('btn-uppdrag').disabled = false;
    if (nasta) {
      spel.aktuell = Math.min(5, uppdragVidStart + 1);
      if (spel.aktuell === 1) { spel.config.motor = 'start'; spel.config.bransle = 2; spel.config.steg = 1; }
    }
    sakerKonfig(); spara(); render();
    el('btn-starta').focus({ preventScroll: true });
    if (window.innerWidth < 760) document.querySelector('.uppdrag').scrollIntoView({ block: 'start', behavior: 'instant' });
  }
  function visaUppdrag() {
    el('uppdrag-lista').replaceChildren();
    RB.UPPDRAG.forEach(function (u, i) {
      var klar = spel.klara.indexOf(i) !== -1, tillganglig = i <= spel.klara.length;
      var knapp = document.createElement('button');
      knapp.className = 'uppdrag-val' + (klar ? ' klar' : '') + (i === spel.aktuell ? ' aktuell' : '');
      knapp.disabled = !tillganglig;
      var siffra = document.createElement('span'); siffra.className = 'siffra'; siffra.textContent = klar ? '✓' : i + 1;
      var text = document.createElement('span'), namn = document.createElement('b'), status = document.createElement('small');
      namn.textContent = u.namn; status.textContent = klar ? 'Klart · prova igen' : tillganglig ? 'Ditt nästa uppdrag' : 'Låst · klara uppdrag ' + i + ' först';
      text.append(namn, status); knapp.append(siffra, text);
      knapp.addEventListener('click', function () { if (flyger) return; spel.aktuell = i; sakerKonfig(); spara(); render(); el('dialog-uppdrag').close(); });
      el('uppdrag-lista').appendChild(knapp);
    });
    oppna('dialog-uppdrag');
  }
  function visaLogg() {
    el('historik-lista').replaceChildren();
    spel.logg.slice().reverse().forEach(function (r, i) { el('historik-lista').appendChild(loggKort(r, spel.rekord, i === 0)); });
    oppna('dialog-logg');
  }
  function init() {
    ladda(); RB.rita.init(); RB.bygg.init(); RB.flyg.init(); spara(); render();
    el('btn-starta').addEventListener('click', starta);
    el('btn-hjalp').addEventListener('click', function () { oppna('dialog-hjalp'); });
    el('btn-fortsatt').addEventListener('click', fortsatt);
    el('btn-uppdrag').addEventListener('click', visaUppdrag);
    el('btn-logg').addEventListener('click', visaLogg);
    el('dialog-resultat').addEventListener('cancel', function (event) { event.preventDefault(); fortsatt(); });
    document.querySelectorAll('[data-stang]').forEach(function (btn) { btn.addEventListener('click', function () { el(btn.dataset.stang).close(); }); });
    el('btn-nollstall').addEventListener('click', function () { el('dialog-hjalp').close(); oppna('dialog-nollstall'); });
    el('btn-bekrafta-nollstall').addEventListener('click', function () {
      // Avbryt också eventuell pausad flygning innan progressionen återställs.
      RB.flyg.rensa(); flyger = false; nasta = false; el('btn-uppdrag').disabled = false;
      spel = nyttSpel(); spara(); render(); el('dialog-nollstall').close();
      el('btn-starta').focus({ preventScroll: true });
    });
    var forraTid = 0;
    function loop(tid) {
      var dt = Math.min(.05, Math.max(0, (tid - forraTid) / 1000)); forraTid = tid;
      if (flyger && !document.hidden) {
        RB.flyg.tick(dt);
        var f = RB.flyg.tillstand();
        if (f && !document.querySelector('dialog[open]')) RB.rita.rita(f.config, f, RB.UPPDRAG[uppdragVidStart].mal);
      }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }
  document.addEventListener('DOMContentLoaded', init);
  return { andra: andra, andraBransle: andraBransle, resultat: resultat };
})();
