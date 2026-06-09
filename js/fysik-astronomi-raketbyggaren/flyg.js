// Raketbyggaren – flygscenen: numerisk simulering av uppskjutningen.
window.RB = window.RB || {};

RB.flyg = (function () {
  var DT = 1 / 120;        // fysikens tidssteg (s)
  var ROT_HAST = 1.8;      // rotationshastighet (rad/s)
  var f = null;            // aktuellt flygtillstånd

  function totalHojd(stack) {
    var h = 0;
    stack.forEach(function (id) { h += RB.delDef(id).hojd; });
    return h;
  }

  function start(stack) {
    var byggInfo = RB.bygg.beraknaSteg(stack);
    var H = totalHojd(stack);
    f = {
      stack: stack,
      steg: byggInfo.steg.map(function (s) {
        return { delar: s.delar, torr: s.torr, dragkraft: s.dragkraft,
                 flode: s.dragkraft > 0 ? s.dragkraft / s.ve : 0,
                 bransle: s.bransle, kapacitet: Math.max(1, s.bransle) };
      }),
      aktivtSteg: 0,
      harNos: byggInfo.harNos,
      harFallskarm: byggInfo.harFallskarm,
      raketHojd: H,
      pos: { x: 0, y: RB.K.PLANET_R + H / 2 },
      vel: { x: 0, y: 0 },
      ang: Math.PI / 2,    // raketens "upp" i världen; start = rakt ut från planeten
      rotInput: 0,
      gas: 0,
      warp: 1,
      t: 0,
      hojd: 0, fart: 0,
      maxHojd: 0, maxFart: 0,
      bana: null,
      iBana: false, nareManen: false, mjukLandning: false,
      fallskarmUte: false,
      slut: null,          // null | 'krasch' | 'landning'
      spar: [], sparTid: 0,
      partiklar: [],
      avlossadeSteg: []    // jettisonerade steg som faller fritt (bara visuellt)
    };
    sattGas(0);
    sattWarp(1);
    return f;
  }

  // massa som återstår: torrvikt + kvarvarande bränsle för aktivt steg och stegen ovanför
  function massa() {
    var m = 0;
    for (var i = f.aktivtSteg; i < f.steg.length; i++) {
      m += f.steg[i].torr + f.steg[i].bransle;
    }
    return m;
  }

  function fysikSteg(dt) {
    var st = f.steg[f.aktivtSteg];
    var m = massa();
    var r = Math.sqrt(f.pos.x * f.pos.x + f.pos.y * f.pos.y);
    var altBotten = r - RB.K.PLANET_R - f.raketHojd / 2;

    // dragkraft
    var ax = 0, ay = 0;
    if (f.gas > 0 && st.dragkraft > 0 && st.bransle > 0) {
      var F = st.dragkraft * f.gas;
      st.bransle -= st.flode * f.gas * dt;
      if (st.bransle < 0) st.bransle = 0;
      ax += (F / m) * Math.cos(f.ang);
      ay += (F / m) * Math.sin(f.ang);
    }

    // gravitation (planet + måne)
    var g = RB.fysik.gravitation(f.pos.x, f.pos.y, f.t);
    ax += g.x; ay += g.y;

    // luftmotstånd
    var rho = RB.fysik.densitet(altBotten);
    if (rho > 0) {
      var fart2 = f.vel.x * f.vel.x + f.vel.y * f.vel.y;
      if (fart2 > 0.01) {
        var fart = Math.sqrt(fart2);
        var radVel = (f.pos.x * f.vel.x + f.pos.y * f.vel.y) / r;
        if (f.harFallskarm && !f.fallskarmUte && altBotten < 1200 && radVel < 0 && fart < 300) {
          f.fallskarmUte = true;
        }
        var cdA = (f.harNos ? RB.K.CD_NOS : RB.K.CD) * RB.K.AREA;
        if (f.fallskarmUte) cdA += altBotten < 400 ? RB.K.FALLSKARM_CDA : RB.K.FALLSKARM_CDA / 4;
        var Fd = 0.5 * rho * fart2 * cdA;
        ax -= (Fd / m) * (f.vel.x / fart);
        ay -= (Fd / m) * (f.vel.y / fart);
      }
    }

    f.vel.x += ax * dt;
    f.vel.y += ay * dt;
    f.pos.x += f.vel.x * dt;
    f.pos.y += f.vel.y * dt;
    f.ang += f.rotInput * ROT_HAST * dt;
    f.t += dt;

    // markkontakt
    r = Math.sqrt(f.pos.x * f.pos.x + f.pos.y * f.pos.y);
    var minR = RB.K.PLANET_R + f.raketHojd / 2;
    if (r <= minR) {
      var fartNu = Math.sqrt(f.vel.x * f.vel.x + f.vel.y * f.vel.y);
      var skala = minR / r;
      f.pos.x *= skala; f.pos.y *= skala;
      if (f.maxHojd > 50) {
        if (fartNu > 10) { krasch(); }
        else { landa(); }
      } else {
        // står kvar på plattan: ta bort inåtriktad hastighet
        var rad = (f.pos.x * f.vel.x + f.pos.y * f.vel.y) / minR;
        if (rad < 0) {
          f.vel.x -= rad * f.pos.x / minR;
          f.vel.y -= rad * f.pos.y / minR;
        }
      }
    }
  }

  function krasch() {
    f.slut = 'krasch';
    f.gas = 0;
    var n = 70;
    for (var i = 0; i < n; i++) {
      var v = Math.random() * Math.PI * 2;
      var s = 20 + Math.random() * 90;
      f.partiklar.push({ x: f.pos.x, y: f.pos.y,
        vx: f.vel.x * 0.1 + Math.cos(v) * s, vy: f.vel.y * 0.1 + Math.sin(v) * s,
        liv: 1 + Math.random() });
    }
    RB.main.flygSlut(1500);
  }

  function landa() {
    f.slut = 'landning';
    f.gas = 0;
    f.vel.x = 0; f.vel.y = 0;
    if (f.maxHojd > 50) f.mjukLandning = true;
    RB.main.flygSlut(1200);
  }

  function stega() {
    if (!f || f.slut) return;
    if (f.aktivtSteg >= f.steg.length - 1) return;
    var bort = f.steg[f.aktivtSteg];
    f.avlossadeSteg.push({
      delar: bort.delar.slice(),
      pos: { x: f.pos.x, y: f.pos.y },
      vel: { x: f.vel.x * 0.985, y: f.vel.y * 0.985 },
      ang: f.ang, fodd: f.t
    });
    f.aktivtSteg++;
    RB.main.toast('⏏ Steg ' + (f.aktivtSteg + 1));
  }

  function uppdateraAvlossade(dt) {
    f.avlossadeSteg.forEach(function (s) {
      var g = RB.fysik.gravitation(s.pos.x, s.pos.y, f.t);
      s.vel.x += g.x * dt; s.vel.y += g.y * dt;
      s.pos.x += s.vel.x * dt; s.pos.y += s.vel.y * dt;
      var r = Math.sqrt(s.pos.x * s.pos.x + s.pos.y * s.pos.y);
      if (r < RB.K.PLANET_R) s.dod = true;
    });
    f.avlossadeSteg = f.avlossadeSteg.filter(function (s) { return !s.dod && f.t - s.fodd < 120; });
  }

  // körs en gång per bildruta
  function tick(frameDt) {
    if (!f) return;
    if (f.slut) {
      f.partiklar.forEach(function (p) {
        p.x += p.vx * frameDt; p.y += p.vy * frameDt; p.liv -= frameDt;
      });
      f.partiklar = f.partiklar.filter(function (p) { return p.liv > 0; });
      return;
    }

    var simTid = Math.min(frameDt, 0.1) * f.warp;
    var n = Math.min(2600, Math.max(1, Math.round(simTid / DT)));
    for (var i = 0; i < n; i++) {
      fysikSteg(DT);
      if (f.slut) break;
    }
    uppdateraAvlossade(Math.min(simTid, 2));

    // härledda värden
    var r = Math.sqrt(f.pos.x * f.pos.x + f.pos.y * f.pos.y);
    f.hojd = Math.max(0, r - RB.K.PLANET_R - f.raketHojd / 2);
    f.fart = Math.sqrt(f.vel.x * f.vel.x + f.vel.y * f.vel.y);
    if (f.hojd > f.maxHojd) f.maxHojd = f.hojd;
    if (f.fart > f.maxFart) f.maxFart = f.fart;
    f.bana = RB.fysik.banelement(f.pos.x, f.pos.y, f.vel.x, f.vel.y);
    if (!f.iBana && !f.bana.hyperbolisk && f.bana.peri > RB.K.ATM_HOJD) f.iBana = true;
    var m = RB.fysik.manePos(f.t);
    var dM = Math.hypot(f.pos.x - m.x, f.pos.y - m.y);
    if (dM < 60000) f.nareManen = true;

    // spår
    f.sparTid += simTid;
    if (f.sparTid > 0.5) {
      f.sparTid = 0;
      f.spar.push({ x: f.pos.x, y: f.pos.y });
      if (f.spar.length > 2500) f.spar.shift();
    }

    RB.main.kollaMilstolpar(f);
    uppdateraHUD();
  }

  function uppdateraHUD() {
    var st = f.steg[f.aktivtSteg];
    document.getElementById('hud-hojd').textContent = RB.fysik.formatMeter(f.hojd);
    document.getElementById('hud-fart').textContent = Math.round(f.fart) + ' m/s';
    var apoEl = document.getElementById('hud-apo');
    var periEl = document.getElementById('hud-peri');
    if (f.bana && f.maxHojd > 10) {
      apoEl.textContent = f.bana.hyperbolisk ? '∞' : RB.fysik.formatMeter(Math.max(0, f.bana.apo));
      periEl.textContent = f.bana.peri > 0 ? RB.fysik.formatMeter(f.bana.peri) : '—';
    } else { apoEl.textContent = '—'; periEl.textContent = '—'; }
    var t = Math.floor(f.t);
    document.getElementById('hud-tid').textContent =
      t < 120 ? t + ' s' : Math.floor(t / 60) + ' min ' + (t % 60) + ' s';
    document.getElementById('hud-steg').textContent =
      'Steg ' + (f.aktivtSteg + 1) + '/' + f.steg.length;
    document.getElementById('hud-bransle').style.width =
      Math.round(100 * st.bransle / st.kapacitet) + '%';
  }

  function sattGas(v) {
    if (!f) return;
    f.gas = Math.min(1, Math.max(0, v));
    if (f.gas > 0 && f.warp > 1) sattWarp(1);
    document.getElementById('gas-slider').value = Math.round(f.gas * 100);
  }

  function sattWarp(w) {
    if (!f) return;
    f.warp = w;
    if (w > 1) sattGas(0);
    document.querySelectorAll('#warp-knappar button').forEach(function (b) {
      b.classList.toggle('aktiv-warp', Number(b.dataset.warp) === w);
    });
  }

  function rotera(riktning) {
    if (!f) return;
    f.rotInput = riktning;
    if (riktning !== 0 && f.warp > 1) sattWarp(1);
  }

  // ---------- kontroller ----------
  function hallKnapp(el, ner, upp) {
    el.addEventListener('pointerdown', function (e) { e.preventDefault(); ner(); el.classList.add('nere'); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) {
      el.addEventListener(ev, function () { upp(); el.classList.remove('nere'); });
    });
  }

  function init() {
    hallKnapp(document.getElementById('btn-vrid-v'),
      function () { rotera(1); }, function () { if (f && f.rotInput === 1) rotera(0); });
    hallKnapp(document.getElementById('btn-vrid-h'),
      function () { rotera(-1); }, function () { if (f && f.rotInput === -1) rotera(0); });

    document.getElementById('gas-slider').addEventListener('input', function () {
      sattGas(this.value / 100);
    });
    document.getElementById('btn-gas-max').addEventListener('click', function () { sattGas(1); });
    document.getElementById('btn-gas-noll').addEventListener('click', function () { sattGas(0); });
    document.getElementById('btn-stega').addEventListener('click', stega);
    document.querySelectorAll('#warp-knappar button').forEach(function (b) {
      b.addEventListener('click', function () { sattWarp(Number(b.dataset.warp)); });
    });

    window.addEventListener('keydown', function (e) {
      if (!f || !document.getElementById('scen-flyg').classList.contains('aktiv')) return;
      if (e.repeat && e.code === 'Space') return;
      switch (e.code) {
        case 'ArrowLeft': rotera(1); e.preventDefault(); break;
        case 'ArrowRight': rotera(-1); e.preventDefault(); break;
        case 'ArrowUp': sattGas(f.gas + 0.05); e.preventDefault(); break;
        case 'ArrowDown': sattGas(f.gas - 0.05); e.preventDefault(); break;
        case 'Space': stega(); e.preventDefault(); break;
        case 'KeyX': sattGas(0); break;
        case 'KeyZ': sattGas(1); break;
        case 'Digit1': sattWarp(1); break;
        case 'Digit2': sattWarp(10); break;
        case 'Digit3': sattWarp(100); break;
        case 'Digit4': sattWarp(1000); break;
      }
    });
    window.addEventListener('keyup', function (e) {
      if (!f) return;
      if (e.code === 'ArrowLeft' && f.rotInput === 1) rotera(0);
      if (e.code === 'ArrowRight' && f.rotInput === -1) rotera(0);
    });
  }

  return {
    init: init,
    start: start,
    tick: tick,
    stega: stega,
    tillstand: function () { return f; },
    rensa: function () { f = null; }
  };
})();
