// Byggpanelen: alltid en flygbar grundraket, aldrig fri dragning av lösa delar.
window.RB = window.RB || {};
RB.bygg = (function () {
  function ikon(namn) { return '<svg class="ikon" aria-hidden="true"><use href="#ikon-' + namn + '"/></svg>'; }
  function init() {
    var lista = document.getElementById('motor-val');
    RB.MOTORER.forEach(function (motor) {
      var kort = document.createElement('label');
      kort.className = 'motor-kort';
      kort.innerHTML = '<input type="radio" name="motor" value="' + motor.id + '">' +
        '<span class="motor-ikon">' + ikon('motor') + '</span>' +
        '<span class="motor-info"><b>' + motor.namn + '</b><span class="motor-text"></span></span>' +
        '<span class="val-markering" aria-hidden="true"></span>';
      kort.querySelector('input').addEventListener('change', function () { RB.main.andra({ motor: motor.id }); });
      lista.appendChild(kort);
    });
    document.getElementById('btn-minus').addEventListener('click', function () { RB.main.andraBransle(-1); });
    document.getElementById('btn-plus').addEventListener('click', function () { RB.main.andraBransle(1); });
    document.getElementById('btn-tva').addEventListener('click', function () { RB.main.andra({ bransle: 2 }); });
    document.getElementById('btn-sex').addEventListener('click', function () { RB.main.andra({ bransle: 6 }); });
    document.querySelectorAll('input[name="steg"]').forEach(function (input) {
      input.addEventListener('change', function () { RB.main.andra({ steg: Number(input.value) }); });
    });
    var block = document.getElementById('bransle-block');
    for (var i = 0; i < 8; i++) block.appendChild(document.createElement('span'));
  }
  function render(spel, flyger) {
    var config = spel.config, upplast = spel.klara.length;
    var jamfor = spel.aktuell === 1;
    document.querySelectorAll('.motor-kort').forEach(function (kort, i) {
      var motor = RB.MOTORER[i], last = upplast < motor.upplasning;
      var input = kort.querySelector('input');
      input.checked = config.motor === motor.id;
      input.disabled = flyger || last || (jamfor && motor.id !== 'start');
      kort.classList.toggle('last', last);
      kort.hidden = last;
      kort.querySelector('.motor-text').textContent = last ? 'Lås upp i uppdrag ' + (motor.upplasning + 1) : motor.text;
      kort.querySelector('.motor-ikon').innerHTML = ikon(last ? 'las' : 'motor');
      input.setAttribute('aria-label', motor.namn + '. ' + kort.querySelector('.motor-text').textContent);
    });
    var nastaMotor = RB.MOTORER.find(function (motor) { return upplast < motor.upplasning; });
    document.getElementById('motor-laser').hidden = !nastaMotor;
    document.getElementById('motor-laser').textContent = nastaMotor ? 'Klara uppdrag ' + nastaMotor.upplasning + ' för att låsa upp nästa motor.' : '';
    document.getElementById('bransle-antal').textContent = config.bransle;
    document.getElementById('btn-minus').disabled = flyger || config.bransle <= (config.steg === 2 ? 2 : 1);
    document.getElementById('btn-plus').disabled = flyger || config.bransle >= 8;
    document.querySelectorAll('#bransle-block span').forEach(function (block, i) { block.classList.toggle('fyllt', i < config.bransle); });
    document.getElementById('jamfor-val').hidden = !jamfor;
    document.getElementById('jamfor-status').hidden = !jamfor;
    document.getElementById('btn-tva').disabled = flyger;
    document.getElementById('btn-sex').disabled = flyger;
    document.getElementById('jamfor-status').textContent =
      (spel.jamforelse.tva ? '✓ 2 block testade' : '○ Testa 2 block') + ' · ' +
      (spel.jamforelse.sex ? '✓ 6 block testade' : '○ Testa 6 block');
    document.getElementById('steg-falt').hidden = upplast < 4;
    document.querySelectorAll('input[name="steg"]').forEach(function (input) {
      input.checked = Number(input.value) === config.steg;
      input.disabled = flyger || jamfor;
    });
    document.getElementById('steg-tips').textContent = config.steg === 2 ?
      'Släpp den första delen när den är tom.' : 'Alla tankar följer med hela vägen.';
    var data = RB.fysik.data(config);
    document.getElementById('vikt').textContent = RB.formatVikt(data.vikt);
    document.getElementById('torrvikt').textContent = RB.formatVikt(data.torr);
    document.getElementById('branslevikt').textContent = RB.formatVikt(data.bransle);
    document.getElementById('vikt-raket').style.width = (100 * data.torr / data.vikt) + '%';
    document.getElementById('vikt-bransle').style.width = (100 * data.bransle / data.vikt) + '%';
    var tips = document.getElementById('lyft-tips');
    tips.classList.toggle('tung', data.lyft < 1.15);
    tips.textContent = data.lyft < 1 ? 'Tung start! Motorn måste bränna bränsle innan raketen kan lyfta.' :
      data.lyft < 1.15 ? 'Tung för motorn. Prova gärna och jämför höjden.' : 'Redo för lyft. Nu är det dags att testa!';
    document.querySelector('.app').classList.toggle('flyger', flyger);
    if (!flyger) RB.rita.rita(config, null, RB.UPPDRAG[spel.aktuell].mal);
  }
  return { init: init, render: render };
})();
