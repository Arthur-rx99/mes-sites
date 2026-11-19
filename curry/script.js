// ----- Effet sur le header quand on descend -----

var nav = document.querySelector("nav");
var header = document.querySelector("header");
var fondHeader = document.querySelector(".header-bg");
var texteHeader = document.querySelector(".header-texte");
var profil = document.querySelector(".profil");
var logo = document.querySelector(".logo");

window.addEventListener("scroll", function () {
  var y = window.scrollY;
  var p = y / header.offsetHeight;
  if (p > 1) {
    p = 1;
  }

  if (y > 60) {
    nav.classList.add("scrolle");
  } else {
    nav.classList.remove("scrolle");
  }

  fondHeader.style.transform = "translateY(" + y * 0.45 + "px) scale(" + (1 + p * 0.15) + ")";
  fondHeader.style.filter = "brightness(" + (1 - p * 0.5) + ")";

  texteHeader.style.transform = "translateY(" + -y * 0.3 + "px)";
  texteHeader.style.opacity = 1 - p * 1.4;

  profil.style.transform = "translateY(" + y * 0.12 + "px) rotate(" + p * 6 + "deg)";
  profil.style.opacity = 1 - p * 1.1;

  logo.style.opacity = 1 - p * 3;
});


// ----- Les éléments apparaissent quand on arrive dessus -----

var elements = document.querySelectorAll("main h2, .contenu, .carte");

var observer = new IntersectionObserver(function (entrees) {
  entrees.forEach(function (entree) {
    if (entree.isIntersecting) {
      entree.target.classList.add("visible");
    }
  });
});

elements.forEach(function (element) {
  element.classList.add("reveal");
  observer.observe(element);
});


// ----- Les cartes du palmarès penchent avec la souris -----

var cartes = document.querySelectorAll(".carte");

cartes.forEach(function (carte) {
  carte.addEventListener("mousemove", function (e) {
    var rect = carte.getBoundingClientRect();
    var x = (e.clientX - rect.left) / rect.width - 0.5;
    var y = (e.clientY - rect.top) / rect.height - 0.5;
    carte.style.transform = "perspective(700px) rotateX(" + -y * 15 + "deg) rotateY(" + x * 15 + "deg)";
  });

  carte.addEventListener("mouseleave", function () {
    carte.style.transform = "";
  });
});


// ----- Fond animé -----

var canvas = document.getElementById("fond");
var ctx = canvas.getContext("2d");
var halo = document.querySelector(".halo");

var ballon = new Image();
ballon.src = "images/ballon.png";

var points = [];
var tirs = [];
var messages = [];
var sourisX = -1000;
var sourisY = -1000;

function changerTaille() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
changerTaille();
window.addEventListener("resize", changerTaille);

// on crée les points qui montent (certains sont des ballons)
for (var i = 0; i < 70; i++) {
  points.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vitesse: 0.2 + Math.random() * 0.4,
    taille: 1 + Math.random() * 2,
    estUnBallon: Math.random() < 0.12,
    angle: Math.random() * 6
  });
}

window.addEventListener("mousemove", function (e) {
  sourisX = e.clientX;
  sourisY = e.clientY;
  halo.style.background = "radial-gradient(450px circle at " + sourisX + "px " + sourisY + "px, rgba(75, 134, 211, 0.18), transparent 60%)";
});

// clic sur le fond = tir à 3 points
window.addEventListener("click", function (e) {
  if (e.target.closest("a, img, p, h1, h2, .carte, nav")) {
    return;
  }
  var distance = 300;
  if (e.clientX > canvas.width / 2) {
    distance = -300;
  }
  tirs.push({
    departX: e.clientX,
    departY: e.clientY,
    arriveeX: e.clientX + distance,
    arriveeY: e.clientY - 150,
    t: 0
  });
});

function dessinerBallon(x, y, taille, angle) {
  // si l'image n'est pas encore chargée on ne dessine rien
  if (ballon.naturalWidth == 0) {
    return;
  }
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.drawImage(ballon, -taille / 2, -taille / 2, taille, taille);
  ctx.restore();
}

function dessinerTerrain() {
  var l = Math.min(canvas.width * 0.9, 900);
  var h = l * 1.9;
  var x = (canvas.width - l) / 2;
  var y = canvas.height / 2 - h / 2 - window.scrollY * 0.12;

  ctx.strokeStyle = "rgba(75, 134, 211, 0.15)";
  ctx.lineWidth = 2;

  // contour + ligne du milieu + rond central
  ctx.strokeRect(x, y, l, h);
  ctx.beginPath();
  ctx.moveTo(x, y + h / 2);
  ctx.lineTo(x + l, y + h / 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x + l / 2, y + h / 2, l * 0.12, 0, Math.PI * 2);
  ctx.stroke();

  // raquettes
  ctx.strokeRect(x + l * 0.335, y, l * 0.33, h * 0.2);
  ctx.strokeRect(x + l * 0.335, y + h * 0.8, l * 0.33, h * 0.2);

  // lignes à 3 points
  ctx.beginPath();
  ctx.arc(x + l / 2, y + h * 0.05, l * 0.45, 0, Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x + l / 2, y + h * 0.95, l * 0.45, Math.PI, Math.PI * 2);
  ctx.stroke();
}

function animer() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  dessinerTerrain();

  // les points
  points.forEach(function (p) {
    p.y -= p.vitesse;
    p.angle += 0.01;
    if (p.y < -20) {
      p.y = canvas.height + 20;
      p.x = Math.random() * canvas.width;
    }

    // ils s'écartent de la souris
    var dx = p.x - sourisX;
    var dy = p.y - sourisY;
    var distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < 140) {
      p.x += dx / distance;
      p.y += dy / distance;
    }

    // petit trait vers la souris
    if (distance < 190) {
      ctx.strokeStyle = "rgba(120, 170, 235, " + (1 - distance / 190) * 0.4 + ")";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(sourisX, sourisY);
      ctx.stroke();
    }

    if (p.estUnBallon) {
      ctx.globalAlpha = 0.6;
      dessinerBallon(p.x, p.y, p.taille * 7, p.angle);
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = "rgba(170, 200, 245, 0.6)";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.taille, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // les tirs
  for (var i = tirs.length - 1; i >= 0; i--) {
    var tir = tirs[i];
    tir.t += 0.02;
    var x = tir.departX + (tir.arriveeX - tir.departX) * tir.t;
    var y = tir.departY + (tir.arriveeY - tir.departY) * tir.t - Math.sin(tir.t * Math.PI) * 250;
    dessinerBallon(x, y, 34, tir.t * 15);

    if (tir.t >= 1) {
      messages.push({ x: x, y: y, opacite: 1, texte: Math.random() < 0.5 ? "+3" : "SPLASH !" });
      tirs.splice(i, 1);
    }
  }

  // les "+3" qui montent et disparaissent
  for (var j = messages.length - 1; j >= 0; j--) {
    var m = messages[j];
    m.y -= 0.8;
    m.opacite -= 0.015;
    ctx.globalAlpha = m.opacite;
    ctx.font = "42px Impact, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "white";
    ctx.shadowColor = "#4b86d3";
    ctx.shadowBlur = 20;
    ctx.fillText(m.texte, m.x, m.y);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    if (m.opacite <= 0) {
      messages.splice(j, 1);
    }
  }

  requestAnimationFrame(animer);
}

animer();
