// ===== Fond animé du haut de page uniquement =====
// Des symboles "cyber" en contour flottent doucement, avec un léger effet de profondeur à la souris.
const canvas = document.getElementById("hero-canvas");
const ctx = canvas.getContext("2d");
const hero = document.getElementById("accueil");
const VERT = "52, 211, 153";
const textes = ["</>", ">_", "{ }", "01", "#!", "$"];
const formes = ["cadenas", "bouclier", "cle"];
let symboles = [];
let souris = { x: 0, y: 0 };

function creerSymbole() {
  const estTexte = Math.random() < 0.5;
  return {
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    taille: 16 + Math.random() * 22,
    profondeur: 0.3 + Math.random() * 0.7,       // plus proche = plus visible et plus réactif
    vy: -(0.08 + Math.random() * 0.22),
    angle: Math.random() * Math.PI * 2,
    rotation: (Math.random() - 0.5) * 0.004,
    texte: estTexte ? textes[Math.floor(Math.random() * textes.length)] : null,
    forme: estTexte ? null : formes[Math.floor(Math.random() * formes.length)],
  };
}

function initFond() {
  canvas.width = hero.offsetWidth;
  canvas.height = hero.offsetHeight;
  const nombre = Math.round((canvas.width * canvas.height) / 38000);
  symboles = Array.from({ length: Math.min(nombre, 40) }, creerSymbole);
}

function dessinerForme(forme, t) {
  ctx.beginPath();
  if (forme === "cadenas") {
    ctx.rect(-t * 0.5, -t * 0.05, t, t * 0.7);
    ctx.moveTo(-t * 0.3, -t * 0.05);
    ctx.arc(0, -t * 0.05, t * 0.3, Math.PI, 0);
  } else if (forme === "bouclier") {
    ctx.moveTo(0, -t * 0.6);
    ctx.lineTo(t * 0.5, -t * 0.4);
    ctx.quadraticCurveTo(t * 0.5, t * 0.3, 0, t * 0.6);
    ctx.quadraticCurveTo(-t * 0.5, t * 0.3, -t * 0.5, -t * 0.4);
    ctx.closePath();
  } else {
    ctx.arc(-t * 0.3, 0, t * 0.22, 0, Math.PI * 2);
    ctx.moveTo(-t * 0.08, 0);
    ctx.lineTo(t * 0.55, 0);
    ctx.moveTo(t * 0.35, 0);
    ctx.lineTo(t * 0.35, t * 0.18);
    ctx.moveTo(t * 0.5, 0);
    ctx.lineTo(t * 0.5, t * 0.14);
  }
  ctx.stroke();
}

function animerFond() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const s of symboles) {
    s.y += s.vy * s.profondeur;
    s.angle += s.rotation;
    if (s.y < -50) { Object.assign(s, creerSymbole(), { y: canvas.height + 40 }); }

    const decalX = souris.x * 25 * s.profondeur;
    const decalY = souris.y * 25 * s.profondeur;

    ctx.save();
    ctx.translate(s.x + decalX, s.y + decalY);
    ctx.rotate(s.angle);
    const alpha = 0.08 + s.profondeur * 0.22;
    ctx.strokeStyle = ctx.fillStyle = `rgba(${VERT}, ${alpha})`;
    ctx.lineWidth = 1.4;
    if (s.texte) {
      ctx.font = `600 ${s.taille}px "JetBrains Mono", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(s.texte, 0, 0);
    } else {
      dessinerForme(s.forme, s.taille * 1.3);
    }
    ctx.restore();
  }

  requestAnimationFrame(animerFond);
}

hero.addEventListener("mousemove", (e) => {
  const r = hero.getBoundingClientRect();
  souris.x = (e.clientX - r.left) / r.width - 0.5;
  souris.y = (e.clientY - r.top) / r.height - 0.5;
});
window.addEventListener("resize", initFond);
initFond();
animerFond();

// ===== Navigation : fond au scroll, menu mobile, lien actif =====
const nav = document.getElementById("nav");
const burger = document.getElementById("burger");
const menu = document.getElementById("menu");
const liens = menu.querySelectorAll("a");

window.addEventListener("scroll", () => nav.classList.toggle("scrolled", window.scrollY > 50));

burger.addEventListener("click", () => {
  burger.classList.toggle("open");
  menu.classList.toggle("open");
});
liens.forEach((a) => a.addEventListener("click", () => {
  burger.classList.remove("open");
  menu.classList.remove("open");
}));

const sections = document.querySelectorAll("section[id]");
const obsNav = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) {
      liens.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id));
    }
  });
}, { rootMargin: "-50% 0px -50% 0px" });
sections.forEach((s) => obsNav.observe(s));

// ===== Apparition des éléments au scroll =====
const obsReveal = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) {
      e.target.classList.add("visible");
      obsReveal.unobserve(e.target);
    }
  });
}, { threshold: 0.15 });
document.querySelectorAll(".reveal").forEach((el) => obsReveal.observe(el));

// ===== Filtres des projets =====
document.querySelectorAll(".filter").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    const f = btn.dataset.filter;
    document.querySelectorAll(".project").forEach((p) => {
      p.classList.toggle("hidden", f !== "all" && p.dataset.cat !== f);
    });
  });
});

// ===== Formulaire : ouvre la messagerie avec le message pré-rempli =====
document.getElementById("form").addEventListener("submit", (e) => {
  e.preventDefault();
  const f = e.target;
  const sujet = encodeURIComponent("Contact portfolio - " + f.nom.value);
  const corps = encodeURIComponent(f.message.value + "\n\n" + f.nom.value + " (" + f.email.value + ")");
  window.location.href = `mailto:arthurroux99@gmail.com?subject=${sujet}&body=${corps}`;
});

document.getElementById("year").textContent = new Date().getFullYear();
