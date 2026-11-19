/* =====================================================
   CONFIGURACIÓN: edita aquí tus datos de contacto
   ===================================================== */
const isEnglish = document.documentElement.lang === "en";

const CONFIG = {
  whatsapp: "50232075850",                      // código de país + número, sin + ni espacios (502 = Guatemala)
  email:    "lestergarcia711@gmail.com",
  linkedin: "https://www.linkedin.com/in/lester-garcia-dev/", // Pega aquí tu URL de LinkedIn; la página no la muestra como texto.
  github:   "https://github.com/lestergarcia711",
  roles:    isEnglish ? ["Developer", "Front-End", "Back-End/JavaScript"] : ["de Software", "Front-End", "Back-End/JavaScript"] // Roles que se mostrarán en el efecto de escritura
};

const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

/* ----- Enlaces de contacto desde CONFIG ----- */
const links = {
  wa:   `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(isEnglish ? "Hello Lester, I saw your portfolio and would like to contact you." : "Hola Lester, vi tu portafolio y me gustaría contactarte.")}`,
  mail: `mailto:${CONFIG.email}`,
  li:   CONFIG.linkedin,
  gh:   CONFIG.github
};
$$("[data-link]").forEach(a => a.href = links[a.dataset.link]);
$("#mailTxt").textContent = CONFIG.email;
$("#year").textContent = new Date().getFullYear();

/* ----- Modo claro / oscuro (se recuerda la elección) ----- */
const themeBtns = $$("[data-theme-set]");
const applyTheme = t => {
  document.documentElement.dataset.theme = t;
  themeBtns.forEach(b => b.setAttribute("aria-pressed", b.dataset.themeSet === t));
  $("meta[name='theme-color']").content = t === "light" ? "#f5f7fb" : "#0b1220";
};
applyTheme(document.documentElement.dataset.theme || "dark");
themeBtns.forEach(b => b.addEventListener("click", () => {
  applyTheme(b.dataset.themeSet);
  try { localStorage.setItem("theme", b.dataset.themeSet); } catch (e) {}
}));

/* ----- Menú móvil ----- */
const sidebar = $("#sidebar"), menuBtn = $("#menuBtn");
const toggle = open => {
  sidebar.classList.toggle("open", open);
  menuBtn.setAttribute("aria-expanded", open);
  menuBtn.textContent = open ? "✕" : "☰";
};
menuBtn.onclick = () => toggle(!sidebar.classList.contains("open"));
$$("#nav a").forEach(a => a.addEventListener("click", () => toggle(false)));
document.addEventListener("click", e => {
  if (sidebar.classList.contains("open") && !sidebar.contains(e.target) && e.target !== menuBtn) toggle(false);
});

/* ----- Enlace activo según la sección visible ----- */
const navLinks = $$("#nav a");
const spy = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (en.isIntersecting) navLinks.forEach(a => a.classList.toggle("active", a.hash === "#" + en.target.id));
  });
}, { rootMargin: "-45% 0px -50% 0px" });
$$("main section").forEach(s => spy.observe(s));

/* ----- Animaciones al hacer scroll (aparecer, barras y contadores) ----- */
const countUp = el => {
  const end = +el.dataset.count; let n = 0;
  const step = Math.max(1, Math.ceil(end / 40));
  const t = setInterval(() => { n = Math.min(end, n + step); el.textContent = n; if (n >= end) clearInterval(t); }, 35);
};
const reveal = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (!en.isIntersecting) return;
    const el = en.target;
    el.classList.add("in");
    $$("[data-count]", el).forEach(countUp);
    reveal.unobserve(el);
  });
}, { threshold: .15 });
$$(".reveal").forEach(el => reveal.observe(el));

/* ----- Efecto de escritura en el rol ----- */
(function typing() {
  const out = $("#typed"); let r = 0, c = 0, del = false;
  (function tick() {
    const word = CONFIG.roles[r];
    out.textContent = word.slice(0, c);
    if (!del && c === word.length) { del = true; return setTimeout(tick, 1400); }
    if (del && c === 0) { del = false; r = (r + 1) % CONFIG.roles.length; }
    c += del ? -1 : 1;
    setTimeout(tick, del ? 50 : 100);
  })();
})();

/* ----- Vista previa del CV antes de descargar ----- */
const cvModal = $("#cvModal");
const cvPreviewBtn = $("#cvPreviewBtn");
const cvCloseBtn = $("#cvCloseBtn");
const cvSecondaryCloseBtn = $("#cvSecondaryCloseBtn");

const openCvModal = () => {
  cvModal.classList.add("show");
  cvModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
};

const closeCvModal = () => {
  cvModal.classList.remove("show");
  cvModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
};

cvPreviewBtn.addEventListener("click", openCvModal);
cvCloseBtn.addEventListener("click", closeCvModal);
cvSecondaryCloseBtn.addEventListener("click", closeCvModal);
cvModal.addEventListener("click", e => {
  if (e.target.matches("[data-close='cvModal']")) closeCvModal();
});
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && cvModal.classList.contains("show")) closeCvModal();
});

/* ----- Botón volver arriba ----- */
const toTop = $("#toTop");
addEventListener("scroll", () => toTop.classList.toggle("show", scrollY > 600), { passive: true });
toTop.onclick = () => scrollTo({ top: 0, behavior: "smooth" });

/* ----- Formulario: abre WhatsApp con el mensaje ya redactado ----- */
$("#form").addEventListener("submit", e => {
  e.preventDefault();
  const text = isEnglish
    ? `Hello Lester, my name is ${$("#name").value} (${$("#email").value}).\n\n${$("#msg").value}`
    : `Hola Lester, soy ${$("#name").value} (${$("#email").value}).\n\n${$("#msg").value}`;
  open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  e.target.reset();
});

/* =====================================================
   EXPERIENCIA INMERSIVA
   ===================================================== */
const fineHover = matchMedia("(hover: hover) and (pointer: fine)").matches;
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ----- Nombre del hero: cada letra reacciona y entra escalonada ----- */
$$("[data-split]").forEach((el, line) => {
  const text = el.textContent;
  el.innerHTML = "";
  [...text].forEach((ch, i) => {
    const s = document.createElement("span");
    s.className = "ch"; s.textContent = ch; s.setAttribute("aria-hidden", "true");
    s.style.setProperty("--i", i + line * 6);
    el.append(s);
  });
});

/* ----- Foco de luz, cursor propio y botones magnéticos (solo con ratón) ----- */
if (fineHover && !reduceMotion) {
  document.body.classList.add("has-cursor");
  const spot = Object.assign(document.createElement("div"), { className: "spotlight" });
  const ring = Object.assign(document.createElement("div"), { className: "cursor-ring" });
  const dot  = Object.assign(document.createElement("div"), { className: "cursor-dot" });
  document.body.append(spot, ring, dot);

  let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
  addEventListener("pointermove", e => {
    mx = e.clientX; my = e.clientY;
    dot.style.transform = `translate(${mx}px, ${my}px)`;
    spot.style.setProperty("--mx", mx + "px");
    spot.style.setProperty("--my", my + "px");
  }, { passive: true });
  (function follow() {
    rx += (mx - rx) * .18; ry += (my - ry) * .18;
    ring.style.transform = `translate(${rx}px, ${ry}px)`;
    requestAnimationFrame(follow);
  })();

  document.addEventListener("pointerover", e => {
    ring.classList.toggle("big", !!e.target.closest("a, button, .big-name .ch"));
  });

  $$(".magnetic").forEach(el => {
    el.addEventListener("pointermove", e => {
      const r = el.getBoundingClientRect();
      el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .25}px, ${(e.clientY - r.top - r.height / 2) * .35}px)`;
    });
    el.addEventListener("pointerleave", () => { el.style.transform = ""; });
  });

  /* Vista previa flotante de los proyectos */
  const pf = Object.assign(document.createElement("div"), { className: "pfloat" });
  const pimg = document.createElement("img"); pimg.alt = "";
  pf.append(pimg); document.body.append(pf);
  let px = 0, py = 0, tx = 0, ty = 0;
  $$(".prow").forEach(row => {
    const thumb = $(".pthumb", row);
    row.addEventListener("pointerenter", () => {
      pimg.src = thumb.src; pimg.style.cssText = thumb.style.cssText;
      pf.style.borderColor = row.dataset.accent; pf.classList.add("show");
    });
    row.addEventListener("pointerleave", () => pf.classList.remove("show"));
    row.addEventListener("pointermove", e => { tx = e.clientX + 28; ty = e.clientY - 90; });
  });
  (function glide() {
    px += (tx - px) * .15; py += (ty - py) * .15;
    pf.style.transform = `translate(${px}px, ${py}px) rotate(${(tx - px) * .05}deg)`;
    requestAnimationFrame(glide);
  })();
}

/* ----- Color de cada proyecto como variable CSS ----- */
$$(".prow").forEach(r => r.style.setProperty("--accent", r.dataset.accent));

/* ----- Constelación de habilidades (canvas) ----- */
(function constellation() {
  const cv = $("#stack"); if (!cv) return;
  const T = (es, en) => isEnglish ? en : es;
  const NODES = [
    { n: "HTML",       x: .12, y: .30, d: T("Estructura semántica y accesible de cada página.", "Semantic, accessible structure for every page.") },
    { n: "CSS",        x: .26, y: .62, d: T("Diseño responsivo, animaciones y temas claro/oscuro.", "Responsive design, animations and light/dark themes.") },
    { n: "JavaScript", x: .42, y: .30, d: T("Interactividad en el navegador y lógica de aplicación.", "Browser interactivity and application logic.") },
    { n: "Node.js",    x: .60, y: .55, d: T("Servidores y APIs REST del lado del backend.", "Back-end servers and REST APIs.") },
    { n: "Express",    x: .76, y: .28, d: T("Rutas y middlewares para construir APIs.", "Routes and middleware to build APIs.") },
    { n: "MySQL",      x: .62, y: .85, d: T("Modelos relacionales y consultas SQL.", "Relational models and SQL queries.") },
    { n: "Git",        x: .30, y: .88, d: T("Ramas, commits y trabajo en equipo con GitHub.", "Branches, commits and teamwork on GitHub.") },
    { n: "IA",         x: .90, y: .62, d: T("Uso responsable de asistentes de código para ganar productividad.", "Responsible use of code assistants to boost productivity.") }
  ];
  window.STACK_NODES = NODES; // lo reutiliza el mundo 3D (js/world.js)
  const LINKS = [[0,1],[0,2],[1,2],[2,3],[3,4],[3,5],[2,6],[4,5],[4,7],[3,7],[1,6],[5,6]];
  const card = $("#nodeCard"), title = $("#nodeTitle"), text = $("#nodeText");
  const idle = () => { title.textContent = T("Mi stack", "My stack"); text.textContent = T("Explora cada nodo para ver cómo lo uso.", "Explore each node to see how I use it."); card.classList.remove("on"); };
  idle();
  $("#stackList").innerHTML = NODES.map(n => `<li>${n.n}: ${n.d}</li>`).join("");

  const ctx = cv.getContext("2d");
  let W, H, mx = -999, my = -999, hot = -1, pull = false, running = false, col = {};
  const parts = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), vx: (Math.random() - .5) * 4e-4, vy: (Math.random() - .5) * 4e-4 }));
  const probe = document.createElement("canvas").getContext("2d");
  const rgb = c => { probe.fillStyle = c; const n = parseInt(probe.fillStyle.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const readColors = () => {
    const cs = getComputedStyle(document.documentElement), v = k => cs.getPropertyValue(k).trim();
    col = { g: v("--green"), t: v("--text"), bg: v("--bg2"), gR: rgb(v("--green")), bR: rgb(v("--blue")) };
  };
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  readColors(); resize();
  addEventListener("resize", resize);
  new MutationObserver(readColors).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  const pos = e => { const r = cv.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; };
  cv.addEventListener("pointermove", pos);
  cv.addEventListener("pointerdown", e => { pos(e); pull = true; });
  addEventListener("pointerup", () => { pull = false; });
  cv.addEventListener("pointerleave", () => { mx = my = -999; });
  // Solo se anima mientras la sección está visible
  new IntersectionObserver(([en]) => { const was = running; running = en.isIntersecting; if (running && !was) frame(); }).observe(cv);

  function frame() {
    if (!running) return;
    ctx.clearRect(0, 0, W, H);
    const t = reduceMotion ? 0 : Date.now() / 450;
    parts.forEach(p => {
      if (!reduceMotion) { p.x += p.vx; p.y += p.vy; if (p.x < 0 || p.x > 1) p.vx *= -1; if (p.y < 0 || p.y > 1) p.vy *= -1; }
      const dx = mx - p.x * W, dy = my - p.y * H;
      if (Math.hypot(dx, dy) < 150) { const k = pull ? .05 : -.012; p.x += dx * k / W; p.y += dy * k / H; }
    });
    ctx.lineWidth = 1;
    for (let i = 0; i < parts.length; i++) for (let j = i + 1; j < parts.length; j++) {
      const d = Math.hypot((parts[i].x - parts[j].x) * W, (parts[i].y - parts[j].y) * H);
      if (d < 90) { ctx.strokeStyle = rgba(col.bR, .2 * (1 - d / 90)); ctx.beginPath(); ctx.moveTo(parts[i].x * W, parts[i].y * H); ctx.lineTo(parts[j].x * W, parts[j].y * H); ctx.stroke(); }
    }
    ctx.fillStyle = rgba(col.bR, .5);
    parts.forEach(p => ctx.fillRect(p.x * W, p.y * H, 2, 2));

    hot = -1;
    NODES.forEach((n, i) => { if (Math.hypot(n.x * W - mx, n.y * H - my) < 28) hot = i; });
    LINKS.forEach(([a, b]) => {
      const on = hot === a || hot === b;
      ctx.strokeStyle = rgba(col.gR, on ? .9 : .28); ctx.lineWidth = on ? 2 : 1;
      ctx.beginPath(); ctx.moveTo(NODES[a].x * W, NODES[a].y * H); ctx.lineTo(NODES[b].x * W, NODES[b].y * H); ctx.stroke();
    });
    ctx.textAlign = "center"; ctx.font = "500 13px Inter, system-ui, sans-serif";
    NODES.forEach((n, i) => {
      const x = n.x * W, y = n.y * H, on = hot === i, r = (on ? 15 : 9) + Math.sin(t + i) * .8;
      ctx.beginPath(); ctx.arc(x, y, r, 0, 7);
      ctx.fillStyle = on ? col.g : col.bg; ctx.fill(); ctx.strokeStyle = col.g; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = col.t; ctx.fillText(n.n, x, y + r + 16);
    });
    if (hot >= 0) { title.textContent = NODES[hot].n; text.textContent = NODES[hot].d; card.classList.add("on"); }
    else if (card.classList.contains("on")) idle();
    requestAnimationFrame(frame);
  }
})();
