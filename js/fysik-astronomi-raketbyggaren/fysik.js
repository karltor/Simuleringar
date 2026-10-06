// Vertikal provflygning med varierande massa, gravitation och luftmotstånd.
// Inga påhittade höjdbonusar: resultatet kommer från samma modell i alla uppdrag.
window.RB = window.RB || {};
RB.fysik = (function () {
  var KAPSEL = 400, TANK = 90, BRANSLE = 500, G = 9.82, RADIE = 6371000;
  var DT = 1 / 60;
  function delar(config) {
    var motor = RB.motor(config.motor);
    var antal = config.steg === 2 ? [Math.ceil(config.bransle * 0.6), Math.floor(config.bransle * 0.4)] : [config.bransle];
    if (config.steg === 2 && config.bransle < 2) antal = [1, 1];
    return antal.map(function (block) {
      return { block: block, torr: motor.massa + block * TANK,
        bransle: block * BRANSLE, fullt: block * BRANSLE };
    });
  }
  function massa(f) {
    return KAPSEL + f.delar.reduce(function (summa, del, i) {
      return summa + (i < f.aktiv ? 0 : del.torr + del.bransle);
    }, 0);
  }
  function data(config) {
    var f = skapa(config), vikt = massa(f);
    var bransle = f.delar.reduce(function (summa, del) { return summa + del.bransle; }, 0);
    return { vikt: vikt, bransle: bransle, torr: vikt - bransle, lyft: f.motor.kraft / (vikt * G), delar: f.delar };
  }
  function skapa(config) {
    config = RB.konfig(config);
    if (config.steg === 2) config.bransle = Math.max(2, config.bransle);
    return { config: config, motor: RB.motor(config.motor), delar: delar(config), aktiv: 0,
      h: 0, v: 0, t: 0, maxHojd: 0, maxFart: 0, markTid: 0,
      fas: 'motor', vantande: false, slappt: false, slut: false, orsak: '', rest: 0 };
  }
  function slapp(f) {
    if (!f.vantande || f.slut) return false;
    f.aktiv++;
    f.vantande = false;
    f.slappt = true;
    f.fas = 'motor';
    return true;
  }
  function steg(f, dt) {
    if (f.slut || f.vantande) return;
    var del = f.delar[f.aktiv];
    var fore = massa(f), forbrukat = Math.min(del.bransle, f.motor.kraft / f.motor.ve * dt);
    del.bransle = Math.max(0, del.bransle - forbrukat);
    var efter = fore - forbrukat;
    // Exakt hastighetsändring från utkastad massa inom detta lilla tidssteg.
    var dv = forbrukat > 0 ? f.motor.ve * Math.log(fore / efter) : 0;
    var g = G * Math.pow(RADIE / (RADIE + f.h), 2);
    var rho = 1.225 * Math.exp(-Math.max(0, f.h) / 8500);
    var cda = 0.38 + 0.035 * f.config.bransle;
    var luft = 0.5 * rho * cda * f.v * Math.abs(f.v) / ((fore + efter) / 2);
    f.v += dv - (g + luft) * dt;
    f.h += f.v * dt;
    f.t += dt;
    if (f.h <= 0) {
      f.h = 0;
      f.v = Math.max(0, f.v);
      f.markTid += dt;
    }
    f.maxHojd = Math.max(f.maxHojd, f.h);
    f.maxFart = Math.max(f.maxFart, f.v);
    if (del.bransle <= 0 && f.aktiv < f.delar.length - 1) {
      f.vantande = true;
      f.fas = 'slapp';
      return;
    }
    if (del.bransle <= 0) f.fas = 'glid';
    // Avsluta vid högsta punkten: ingen landningsskicklighet behövs.
    if ((f.fas === 'glid' && f.v <= 0) || f.t >= 1200) {
      f.slut = true;
      f.fas = 'klar';
      f.orsak = f.maxHojd < 1 ? 'tung' : 'topp';
    }
  }
  function tick(f, sekunder) {
    if (f.slut || f.vantande) return;
    f.rest += sekunder;
    while (f.rest >= DT && !f.slut && !f.vantande) {
      steg(f, DT);
      f.rest -= DT;
    }
    // En paus vid stegbyte ska inte köra ikapp tiden från samma bildruta.
    if (f.vantande || f.slut) f.rest = 0;
  }
  function prova(config, slappa) {
    var f = skapa(config);
    while (!f.slut) {
      tick(f, 1);
      if (f.vantande) {
        if (slappa === false) break;
        slapp(f);
      }
    }
    return f;
  }
  return { skapa: skapa, tick: tick, slapp: slapp, massa: massa, data: data, prova: prova };
})();
