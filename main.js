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

/* ---------- Preloader: three blows crack the ice, and the logo is what's left ---------- */
const ICE_APEX = [25, 20]; // where the logo's streaks meet, in % of the block

// Pieces of ice that fill the gaps in the logo. Points are % of the block.
const ICE_SHARDS = [
  [[26, 18], [41, 26], [42, 32], [27, 21]],
  [[41, 26], [61, 37], [62, 46], [42, 32]],
  [[61, 37], [81, 48], [88, 51.5], [84, 61.5], [62, 46]],
  [[88, 51.5], [98, 50], [98, 66], [84, 61.5]],
  [[23, 21], [40, 37.5], [41, 42], [23.5, 25]],
  [[40, 37.5], [55, 53.5], [50, 60], [41, 42]],
  [[55, 53.5], [71, 70], [57, 71], [50, 60]],
  [[71, 70], [74, 74], [72, 96], [61, 96], [60.5, 80], [57, 71]],
  [[84, 61.5], [86, 67], [82, 74], [98, 76], [98, 66]],
  [[74, 74], [82, 74], [98, 76], [98, 85], [80, 84]],
  [[74, 74], [80, 84], [84, 96], [72, 96]],
  [[80, 84], [98, 85], [98, 96], [84, 96]],
];

// Crack lines, grouped by the blow that opens them.
const ICE_CRACKS = [
  ['M25 20 L34 25 L42 29', 'M25 21 L31 30 L38 38'],
  ['M42 29 L52 34 L62 41 L72 46', 'M38 38 L47 47 L55 55', 'M52 34 L49 41', 'M47 47 L55 44'],
  ['M72 46 L84 55 L96.5 58', 'M55 55 L58 66 L66 72 L72 84 L75 94', 'M84 55 L86 66 L82 74', 'M72 84 L85 80 L96.5 82'],
];

function runPreloader(onReveal) {
  const ice = document.getElementById('ice');
  const stage = document.getElementById('ice-stage');
  const block = stage.querySelector('.ice__block');
  const logo = stage.querySelector('.ice__logo');
  const flash = document.getElementById('ice-flash');
  const shardBox = document.getElementById('ice-shards');
  const crackBox = document.getElementById('ice-cracks');
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const between = (min, max) => min + Math.random() * (max - min);

  // Each crack is a dark fracture with a bright edge, so it shows on pale ice.
  const crackGroups = ICE_CRACKS.map((group) => group.flatMap((d) => (
    [['#2B4654', '0.85'], ['#FFFFFF', '0.3']].map(([stroke, width]) => {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', d);
      path.setAttribute('pathLength', '1');
      path.setAttribute('stroke', stroke);
      path.setAttribute('stroke-width', width);
      crackBox.append(path);
      return path;
    })
  )));

  const shards = ICE_SHARDS.map((points) => {
    const shard = document.createElement('div');
    shard.className = 'ice__shard';
    shard.style.clipPath = `polygon(${points.map(([x, y]) => `${x}% ${y}%`).join(',')})`;
    shardBox.append(shard);
    const cx = points.reduce((sum, p) => sum + p[0], 0) / points.length;
    const cy = points.reduce((sum, p) => sum + p[1], 0) / points.length;
    shard.style.transformOrigin = `${cx}% ${cy}%`;
    return { shard, cx, cy };
  });

  function strike(power, cracks) {
    const kick = 2 + power * 2.5;
    stage.animate([
      { transform: 'none' },
      { transform: `translate(${kick}%, ${kick * 0.7}%) rotate(${power * 0.7}deg) scale(.985)`, offset: 0.2 },
      { transform: `translate(${-kick * 0.5}%, ${-kick * 0.3}%) rotate(${-power * 0.35}deg)`, offset: 0.5 },
      { transform: 'none' },
    ], { duration: 240, easing: 'ease-out' });
    flash.animate([{ opacity: 0.35 + power * 0.2 }, { opacity: 0 }], { duration: 260, easing: 'ease-out' });
    cracks.forEach((path) => {
      path.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 170, easing: 'ease-out', fill: 'forwards' });
    });
  }

  function throwChips(size) {
    for (let i = 0; i < 26; i++) {
      const chip = document.createElement('i');
      chip.className = 'ice__chip';
      const s = between(0.8, 3.2);
      chip.style.cssText = `left:${between(30, 92)}%;top:${between(25, 90)}%;width:${s}%;height:${s * between(0.6, 1.5)}%;clip-path:polygon(50% 0,100% 40%,70% 100%,0 70%);visibility:visible`;
      stage.append(chip);
      const angle = between(-0.5, 1.9);
      const dist = size * between(0.5, 1.4);
      chip.animate([
        { transform: 'none', opacity: 1 },
        { transform: `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist + size * 0.55}px) rotate(${between(-400, 400)}deg)`, opacity: 0 },
      ], { duration: between(500, 950), easing: 'cubic-bezier(.15,.7,.5,1)', fill: 'forwards' });
    }
  }

  function shatter() {
    const size = stage.offsetWidth;
    block.style.visibility = 'hidden';
    crackBox.style.visibility = 'hidden';
    logo.style.visibility = 'visible';
    flash.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 420, easing: 'ease-out' });
    shards.forEach(({ shard, cx, cy }) => {
      shard.style.visibility = 'visible';
      // Each piece flies out from where the streaks meet, then gravity takes it.
      const dx = cx - ICE_APEX[0];
      const dy = cy - ICE_APEX[1];
      const length = Math.hypot(dx, dy);
      const reach = size * between(0.45, 0.95);
      const x = (dx / length) * reach;
      const y = (dy / length) * reach;
      const spin = between(-110, 110);
      shard.animate([
        { transform: 'none', opacity: 1, easing: 'cubic-bezier(.1,.7,.5,1)' },
        { transform: `translate(${x * 0.7}px, ${y * 0.7}px) rotate(${spin * 0.6}deg)`, opacity: 1, offset: 0.45, easing: 'cubic-bezier(.6,0,1,.7)' },
        { transform: `translate(${x}px, ${y + size * 1.1}px) rotate(${spin}deg) scale(.9)`, opacity: 0 },
      ], { duration: 1000, fill: 'forwards' });
    });
    throwChips(size);
    logo.animate([
      { transform: 'scale(.97)', filter: 'brightness(1.5)' },
      { transform: 'scale(1.03)', filter: 'brightness(1.15)', offset: 0.35 },
      { transform: 'none', filter: 'none' },
    ], { duration: 620, easing: 'ease-out' });
  }

  let finished = false;
  function finish() {
    if (finished) return;
    finished = true;
    onReveal();
    // A skip can land before the break, so make sure the logo is what's showing.
    block.style.visibility = 'hidden';
    crackBox.style.visibility = 'hidden';
    logo.style.visibility = 'visible';
    const target = document.querySelector('.nav__brand img').getBoundingClientRect();
    const from = logo.getBoundingClientRect();
    // Land the logo on the nav icon, if the nav is on screen.
    if (target.bottom > 0) {
      const scale = target.width / from.width;
      const x = target.left + target.width / 2 - (from.left + from.width / 2);
      const y = target.top + target.height / 2 - (from.top + from.height / 2);
      stage.animate([{ transform: 'none' }, { transform: `translate(${x}px, ${y}px) scale(${scale})` }], { duration: 620, easing: 'cubic-bezier(.65,0,.2,1)', fill: 'forwards' });
    }
    ice.style.pointerEvents = 'none';
    const background = ice.animate([{ backgroundColor: '#0A0809' }, { backgroundColor: 'rgb(10 8 9 / 0)' }], { duration: 620, easing: 'ease-in', fill: 'forwards' });
    background.finished.then(() => ice.remove());
  }

  // Tap, click or press a key to skip.
  ice.addEventListener('click', finish);
  addEventListener('keydown', finish, { once: true });

  const pageLoaded = new Promise((resolve) => {
    if (document.readyState === 'complete') resolve();
    else addEventListener('load', resolve, { once: true });
  });
  const artReady = Promise.all([block, logo].map((img) => img.decode().catch(() => {})));

  (async () => {
    await Promise.race([artReady, wait(1200)]);
    stage.animate([{ opacity: 0, transform: 'scale(.94)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: 'ease-out' });
    await wait(480);
    if (finished) return;
    strike(1, crackGroups[0]);
    await wait(420);
    if (finished) return;
    strike(1.6, crackGroups[1]);
    await Promise.all([wait(420), Promise.race([pageLoaded, wait(1500)])]);
    if (finished) return;
    strike(2.2, crackGroups[2]);
    await wait(90);
    if (finished) return;
    shatter();
    await wait(1050);
    finish();
  })();
}


/* ---------- The route: a road with a molten trail up to the next run ---------- */
function setupRoute() {
  const route = document.getElementById('route');
  const road = document.getElementById('route-road');
  const lines = [...road.querySelectorAll('path')];
  const trails = lines.filter((line) => line.hasAttribute('pathLength'));
  const heat = document.getElementById('route-heat');
  const embers = document.getElementById('route-embers');
  const stops = [...route.querySelectorAll('.route__stop')];

  // Stops that have passed are done; the first one left is next.
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const next = stops.find((stop) => new Date(`${stop.dataset.date}T00:00:00`) >= startOfToday);
  stops.forEach((stop, i) => {
    stop.classList.toggle('is-done', new Date(`${stop.dataset.date}T00:00:00`) < startOfToday);
    stop.classList.toggle('is-next', stop === next);
    // Stops sit on alternate peaks and valleys, with labels inside each bend.
    stop.classList.add(i % 2 ? 'is-valley' : 'is-peak');
  });

  // Embers rising from the hot end of the trail.
  if (next) {
    for (let i = 0; i < 14; i++) {
      const ember = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      ember.setAttribute('class', 'route__ember');
      ember.setAttribute('r', (1 + Math.random() * 1.6).toFixed(1));
      ember.style.setProperty('--drift', `${(Math.random() * 44 - 22).toFixed(0)}px`);
      ember.style.setProperty('--rise', `${(-34 - Math.random() * 46).toFixed(0)}px`);
      ember.style.setProperty('--life', `${(1.1 + Math.random() * 1.1).toFixed(2)}s`);
      ember.style.setProperty('--wait', `${(Math.random() * 2).toFixed(2)}s`);
      embers.append(ember);
    }
  }

  let reached = 1; // share of the road's length covered by the trail
  function layout() {
    route.classList.remove('is-squeezed');
    const w = route.clientWidth;
    const h = route.clientHeight;
    // Too little room for a road and its labels, so leave it out.
    const compact = w < 600;
    if (h < (compact ? 170 : 120)) {
      route.classList.add('is-squeezed');
      return;
    }
    const width = compact ? 14 : 26;
    route.style.setProperty('--road', `${width}px`);
    // Narrow bends can't hold a label, so on phones labels sit outside them.
    route.classList.toggle('is-compact', compact);
    const top = compact ? 66 : width / 2 + 18;
    const low = compact ? h - 34 : h - width / 2 - 3;
    const y = (share) => top + share * (low - top);

    // Peak, valley, peak... with flat tangents, so the road sweeps between stops.
    const first = 0.13;
    const gap = (0.89 - first) / Math.max(1, stops.length - 1);
    const points = stops.map((_, i) => [(first + gap * i) * w, y(i % 2 ? 1 : 0)]);
    const all = [[0, y(0.55)], ...points, [w, y(stops.length % 2 ? 0.5 : 0.5)]];
    const sweep = (a, b) => {
      const pull = (b[0] - a[0]) / 2;
      return `C${(a[0] + pull).toFixed(1)} ${a[1].toFixed(1)} ${(b[0] - pull).toFixed(1)} ${b[1].toFixed(1)} ${b[0].toFixed(1)} ${b[1].toFixed(1)}`;
    };
    const pathTo = (end) => `M${all[0][0]} ${all[0][1].toFixed(1)} ${all.slice(1, end + 1).map((p, i) => sweep(all[i], p)).join(' ')}`;
    const d = pathTo(all.length - 1);

    road.setAttribute('viewBox', `0 0 ${w} ${h}`);
    lines.forEach((line) => line.setAttribute('d', d));
    stops.forEach((stop, i) => {
      stop.style.left = `${points[i][0]}px`;
      stop.style.top = `${points[i][1]}px`;
    });

    // The trail stops at the next run; the heat gradient peaks right there.
    const nextIndex = stops.indexOf(next);
    const head = next ? points[nextIndex] : all[all.length - 1];
    const measure = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    measure.setAttribute('d', next ? pathTo(nextIndex + 1) : d);
    reached = measure.getTotalLength() / lines[0].getTotalLength();
    trails.forEach((trail) => { trail.style.strokeDasharray = `${reached} 1`; });
    heat.setAttribute('x2', head[0]);
    embers.setAttribute('transform', `translate(${head[0]} ${head[1]})`);
    route.classList.add('is-ready');
  }
  layout();
  let resizeTimer;
  addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(layout, 100);
  });

  // Burn the trail up to the next stop, lighting each stop as it passes.
  return function runRoute() {
    const start = 500;
    const burn = 1600;
    trails.forEach((trail) => {
      trail.animate(
        [{ strokeDashoffset: reached }, { strokeDashoffset: 0 }],
        { duration: burn, delay: start, easing: 'cubic-bezier(.45,0,.3,1)', fill: 'backwards' },
      );
    });
    stops.forEach((stop, i) => {
      const share = next ? (i + 1) / (stops.indexOf(next) + 1) : (i + 1) / stops.length;
      stop.animate(
        [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }],
        { duration: 320, delay: start + burn * Math.min(1, share) * 0.92, easing: 'ease-out', fill: 'backwards' },
      );
    });
    embers.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400, delay: start + burn, fill: 'backwards' });
  };
}
const runRoute = setupRoute();

if (!reducedMotion) {
  runPreloader(() => {
    hammerOut();
    runRoute();
  });
}

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

/* ---------- Scroll: fly into the metal, and hammer things out as they arrive ---------- */
function startScrollEffects() {
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const smooth = (t) => t * t * (3 - 2 * t);

  const pin = document.getElementById('hero-pin');
  const hero = document.getElementById('hero');
  const ingot = document.getElementById('ingot');
  const mark = ingot.querySelector('.wordmark');
  const heat = document.getElementById('wordmark-heat');
  const fading = [hero.querySelector('.nav'), hero.querySelector('.route'), hero.querySelector('.hero__body')];
  // The widest solid part of the wordmark, in the G. Measured from the artwork.
  const SOLID = { x: 0.5542, y: 0.6817, radius: 0.0445 };
  mark.style.transformOrigin = `${SOLID.x * 100}% ${SOLID.y * 100}%`;
  const HEAT = [
    { at: 0.3, rgb: [255, 120, 30] },
    { at: 0.62, rgb: [226, 40, 22] },
    { at: 1, rgb: [74, 12, 16] }, // matches --blood-from
  ];

  const numerals = [...document.querySelectorAll('.date__day')];
  const finishMark = document.querySelector('.finish__line .wordmark');
  finishMark.style.transformOrigin = '0 50%';

  // How far an element has travelled up the screen on its way in.
  const arrival = (el) => clamp((innerHeight - el.getBoundingClientRect().top) / (innerHeight * 0.55));

  let flying = false;
  function fitFlight() {
    // A hero taller than the screen can't pin, so it just scrolls normally.
    document.documentElement.classList.remove('has-flight');
    flying = hero.offsetHeight <= innerHeight + 1;
    document.documentElement.classList.toggle('has-flight', flying);
    if (!flying) {
      mark.style.transform = '';
      heat.style.opacity = 0;
      fading.forEach((el) => { el.style.opacity = ''; el.style.transform = ''; });
      hero.classList.remove('is-flying', 'is-molten');
    }
  }

  function flyInto() {
    const travel = pin.offsetHeight - hero.offsetHeight;
    const progress = clamp(-pin.getBoundingClientRect().top / travel);
    const box = ingot.getBoundingClientRect();
    const t = clamp((progress - 0.03) / 0.97);

    // Scale exponentially so the speed feels constant, ending when the solid
    // part of the letter is big enough to cover the whole screen.
    const widest = Math.hypot(innerWidth, innerHeight) / 2;
    const maxScale = (widest / (SOLID.radius * box.width)) * 1.06;
    const scale = maxScale ** (t * t * (1.6 - 0.6 * t));
    // Bring that solid part to the middle of the screen as we approach.
    const aim = smooth(clamp(t * 1.5));
    const x = (innerWidth / 2 - (box.left + box.width * SOLID.x)) * aim;
    const y = (innerHeight / 2 - (box.top + box.height * SOLID.y)) * aim;
    mark.style.transform = t > 0 ? `translate(${x}px, ${y}px) scale(${scale})` : '';
    // The metal glows orange, then cherry, then settles into the next section's red.
    const stop = HEAT.findIndex((s) => t <= s.at);
    const to = HEAT[stop < 0 ? HEAT.length - 1 : Math.max(stop, 1)];
    const from = HEAT[HEAT.indexOf(to) - 1];
    const mix = smooth(clamp((t - from.at) / (to.at - from.at)));
    heat.style.background = `rgb(${from.rgb.map((c, i) => Math.round(c + (to.rgb[i] - c) * mix)).join(' ')})`;
    heat.style.opacity = smooth(clamp((t - 0.06) / 0.3));

    const gone = clamp(progress / 0.2);
    fading.forEach((el) => {
      el.style.opacity = 1 - gone;
      el.style.transform = gone ? `translateY(${-40 * gone}px)` : '';
    });
    hero.classList.toggle('is-flying', gone >= 1);
    hero.classList.toggle('is-molten', t >= 1);
  }

  let queued = false;
  function update() {
    queued = false;
    if (flying) flyInto();
    numerals.forEach((numeral) => {
      numeral.style.fontVariationSettings = `"wdth" ${60 + 60 * smooth(arrival(numeral))}`;
    });
    finishMark.style.transform = `scaleX(${0.34 + 0.66 * smooth(arrival(finishMark))})`;
  }
  function requestUpdate() {
    if (!queued) {
      queued = true;
      requestAnimationFrame(update);
    }
  }
  addEventListener('scroll', requestUpdate, { passive: true });
  addEventListener('resize', () => {
    fitFlight();
    requestUpdate();
  });
  fitFlight();
  update();
}
if (!reducedMotion) startScrollEffects();

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

/* ---------- Reels: play each video while it's on screen ---------- */
function loadInstagramEmbeds() {
  if (window.instgrm) {
    window.instgrm.Embeds.process();
  } else if (!document.getElementById('instagram-embed')) {
    const script = document.createElement('script');
    script.id = 'instagram-embed';
    script.src = 'https://www.instagram.com/embed.js';
    script.async = true;
    document.body.append(script);
  }
}

function startReel(reel) {
  const frame = reel.querySelector('.reel__frame');
  const video = reel.querySelector('video');
  const sound = reel.querySelector('.reel__sound');

  // No video file yet, so fall back to Instagram's embed (which can't autoplay).
  function showEmbed() {
    frame.classList.add('is-embed');
    frame.innerHTML = '';
    const embed = document.createElement('blockquote');
    embed.className = 'instagram-media';
    embed.dataset.instgrmPermalink = reel.dataset.permalink;
    embed.dataset.instgrmVersion = '14';
    frame.append(embed);
    loadInstagramEmbeds();
  }
  // The file may have already failed before this script ran.
  if (video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) {
    showEmbed();
    return;
  }
  reel.querySelector('source').addEventListener('error', showEmbed);

  sound.addEventListener('click', () => {
    video.muted = !video.muted;
    sound.textContent = video.muted ? 'Sound on' : 'Sound off';
    sound.setAttribute('aria-pressed', String(!video.muted));
  });

  // People who ask for less motion get normal controls instead of autoplay.
  if (reducedMotion) {
    video.controls = true;
    sound.hidden = true;
    return;
  }
  new IntersectionObserver((entries) => {
    // Fast scrolling can batch several changes; only the latest one counts.
    if (entries[entries.length - 1].isIntersecting) {
      video.play().catch(() => { video.controls = true; });
    } else {
      video.pause();
    }
  }, { threshold: 0.5 }).observe(video);
}
document.querySelectorAll('.reel').forEach(startReel);
