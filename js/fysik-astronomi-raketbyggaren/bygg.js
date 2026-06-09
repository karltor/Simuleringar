// Raketbyggaren – byggscenen (VAB): stapla delar, räkna Δv/TWR per steg.
window.RB = window.RB || {};

RB.bygg = (function () {
  var stack = []; // del-id:n uppifrån och ned (index 0 = toppen)

  // Delar upp stacken i steg vid varje dekopplare. Steg 0 = nedersta (brinner först).
  // Dekopplaren ovanför ett steg följer med det steget när det släpps.
  function beraknaSteg(s) {
    var segment = [];
    var akt = { delar: [], torr: 0, bransle: 0, dragkraft: 0, flode: 0 };
    for (var i = s.length - 1; i >= 0; i--) {
      var d = RB.delDef(s[i]);
      if (d.typ === 'dekopplare') {
        akt.torr += d.massa;
        segment.push(akt);
        akt = { delar: [], torr: 0, bransle: 0, dragkraft: 0, flode: 0 };
        continue;
      }
      akt.delar.push(d.id);
      akt.torr += d.massa;
      if (d.typ === 'tank') akt.bransle += d.bransle;
      if (d.typ === 'motor') {
        akt.dragkraft += d.dragkraft;
        akt.flode += d.dragkraft / d.ve; // massflöde = F / ve
      }
    }
    segment.push(akt);

    var totalMassa = 0;
    segment.forEach(function (sg) { totalMassa = totalMassa + sg.torr + sg.bransle; });

    var steg = [];
    var massaKvar = totalMassa;
    var totalDv = 0;
    segment.forEach(function (sg) {
      var m0 = massaKvar;
      var m1 = m0 - sg.bransle;
      var ve = sg.flode > 0 ? sg.dragkraft / sg.flode : 0;
      var dv = (ve > 0 && sg.bransle > 0) ? ve * Math.log(m0 / m1) : 0;
      var twr = sg.dragkraft > 0 ? sg.dragkraft / (m0 * RB.K.G0) : 0;
      steg.push({ delar: sg.delar, torr: sg.torr, bransle: sg.bransle, dragkraft: sg.dragkraft,
                  ve: ve, m0: m0, m1: m1, dv: dv, twr: twr });
      totalDv += dv;
      massaKvar = m1 - sg.torr; // släpp stegets torrvikt (inkl. dekopplare)
    });

    var har = function (typ) {
      return s.some(function (id) { return RB.delDef(id).typ === typ; });
    };
    return {
      steg: steg, totalMassa: totalMassa, totalDv: totalDv,
      harKapsel: har('kapsel'), harMotor: har('motor'),
      harNos: har('nos'), harFallskarm: har('fallskarm')
    };
  }

  // ---------- UI ----------
  function renderPalett() {
    var lista = document.getElementById('palett-lista');
    lista.innerHTML = '';
    RB.GRUPPORDNING.forEach(function (grupp) {
      var rubrik = document.createElement('div');
      rubrik.className = 'del-grupp';
      rubrik.textContent = grupp;
      lista.appendChild(rubrik);
      RB.DELAR.forEach(function (d) {
        if (RB.GRUPPNAMN[d.typ] !== grupp) return;
        var agd = RB.main.harDel(d.id);
        var kort = document.createElement('button');
        kort.className = 'del-kort' + (agd ? '' : ' last');
        var data = [];
        if (d.typ === 'motor') data.push('🔥 ' + (d.dragkraft / 1000) + ' kN', 'vₑ ' + d.ve + ' m/s');
        if (d.bransle) data.push('⛽ ' + RB.fysik.formatKg(d.bransle));
        data.push('⚖ ' + RB.fysik.formatKg(d.massa));
        if (d.info) data.push(d.info);
        kort.innerHTML = '<span class="ikon">' + d.ikon + '</span>' +
          '<span class="info"><span class="namn">' + d.namn + (agd ? '' : ' 🔒 ' + d.kostnad) + '</span>' +
          '<span class="data">' + data.join(' · ') + '</span></span>';
        kort.addEventListener('click', function () {
          if (RB.main.harDel(d.id)) { laggTill(d.id); }
          else { RB.main.oppnaForskning(); }
        });
        lista.appendChild(kort);
      });
    });
  }

  function laggTill(id) {
    stack.push(id); // nya delar hamnar underst – man bygger uppifrån och ned
    uppdatera();
  }

  function renderStack() {
    var lista = document.getElementById('stack-lista');
    lista.innerHTML = '';
    stack.forEach(function (id, i) {
      var d = RB.delDef(id);
      var rad = document.createElement('div');
      rad.className = 'stack-rad';
      rad.innerHTML = '<span>' + d.ikon + '</span><span class="namn">' + d.namn + '</span>';
      var upp = document.createElement('button');
      upp.textContent = '▲';
      upp.disabled = i === 0;
      upp.addEventListener('click', function () {
        stack.splice(i - 1, 0, stack.splice(i, 1)[0]);
        uppdatera();
      });
      var ner = document.createElement('button');
      ner.textContent = '▼';
      ner.disabled = i === stack.length - 1;
      ner.addEventListener('click', function () {
        stack.splice(i + 1, 0, stack.splice(i, 1)[0]);
        uppdatera();
      });
      var bort = document.createElement('button');
      bort.textContent = '✕';
      bort.className = 'bort';
      bort.addEventListener('click', function () {
        stack.splice(i, 1);
        uppdatera();
      });
      rad.appendChild(upp); rad.appendChild(ner); rad.appendChild(bort);
      lista.appendChild(rad);
    });
  }

  function statBox(varde, etikett, klass) {
    return '<div class="stat-box ' + (klass || '') + '"><span class="varde">' + varde +
           '</span><span class="etikett">' + etikett + '</span></div>';
  }

  function uppdateraStatistik() {
    var r = beraknaSteg(stack);
    var statEl = document.getElementById('statistik');
    var steg1 = r.steg[0];
    var twrKlass = !r.harMotor ? '' : (steg1.twr >= 1.05 ? 'bra' : 'dalig');
    statEl.innerHTML =
      statBox(RB.fysik.formatKg(r.totalMassa), 'Massa m₀') +
      statBox(Math.round(r.totalDv) + '', 'Δv totalt (m/s)', r.totalDv > 0 ? 'bra' : '') +
      statBox(steg1.twr > 0 ? steg1.twr.toFixed(2) : '—', 'TWR (steg 1)', twrKlass) +
      statBox(r.steg.length + '', 'Steg');

    var stegEl = document.getElementById('steg-lista');
    stegEl.innerHTML = '';
    r.steg.forEach(function (st, i) {
      var rad = document.createElement('div');
      rad.className = 'steg-rad';
      var twrTxt = st.dragkraft > 0
        ? '<span' + (st.twr < 1.05 && i === 0 ? ' class="twr-dalig"' : '') + '>TWR ' + st.twr.toFixed(2) + '</span>'
        : '<span>—</span>';
      rad.innerHTML = '<span>Steg ' + (i + 1) + '</span>' + twrTxt +
                      '<b>Δv ' + Math.round(st.dv) + ' m/s</b>';
      stegEl.appendChild(rad);
    });

    // startvillkor
    var varning = '';
    if (stack.length === 0) varning = '← Klicka på delar för att bygga';
    else if (!r.harKapsel) varning = 'Raketen behöver en kapsel 🧑‍🚀';
    else if (!r.harMotor) varning = 'Raketen behöver en motor 🔥';
    else if (steg1.dragkraft === 0) varning = 'Nedersta steget saknar motor 🔥';
    else if (steg1.twr < 1.02) varning = 'För tung! TWR måste vara över 1 för att lyfta';
    document.getElementById('bygg-varning').textContent = varning;
    document.getElementById('btn-starta').disabled = varning !== '';
    return r;
  }

  function uppdatera() {
    renderStack();
    uppdateraStatistik();
    RB.rita.ritaBygg(stack);
    RB.main.sparaRaket(stack);
  }

  function init(sparadStack) {
    stack = (sparadStack || []).filter(function (id) { return RB.delDef(id); });
    renderPalett();
    document.getElementById('btn-tom').addEventListener('click', function () {
      stack = [];
      uppdatera();
    });
    document.getElementById('btn-starta').addEventListener('click', function () {
      RB.main.startaFlygning(stack.slice());
    });
    uppdatera();
  }

  return {
    init: init,
    uppdatera: uppdatera,
    renderPalett: renderPalett,
    beraknaSteg: beraknaSteg,
    hamtaStack: function () { return stack; }
  };
})();
