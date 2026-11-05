const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- The word: fit it to the page, then hammer it out ---------- */
const ingot = document.getElementById('ingot');
const word = ingot.firstElementChild;

function fitIngot() {
  const available = ingot.clientWidth;
  ingot.style.fontSize = '100px';
  ingot.style.fontVariationSettings = '"wdth" 150';
  const size = (available / word.offsetWidth) * 100;
  ingot.style.fontSize = `${size}px`;
  ingot.style.fontVariationSettings = '';
}

function hammerOut() {
  // Three blows, each spreading the metal wider and cooling it a little.
  const blows = [
    { wdth: 50,  heat: 2.2 },
    { wdth: 88,  heat: 1.9 },
    { wdth: 122, heat: 1.5 },
    { wdth: 150, heat: 1.2 },
  ];
  const hold = 0.28; // share of each beat spent resting before the next blow
  const frames = [];
  blows.forEach((blow, i) => {
    const start = i === 0 ? 0 : (i - 1 + hold) / (blows.length - 1);
    const end = i / (blows.length - 1);
    if (i > 0) {
      frames.push({
        offset: start,
        fontVariationSettings: `"wdth" ${blows[i - 1].wdth}`,
        filter: `brightness(${blows[i - 1].heat * 0.9})`,
        transform: 'translateY(0)',
        easing: 'cubic-bezier(.7,0,1,.6)',
      });
    }
    frames.push({
      offset: i === 0 ? 0 : Math.min(start + 0.1, end),
      fontVariationSettings: `"wdth" ${blow.wdth}`,
      filter: `brightness(${blow.heat})`,
      transform: i === 0 ? 'translateY(0)' : 'translateY(.012em)',
      easing: 'ease-out',
    });
  });
  frames.push({
    offset: 1,
    fontVariationSettings: '"wdth" 150',
    filter: 'brightness(1)',
    transform: 'translateY(0)',
  });
  frames.sort((a, b) => a.offset - b.offset);
  ingot.animate(frames, { duration: 1500, delay: 150, fill: 'backwards' });
}

const fontsReady = document.fonts ? document.fonts.load('900 100px Anybody').then(() => document.fonts.ready) : Promise.resolve();
fontsReady.then(() => {
  fitIngot();
  if (!reducedMotion) hammerOut();
});
let resizeTimer;
addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(fitIngot, 120);
});

/* ---------- The watch: scroll position told as distance and time ---------- */
const MINUTES_PER_KM = 6.4; // easy social pace, from a 06:00 start
const marks = [...document.querySelectorAll('[data-km]')];
const kmEl = document.getElementById('watch-km');
const timeEl = document.getElementById('watch-time');
const barEl = document.getElementById('watch-bar');

function distanceRun() {
  const y = scrollY + innerHeight * 0.4;
  const maxY = document.documentElement.scrollHeight - innerHeight;
  if (scrollY >= maxY - 2) return 5;
  const tops = marks.map((el) => el.getBoundingClientRect().top + scrollY);
  tops[0] = innerHeight * 0.4; // km 0 is the top of the page
  for (let i = tops.length - 1; i >= 0; i--) {
    if (y >= tops[i]) {
      const next = i + 1 < tops.length ? tops[i + 1] : maxY + innerHeight * 0.4;
      return Math.min(5, i + (y - tops[i]) / (next - tops[i]));
    }
  }
  return 0;
}

let ticking = false;
function updateWatch() {
  ticking = false;
  const km = distanceRun();
  const minutes = Math.round(km * MINUTES_PER_KM);
  kmEl.textContent = km.toFixed(2);
  timeEl.textContent = `06:${String(minutes).padStart(2, '0')}`;
  barEl.style.transform = `scaleX(${km / 5})`;
}
function requestWatchUpdate() {
  if (!ticking) {
    ticking = true;
    requestAnimationFrame(updateWatch);
  }
}
addEventListener('scroll', requestWatchUpdate, { passive: true });
addEventListener('resize', requestWatchUpdate);
updateWatch();

/* ---------- Dates: keep the page honest once a run has happened ---------- */
const today = new Date();
today.setHours(0, 0, 0, 0);
const events = [...document.querySelectorAll('[data-event-date]')];
const upcoming = [];

events.forEach((event) => {
  const date = new Date(`${event.dataset.eventDate}T00:00:00`);
  if (date < today) {
    event.classList.add('is-past');
    event.querySelector('[data-status]').textContent = 'This one is done. New dates land in the WhatsApp group first.';
  } else {
    upcoming.push(date);
  }
});

const nextRun = document.getElementById('next-run');
if (upcoming.length === 0) {
  nextRun.textContent = 'New dates land in the WhatsApp group first.';
} else if (events[0].classList.contains('is-past')) {
  nextRun.textContent = upcoming[0].toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).replace(',', '') + '. Details coming soon.';
}
