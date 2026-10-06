// Ljus startplatta och höjdvy. Canvas är en illustration, aldrig en kontroll.
window.RB = window.RB || {};
RB.rita = (function () {
  var canvas, ctx, W = 700, H = 360, senast = null;
  var ink = '#294756', orange = '#d56638';
  function linje(x1, y1, x2, y2, color, width) {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    ctx.strokeStyle = color || ink; ctx.lineWidth = width || 1; ctx.stroke();
  }
  function ruta(x, y, w, h, r, fill, stroke) {
    ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fillStyle = fill; ctx.fill();
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.stroke(); }
  }
  function moln(x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = '#ffffff'; ctx.beginPath();
    ctx.ellipse(0, 0, 31, 10, 0, 0, Math.PI * 2);
    ctx.ellipse(-12, -8, 14, 15, 0, 0, Math.PI * 2);
    ctx.ellipse(10, -13, 18, 20, 0, 0, Math.PI * 2);
    ctx.ellipse(29, -2, 15, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  function raket(config, x, y, scale, f) {
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    var block = f && f.slappt ? f.delar[1].block : config.bransle;
    var bodyH = 55 + block * 11;
    var split = config.steg === 2 && (!f || !f.slappt);
    var ground = bodyH + 45;
    var allFuel = f ? f.delar.slice(f.aktiv).reduce(function (sum, d) { return sum + d.bransle; }, 0) / (block * 500) : 1;
    // Ombord finns alltid nos, kapsel och fenor.
    ctx.fillStyle = '#264957'; ctx.beginPath(); ctx.moveTo(-23, ground - 46); ctx.lineTo(-48, ground + 7); ctx.lineTo(-23, ground); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(23, ground - 46); ctx.lineTo(48, ground + 7); ctx.lineTo(23, ground); ctx.closePath(); ctx.fill();
    ruta(-25, 25, 50, bodyH + 20, 9, '#fffdf5', ink);
    ruta(11, 31, 10, bodyH + 10, 4, '#e9eee9');
    // Tankens fyllning sjunker under flygningen.
    ruta(-15, 77, 30, Math.max(1, (bodyH - 43) * Math.max(0, allFuel)), 3, '#e9a677');
    for (var i = 0; i < block; i++) linje(-14, 78 + i * 11, 14, 78 + i * 11, '#f7cfab', 1);
    ctx.fillStyle = orange; ctx.beginPath(); ctx.moveTo(-25, 30); ctx.quadraticCurveTo(-24, 0, 0, -30); ctx.quadraticCurveTo(24, 0, 25, 30); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = ink; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 49, 14, 0, Math.PI * 2); ctx.fillStyle = ink; ctx.fill();
    ctx.beginPath(); ctx.arc(0, 49, 10, 0, Math.PI * 2); ctx.fillStyle = '#b3d6d6'; ctx.fill();
    linje(-5, 45, 4, 41, '#fff', 2.5);
    linje(-25, ground - 21, 25, ground - 21, ink, 1.5);
    if (split) {
      var boundary = 76 + Math.floor(config.bransle * .4) * 11;
      ruta(-27, boundary, 54, 8, 2, ink);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 6px system-ui'; ctx.textAlign = 'center'; ctx.fillText('SLÄPP HÄR', 0, boundary + 6);
    }
    ctx.fillStyle = '#71888c'; ctx.beginPath(); ctx.moveTo(-13, ground); ctx.lineTo(-18, ground + 13); ctx.lineTo(18, ground + 13); ctx.lineTo(13, ground); ctx.closePath(); ctx.fill();
    if (f && f.fas === 'motor' && !f.vantande && !f.slut) {
      var flame = 35 + 7 * Math.sin(f.t * 12);
      ctx.fillStyle = '#e79539'; ctx.beginPath(); ctx.moveTo(-13, ground + 13); ctx.quadraticCurveTo(-15, ground + 30, 0, ground + 13 + flame); ctx.quadraticCurveTo(15, ground + 30, 13, ground + 13); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff0b5'; ctx.beginPath(); ctx.moveTo(-7, ground + 13); ctx.lineTo(0, ground + 37); ctx.lineTo(7, ground + 13); ctx.fill();
    }
    ctx.restore();
    return ground * scale;
  }
  function fond(f) {
    var altitude = f ? f.h : 0;
    var top = altitude > 35000 ? '#e7eeef' : '#e5f1f1';
    var grad = ctx.createLinearGradient(0, 0, 0, H); grad.addColorStop(0, top); grad.addColorStop(1, '#f7f8ed');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#a6c2c21c'; ctx.lineWidth = 1;
    for (var x = 0; x < W; x += 28) linje(x, 0, x, H, '#a6c2c224');
    for (var y = 0; y < H; y += 28) linje(0, y, W, y, '#a6c2c224');
    if (altitude < 35000) {
      var drift = f ? Math.min(f.h / 250, H) : 0;
      moln(W * .18, H * .31 + drift, .95); moln(W * .70, H * .23 + drift, .7); moln(W * .87, H * .54 + drift, 1.2);
    } else {
      for (var i = 0; i < 20; i++) {
        var sx = ((i * 137 + 29) % 997) / 997 * W, sy = ((i * 71 + 37) % 331) / 331 * H;
        linje(sx - 2, sy, sx + 2, sy, '#789695', 1); linje(sx, sy - 2, sx, sy + 2, '#789695', 1);
      }
    }
  }
  function mark(f) {
    // När kameran följer raketen försvinner marken nedåt, aldrig uppåt.
    var ground = H - 65 + (f ? Math.min(f.h / 20, H) : 0);
    if (ground >= H) return;
    ctx.fillStyle = '#d8e5cf'; ctx.beginPath(); ctx.moveTo(0, ground + 14); ctx.quadraticCurveTo(W * .18, ground - 52, W * .40, ground + 15); ctx.quadraticCurveTo(W * .72, ground - 42, W, ground + 13); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#a1b9a3'; ctx.beginPath(); ctx.moveTo(0, ground + 30); ctx.quadraticCurveTo(W * .3, ground + 8, W * .52, ground + 22); ctx.quadraticCurveTo(W * .8, ground + 7, W, ground + 28); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
    // Ett litet raketlabb och en flagga, ritade utan externa resurser.
    var hx = W * .16;
    ruta(hx - 34, ground - 12, 68, 40, 5, '#f3f3e9', '#7d9796');
    ruta(hx - 21, ground + 1, 42, 27, 3, '#a8bbba');
    for (var hy = ground + 6; hy < ground + 24; hy += 5) linje(hx - 20, hy, hx + 20, hy, '#809b9b');
    ctx.font = 'bold 7px system-ui'; ctx.fillStyle = ink; ctx.textAlign = 'center'; ctx.fillText('RAKETLABBET', hx, ground - 2);
    var flagX = W * .73;
    linje(flagX, ground - 24, flagX, ground + 24, ink, 2);
    ctx.fillStyle = orange; ctx.beginPath(); ctx.moveTo(flagX, ground - 23); ctx.lineTo(flagX + 25, ground - 18); ctx.lineTo(flagX, ground - 9); ctx.fill();
    ruta(W * .49 - 54, ground + 20, 108, 8, 3, '#819997', ink);
    ruta(W * .49 - 35, ground + 28, 70, 6, 2, '#637e7c');
    return ground;
  }
  function malLinje(mal, f) {
    if (!mal) return;
    var lineY = !f ? H * .23 : H * .59 - (mal - f.h) / Math.max(20, f.h / (H * .5));
    if (lineY < 70 || lineY > H - 65) return;
    ctx.setLineDash([5, 6]); linje(20, lineY, W - 55, lineY, '#92afa9'); ctx.setLineDash([]);
    ctx.font = 'bold 10px system-ui'; ctx.textAlign = 'right'; ctx.fillStyle = '#3f6765';
    ctx.fillText('MÅL ' + RB.formatHojd(mal), W - 62, lineY - 8);
  }
  function matare(f) {
    var x = W - 28, bot = H - 36, top = 145;
    if (H < 300) top = 120;
    linje(x, top, x, bot, '#a8bebe');
    for (var i = 0; i <= 10; i++) {
      var y = bot - i * (bot - top) / 10;
      linje(x - (i % 5 === 0 ? 10 : 5), y, x, y, '#8da6a7');
    }
    if (f) {
      var height = Math.min(1, f.h / 100000), currentY = bot - height * (bot - top);
      ctx.fillStyle = orange; ctx.beginPath(); ctx.arc(x, currentY, 4, 0, Math.PI * 2); ctx.fill();
    }
    ctx.save(); ctx.translate(x + 9, (top + bot) / 2); ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#4c676e'; ctx.font = '9px system-ui'; ctx.textAlign = 'center'; ctx.fillText('FRÅN MARKEN TILL RYMDEN', 0, 0); ctx.restore();
  }
  function rita(config, f, mal) {
    senast = [config, f, mal];
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H); fond(f); malLinje(mal, f);
    mark(f);
    var cx = W * .49;
    var scale = Math.min(1.17, (H - 105) / (110 + config.bransle * 11));
    var rocketH = (100 + (f && f.slappt ? f.delar[1].block : config.bransle) * 11) * scale;
    var startY = H - 65 + 12 - rocketH;
    var ry = startY - (f ? Math.min(f.h / 12, Math.max(0, startY - (H * .5 - rocketH * .4))) : 0);
    if (f && f.h > 300) {
      ctx.setLineDash([3, 7]); linje(cx, ry + rocketH + 48, cx, H + 10, '#d8a880', 2); ctx.setLineDash([]);
      if (f.slappt && f.t > 0) {
        ctx.save(); ctx.globalAlpha = .35; ruta(cx + 52, Math.min(H - 30, ry + rocketH + 80), 24, 36, 5, '#9aaca7'); ctx.restore();
      }
    }
    raket(config, cx, ry, scale, f); matare(f);
    if (!f && W > 470) {
      ctx.fillStyle = '#536d72'; ctx.font = '10px system-ui'; ctx.textAlign = 'left';
      var tx = Math.min(W - 165, cx + 80);
      linje(cx + 34, ry + 50 * scale, tx - 8, ry + 50 * scale, '#9ab6b4');
      ctx.fillText('KAPSEL INGÅR', tx, ry + 50 * scale + 3);
      linje(cx + 34, ry + 95 * scale, tx - 8, ry + 95 * scale, '#9ab6b4');
      ctx.fillText(config.bransle + ' BRÄNSLEBLOCK', tx, ry + 95 * scale + 3);
    }
    canvas.setAttribute('aria-label', f ? 'Raketen är ' + RB.formatHojd(f.h) + ' över marken. ' + (f.vantande ? 'Första delen är tom, spelet väntar.' : '') :
      'Färdig grundraket med ' + RB.motor(config.motor).namn.toLowerCase() + ', ' + config.bransle + ' bränsleblock och ' + config.steg + ' raketsteg.');
  }
  function resize() {
    var rect = canvas.getBoundingClientRect(); W = rect.width; H = rect.height;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (senast) rita.apply(null, senast);
  }
  function init() {
    canvas = document.getElementById('raketCanvas'); ctx = canvas.getContext('2d');
    new ResizeObserver(resize).observe(canvas);
    resize();
  }
  return { init: init, rita: rita };
})();
