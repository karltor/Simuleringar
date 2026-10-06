// Speldata. Kapsel, nos och fenor ingår alltid i grundraketen.
window.RB = window.RB || {};
RB.MOTORER = [
  { id: 'start', namn: 'Startmotorn', kort: 'Start', text: 'En liten motor. Börja här.',
    massa: 220, kraft: 28000, ve: 1800, upplasning: 0, styrka: 1, snalhet: 1 },
  { id: 'kraft', namn: 'Kraftmotorn', kort: 'Kraft', text: 'Orkar lyfta en tyngre raket.',
    massa: 420, kraft: 75000, ve: 2000, upplasning: 2, styrka: 3, snalhet: 1 },
  { id: 'snal', namn: 'Snålmotorn', kort: 'Snål', text: 'Får mer fart ur samma bränsle.',
    massa: 260, kraft: 38000, ve: 2400, upplasning: 3, styrka: 2, snalhet: 3 }
];
RB.UPPDRAG = [
  { namn: 'Sikta på molnen', mal: 1000, etikett: 'Molnen',
    text: 'Nå 1 000 meter. Din första raket är redan redo!',
    tips: 'Välj bränsle och tryck på Starta. Raketen sköter gas och styrning.',
    beloning: 'Nästa uppdrag: testa vad mer bränsle gör.' },
  { namn: 'Mer är inte alltid bättre', mal: null, etikett: 'Jämför två försök',
    text: 'Testa 2 och 6 bränsleblock med startmotorn. Vilken når högst?',
    tips: 'Behåll samma motor och ett raketsteg. Ändra bara bränslet.',
    beloning: 'Kraftmotorn är upplåst!' },
  { namn: 'Lite mer muskler', mal: 30000, etikett: '30 000 m',
    text: 'Nå 30 000 meter med din nya kraftmotor.',
    tips: 'En starkare motor kan lyfta mer. Men extra bränsle väger fortfarande.',
    beloning: 'Snålmotorn är upplåst!' },
  { namn: 'Lättare. Smartare. Högre.', mal: 50000, etikett: '50 000 m',
    text: 'Nå 50 000 meter med högst 3 bränsleblock och ett raketsteg.',
    tips: 'Testa snålmotorn. Den får mer fart ur varje bränsleblock.',
    beloning: 'Nu kan du bygga en raket med två steg!' },
  { namn: 'Släpp dödvikten', mal: 80000, etikett: '80 000 m',
    text: 'Nå 80 000 meter med två steg. Släpp den tomma delen på vägen.',
    tips: 'När första delen är tom stannar spelet. Tryck på Släpp tom del.',
    beloning: 'Sista uppdraget är upplåst. Nu siktar vi riktigt högt!' },
  { namn: 'Ditt eget rymdprogram', mal: 100000, etikett: 'Rymdgränsen',
    text: 'Nå 100 000 meter. Hitta din bästa blandning av motor, bränsle och steg.',
    tips: 'Jämför dina försök. Kan en lättare raket slå ditt rekord?',
    beloning: 'Alla uppdrag klara! Fortsätt jaga ditt eget höjdrekord.' }
];
RB.motor = function (id) {
  return RB.MOTORER.find(function (motor) { return motor.id === id; }) || RB.MOTORER[0];
};
RB.konfig = function (data) {
  data = data || {};
  return { motor: RB.motor(data.motor).id,
    bransle: Math.max(1, Math.min(8, Math.round(Number(data.bransle) || 1))),
    steg: data.steg === 2 ? 2 : 1 };
};
RB.formatHojd = function (meter) {
  return Math.round(meter).toLocaleString('sv-SE') + ' m';
};
RB.formatVikt = function (kg) { return Math.round(kg).toLocaleString('sv-SE') + ' kg'; };
