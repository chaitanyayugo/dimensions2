// script.js
// Requires: gsap + ScrollTrigger (loaded before this script)
gsap.registerPlugin(ScrollTrigger);

/* ---------------------
   1) LOADER + FAIL-SAFE
   --------------------- */
const loader = document.getElementById('loader');
const loaderBarInner = document.querySelector('#loader-bar::after'); // not directly usable; we'll animate width via style on pseudo using GSAP target on element's CSS variable instead
const loaderBar = document.getElementById('loader-bar');

function animateLoaderBar(duration = 2.2) {
  // animate the pseudo-like inner by using GSAP to animate a data attribute and update style
  gsap.to(loaderBar, {
    duration,
    onStart() { loaderBar.setAttribute('data-progress', '0'); },
    onUpdate() {
      // progress ratio from gsap instance
      const prog = (this.progress() * 100).toFixed(0);
      loaderBar.style.setProperty('--loader-percent', prog + '%');
    },
    onComplete() {
      loaderBar.style.setProperty('--loader-percent', '100%');
    }
  });
}

function dismissLoader(immediate = false) {
  if (!loader) return;
  if (immediate) {
    loader.style.display = 'none';
    loader.setAttribute('aria-hidden', 'true');
    return;
  }
  gsap.to(loader, { opacity: 0, duration: 0.8, onComplete() {
    loader.style.display = 'none';
    loader.setAttribute('aria-hidden', 'true');
  }});
}

// simple CSS update for loader pseudo: animate using CSS var
// (set initial CSS var so pseudo can read it)
if (loaderBar) {
  loaderBar.style.setProperty('--loader-percent', '0%');
  // create a real inner indicator using inline style (since pseudo is cumbersome to animate directly)
  if (!loaderBar.querySelector('.loader-inner')) {
    const inner = document.createElement('div');
    inner.className = 'loader-inner';
    inner.style.position = 'absolute';
    inner.style.left = '0';
    inner.style.top = '0';
    inner.style.height = '100%';
    inner.style.width = '0%';
    inner.style.background = 'linear-gradient(90deg, transparent, #c5a059, transparent)';
    inner.style.transition = 'width 0.2s linear';
    loaderBar.appendChild(inner);
  }
}

// FAIL SAFE: if load event doesn't fire, dismiss after 4000ms
const LOADER_TIMEOUT = 4000;
let loaderTimedOut = false;
const loaderTimeoutId = setTimeout(() => {
  loaderTimedOut = true;
  // fully fill the loader inner and dismiss
  const inner = loaderBar && loaderBar.querySelector('.loader-inner');
  if (inner) inner.style.width = '100%';
  setTimeout(() => dismissLoader(true), 500);
}, LOADER_TIMEOUT);

/* ---------------------
   2) DUST GENERATOR
   --------------------- */
(function createDust() {
  const dustContainer = document.getElementById('dust-container');
  if (!dustContainer) return;
  const count = Math.min(40, Math.round(window.innerWidth / 40)); // scale with width a bit
  for (let i = 0; i < count; i++) {
    const d = document.createElement('div');
    d.className = 'dust';
    const size = Math.random() * 3 + 1;
    d.style.width = size + 'px';
    d.style.height = size + 'px';
    d.style.left = Math.random() * 100 + '%';
    d.style.top = Math.random() * 100 + '%';
    dustContainer.appendChild(d);

    const travel = window.innerHeight + 120 + Math.random() * 120;
    // animate upward slowly and loop, offset the start time (stagger) to avoid all jumping at once
    gsap.fromTo(d,
      { y: 0, opacity: 0.15 },
      {
        y: -travel,
        opacity: 0,
        duration: 6 + Math.random() * 6,
        ease: 'linear',
        repeat: -1,
        delay: Math.random() * 6,
        repeatRefresh: true
      }
    );
  }
})();

/* ---------------------
   3) CONFIGURATOR (swatches)
   --------------------- */
const setupConfigurator = () => {
  const swatches = Array.from(document.querySelectorAll('.swatch'));
  const sofa = document.querySelector('#animated-sofa');
  if (!swatches.length || !sofa) return;

  function applyColor(color) {
    if (!sofa) return;
    if (color === 'royal-gold') {
      gsap.to(sofa, { filter: "sepia(0.55) saturate(1.45) brightness(0.95)", duration: 0.8 });
    } else if (color === 'deep-velvet') {
      gsap.to(sofa, { filter: "hue-rotate(280deg) saturate(1.2) brightness(0.75)", duration: 0.8 });
    } else {
      gsap.to(sofa, { filter: "none", duration: 0.6 });
    }
  }

  // initialize state from any .active swatch, otherwise set first
  let initial = swatches.find(s => s.classList.contains('active'));
  if (!initial) {
    initial = swatches[0];
    initial.classList.add('active');
    initial.setAttribute('aria-pressed', 'true');
  }
  applyColor(initial.getAttribute('data-color'));

  swatches.forEach(swatch => {
    // clicks
    swatch.addEventListener('click', () => {
      swatches.forEach(s => { s.classList.remove('active'); s.setAttribute('aria-pressed', 'false'); });
      swatch.classList.add('active');
      swatch.setAttribute('aria-pressed', 'true');
      applyColor(swatch.getAttribute('data-color'));
    }, { passive: true });

    // keyboard support
    swatch.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        swatch.click();
      }
    });
  });
};

/* ---------------------
   4) SOFA TIMELINE + SCROLLTRIGGER
   --------------------- */
const setupSofaTimeline = () => {
  const sofa = document.querySelector('#animated-sofa');
  if (!sofa) return;

  const mainTl = gsap.timeline({
    scrollTrigger: {
      trigger: ".scroll-container",
      start: "top top",
      end: "bottom bottom",
      scrub: 1.2
    }
  });

  mainTl
    // Step 1
    .addLabel("step1")
    .to(sofa, { rotationY: 180, scale: 1.18, x: "25%", ease: "power1.out" }, "step1")
    .to(".left-text .content-box", { x: "-100px", opacity: 0.28, stagger: 0.05 }, "step1")

    // Step 2
    .addLabel("step2")
    .to(sofa, { rotationY: 360, scale: 0.95, x: "-25%", ease: "power1.out" }, "step2")
    .to(".right-text .content-box", { x: "100px", opacity: 0.28, stagger: 0.05 }, "step2")

    // Step 3 - return center
    .addLabel("step3")
    .to(sofa, { rotationY: 540, scale: 1.05, x: "0%", ease: "power2.out" }, "step3")
    .to(".center-text .hero-box", { y: "-18px", opacity: 1, duration: 0.6 }, "step3");
};

/* ---------------------
   5) REVEAL ELEMENTS (scroll based)
   --------------------- */
const setupReveals = () => {
  document.querySelectorAll('.reveal').forEach(el => {
    gsap.fromTo(el,
      { y: 30, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.9,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 80%',
          toggleActions: 'play none none reverse',
          markers: false
        }
      });
  });
};

/* ---------------------
   6) CTA 3D HOVER
   --------------------- */
const setupHovers = () => {
  const btns = document.querySelectorAll('.cta-button');
  btns.forEach(btn => {
    // ensure transform origin and will-change
    btn.style.transformOrigin = 'center';
    btn.style.willChange = 'transform';

    let hoverTween = null;

    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) - 0.5;
      const y = ((e.clientY - rect.top) / rect.height) - 0.5;

      // kill previous tween for snappy response
      if (hoverTween) hoverTween.kill();

      hoverTween = gsap.to(btn, {
        duration: 0.35,
        rotateY: x * 22,
        rotateX: -y * 18,
        scale: 1.06,
        boxShadow: `${-x * 16}px ${-y * 16}px 28px rgba(212,175,55,0.22)`,
        ease: 'power2.out'
      });
    }, { passive: true });

    btn.addEventListener('mouseleave', () => {
      if (hoverTween) hoverTween.kill();
      gsap.to(btn, { duration: 0.8, rotateY: 0, rotateX: 0, scale: 1, ease: 'elastic.out(1,0.35)', boxShadow: 'none' });
    });
  });
};

/* ---------------------
   7) SCROLL PROGRESS BAR
   --------------------- */
const setupProgress = () => {
  const bar = document.getElementById('progress-bar');
  if (!bar) return;
  const update = () => {
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.width = pct + '%';
  };
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
};

/* ---------------------
   8) INIT
   --------------------- */
window.addEventListener('load', () => {
  // animate loader inner bar nicely then hide
  const loaderInner = loader && loader.querySelector('.loader-inner');
  if (loaderInner) {
    // grow to 75% while page finishes; remaining to 100% on complete or timeout
    gsap.to(loaderInner, { width: '75%', duration: 1.6, ease: 'power2.out' });
  }

  // Start initial setups
  setupConfigurator();
  setupHovers();
  setupProgress();
  setupReveals();
  setupSofaTimeline();

  // clear fallback timer and finish loader animation
  clearTimeout(loaderTimeoutId);
  if (loaderInner) gsap.to(loaderInner, { width: '100%', duration: 0.45, delay: 0.15, onComplete: () => dismissLoader() });
  else dismissLoader();
});
