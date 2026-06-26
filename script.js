// ═══════════════════════════════════════════════════════
//  NAV — fade on scroll + contact dropdown
// ═══════════════════════════════════════════════════════
(function () {
  const nav = document.querySelector('.nav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('is-scrolled', window.scrollY > 40);
  }, { passive: true });

  const btn      = document.getElementById('nav-contact-btn');
  const dropdown = document.getElementById('nav-contact-dropdown');
  if (btn && dropdown) {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('is-open');
    });
    document.addEventListener('click', () => dropdown.classList.remove('is-open'));
  }
})();

// ═══════════════════════════════════════════════════════
//  HERO — split letters
// ═══════════════════════════════════════════════════════
let letterIdx = 0;
document.querySelectorAll('#hero-title .word').forEach(word => {
  const text = word.getAttribute('data-text');
  word.innerHTML = text.split('').map(ch => {
    if (ch === ' ') {
      letterIdx++;
      return '<span style="display:inline-block;width:0.28em"> </span>';
    }
    const delay = 80 + letterIdx * 65;
    letterIdx++;
    return `<span class="letter" style="animation-delay:${delay}ms">${ch}</span>`;
  }).join('');
});

// Once each letter's intro animation ends, remove it so hover transform works freely
document.querySelectorAll('#hero-title .letter').forEach(letter => {
  letter.addEventListener('animationend', () => {
    letter.style.animation = 'none';
  }, { once: true });
});

// ═══════════════════════════════════════════════════════
//  PHYSICS CAROUSEL
// ═══════════════════════════════════════════════════════
class PhysicsCarousel {
  constructor({ trackId, viewportId, titleId, descId, items }) {
    this.track    = document.getElementById(trackId);
    this.viewport = document.getElementById(viewportId);
    this.titleEl  = document.getElementById(titleId);
    this.descEl   = document.getElementById(descId);
    this.items    = items;

    this.x           = 0;
    this.velocity    = 0;
    this.isDragging  = false;
    this.startX      = 0;
    this.lastX       = 0;
    this.lastTime    = 0;
    this.activeIndex = -1;
    this.raf         = null;

    this._buildCards();
    this._bind();
    this._checkActive();
  }

  _buildCards() {
    this.items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'carousel-card';
      const img = document.createElement('img');
      img.src       = item.src;
      img.alt       = item.title;
      img.draggable = false;
      card.appendChild(img);
      this.track.appendChild(card);
    });
    this.cards = [...this.track.querySelectorAll('.carousel-card')];
  }

  _bind() {
    const vp = this.viewport;
    const px = e => e.touches ? e.touches[0].clientX : e.clientX;

    vp.addEventListener('mousedown',  e => { e.preventDefault(); this._start(px(e)); });
    vp.addEventListener('touchstart', e => this._start(px(e)), { passive: true });
    window.addEventListener('mousemove',  e => this._move(px(e)));
    window.addEventListener('touchmove',  e => this._move(px(e)), { passive: true });
    window.addEventListener('mouseup',    () => this._end());
    window.addEventListener('touchend',   () => this._end());
  }

  _start(cx) {
    this.isDragging = true;
    this.startX     = cx - this.x;
    this.lastX      = cx;
    this.lastTime   = performance.now();
    this.velocity   = 0;
    cancelAnimationFrame(this.raf);
  }

  _move(cx) {
    if (!this.isDragging) return;
    const now = performance.now();
    const dt  = Math.max(1, now - this.lastTime);
    const dx  = cx - this.lastX;
    this.velocity = (dx / dt) * 16;
    this.x        = cx - this.startX;
    this.lastX    = cx;
    this.lastTime = now;
    this._apply();
    this._tilt(this.velocity);
    this._checkActive();
  }

  _end() {
    if (!this.isDragging) return;
    this.isDragging = false;
    this._momentum();
  }

  _momentum() {
    const step = () => {
      this.velocity *= 0.93;
      this.x        += this.velocity;
      this._apply();
      this._tilt(this.velocity);
      this._checkActive();
      if (Math.abs(this.velocity) > 0.25) {
        this.raf = requestAnimationFrame(step);
      } else {
        this.velocity = 0;
        this._tilt(0);
        this._checkActive();
      }
    };
    this.raf = requestAnimationFrame(step);
  }

  _apply() {
    const trackW = this.track.scrollWidth;
    const viewW  = this.viewport.offsetWidth;
    const minX   = Math.min(0, -(trackW - viewW));
    const RUBBER = 80;
    if (this.x > 0) {
      this.x = Math.tanh(this.x / RUBBER) * RUBBER;
    } else if (this.x < minX) {
      this.x = minX + Math.tanh((this.x - minX) / RUBBER) * RUBBER;
    }
    this.track.style.transform = `translateX(${this.x}px)`;
  }

  _tilt(v) {
    const deg = Math.max(-7, Math.min(7, -v * 0.28));
    this.cards.forEach(c => { c.style.transform = `rotate(${deg}deg)`; });
  }

  _checkActive() {
    const vpLeft   = this.viewport.getBoundingClientRect().left;
    const vpCenter = vpLeft + this.viewport.offsetWidth / 2;
    let best = 0, bestDist = Infinity;
    this.cards.forEach((c, i) => {
      const r    = c.getBoundingClientRect();
      const dist = Math.abs((r.left + r.width / 2) - vpCenter);
      if (dist < bestDist) { bestDist = dist; best = i; }
    });
    if (best !== this.activeIndex) {
      this.activeIndex = best;
      this.cards.forEach((c, i) => c.classList.toggle('is-active', i === best));
      this._updateInfo(best);
    }
  }

  _updateInfo(i) {
    const item = this.items[i];
    if (!item || !this.titleEl) return;
    this.titleEl.style.opacity = '0';
    this.descEl.style.opacity  = '0';
    setTimeout(() => {
      this.titleEl.textContent   = item.title;
      this.descEl.textContent    = item.desc;
      this.titleEl.style.opacity = '1';
      this.descEl.style.opacity  = '1';
    }, 140);
  }
}

// Illustration data
const illustrations = [
  { src: 'FINISHED1STPOSTER.png', title: 'Design Philosophy',  desc: 'Stained glass composition exploring atmosphere and mystery.' },
  { src: 'killy.jpg',             title: 'Killy',              desc: 'High-contrast monochrome portrait of the Toronto rapper.' },
  { src: 'cudder.png',            title: 'Kid Cudi',           desc: 'Vibrant pop-art illustration with marbled abstract background.' },
  { src: 'donnyT.png',            title: 'Donny T',            desc: 'Relaxed portrait capturing casual energy and gold.' },
  { src: 'takeoff.png',           title: 'Takeoff',            desc: 'Cosmic tribute set against a deep space backdrop.' },
  { src: 'houdini.jpg',           title: 'Houdini',            desc: 'Neon line-work tribute featuring an angel motif.' },
  { src: 'nanaksmoking.png',      title: 'Nanak',              desc: 'Figure on a rooftop edge beneath a violet sky.' },
  { src: 'bluemoon.png',          title: 'Blue Moon',          desc: 'Mountain silhouette against aurora borealis and moonlight.' },
  { src: 'caution.png',           title: 'Caution',            desc: 'Album cover concept — a smoky doorway, open and unknown.' },
  { src: 'space.png',             title: 'Space',              desc: 'Pop-art silhouette portrait with bold stained glass geometry.' },
  { src: 'lmdoopcover.png',       title: 'LMDOOP',             desc: 'Figure drifting through a purple planetary dreamscape.' },
  { src: 'fallingmoon.jpg',       title: 'Falling Moon',       desc: 'Freefall in the cosmos against a glowing full moon.' },
  { src: 'yours truly.jpg',       title: 'Yours Truly',        desc: 'A cinematic silhouette — smoke, red, and attitude in a parked car.' },
  { src: 'mona lisa.jpg',         title: 'Mona Lisa',          desc: 'A reimagining of the iconic painting — vandalized, spotlit, and questioned.' },
  { src: 'voodoo.jpg',            title: 'Voodoo',             desc: 'A voodoo doll in a lived-in room — detail-rich and darkly playful.' },
];

// Photography data
const photos = [
  { src: 'landscape.jpg',      title: 'Stratford',        desc: 'Downtown Stratford, Ontario — summer afternoon.' },
  { src: 'Doglokes.jpg',       title: 'Doglokes',         desc: 'Candid portrait — caught mid-howl in the afternoon sun.' },
  { src: 'Hasan.jpg',          title: 'Hasan',            desc: 'Portrait — natural light, candid moment.' },
  { src: 'MACRO.JPG',          title: 'Macro',            desc: 'Close-up study — texture and light.' },
  { src: 'PRODUCT.JPG',        title: 'Product',          desc: 'Product photography — clean and deliberate.' },
  { src: 'StatuesinStrat.jpg', title: 'Statues in Strat', desc: 'War memorial and Canadian flag — Stratford, Ontario.' },
];

new PhysicsCarousel({ viewportId: 'illus-carousel', trackId: 'illus-track', titleId: 'illus-title', descId: 'illus-desc', items: illustrations });
new PhysicsCarousel({ viewportId: 'photo-carousel', trackId: 'photo-track', titleId: 'photo-title', descId: 'photo-desc', items: photos });

// ── MISC / SANDBOX CAROUSEL ──
const miscTitles = ['A JACK OF ALL TRADES', 'THE SANDBOX', 'EXPERIMENTS'];
document.getElementById('misc-title').textContent = miscTitles[Math.floor(Math.random() * miscTitles.length)];

const misc = [
  // items will be added here — each can have: { src, title, desc, url }
];

const miscCarousel = new PhysicsCarousel({ viewportId: 'misc-carousel', trackId: 'misc-track', titleId: 'misc-card-title', descId: 'misc-card-desc', items: misc });

// Click to open URL on active card
document.getElementById('misc-track').addEventListener('click', () => {
  const activeCard = document.querySelector('#misc-track .carousel-card.is-active');
  if (!activeCard) return;
  const idx = parseInt(activeCard.dataset.idx, 10);
  if (misc[idx] && misc[idx].url) window.open(misc[idx].url, '_blank');
});

// ═══════════════════════════════════════════════════════
//  PERSONAL SECTION — synced photo + text rotation
// ═══════════════════════════════════════════════════════
(function () {
  const photos = document.querySelectorAll('.about-photo');
  const blurbs = document.querySelectorAll('.blurb');
  const dots   = document.querySelectorAll('.bdot');
  if (!blurbs.length) return;

  let current = 0;

  function goTo(index) {
    photos[current].classList.remove('is-active');
    blurbs[current].classList.remove('is-active');
    dots[current].classList.remove('is-active');
    current = index;
    photos[current].classList.add('is-active');
    blurbs[current].classList.add('is-active');
    dots[current].classList.add('is-active');
  }

  // Dot clicks
  dots.forEach((dot, i) => dot.addEventListener('click', () => goTo(i)));

  // Auto-rotate every 15 seconds
  setInterval(() => goTo((current + 1) % blurbs.length), 15000);
})();

// ═══════════════════════════════════════════════════════
//  VIDEO HOVER PREVIEWS
// ═══════════════════════════════════════════════════════
document.querySelectorAll('.thumb-card.has-video-preview').forEach(card => {
  const video = card.querySelector('.thumb-preview-video');
  if (!video) return;
  card.addEventListener('mouseenter', () => { video.play().catch(() => {}); });
  card.addEventListener('mouseleave', () => { video.pause(); video.currentTime = 0; });
});

// ═══════════════════════════════════════════════════════
//  OVERLAY OPEN / CLOSE
// ═══════════════════════════════════════════════════════
function openOverlay(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('is-open');
  document.body.style.overflow = 'hidden';

  // Lazy-load PDF on first open of Sweet Stuff overlay
  if (id === 'overlay-sweetstuff' && !window._pdfLoaded) {
    window._pdfLoaded = true;
    loadPDFSlides();
  }
}

function closeOverlay(el) {
  el.classList.remove('is-open');
  document.body.style.overflow = '';
  el.querySelectorAll('video').forEach(v => v.pause());
}

document.querySelectorAll('.thumb-card[data-overlay]').forEach(card => {
  card.addEventListener('click', () => openOverlay(card.dataset.overlay));
});

document.querySelectorAll('.overlay-back').forEach(btn => {
  btn.addEventListener('click', () => closeOverlay(btn.closest('.proj-overlay')));
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.proj-overlay.is-open').forEach(closeOverlay);
  }
});

// ═══════════════════════════════════════════════════════
//  SLIDESHOW (dynamic — always re-reads slides from DOM)
// ═══════════════════════════════════════════════════════
function initSlideshow(overlay) {
  // Skip overlays that use Figma (no slide arrows needed)
  if (overlay.querySelector('.overlay-stage--figma')) return;

  const prevBtn = overlay.querySelector('.slide-arrow--prev');
  const nextBtn = overlay.querySelector('.slide-arrow--next');
  const curEl   = overlay.querySelector('.sc-cur');
  const totEl   = overlay.querySelector('.sc-tot');

  let current = 0;

  function getSlides() {
    return [...overlay.querySelectorAll('.overlay-slide')];
  }

  function updateCounter() {
    const slides = getSlides();
    if (curEl) curEl.textContent = current + 1;
    if (totEl) totEl.textContent = slides.length;
  }

  function goTo(next, direction) {
    const slides = getSlides();
    const total  = slides.length;
    if (total <= 1 || next === current) return;

    const from = slides[current];
    const to   = slides[next];

    // Snap incoming slide into off-screen position without transition
    to.style.transition = 'none';
    to.style.transform  = direction === 'next' ? 'translateX(100%)' : 'translateX(-100%)';
    to.style.opacity    = '0';

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Animate current slide out
        from.style.transition = '';
        from.style.transform  = direction === 'next' ? 'translateX(-100%)' : 'translateX(100%)';
        from.style.opacity    = '0';
        from.classList.remove('is-active');

        // Animate incoming slide in
        to.style.transition = '';
        to.style.transform  = 'translateX(0)';
        to.style.opacity    = '1';
        to.classList.add('is-active');

        // Pause video leaving screen
        from.querySelectorAll('video').forEach(v => v.pause());

        current = next;
        updateCounter();

        // Reset outgoing slide after animation
        setTimeout(() => {
          from.style.transition = 'none';
          from.style.transform  = 'translateX(100%)';
        }, 520);
      });
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      const total = getSlides().length;
      goTo((current - 1 + total) % total, 'prev');
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const total = getSlides().length;
      goTo((current + 1) % total, 'next');
    });
  }

  // Arrow key navigation scoped to open overlay
  document.addEventListener('keydown', e => {
    if (!overlay.classList.contains('is-open')) return;
    const total = getSlides().length;
    if (e.key === 'ArrowLeft')  goTo((current - 1 + total) % total, 'prev');
    if (e.key === 'ArrowRight') goTo((current + 1) % total, 'next');
  });

  // Store reference so PDF loader can trigger a counter refresh
  overlay._slideshowRefresh = updateCounter;

  updateCounter();
}

document.querySelectorAll('.proj-overlay').forEach(initSlideshow);

// ═══════════════════════════════════════════════════════
//  PDF.JS — render presentation slides for Sweet Stuff
// ═══════════════════════════════════════════════════════
async function loadPDFSlides() {
  const overlay   = document.getElementById('overlay-sweetstuff');
  const slidesEl  = document.getElementById('sweetstuff-slides');
  const loadingEl = document.getElementById('pdf-loading-slot');

  try {
    // Configure PDF.js worker from same CDN
    const pdfjsLib = window['pdfjs-dist/build/pdf'];
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    const pdf = await pdfjsLib.getDocument('GBDA202_A2P4_Rama (4).pdf').promise;

    // Remove loading slot
    if (loadingEl) loadingEl.remove();

    // Render each page as a canvas and inject as a slide
    for (let p = 1; p <= pdf.numPages; p++) {
      const page     = await pdf.getPage(p);
      const viewport = page.getViewport({ scale: 1.8 });

      const canvas   = document.createElement('canvas');
      canvas.width   = viewport.width;
      canvas.height  = viewport.height;

      await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;

      const slide = document.createElement('div');
      slide.className = 'overlay-slide';
      slide.appendChild(canvas);
      slidesEl.appendChild(slide);
    }

    // Refresh slide counter now that pages are loaded
    if (overlay._slideshowRefresh) overlay._slideshowRefresh();

  } catch (err) {
    console.warn('PDF load failed:', err);
    if (loadingEl) {
      loadingEl.querySelector('.pdf-loading').innerHTML =
        `<p>Could not load PDF preview.</p>
         <p style="margin-top:8px"><a href="GBDA202_A2P4_Rama (4).pdf" target="_blank">Open PDF directly ↗</a></p>`;
    }
  }
}
