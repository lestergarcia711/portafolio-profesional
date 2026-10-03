/* =====================================================
   CONFIGURACIÓN: edita aquí tus datos de contacto
   ===================================================== */
const CONFIG = {
  whatsapp: "50232075850",                      // código de país + número, sin + ni espacios (502 = Guatemala)
  email:    "lestergarcia711@gmail.com",
  linkedin: "https://www.linkedin.com/in/lester-garcia-dev/", // Pega aquí tu URL de LinkedIn; la página no la muestra como texto.
  github:   "https://github.com/lestergarcia711",
  roles:    ["de Software", "Front-End", "JavaScript", "Python"]
};

const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

/* ----- Enlaces de contacto desde CONFIG ----- */
const links = {
  wa:   `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent("Hola Lester, vi tu portafolio y me gustaría contactarte.")}`,
  mail: `mailto:${CONFIG.email}`,
  li:   CONFIG.linkedin,
  gh:   CONFIG.github
};
$$("[data-link]").forEach(a => a.href = links[a.dataset.link]);
$("#mailTxt").textContent = CONFIG.email;
$("#year").textContent = new Date().getFullYear();

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
    if (el.dataset.level) setTimeout(() => $(".bar i", el).style.width = el.dataset.level + "%", 150);
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
  const text = `Hola Lester, soy ${$("#name").value} (${$("#email").value}).\n\n${$("#msg").value}`;
  open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  e.target.reset();
});
