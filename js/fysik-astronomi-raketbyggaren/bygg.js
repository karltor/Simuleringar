window.RB = window.RB || {};
RB.bygg = (function () {
  function init() {
    RB.MOTORER.forEach(function (motor) {
      var kort = document.createElement('label'); kort.className = 'motor-kort';
      kort.innerHTML = '<input type="radio" name="motor" value="' + motor.id + '"><svg class="ikon" aria-hidden="true"><use href="#ikon-motor"/></svg><span class="motor-info"><b>' + motor.namn + '</b><small>' + (motor.kraft / 1000).toLocaleString('sv-SE') + ' kN · ' + motor.massa + ' kg</small></span><span class="val-markering" aria-hidden="true"></span>';
      kort.querySelector('input').addEventListener('change', function () { RB.main.andra({ motor: motor.id }); });
      document.getElementById('motor-val').appendChild(kort);
    });
    document.getElementById('btn-minus').addEventListener('click', function () { RB.main.andraBransle(-1); });
    document.getElementById('btn-plus').addEventListener('click', function () { RB.main.andraBransle(1); });
    document.querySelectorAll('input[name="steg"]').forEach(function (input) { input.addEventListener('change', function () { RB.main.andra({ steg: Number(input.value) }); }); });
    for (var i = 0; i < 8; i++) document.getElementById('bransle-block').appendChild(document.createElement('span'));
  }
  function render(spel, flyger) {
    document.querySelectorAll('.motor-kort').forEach(function (kort, i) {
      var motor = RB.MOTORER[i], owned = spel.agda.indexOf(motor.id) !== -1;
      kort.hidden = !owned; var input = kort.querySelector('input');
      input.checked = spel.config.motor === motor.id; input.disabled = flyger || !owned;
    });
    document.getElementById('bransle-antal').textContent = spel.config.bransle;
    document.getElementById('btn-minus').disabled = flyger || spel.config.bransle <= spel.config.steg;
    document.getElementById('btn-plus').disabled = flyger || spel.config.bransle >= 8;
    document.querySelectorAll('#bransle-block span').forEach(function (block, i) { block.classList.toggle('fyllt', i < spel.config.bransle); });
    document.getElementById('steg-falt').hidden = spel.agda.indexOf('steg') === -1;
    document.querySelectorAll('input[name="steg"]').forEach(function (input) { input.checked = Number(input.value) === spel.config.steg; input.disabled = flyger; });
    document.getElementById('vikt').textContent = RB.formatVikt(RB.fysik.data(spel.config).vikt);
    document.getElementById('bana-rekord').textContent = spel.marken.indexOf('bana') !== -1 ? 'Omloppsbana ✓' : 'Omloppsbana ○';
    document.querySelector('.app').classList.toggle('flyger', flyger);
    if (!flyger) RB.rita.rita(spel.config, null);
  }
  return { init: init, render: render };
})();
