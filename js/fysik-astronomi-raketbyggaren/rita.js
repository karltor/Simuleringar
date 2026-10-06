// Raketen är en illustration; banprognosen och kartans spår använder fysikens koordinater.
window.RB = window.RB || {};
RB.rita = (function () {
  var canvas, ctx, W = 800, H = 400, nar, map, senast = null;
  var rorelse = { flight: null, tid: 0, x: 0, y: 0 };
  var ink = '#294756', orange = '#d56638';
  function ruta(x, y, w, h, radius, fill, stroke) {
    ctx.beginPath(); ctx.roundRect(x, y, w, h, radius); ctx.fillStyle = fill; ctx.fill();
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.stroke(); }
  }
  function linje(x1, y1, x2, y2, color, width) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.strokeStyle = color; ctx.lineWidth = width || 1; ctx.stroke(); }
  function fond(f) {
    var g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#eaf0f0'); g.addColorStop(1, '#f7f7ed');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (var x = 0; x < W; x += 32) linje(x, 0, x, H, '#afc0ba22');
    for (var y = 0; y < H; y += 32) linje(0, y, W, y, '#afc0ba22');
    if (rorelse.flight !== f) rorelse = { flight: f, tid: f ? f.t : 0, x: 0, y: 0 };
    var vx = f ? f.sidofart : 0, vy = f ? f.radialfart : 0;
    var fart = Math.hypot(vx, vy), faktor = .45 / (1 + fart / 550);
    var dt = f ? Math.max(0, f.t - rorelse.tid) : 0;
    // Kameran följer raketen: omgivningen rör sig motsatt markrelativ hastighet.
    rorelse.x -= vx * faktor * dt; rorelse.y += vy * faktor * dt; rorelse.tid = f ? f.t : 0;
    var dx = fart > .01 ? -vx / fart : 0, dy = fart > .01 ? vy / fart : 0;
    var langd = fart > .5 ? Math.min(24, 2 + fart * .05) : 0;
    var antal = Math.max(30, Math.min(64, Math.round(W * H / 5000)));
    for (var i = 0; i < antal; i++) {
      var sx = ((((i * 137 + 53) % 991) / 991 * (W + 60) + rorelse.x) % (W + 60) + W + 60) % (W + 60) - 30;
      var sy = ((((i * 71 + 29) % 317) / 317 * (H + 60) + rorelse.y) % (H + 60) + H + 60) % (H + 60) - 30;
      if (langd) linje(sx - dx * langd, sy - dy * langd, sx, sy, '#72928a66', 1.3);
      ctx.beginPath(); ctx.arc(sx, sy, i % 3 === 0 ? 1.5 : 1, 0, Math.PI * 2); ctx.fillStyle = '#567b767d'; ctx.fill();
    }
  }
  function raket(config, x, y, scale, angle, f) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle || 0); ctx.scale(scale, scale);
    var block = f && f.slappt ? f.delar[1].block : config.bransle;
    var height = 90 + block * 10, top = -height / 2, bottom = height / 2;
    var split = config.steg === 2 && !(f && f.slappt);
    var fraction = f ? f.delar.slice(f.aktiv).reduce(function (sum, d) { return sum + d.bransle; }, 0) / (block * RB.K.BRANSLE) : 1;
    ctx.fillStyle = ink; ctx.beginPath(); ctx.moveTo(-22, bottom - 30); ctx.lineTo(-40, bottom + 5); ctx.lineTo(-22, bottom); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(22, bottom - 30); ctx.lineTo(40, bottom + 5); ctx.lineTo(22, bottom); ctx.closePath(); ctx.fill();
    ruta(-23, top + 30, 46, height - 30, 7, '#fffdf5', ink); ruta(12, top + 35, 7, height - 41, 3, '#e6eee8');
    ctx.fillStyle = orange; ctx.beginPath(); ctx.moveTo(-23, top + 31); ctx.quadraticCurveTo(-23, top + 13, 0, top - 16); ctx.quadraticCurveTo(23, top + 13, 23, top + 31); ctx.closePath(); ctx.fill(); ctx.strokeStyle = ink; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, top + 48, 12, 0, Math.PI * 2); ctx.fillStyle = ink; ctx.fill();
    ctx.beginPath(); ctx.arc(0, top + 48, 8, 0, Math.PI * 2); ctx.fillStyle = '#b4d5d2'; ctx.fill(); linje(-4, top + 45, 3, top + 41, '#fff', 2);
    var tankY = top + 68, tankH = height - 81;
    ruta(-13, tankY, 26, tankH, 3, '#e9e8dd');
    ruta(-13, tankY + tankH * (1 - fraction), 26, Math.max(.2, tankH * fraction), 3, '#e9a677');
    for (var n = 1; n < block; n++) linje(-13, tankY + tankH * n / block, 13, tankY + tankH * n / block, '#f7d9bc');
    if (split) ruta(-25, tankY + tankH * .4, 50, 6, 2, ink);
    linje(-23, bottom - 9, 23, bottom - 9, ink, 1.5);
    ctx.fillStyle = '#728a8b'; ctx.beginPath(); ctx.moveTo(-12, bottom); ctx.lineTo(-17, bottom + 10); ctx.lineTo(17, bottom + 10); ctx.lineTo(12, bottom); ctx.closePath(); ctx.fill();
    if (f && f.gas && f.delar[f.aktiv].bransle > 0 && !f.slut) {
      ctx.fillStyle = '#e5a34e'; ctx.beginPath(); ctx.moveTo(-13, bottom + 10); ctx.quadraticCurveTo(-17, bottom + 25, 0, bottom + 48); ctx.quadraticCurveTo(17, bottom + 25, 13, bottom + 10); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff0b5'; ctx.beginPath(); ctx.moveTo(-6, bottom + 10); ctx.lineTo(0, bottom + 33); ctx.lineTo(6, bottom + 10); ctx.fill();
    }
    ctx.restore();
  }
  function narbild(config, f) {
    var height = f ? f.h : 0, top = f ? 77 : 0, ledig = H - top;
    var block = f && f.slappt ? f.delar[1].block : config.bransle;
    var scale = Math.min(1.3, Math.max(.25, (ledig - 20) / (154 + block * 10)));
    var startY = H - 42 - (55 + block * 5) * scale;
    var blend = f ? Math.min(1, height / 30) : 0;
    var cy = startY + (top + ledig * .43 - startY) * blend;
    var cx = W * .5, ground = H - 32 + height * .8;
    if (ground < H + 60) {
      ctx.fillStyle = '#c5cabc'; ctx.beginPath(); ctx.moveTo(0, ground + 8); ctx.quadraticCurveTo(W * .17, ground - 15, W * .42, ground + 5); ctx.quadraticCurveTo(W * .76, ground - 26, W, ground + 6); ctx.lineTo(W, H + 100); ctx.lineTo(0, H + 100); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#a7b3a7'; ctx.fillRect(0, ground + 13, W, H);
      ctx.strokeStyle = '#7d9388'; ctx.lineWidth = 1.5;
      for (var i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse((i * 199 + 50) % W, ground + 16 + i % 2 * 13, 23 + i * 4, 5, 0, 0, Math.PI * 2); ctx.stroke(); }
      if (!f || height < 5) {
        ruta(cx - 53, ground - 9, 106, 8, 2, '#6d8581', ink);
        ruta(W * .15, ground - 24, 55, 37, 5, '#eeeee5', '#78938c'); ruta(W * .15 + 10, ground - 11, 35, 24, 2, '#a2b5ad');
        linje(W * .78, ground - 38, W * .78, ground + 10, '#59726a', 2);
        ruta(W * .78 - 18, ground - 39, 36, 18, 2, '#385868');
        for (var j = 0; j < 3; j++) linje(W * .78 - 9 + j * 9, ground - 37, W * .78 - 9 + j * 9, ground - 23, '#b0cbc5');
      }
    }
    var angle = f ? RB.fysik.wrap(f.angle - Math.atan2(f.x, f.y)) : 0;
    raket(config, cx, cy, scale, angle, f);
    if (f && f.slut === 'krasch') {
      ctx.fillStyle = '#d5663840'; ctx.beginPath(); ctx.arc(cx, cy, 45, 0, Math.PI * 2); ctx.fill();
    }
  }
  function ceres(cx, cy, radius, rotation) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rotation);
    ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.fillStyle = '#c6cebd'; ctx.fill(); ctx.clip();
    var grad = ctx.createLinearGradient(-radius, 0, radius, radius); grad.addColorStop(0, '#d6ddcb'); grad.addColorStop(1, '#91a297'); ctx.fillStyle = grad; ctx.fillRect(-radius, -radius, radius * 2, radius * 2);
    for (var i = 0; i < 18; i++) {
      var x = (((i * 71 + 13) % 199) / 199 - .5) * radius * 1.85, y = (((i * 43 + 17) % 181) / 181 - .5) * radius * 1.85;
      var rr = radius * (.04 + (i % 4) * .017);
      ctx.beginPath(); ctx.ellipse(x, y, rr, rr * .8, .2, 0, Math.PI * 2); ctx.fillStyle = '#81988938'; ctx.fill(); ctx.strokeStyle = '#748c794a'; ctx.lineWidth = 1; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(x + rr * .14, y + rr * .17, rr * .68, rr * .54, .2, 0, Math.PI * 2); ctx.fillStyle = '#c4d1bda0'; ctx.fill();
    }
    ctx.restore(); ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.strokeStyle = '#6b8775'; ctx.lineWidth = 1.5; ctx.stroke();
  }
  function karta(config, f) {
    var extent = RB.K.R * 1.18;
    if (f) extent = Math.max(extent, Math.hypot(f.x, f.y) * 1.12, f.bana.bunden ? (RB.K.R + f.bana.apo) * 1.06 : 0);
    var scale = Math.min(W * .4, H * .43) / extent;
    var cx = W * .5, cy = H * .5;
    function project(x, y) { return [cx + x * scale, cy - y * scale]; }
    if (f && f.bana.p > .1) {
      var b = f.bana, started = false; ctx.beginPath();
      for (var i = 0; i <= 360; i++) {
        var nu = -Math.PI + i / 360 * Math.PI * 2;
        var denom = 1 + b.e * Math.cos(nu);
        if (denom <= .000001) { started = false; continue; }
        var r = b.p / denom, angle = nu + b.riktning;
        var pt = project(r * Math.cos(angle), r * Math.sin(angle));
        if (r < RB.K.R || r > extent * 3) { started = false; continue; }
        if (started) ctx.lineTo(pt[0], pt[1]); else ctx.moveTo(pt[0], pt[1]); started = true;
      }
      ctx.setLineDash([5, 5]); ctx.strokeStyle = b.saker ? '#167268' : '#af5836'; ctx.lineWidth = 1.8; ctx.stroke(); ctx.setLineDash([]);
      ctx.beginPath(); f.spar.forEach(function (p, i) { var pt = project(p.x, p.y); if (i === 0) ctx.moveTo(pt[0], pt[1]); else ctx.lineTo(pt[0], pt[1]); }); ctx.strokeStyle = '#b66e42'; ctx.lineWidth = 2; ctx.stroke();
    }
    ceres(cx, cy, RB.K.R * scale, f ? RB.K.OMEGA * f.t : 0);
    var station = f ? RB.K.OMEGA * f.t : 0;
    var pad = project((RB.K.R + 2) * Math.sin(station), (RB.K.R + 2) * Math.cos(station));
    ruta(pad[0] - 3, pad[1] - 3, 6, 6, 1, '#294756');
    if (f) {
      var ship = project(f.x, f.y);
      ctx.save(); ctx.translate(ship[0], ship[1]); ctx.rotate(f.angle); ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(5, 6); ctx.lineTo(0, 3); ctx.lineTo(-5, 6); ctx.closePath(); ctx.fillStyle = orange; ctx.fill(); ctx.strokeStyle = '#7b351d'; ctx.lineWidth = 1; ctx.stroke(); ctx.restore();
    }
    if (RB.K.R * scale > 20) { ctx.fillStyle = ink; ctx.font = 'bold 10px system-ui'; ctx.textAlign = 'center'; ctx.fillText('CERES', cx, cy + Math.min(15, RB.K.R * scale * .2)); }
  }
  function yta(v) { ctx = v.ctx; W = v.w; H = v.h; }
  function rita(config, f) {
    senast = [config, f]; if (!ctx) return;
    yta(nar); ctx.clearRect(0, 0, W, H); fond(f); narbild(config, f);
    yta(map); ctx.clearRect(0, 0, W, H); ctx.fillStyle = '#f0f4ef'; ctx.fillRect(0, 0, W, H); karta(config, f);
    canvas.setAttribute('aria-label', f ? 'Raket på ' + RB.formatHojd(f.h) + ', fart ' + Math.round(f.fart) + ' meter per sekund.' : 'Din raket på Ceres med ' + config.bransle + ' bränsleblock.');
    map.canvas.setAttribute('aria-label', f ? 'Banprognos med avstängd motor. ' + (f.bana.saker ? 'Fri bana runt Ceres.' : !f.bana.bunden ? 'På väg från Ceres.' : 'Banan korsar marken.') : 'Ceres och startplattan.');
  }
  function resize() {
    [nar, map].forEach(function (v) {
      var bounds = v.canvas.getBoundingClientRect(); v.w = bounds.width; v.h = bounds.height;
      var dpr = Math.min(2, window.devicePixelRatio || 1); v.canvas.width = Math.round(v.w * dpr); v.canvas.height = Math.round(v.h * dpr); v.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    });
    if (senast) rita.apply(null, senast);
  }
  function init() {
    canvas = document.getElementById('raketCanvas'); ctx = canvas.getContext('2d');
    nar = { canvas: canvas, ctx: ctx, w: 800, h: 400 };
    var banaCanvas = document.getElementById('banaCanvas'); map = { canvas: banaCanvas, ctx: banaCanvas.getContext('2d'), w: 300, h: 160 };
    var observer = new ResizeObserver(resize); observer.observe(canvas); observer.observe(banaCanvas); resize();
  }
  return { init: init, rita: rita };
})();
