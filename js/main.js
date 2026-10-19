/* ==========================================================================
   Thomas Gline — Portfolio
   Animations : GSAP + ScrollTrigger + SplitText, défilement fluide : Lenis.
   ========================================================================== */

(() => {
  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  const hasGsap = !!(window.gsap && window.ScrollTrigger && window.SplitText);
  const motion = hasGsap && matchMedia('(prefers-reduced-motion: no-preference)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  let lenis = null;
  let viewH = window.innerHeight; // hauteur d'écran de référence pour les animations

  /* ------------------------------------------------------------------------
     Horloge (heure belge)
     ------------------------------------------------------------------------ */
  const clock = $('[data-clock]');
  if (clock) {
    const fmt = new Intl.DateTimeFormat('fr-BE', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Brussels' });
    const tick = () => { clock.textContent = fmt.format(new Date()); };
    tick();
    setInterval(tick, 15000);
  }

  /* ------------------------------------------------------------------------
     Titre du hero : la taille s'ajuste pour remplir toute la largeur
     ------------------------------------------------------------------------ */
  const heroTitle = $('.hero__title');
  function fitTitle() {
    if (!heroTitle) return;
    const words = $$('.hero__word', heroTitle);
    const stacked = matchMedia('(max-width: 760px)').matches;
    const cs = getComputedStyle(heroTitle);
    const avail = heroTitle.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    // Plusieurs passes : sur Apple, la police change légèrement de dessin selon sa taille,
    // la largeur n'est donc pas parfaitement proportionnelle. On affine la mesure.
    let size = 100;
    for (let i = 0; i < 3; i++) {
      heroTitle.style.fontSize = `${size}px`;
      const widths = words.map((w) => {
        const ws = getComputedStyle(w);
        return w.offsetWidth - parseFloat(ws.paddingLeft) - parseFloat(ws.paddingRight);
      });
      const gap = parseFloat(getComputedStyle(heroTitle).columnGap) || 0;
      const overhang = size * 0.06; // la dernière lettre dépasse de sa boîte (interlettrage négatif)
      const needed = (stacked ? Math.max(...widths) : widths.reduce((a, b) => a + b, 0) + gap * (words.length - 1)) + overhang;
      size *= avail / needed;
    }
    heroTitle.style.fontSize = `${size * 0.99}px`;
  }

  /* ------------------------------------------------------------------------
     Visionneuse plein écran
     ------------------------------------------------------------------------ */
  const GALLERIES = {
    cinemon: {
      title: 'Cinémon',
      items: [
        { src: 'assets/img/cinemon-desktop.jpg', w: 1440, h: 4520, kind: 'wide', cap: 'Desktop : page d\'accueil complète', alt: 'Page d\'accueil desktop de Cinémon' },
        { src: 'assets/img/cinemon-mobile.jpg', w: 375, h: 5454, kind: 'phone', cap: 'Mobile', alt: 'Version mobile de Cinémon' },
      ],
    },
    workout: {
      title: 'Workout',
      items: [
        { src: 'assets/img/workout-home.jpg', w: 393, h: 852, kind: 'phone', cap: 'Accueil', alt: 'Écran d\'accueil de Workout' },
        { src: 'assets/img/workout-historique.jpg', w: 393, h: 852, kind: 'phone', cap: 'Historique', alt: 'Écran Historique de Workout' },
      ],
    },
    astro: {
      title: 'Astro',
      items: [
        { video: 'assets/video/astro-mars.mp4', poster: 'assets/img/astro-mars.jpg', w: 402, h: 874, kind: 'phone', cap: 'Mars', alt: 'Animation de l\'écran Mars' },
        { video: 'assets/video/astro-venus.mp4', poster: 'assets/img/astro-venus.jpg', w: 402, h: 874, kind: 'phone', cap: 'Vénus', alt: 'Animation de l\'écran Vénus' },
      ],
    },
    gabrielle: {
      title: 'Gabrielle',
      items: [
        { src: 'assets/img/gabrielle-hero.jpg', w: 1440, h: 798, kind: 'wide', cap: 'En-tête', alt: 'En-tête du site Gabrielle' },
        { src: 'assets/img/gabrielle-pathologie.jpg', w: 1440, h: 826, kind: 'wide', cap: 'Section pathologies', alt: 'Section pathologies du site Gabrielle' },
        { src: 'assets/img/gabrielle-site.jpg', w: 1440, h: 5133, kind: 'wide', cap: 'Page d\'accueil complète', alt: 'Page d\'accueil complète du site Gabrielle' },
      ],
    },
  };

  const lb = $('.lightbox');
  const lbTitle = $('.lightbox__title', lb);
  const lbScroller = $('.lightbox__scroller', lb);
  const lbContent = $('.lightbox__content', lb);
  const lbClose = $('.lightbox__close', lb);
  let lastFocus = null;

  function openLightbox(key, opener) {
    const g = GALLERIES[key];
    if (!g) return;
    lbTitle.textContent = g.title;
    lbContent.innerHTML = g.items.map((it) => {
      const media = it.video
        ? `<video src="${it.video}" poster="${it.poster}" width="${it.w}" height="${it.h}" controls muted loop playsinline ${motion ? 'autoplay' : ''} aria-label="${it.alt}"></video>`
        : `<img src="${it.src}" width="${it.w}" height="${it.h}" alt="${it.alt}">`;
      return `<figure class="lightbox__item lightbox__item--${it.kind}">${media}<figcaption>${it.cap}</figcaption></figure>`;
    }).join('');
    lb.hidden = false;
    lbScroller.scrollTop = 0;
    document.body.style.overflow = 'hidden';
    if (lenis) lenis.stop();
    lastFocus = opener || document.activeElement;
    lbClose.focus();
    if (motion) {
      gsap.fromTo(lb, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.35, ease: 'power2.out' });
      gsap.from(lbContent.children, { y: 80, autoAlpha: 0, duration: 0.9, stagger: 0.08, ease: 'expo.out' });
    }
  }

  function closeLightbox() {
    if (lb.hidden) return;
    const done = () => {
      lb.hidden = true;
      lbContent.innerHTML = '';
      document.body.style.overflow = '';
      if (lenis) lenis.start();
      if (lastFocus) lastFocus.focus({ preventScroll: true });
    };
    if (motion) gsap.to(lb, { autoAlpha: 0, duration: 0.3, ease: 'power2.in', onComplete: done });
    else done();
  }

  $$('[data-lightbox]').forEach((el) => {
    el.addEventListener('click', () => openLightbox(el.dataset.lightbox, el.tagName === 'BUTTON' ? el : null));
  });
  lbClose.addEventListener('click', closeLightbox);
  lbScroller.addEventListener('click', (e) => {
    if (e.target === lbScroller || e.target === lbContent) closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'Tab') {
      const focusables = $$('button, video', lb);
      const i = focusables.indexOf(document.activeElement);
      const next = e.shiftKey ? i - 1 : i + 1;
      e.preventDefault();
      focusables[(next + focusables.length) % focusables.length].focus();
    }
  });

  /* ------------------------------------------------------------------------
     Sans GSAP (hors-ligne) ou mouvement réduit : version statique
     ------------------------------------------------------------------------ */
  if (!motion) {
    root.classList.remove('js');
    fitTitle();
    addEventListener('resize', fitTitle);
    if (document.fonts) document.fonts.ready.then(fitTitle);
    return;
  }

  gsap.registerPlugin(ScrollTrigger, SplitText);
  // Mobile : la barre d'adresse qui se replie change la hauteur de l'écran, on n'en tient pas compte
  ScrollTrigger.config({ ignoreMobileResize: true });

  /* ------------------------------------------------------------------------
     Défilement fluide
     ------------------------------------------------------------------------ */
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  // syncTouch : sur iPhone, le défilement au doigt passe aussi par Lenis. Le défilement et les animations
  // sont calculés au même moment, ce qui supprime les tremblements (cadre coloré, titre) dus au
  // décalage d'une image entre le scroll natif de Safari et les animations.
  // Réglages tactiles (iPhone) :
  //  - touchInertiaMultiplier : élan après un geste rapide du doigt (Lenis : 35 par défaut). Plus bas = moins loin.
  //  - syncTouchLerp : vitesse à laquelle cet élan s'amortit (0.075 par défaut). Plus haut = s'arrête plus vite.
  lenis = new Lenis({
    lerp: 0.09,
    wheelMultiplier: 1,
    syncTouch: true,
    touchInertiaMultiplier: 18,
    syncTouchLerp: 0.09,
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.stop();

  $$('[data-scroll-to]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      const target = id === '#top' ? 0 : $(id);
      if (target === null) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: target === 0 ? 0 : -24, duration: 1.8 });
    });
  });

  /* ------------------------------------------------------------------------
     Intro : compteur, rideau, titre
     ------------------------------------------------------------------------ */
  const loader = $('.loader');
  const loaderNum = $('.loader__num');
  const nav = $('.nav');

  gsap.set([nav, '.hero__meta > *', '.hero__cta'], { autoAlpha: 0, y: 20 });

  const counter = { v: 0 };
  const counting = gsap.to(counter, {
    v: 100,
    duration: 1.6,
    ease: 'power2.inOut',
    onUpdate: () => { loaderNum.textContent = Math.round(counter.v); },
  });

  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();

  Promise.all([fontsReady, counting.then()]).then(() => {
    // Mesure après le découpage en lettres : séparées, elles perdent leur crénage et s'élargissent un peu
    const heroChars = SplitText.create('.hero__word', { type: 'chars', charsClass: 'char' }).chars;
    fitTitle();
    const lead = SplitText.create('.hero__lead', { type: 'lines', linesClass: 'line', mask: 'lines' });
    gsap.set(heroChars, { yPercent: 118 });
    gsap.set(lead.lines, { yPercent: 110 });

    // Une erreur dans les animations au scroll ne doit jamais bloquer l'intro
    try { buildScroll(); } catch (err) { console.error(err); }

    const tl = gsap.timeline({
      onComplete: () => {
        loader.remove();
        lead.revert();
        lenis.start();
      },
    });
    tl.to('.loader__inner', { y: -40, autoAlpha: 0, duration: 0.6, ease: 'power3.in' })
      .to(loader, { yPercent: -100, duration: 1.1, ease: 'expo.inOut' }, '-=0.2')
      .to(heroChars, { yPercent: 0, duration: 1.5, stagger: 0.04, ease: 'expo.out' }, '-=0.45')
      .to(lead.lines, { yPercent: 0, duration: 1.2, stagger: 0.1, ease: 'expo.out' }, '<0.2')
      .to([nav, '.hero__meta > *', '.hero__cta'], { autoAlpha: 1, y: 0, duration: 1, stagger: 0.05, ease: 'expo.out' }, '<0.1');
  });

  /* ------------------------------------------------------------------------
     Toutes les animations au scroll
     ------------------------------------------------------------------------ */
  function buildScroll() {
    const mm = gsap.matchMedia();
    const vh = () => viewH;
    const narrow = () => matchMedia('(max-width: 760px)').matches;

    // Les animations recréées lors d'un redimensionnement passent en fin de liste :
    // on les remet dans l'ordre de la page avant chaque recalcul, sinon tout ce qui
    // suit une section épinglée se retrouve décalé.
    ScrollTrigger.addEventListener('refreshInit', () => ScrollTrigger.sort());

    /* Reel : le cadre s'ouvre en plein écran, les colonnes glissent.
       Section actuellement désactivée dans index.html (balise <template>) : ce code ne s'exécute
       que si elle est réactivée. Créé une seule fois, les valeurs s'adaptent à chaque recalcul. */
    if ($('.reel')) {
      const travel = () => (narrow() ? 0.15 : 0.3);
      const reel = gsap.timeline({
        scrollTrigger: { trigger: '.reel', start: 'top top', end: '+=150%', pin: true, scrub: true, invalidateOnRefresh: true },
      });
      reel.fromTo('.reel__frame',
        { clipPath: 'inset(16% 20% 16% 20% round 28px)' },
        { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'power2.inOut', duration: 0.55 }, 0);
      reel.fromTo('.reel__cols', { scale: 1.25 }, { scale: 1, ease: 'power2.inOut', duration: 0.55 }, 0);
      $$('.reel__col').forEach((col) => {
        const s = parseFloat(col.dataset.speed);
        reel.fromTo(col, { y: () => s * vh() * travel() }, { y: () => -s * vh() * travel(), ease: 'none', duration: 1 }, 0);
      });
      reel.fromTo('.reel__caption', { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.15 }, 0.5);
    }

    /* Parcours : défilement horizontal sur desktop, liste verticale sur mobile */
    mm.add('(min-width: 901px)', () => {
      const track = $('.journey__track');
      const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
      const horizontal = gsap.to(track, {
        x: () => -dist(),
        ease: 'none',
        scrollTrigger: {
          trigger: '.journey__pin',
          start: 'top top',
          end: () => `+=${dist()}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });
      gsap.fromTo('.journey__line span', { scaleX: 0 }, {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: { trigger: '.journey__pin', start: 'top top', end: () => `+=${dist()}`, scrub: 1, invalidateOnRefresh: true },
      });
      // Les cartes déjà visibles au départ apparaissent à l'arrivée de la section,
      // les suivantes au fil du défilement horizontal.
      $$('.step').forEach((step, i) => {
        const visibleAtStart = step.offsetLeft < window.innerWidth * 0.9;
        gsap.from(step, {
          y: 80,
          rotation: i % 2 ? 4 : -4,
          autoAlpha: 0,
          duration: 0.9,
          delay: visibleAtStart ? i * 0.08 : 0,
          ease: 'expo.out',
          scrollTrigger: visibleAtStart
            ? { trigger: '.journey__track', start: 'top 90%', toggleActions: 'play none none reverse' }
            : { trigger: step, containerAnimation: horizontal, start: 'left 92%', toggleActions: 'play none none reverse' },
        });
      });
    });
    mm.add('(max-width: 900px)', () => {
      gsap.fromTo('.journey__line span', { scaleY: 0 }, {
        scaleY: 1,
        ease: 'none',
        scrollTrigger: { trigger: '.journey__track', start: 'top 70%', end: 'bottom 70%', scrub: true },
      });
      $$('.step').forEach((step) => {
        gsap.from(step, { y: 50, autoAlpha: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: step, start: 'top 90%', once: true } });
      });
    });

    /* Hero : les deux mots s'écartent en scrollant */
    const heroST = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true };
    gsap.to('.hero__word:first-child', { xPercent: -18, ease: 'none', scrollTrigger: heroST });
    gsap.to('.hero__word:last-child', { xPercent: 18, ease: 'none', scrollTrigger: heroST });
    gsap.to('.hero__intro', { y: -80, autoAlpha: 0, ease: 'none', scrollTrigger: { ...heroST, end: '60% top' } });

    /* Titres : lettres qui montent */
    $$('[data-split-chars]').forEach((el) => {
      SplitText.create(el, {
        type: 'lines,words,chars',
        linesClass: 'line',
        wordsClass: 'word',
        charsClass: 'char',
        mask: 'lines',
        autoSplit: true,
        onSplit: (self) => gsap.from(self.chars, {
          yPercent: 115,
          duration: 1.2,
          stagger: 0.022,
          ease: 'expo.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        }),
      });
    });

    /* À propos : les mots s'allument au fil du scroll */
    $$('[data-reveal-words]').forEach((el) => {
      SplitText.create(el, {
        type: 'words',
        wordsClass: 'word',
        onSplit: (self) => gsap.fromTo(self.words, { opacity: 0.12 }, {
          opacity: 1,
          ease: 'none',
          stagger: 0.1,
          scrollTrigger: { trigger: el, start: 'top 78%', end: 'bottom 42%', scrub: true },
        }),
      });
    });

    /* Apparitions simples */
    $$('[data-fade]').forEach((el) => {
      gsap.from(el, { y: 40, autoAlpha: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
    });
    $$('[data-stagger]').forEach((el) => {
      gsap.from(el.children, { y: 30, autoAlpha: 0, duration: 1, stagger: 0.08, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
    });
    $$('.about__pills, .skills__row ul').forEach((list) => {
      gsap.from(list.children, {
        y: 24,
        scale: 0.8,
        autoAlpha: 0,
        duration: 0.8,
        stagger: 0.05,
        ease: 'back.out(1.8)',
        scrollTrigger: { trigger: list, start: 'top 90%', once: true },
      });
    });
    $$('.skills__row h3, .project__kicker, .project__num, .work__head .label, .contact .label, .journey__head .label, .about .label').forEach((el) => {
      gsap.from(el, { y: 24, autoAlpha: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 92%', once: true } });
    });
    $$('.index li').forEach((li, i) => {
      gsap.from(li, { y: 40, autoAlpha: 0, duration: 1, delay: i * 0.06, ease: 'expo.out', scrollTrigger: { trigger: '.index', start: 'top 85%', once: true } });
    });

    /* Marquee : vitesse et sens qui suivent le scroll */
    const rows = $$('.marquee__row').map((row) => {
      const track = $('.marquee__track', row);
      return { row, track, dir: Number(row.dataset.dir) || 1, x: 0, w: 0, wrap: null };
    });
    const measureMarquee = () => {
      rows.forEach((r) => {
        $$('.marquee__track', r.row).slice(1).forEach((c) => c.remove());
        r.w = r.track.offsetWidth;
        const copies = Math.ceil(window.innerWidth / r.w) + 1;
        for (let i = 0; i < copies; i++) r.row.appendChild(r.track.cloneNode(true));
        r.wrap = gsap.utils.wrap(-r.w, 0);
      });
    };
    measureMarquee();
    ScrollTrigger.addEventListener('refreshInit', measureMarquee);
    let velocity = 0;
    let scrollDir = 1;
    ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => { velocity = self.getVelocity(); scrollDir = self.direction; },
    });
    gsap.ticker.add((time, delta) => {
      const boost = 1 + Math.min(Math.abs(velocity) / 250, 10);
      velocity *= 0.92;
      rows.forEach((r) => {
        r.x = r.wrap(r.x - r.dir * scrollDir * 0.05 * delta * boost);
        gsap.set(r.row, { x: r.x });
      });
    });

    /* Projets : la scène s'ouvre, les captures défilent dans les écrans */
    const PRESENTATION = 2.6; // durée de la présentation des sites, en hauteurs d'écran de scroll
    const RAMP = 0.2;         // part de cette durée pour freiner (et autant pour repartir)
    const HOLD = 0.1;         // vitesse de la scène au centre (0.1 = 10 % de la vitesse de la page)

    // Courbe « plateau » : part et arrive à vitesse nulle, vitesse constante au milieu.
    // r = part du trajet consacrée à accélérer (et autant à ralentir).
    const plateau = (r) => {
      const G = (p) => (p < r ? p / 2 - (r / (2 * Math.PI)) * Math.sin((Math.PI * p) / r) : r / 2 + (p - r));
      const total = 1 - r;
      return (p) => (p <= 1 - r ? G(p) : total - G(1 - p)) / total;
    };

    $$('.project__stage').forEach((stage) => {
      const wrap = stage.parentElement;
      const shots = $$('[data-scrollshot]', stage);

      // Sites web : en approchant du centre, la scène freine progressivement jusqu'à presque
      // s'arrêter, le site défile dans l'écran, puis elle repart progressivement.
      // La vitesse ne change jamais d'un coup : pas d'à-coup à l'entrée ni à la sortie.
      const length = () => vh() * PRESENTATION;
      const extra = () => (shots.length ? length() * (1 - HOLD) * (1 - RAMP) : 0); // retard pris par la scène
      const drift = () => length() - extra(); // distance réellement parcourue à l'écran pendant la présentation
      if (shots.length) {
        const setSpace = () => { wrap.style.paddingBottom = `${extra()}px`; };
        setSpace();
        ScrollTrigger.addEventListener('refreshInit', setSpace);
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: wrap,
            // départ calculé pour que le moment le plus lent soit pile au centre de l'écran
            start: () => `top+=${stage.offsetHeight / 2} center+=${drift() / 2}`,
            end: () => `+=${length()}`,
            scrub: true,
            invalidateOnRefresh: true,
          },
        });
        tl.to(stage, { y: () => extra(), ease: plateau(RAMP), duration: 1 }, 0);
        shots.forEach((vp) => {
          const img = $('img', vp);
          // le site ne défile que pendant que la scène est (presque) immobile au centre
          tl.to(img, { y: () => -(img.offsetHeight - vp.clientHeight), ease: plateau(0.15), duration: 1 - 2 * RAMP }, RAMP);
        });
      }

      gsap.fromTo(stage,
        { clipPath: 'inset(9% 7% 9% 7% round 28px)' },
        { clipPath: 'inset(0% 0% 0% 0% round 28px)', ease: 'none', scrollTrigger: { trigger: wrap, start: 'top 95%', end: 'top 50%', scrub: true } });
      gsap.fromTo($('.stage__inner', stage), { scale: 1.12 }, {
        scale: 1, ease: 'none', scrollTrigger: { trigger: wrap, start: 'top 95%', end: 'top 50%', scrub: true },
      });

      // Amplitude proportionnelle à la scène : les éléments flottants restent dans le cadre sur mobile
      const amp = () => Math.min(50, stage.offsetHeight * 0.04);
      $$('[data-float]', stage).forEach((el) => {
        const f = parseFloat(el.dataset.float);
        gsap.fromTo(el, { y: () => f * amp() }, {
          y: () => f * -amp(),
          ease: 'none',
          scrollTrigger: {
            trigger: wrap,
            start: 'top bottom',
            // de l'entrée à la sortie de la scène, ralenti compris
            end: () => `+=${vh() + stage.offsetHeight + extra()}`,
            scrub: true,
            invalidateOnRefresh: true,
          },
        });
      });

      $$('video', stage).forEach((v) => {
        ScrollTrigger.create({
          trigger: stage,
          start: 'top bottom',
          end: 'bottom top',
          onToggle: (self) => (self.isActive ? v.play().catch(() => {}) : v.pause()),
        });
      });
    });

    /* Workout : les téléphones se redressent, le mot défile derrière */
    const workout = $('#workout .project__stage');
    const workoutST = { trigger: workout, start: 'top bottom', end: 'center center', scrub: true, invalidateOnRefresh: true };
    const spread = () => (narrow() ? 12 : 35);
    gsap.fromTo('.phone--tilt-l', { rotation: -20, xPercent: () => -spread() }, { rotation: -6, xPercent: 0, ease: 'none', scrollTrigger: workoutST });
    gsap.fromTo('.phone--tilt-r', { rotation: 20, xPercent: () => spread() }, { rotation: 6, xPercent: 0, ease: 'none', scrollTrigger: workoutST });
    gsap.set('.stage__word', { x: 0, y: 0, xPercent: -50, yPercent: -50 });
    gsap.fromTo('.stage__word', { xPercent: -25 }, {
      xPercent: -75, ease: 'none', scrollTrigger: { trigger: workout, start: 'top bottom', end: 'bottom top', scrub: true },
    });

    /* Astro : le fond passe de Mars à Vénus */
    const astro = $('#astro .project__stage');
    gsap.fromTo(astro, { backgroundColor: '#f6c9b0' }, {
      backgroundColor: '#f4dd9a', ease: 'none', scrollTrigger: { trigger: astro, start: 'top 60%', end: 'bottom 40%', scrub: true },
    });
    gsap.fromTo('.stars', { yPercent: -8 }, {
      yPercent: 8, ease: 'none', scrollTrigger: { trigger: astro, start: 'top bottom', end: 'bottom top', scrub: true },
    });

    /* Contact */
    gsap.from('.contact__mail', { y: 50, autoAlpha: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.contact__mail', start: 'top 92%', once: true } });
    gsap.from('.contact__actions > *', { y: 30, autoAlpha: 0, duration: 1, stagger: 0.08, ease: 'expo.out', scrollTrigger: { trigger: '.contact__actions', start: 'top 95%', once: true } });

    /* Navigation : fond flouté, se cache en descendant, barre de progression */
    ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        const y = self.scroll();
        nav.classList.toggle('nav--solid', y > 40);
        nav.classList.toggle('nav--hidden', self.direction === 1 && y > vh() * 0.8);
      },
    });
    gsap.to('.nav__progress', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });

    if (finePointer) desktopInteractions();

    addEventListener('load', () => ScrollTrigger.refresh());
    // On ne recalcule que si la largeur change : sur mobile, la barre d'adresse qui apparaît
    // ou disparaît en scrollant ne change que la hauteur, et un recalcul ferait sauter la page.
    let resizeTimer;
    let lastWidth = window.innerWidth;
    addEventListener('resize', () => {
      if (window.innerWidth === lastWidth) return;
      lastWidth = window.innerWidth;
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => { viewH = window.innerHeight; fitTitle(); ScrollTrigger.refresh(); }, 150);
    });
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
  }

  /* ------------------------------------------------------------------------
     Souris : curseur, aperçu des projets, boutons magnétiques
     ------------------------------------------------------------------------ */
  function desktopInteractions() {
    root.classList.add('has-cursor');
    const cursor = $('.cursor');
    const label = $('.cursor__label');
    const cx = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3' });
    const cy = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3' });
    cursor.classList.add('cursor--hidden');
    addEventListener('mousemove', (e) => { cx(e.clientX); cy(e.clientY); }, { passive: true });
    addEventListener('mousemove', (e) => {
      gsap.set(cursor, { x: e.clientX, y: e.clientY });
      cursor.classList.remove('cursor--hidden');
    }, { once: true });
    document.addEventListener('mouseleave', () => cursor.classList.add('cursor--hidden'));
    document.addEventListener('mouseenter', () => cursor.classList.remove('cursor--hidden'));
    document.addEventListener('mouseover', (e) => {
      const labelled = e.target.closest('[data-cursor]');
      const link = e.target.closest('a, button');
      const inIndex = !!e.target.closest('.index a'); // liste des projets : le curseur reste un simple point
      cursor.classList.toggle('cursor--label', !!labelled);
      cursor.classList.toggle('cursor--link', !labelled && !!link && !inIndex);
      if (labelled) label.textContent = labelled.dataset.cursor;
    });

    /* Boutons magnétiques */
    $$('[data-magnetic]').forEach((el) => {
      const mx = gsap.quickTo(el, 'x', { duration: 0.8, ease: 'elastic.out(1, 0.4)' });
      const my = gsap.quickTo(el, 'y', { duration: 0.8, ease: 'elastic.out(1, 0.4)' });
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        mx((e.clientX - r.left - r.width / 2) * 0.3);
        my((e.clientY - r.top - r.height / 2) * 0.4);
      });
      el.addEventListener('mouseleave', () => { mx(0); my(0); });
    });
  }
})();
