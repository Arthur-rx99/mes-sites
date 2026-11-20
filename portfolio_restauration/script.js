(function () {
  document.documentElement.classList.add('js');

  /* =====================================================
     1. PHOTOS : essaie plusieurs extensions si besoin
        (.jpg, .jpeg, .png, .webp...) puis affiche un
        message si le fichier est introuvable.
     ===================================================== */
  var EXTS = ['jpg', 'jpeg', 'png', 'webp', 'JPG', 'JPEG', 'PNG', 'WEBP'];

  document.querySelectorAll('.photo img').forEach(function (img) {
    var base = img.getAttribute('data-base');
    var tries = 0;

    function next() {
      tries++;
      if (tries < EXTS.length) {
        img.src = base + '.' + EXTS[tries];
      } else {
        var box = img.parentElement;
        box.classList.add('missing');
        box.setAttribute('data-hint', 'Photo introuvable : ajoute ' + base + '.jpg');
      }
    }
    img.addEventListener('error', next);
    if (img.complete && img.naturalWidth === 0) next();
  });

  /* =====================================================
     2. APPARITION AU SCROLL
     ===================================================== */
  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
      });
    }, { threshold: 0.15 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('visible'); });
  }

  /* =====================================================
     3. FOND INTERACTIF « BAR »
        - lueurs chaudes (bokeh) qui dérivent et suivent la souris
        - verres, cocktails, bouteilles, tasses, couverts qui flottent
          et s'écartent du curseur
     ===================================================== */
  var canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var w, h, dpr, lights = [], icons = [];
  var mouse = { x: -9999, y: -9999, active: false };
  var smooth = { x: 0, y: 0 };            // parallaxe lissée
  var LIGHT_COLORS = ['255,176,66', '214,150,60', '190,60,60', '255,214,140', '160,70,40'];

  /* ---------- dessin des icônes (traits fins) ---------- */
  var draw = {
    wine: function (c, s) {
      c.beginPath();
      c.moveTo(-.45 * s, -s);
      c.bezierCurveTo(-.55 * s, -.1 * s, -.3 * s, .2 * s, 0, .2 * s);
      c.bezierCurveTo(.3 * s, .2 * s, .55 * s, -.1 * s, .45 * s, -s);
      c.lineTo(-.45 * s, -s);
      c.moveTo(0, .2 * s); c.lineTo(0, .85 * s);
      c.moveTo(-.3 * s, .9 * s); c.lineTo(.3 * s, .9 * s);
      c.stroke();
    },
    martini: function (c, s) {
      c.beginPath();
      c.moveTo(-.75 * s, -.9 * s); c.lineTo(.75 * s, -.9 * s); c.lineTo(0, 0); c.closePath();
      c.moveTo(0, 0); c.lineTo(0, .8 * s);
      c.moveTo(-.35 * s, .85 * s); c.lineTo(.35 * s, .85 * s);
      c.stroke();
      c.beginPath(); c.arc(.12 * s, -.45 * s, .1 * s, 0, Math.PI * 2); c.stroke();
    },
    cup: function (c, s) {
      c.beginPath();
      c.moveTo(-.6 * s, -.3 * s); c.lineTo(.6 * s, -.3 * s); c.lineTo(.5 * s, .35 * s);
      c.quadraticCurveTo(0, .75 * s, -.5 * s, .35 * s); c.closePath();
      c.moveTo(-.85 * s, .75 * s); c.lineTo(.85 * s, .75 * s);
      c.stroke();
      c.beginPath(); c.arc(.62 * s, .02 * s, .24 * s, -Math.PI / 2, Math.PI / 2); c.stroke();
      c.beginPath();                                   // vapeur
      c.moveTo(-.2 * s, -.5 * s); c.quadraticCurveTo(-.35 * s, -.7 * s, -.2 * s, -.9 * s);
      c.moveTo(.15 * s, -.5 * s); c.quadraticCurveTo(0, -.7 * s, .15 * s, -.9 * s);
      c.stroke();
    },
    bottle: function (c, s) {
      c.beginPath();
      c.moveTo(-.15 * s, -s); c.lineTo(.15 * s, -s); c.lineTo(.15 * s, -.45 * s);
      c.bezierCurveTo(.15 * s, -.2 * s, .45 * s, -.2 * s, .45 * s, .1 * s);
      c.lineTo(.45 * s, .9 * s); c.lineTo(-.45 * s, .9 * s); c.lineTo(-.45 * s, .1 * s);
      c.bezierCurveTo(-.45 * s, -.2 * s, -.15 * s, -.2 * s, -.15 * s, -.45 * s);
      c.closePath();
      c.moveTo(-.45 * s, .25 * s); c.lineTo(.45 * s, .25 * s);
      c.moveTo(-.45 * s, .65 * s); c.lineTo(.45 * s, .65 * s);
      c.stroke();
    },
    cutlery: function (c, s) {
      c.beginPath();                                   // fourchette
      c.moveTo(-.6 * s, -.9 * s); c.lineTo(-.6 * s, -.25 * s);
      c.moveTo(-.4 * s, -.9 * s); c.lineTo(-.4 * s, -.25 * s);
      c.moveTo(-.2 * s, -.9 * s); c.lineTo(-.2 * s, -.25 * s);
      c.moveTo(-.6 * s, -.25 * s); c.quadraticCurveTo(-.4 * s, .05 * s, -.2 * s, -.25 * s);
      c.moveTo(-.4 * s, -.05 * s); c.lineTo(-.4 * s, .9 * s);
      c.moveTo(.4 * s, .9 * s); c.lineTo(.4 * s, -.9 * s);   // couteau
      c.quadraticCurveTo(.8 * s, -.5 * s, .6 * s, .1 * s);
      c.lineTo(.4 * s, .1 * s);
      c.stroke();
    }
  };
  var TYPES = ['wine', 'martini', 'cup', 'bottle', 'cutlery'];

  /* ---------- initialisation ---------- */
  function resize() {
    dpr = window.devicePixelRatio || 1;
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    lights = [];
    var nl = w < 700 ? 9 : 15;
    for (var i = 0; i < nl; i++) {
      lights.push({
        x: Math.random() * w, y: Math.random() * h,
        r: 50 + Math.random() * 130,
        depth: 0.3 + Math.random() * 1.2,
        vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25,
        color: LIGHT_COLORS[(Math.random() * LIGHT_COLORS.length) | 0],
        a: .07 + Math.random() * .12,
        phase: Math.random() * 6.28
      });
    }

    icons = [];
    var ni = Math.max(10, Math.min(26, Math.round(w * h / 60000)));
    for (var j = 0; j < ni; j++) {
      icons.push({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - .5) * .3, vy: -0.1 - Math.random() * .25,
        s: 14 + Math.random() * 22,
        rot: Math.random() * 6.28, vr: (Math.random() - .5) * .006,
        type: TYPES[j % TYPES.length],
        a: .13 + Math.random() * .12
      });
    }
    if (reduceMotion) frame(0);
  }

  /* ---------- interactions ---------- */
  window.addEventListener('mousemove', function (e) { mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true; });
  window.addEventListener('touchmove', function (e) {
    mouse.x = e.touches[0].clientX; mouse.y = e.touches[0].clientY; mouse.active = true;
  }, { passive: true });
  window.addEventListener('mouseleave', function () { mouse.active = false; });
  window.addEventListener('touchend', function () { mouse.active = false; });
  window.addEventListener('resize', resize);

  /* ---------- boucle d'animation ---------- */
  function frame(t) {
    ctx.clearRect(0, 0, w, h);

    var tx = mouse.active ? (mouse.x / w - .5) : 0;
    var ty = mouse.active ? (mouse.y / h - .5) : 0;
    smooth.x += (tx - smooth.x) * .05;
    smooth.y += (ty - smooth.y) * .05;
    var scroll = window.pageYOffset || 0;

    /* lueurs chaudes */
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < lights.length; i++) {
      var L = lights[i];
      if (!reduceMotion) {
        L.x += L.vx; L.y += L.vy;
        if (L.x < -L.r) L.x = w + L.r; if (L.x > w + L.r) L.x = -L.r;
        if (L.y < -L.r) L.y = h + L.r; if (L.y > h + L.r) L.y = -L.r;
      }
      var px = L.x - smooth.x * 90 * L.depth;
      var py = L.y - smooth.y * 90 * L.depth - (scroll * .05 * L.depth) % h;
      var pulse = reduceMotion ? 1 : .8 + .2 * Math.sin(t / 1500 + L.phase);
      var g = ctx.createRadialGradient(px, py, 0, px, py, L.r);
      g.addColorStop(0, 'rgba(' + L.color + ',' + (L.a * pulse) + ')');
      g.addColorStop(1, 'rgba(' + L.color + ',0)');
      ctx.fillStyle = g;
      ctx.fillRect(px - L.r, py - L.r, L.r * 2, L.r * 2);
    }

    /* projecteur autour du curseur */
    if (mouse.active) {
      var sg = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 280);
      sg.addColorStop(0, 'rgba(255,190,90,.16)');
      sg.addColorStop(1, 'rgba(255,190,90,0)');
      ctx.fillStyle = sg;
      ctx.fillRect(mouse.x - 280, mouse.y - 280, 560, 560);
    }

    /* icônes de bar / restauration */
    ctx.globalCompositeOperation = 'source-over';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (var k = 0; k < icons.length; k++) {
      var p = icons[k];
      var boost = 0;

      if (mouse.active) {
        var dx = p.x - mouse.x, dy = p.y - mouse.y;
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d < 170 && d > 1) {
          var f = (1 - d / 170) * 2.2;
          p.x += (dx / d) * f; p.y += (dy / d) * f;
          p.rot += f * .01;
          boost = 1 - d / 170;
        }
      }
      if (!reduceMotion) {
        p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      }
      if (p.x < -50) p.x = w + 50; if (p.x > w + 50) p.x = -50;
      if (p.y < -50) p.y = h + 50; if (p.y > h + 50) p.y = -50;

      ctx.save();
      ctx.translate(p.x - smooth.x * 30, p.y - smooth.y * 30);
      ctx.rotate(p.rot);
      ctx.strokeStyle = 'rgba(224,184,112,' + Math.min(.7, p.a + boost * .45) + ')';
      if (boost > 0) { ctx.shadowColor = 'rgba(255,190,90,.8)'; ctx.shadowBlur = 12 * boost; }
      draw[p.type](ctx, p.s);
      ctx.restore();
    }

    if (!reduceMotion) requestAnimationFrame(frame);
  }

  resize();
  if (!reduceMotion) requestAnimationFrame(frame);
})();
