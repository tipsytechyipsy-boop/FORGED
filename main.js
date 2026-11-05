const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- The wordmark: hammer it out to full width ---------- */
function hammerOut() {
  const ingot = document.getElementById('ingot');
  // Three blows: each one spreads the metal wider and cools it a little.
  const blows = [
    { width: 0.34, heat: 2.2 },
    { width: 0.58, heat: 1.9 },
    { width: 0.8, heat: 1.5 },
    { width: 1, heat: 1 },
  ];
  const beat = 1 / (blows.length - 1);
  const strike = 0.08; // share of the animation each blow takes to land
  const frames = [];
  blows.forEach((blow, i) => {
    const at = i * beat;
    const pose = { transform: `scaleX(${blow.width})`, filter: `brightness(${blow.heat})` };
    if (i > 0) {
      // Rest until just before the blow, then land it fast.
      const rest = blows[i - 1];
      frames.push({ offset: at - strike, transform: `scaleX(${rest.width})`, filter: `brightness(${rest.heat * 0.9})`, easing: 'cubic-bezier(.7,0,1,.6)' });
    }
    frames.push({ offset: at, easing: 'linear', ...pose });
  });
  ingot.animate(frames, { duration: 1400, delay: 200, fill: 'backwards' });
}
if (!reducedMotion) hammerOut();

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
