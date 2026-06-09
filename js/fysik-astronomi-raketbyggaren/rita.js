// Raketbyggaren – all canvasritning (byggvy + flygvy).
window.RB = window.RB || {};

RB.rita = (function () {
  var byggCv, byggCtx, flygCv, flygCtx;
  var kam = { x: 0, y: 0, mpp: 0.5, auto: true };
  var stjarnor = [];

  function fixaCanvas(cv) {
    var dpr = window.devicePixelRatio || 1;
    var rect = cv.getBoundingClientRect();
    if (rect.width === 0) return;
    cv.width = Math.round(rect.width * dpr);
    cv.height = Math.round(rect.height * dpr);
    cv.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
    cv._w = rect.width; cv._h = rect.height;
  }

  // ---------- raketens utseende (lokala koordinater i meter, +y = upp) ----------
  function ritaDel(ctx, d, yTopp) {
    var w = d.bredd, h = d.hojd, yB = yTopp - h;
    if (d.typ === 'nos') {
      ctx.fillStyle = '#e8604c';
      ctx.beginPath();
      ctx.moveTo(0, yTopp);
      ctx.lineTo(w / 2, yB); ctx.lineTo(-w / 2, yB);
      ctx.closePath(); ctx.fill();
    } else if (d.typ === 'kapsel') {
      ctx.fillStyle = '#d7dde8';
      ctx.beginPath();
      ctx.moveTo(-w * 0.28, yTopp); ctx.lineTo(w * 0.28, yTopp);
      ctx.lineTo(w / 2, yB); ctx.lineTo(-w / 2, yB);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#67e8f9';
      ctx.beginPath();
      ctx.arc(0, yB + h * 0.55, Math.min(0.35, w * 0.16), 0, Math.PI * 2);
      ctx.fill();
    } else if (d.typ === 'fallskarm') {
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(-w * 0.35, yB);
      ctx.quadraticCurveTo(0, yTopp + h * 0.6, w * 0.35, yB);
      ctx.closePath(); ctx.fill();
    } else if (d.typ === 'tank') {
      ctx.fillStyle = '#cfd8e3';
      ctx.fillRect(-w / 2, yB, w, h);
      ctx.fillStyle = d.id === 'tankXL' ? '#7c5cff' : d.id === 'tankL' ? '#3b82f6' : d.id === 'tankM' ? '#10b981' : '#f59e0b';
      ctx.fillRect(-w / 2, yB + h * 0.42, w, h * 0.16);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(-w * 0.38, yB, w * 0.13, h);
    } else if (d.typ === 'motor') {
      ctx.fillStyle = '#64748b';
      ctx.fillRect(-w * 0.35, yTopp - h * 0.3, w * 0.7, h * 0.3);
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.moveTo(-w * 0.22, yTopp - h * 0.3);
      ctx.lineTo(w * 0.22, yTopp - h * 0.3);
      ctx.lineTo(w / 2, yB); ctx.lineTo(-w / 2, yB);
      ctx.closePath(); ctx.fill();
    } else if (d.typ === 'dekopplare') {
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-w / 2, yB, w, h);
    }
  }

  // ritar hela stacken med toppen vid y = totalHöjd/2 (centrerad kring origo)
  function ritaRaket(ctx, stack, opts) {
    opts = opts || {};
    var H = 0;
    stack.forEach(function (id) { H += RB.delDef(id).hojd; });
    var y = H / 2;
    stack.forEach(function (id) {
      ritaDel(ctx, RB.delDef(id), y);
      y -= RB.delDef(id).hojd;
    });
    if (opts.flamma > 0) {
      var sista = RB.delDef(stack[stack.length - 1]);
      var w = sista.bredd * 0.45;
      var L = (3 + Math.random() * 1.5) * opts.flamma * Math.max(1, sista.bredd * 0.7);
      var yB = -H / 2;
      var grad = ctx.createLinearGradient(0, yB, 0, yB - L);
      grad.addColorStop(0, 'rgba(255,237,160,0.95)');
      grad.addColorStop(0.4, 'rgba(251,146,60,0.85)');
      grad.addColorStop(1, 'rgba(239,68,68,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(-w, yB);
      ctx.quadraticCurveTo(-w * 0.5, yB - L * 0.6, 0, yB - L);
      ctx.quadraticCurveTo(w * 0.5, yB - L * 0.6, w, yB);
      ctx.closePath(); ctx.fill();
    }
    if (opts.fallskarm) {
      var c = 4.5;
      ctx.strokeStyle = 'rgba(245,158,11,0.9)';
      ctx.lineWidth = 0.12;
      ctx.beginPath();
      ctx.moveTo(0, H / 2); ctx.lineTo(-c * 0.8, H / 2 + c * 1.4);
      ctx.moveTo(0, H / 2); ctx.lineTo(c * 0.8, H / 2 + c * 1.4);
      ctx.stroke();
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(0, H / 2 + c * 1.5, c, Math.PI, 0);
      ctx.closePath(); ctx.fill();
    }
    return H;
  }

  // ---------- byggvyn ----------
  function ritaBygg(stack) {
    if (!byggCv._w) fixaCanvas(byggCv);
    var ctx = byggCtx, W = byggCv._w, H = byggCv._h;
    var grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#0b1228');
    grad.addColorStop(1, '#16294a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    // ramp
    ctx.fillStyle = '#22304f';
    ctx.fillRect(0, H - 26, W, 26);
    ctx.fillStyle = '#41557e';
    ctx.fillRect(W / 2 - 70, H - 32, 140, 6);

    if (stack.length === 0) {
      ctx.fillStyle = 'rgba(147,160,191,0.6)';
      ctx.font = '15px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('Bygg din raket – välj delar till vänster', W / 2, H / 2);
      return;
    }

    var rakH = 0, maxB = 2;
    stack.forEach(function (id) {
      var d = RB.delDef(id);
      rakH += d.hojd;
      if (d.bredd > maxB) maxB = d.bredd;
    });
    var s = Math.min((H - 90) / rakH, (W * 0.4) / maxB, 13);
    s = Math.max(s, 2);

    ctx.save();
    ctx.translate(W / 2, H - 34 - (rakH * s) / 2);
    ctx.scale(s, -s);
    ritaRaket(ctx, stack, {});
    ctx.restore();

    // markera stegen vid varje dekopplare
    ctx.font = '11px system-ui';
    ctx.textAlign = 'left';
    var stegNr = RB.bygg.beraknaSteg(stack).steg.length;
    var yTopp = H - 34 - rakH * s;
    var y = yTopp;
    ctx.setLineDash([5, 5]);
    stack.forEach(function (id) {
      var d = RB.delDef(id);
      if (d.typ === 'dekopplare') {
        var ly = y + (d.hojd / 2) * s;
        ctx.strokeStyle = 'rgba(251,191,36,0.5)';
        ctx.beginPath();
        ctx.moveTo(W / 2 - 75, ly); ctx.lineTo(W / 2 + 75, ly);
        ctx.stroke();
        ctx.fillStyle = 'rgba(251,191,36,0.8)';
        ctx.fillText('Steg ' + stegNr, W / 2 + 80, ly + 4);
        stegNr--;
      }
      y += d.hojd * s;
    });
    ctx.setLineDash([]);
  }

  // ---------- flygvyn ----------
  function vTillS(wx, wy) {
    return {
      x: (wx - kam.x) / kam.mpp + flygCv._w / 2,
      y: flygCv._h / 2 - (wy - kam.y) / kam.mpp
    };
  }

  function ritaPlanet(ctx) {
    var c = vTillS(0, 0);
    var rPx = RB.K.PLANET_R / kam.mpp;
    if (rPx < 1) return;

    // atmosfär
    var aPx = (RB.K.PLANET_R + RB.K.ATM_HOJD) / kam.mpp;
    var ag = ctx.createRadialGradient(c.x, c.y, rPx * 0.98, c.x, c.y, aPx);
    ag.addColorStop(0, 'rgba(96,165,250,0.5)');
    ag.addColorStop(1, 'rgba(96,165,250,0)');
    ctx.fillStyle = ag;
    ctx.beginPath(); ctx.arc(c.x, c.y, aPx, 0, Math.PI * 2); ctx.fill();

    // hav
    ctx.fillStyle = '#1d4f8f';
    ctx.beginPath(); ctx.arc(c.x, c.y, rPx, 0, Math.PI * 2); ctx.fill();

    // kontinenter (deterministiska blobbar)
    ctx.save();
    ctx.beginPath(); ctx.arc(c.x, c.y, rPx, 0, Math.PI * 2); ctx.clip();
    for (var i = 0; i < 12; i++) {
      var h1 = Math.sin(i * 127.1) * 0.5 + 0.5;
      var h2 = Math.sin(i * 311.7 + 1.3) * 0.5 + 0.5;
      var h3 = Math.sin(i * 74.7 + 2.1) * 0.5 + 0.5;
      var vink = h1 * Math.PI * 2;
      var avst = rPx * (0.15 + 0.78 * h2);
      var stl = rPx * (0.12 + 0.2 * h3);
      ctx.fillStyle = i % 3 === 0 ? '#2f7d4f' : '#3a915d';
      ctx.beginPath();
      ctx.ellipse(c.x + Math.cos(vink) * avst, c.y + Math.sin(vink) * avst,
                  stl, stl * 0.65, vink, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // startplattan (vid planetens "nordpol")
    if (kam.mpp < 6) {
      var p = vTillS(0, RB.K.PLANET_R);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(p.x - 18 / kam.mpp, p.y, 36 / kam.mpp, 5 / kam.mpp);
    }
  }

  function ritaMane(ctx, t) {
    var m = RB.fysik.manePos(t);
    var c = vTillS(m.x, m.y);
    var rPx = RB.K.MANE_R / kam.mpp;
    // månens banring
    var pc = vTillS(0, 0);
    ctx.strokeStyle = 'rgba(147,160,191,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(pc.x, pc.y, RB.K.MANE_AVSTAND / kam.mpp, 0, Math.PI * 2);
    ctx.stroke();
    if (rPx < 0.5) {
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath(); ctx.arc(c.x, c.y, 2, 0, Math.PI * 2); ctx.fill();
      return;
    }
    ctx.fillStyle = '#b8c0cc';
    ctx.beginPath(); ctx.arc(c.x, c.y, rPx, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#9aa3b2';
    [[0.3, -0.2, 0.25], [-0.35, 0.25, 0.18], [0.05, 0.4, 0.14]].forEach(function (k) {
      ctx.beginPath();
      ctx.arc(c.x + k[0] * rPx, c.y + k[1] * rPx, k[2] * rPx, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function ritaBana(ctx, f) {
    if (!f.bana || f.maxHojd < 200 || f.bana.hyperbolisk || f.bana.e >= 0.999) return;
    var b = f.bana;
    var e = b.e || 0.0001;
    var exN = b.ex / e, eyN = b.ey / e;
    // ellipsens centrum ligger −a·e från fokus (planetens centrum) längs e-vektorn
    var cWx = -b.a * b.ex, cWy = -b.a * b.ey;
    var c = vTillS(cWx, cWy);
    var rot = Math.atan2(-eyN, exN); // skärmens y pekar nedåt
    ctx.save();
    ctx.strokeStyle = 'rgba(232,237,247,0.55)';
    ctx.lineWidth = 1.4;
    ctx.setLineDash([7, 7]);
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, b.a / kam.mpp, (b.a * Math.sqrt(1 - e * e)) / kam.mpp, rot, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    // markera apoapsis & periapsis
    var pe = vTillS(exN * b.rP, eyN * b.rP);
    var ap = vTillS(-exN * b.rA, -eyN * b.rA);
    ctx.fillStyle = '#ffb24d';
    ctx.beginPath(); ctx.arc(pe.x, pe.y, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5eead4';
    ctx.beginPath(); ctx.arc(ap.x, ap.y, 4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function ritaRaketIVarlden(ctx, stack, pos, ang, opts) {
    var p = vTillS(pos.x, pos.y);
    if (p.x < -120 || p.x > flygCv._w + 120 || p.y < -120 || p.y > flygCv._h + 120) return;
    var s = Math.max(1 / kam.mpp, 1.5); // krymp aldrig till osynlighet
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(Math.PI / 2 - ang);
    ctx.scale(s, -s);
    if (opts.alfa) ctx.globalAlpha = opts.alfa;
    ritaRaket(ctx, stack, opts);
    ctx.restore();
  }

  function ritaFlyg(f) {
    if (!flygCv._w) fixaCanvas(flygCv);
    var ctx = flygCtx, W = flygCv._w, H = flygCv._h;

    // kamera: nära marken följer vi raketen, i rymden ramas hela banan in
    if (kam.auto) {
      var mal = 0.15 + f.hojd / 350;
      if (f.hojd > RB.K.ATM_HOJD * 0.8 && f.bana) {
        var rMax = RB.K.PLANET_R + f.hojd;
        if (!f.bana.hyperbolisk && f.bana.apo > f.hojd) rMax = RB.K.PLANET_R + f.bana.apo;
        mal = Math.max(mal, 2.4 * rMax / Math.min(W, H));
      }
      mal = Math.min(2500, Math.max(0.15, mal));
      kam.mpp += (mal - kam.mpp) * 0.06;
    }
    kam.x = f.pos.x; kam.y = f.pos.y;

    // himmel: mörkare ju högre upp
    var atm = Math.max(0, 1 - f.hojd / RB.K.ATM_HOJD);
    ctx.fillStyle = 'rgb(' + Math.round(11 + 50 * atm) + ',' + Math.round(16 + 90 * atm) + ',' + Math.round(32 + 140 * atm) + ')';
    ctx.fillRect(0, 0, W, H);

    // stjärnor
    ctx.fillStyle = 'rgba(255,255,255,' + (0.85 - atm * 0.7) + ')';
    stjarnor.forEach(function (st) {
      ctx.fillRect(st[0] * W, st[1] * H, st[2], st[2]);
    });

    ritaPlanet(ctx);
    ritaMane(ctx, f.t);

    // färdspår
    if (f.spar.length > 1) {
      ctx.strokeStyle = 'rgba(94,234,212,0.4)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      f.spar.forEach(function (pt, i) {
        var sp = vTillS(pt.x, pt.y);
        if (i === 0) ctx.moveTo(sp.x, sp.y); else ctx.lineTo(sp.x, sp.y);
      });
      ctx.stroke();
    }

    ritaBana(ctx, f);

    // avlossade steg
    f.avlossadeSteg.forEach(function (s) {
      ritaRaketIVarlden(ctx, s.delar.slice().reverse(), s.pos,
        s.ang + (f.t - s.fodd) * 0.35, { alfa: 0.55 });
    });

    // raketen
    if (f.slut !== 'krasch') {
      ritaRaketIVarlden(ctx, kvarStack(f), f.pos, f.ang, {
        flamma: (f.gas > 0 && f.steg[f.aktivtSteg].bransle > 0 && f.steg[f.aktivtSteg].dragkraft > 0) ? f.gas : 0,
        fallskarm: f.fallskarmUte
      });
    }

    // explosionspartiklar
    f.partiklar.forEach(function (p) {
      var sp = vTillS(p.x, p.y);
      ctx.fillStyle = p.liv > 1 ? 'rgba(253,224,71,0.95)' : 'rgba(249,115,22,' + Math.max(0, p.liv) + ')';
      var st = 2 + p.liv * 3;
      ctx.fillRect(sp.x - st / 2, sp.y - st / 2, st, st);
    });
  }

  // stacken som är kvar = allt utom de avlossade stegens delar (+ deras dekopplare)
  function kvarStack(f) {
    var bort = 0;
    for (var i = 0; i < f.aktivtSteg; i++) {
      bort += f.steg[i].delar.length + 1; // +1 för dekopplaren ovanför steget
    }
    if (bort === 0) return f.stack;
    return f.stack.slice(0, Math.max(1, f.stack.length - bort));
  }

  // ---------- zoom ----------
  function zoom(faktor) {
    kam.mpp = Math.min(4000, Math.max(0.05, kam.mpp * faktor));
    kam.auto = false;
    uppdateraAutoKnapp();
  }
  function uppdateraAutoKnapp() {
    document.getElementById('btn-zoom-auto').classList.toggle('auto-pa', kam.auto);
  }

  function init() {
    byggCv = document.getElementById('byggCanvas');
    byggCtx = byggCv.getContext('2d');
    flygCv = document.getElementById('flygCanvas');
    flygCtx = flygCv.getContext('2d');
    for (var i = 0; i < 160; i++) {
      stjarnor.push([Math.random(), Math.random(), Math.random() < 0.15 ? 2 : 1]);
    }
    window.addEventListener('resize', function () {
      fixaCanvas(byggCv); fixaCanvas(flygCv);
      RB.rita.ritaBygg(RB.bygg.hamtaStack());
    });
    fixaCanvas(byggCv); fixaCanvas(flygCv);

    flygCv.addEventListener('wheel', function (e) {
      e.preventDefault();
      zoom(e.deltaY > 0 ? 1.25 : 0.8);
    }, { passive: false });
    document.getElementById('btn-zoom-in').addEventListener('click', function () { zoom(0.7); });
    document.getElementById('btn-zoom-ut').addEventListener('click', function () { zoom(1.45); });
    document.getElementById('btn-zoom-auto').addEventListener('click', function () {
      kam.auto = true;
      uppdateraAutoKnapp();
    });
  }

  function nyFlygKamera() {
    kam.mpp = 0.3;
    kam.auto = true;
    uppdateraAutoKnapp();
    fixaCanvas(flygCv);
  }

  return { init: init, ritaBygg: ritaBygg, ritaFlyg: ritaFlyg, nyFlygKamera: nyFlygKamera };
})();
