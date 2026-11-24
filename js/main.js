/* Datos de contacto */
const isEnglish = document.documentElement.lang === "en";

const CONFIG = {
  whatsapp: "50232075850", // prefijo + número, sin "+"
  email: "lestergarcia711@gmail.com",
  linkedin: "https://www.linkedin.com/in/lester-garcia-dev/",
  github: "https://github.com/lestergarcia711",
};

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

/* ----- Enlaces de contacto desde CONFIG ----- */
const greeting = isEnglish
  ? "Hello Lester, I saw your portfolio and would like to contact you."
  : "Hola Lester, vi tu portafolio y me gustaría contactarte.";

const links = {
  wa: `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(greeting)}`,
  mail: `mailto:${CONFIG.email}`,
  li: CONFIG.linkedin,
  gh: CONFIG.github,
};

$$("[data-link]").forEach((a) => (a.href = links[a.dataset.link]));
$$(".mailtxt").forEach((s) => (s.textContent = CONFIG.email));

/* ----- Menú móvil ----- */
const sidebar = $("#sidebar"),
  menuBtn = $("#menuBtn");
const toggle = (open) => {
  sidebar.classList.toggle("open", open);
  menuBtn.setAttribute("aria-expanded", open);
  menuBtn.textContent = open ? "✕" : "☰";
};

menuBtn.onclick = () => toggle(!sidebar.classList.contains("open"));
$$("#nav a").forEach((a) => a.addEventListener("click", () => toggle(false)));
document.addEventListener("click", (e) => {
  if (
    sidebar.classList.contains("open") &&
    !sidebar.contains(e.target) &&
    e.target !== menuBtn
  )
    toggle(false);
});

/* ----- Vista previa del CV antes de descargar ----- */
const cvModal = $("#cvModal");

const openCvModal = () => {
  cvModal.classList.add("show");
  cvModal.setAttribute("aria-hidden", "false");
};

const closeCvModal = () => {
  cvModal.classList.remove("show");
  cvModal.setAttribute("aria-hidden", "true");
};

$$("[data-cv]").forEach((b) => b.addEventListener("click", openCvModal));
$("#cvCloseBtn").addEventListener("click", closeCvModal);
$("#cvSecondaryCloseBtn").addEventListener("click", closeCvModal);
cvModal.addEventListener("click", (e) => {
  if (e.target.matches("[data-close='cvModal']")) closeCvModal();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && cvModal.classList.contains("show")) closeCvModal();
});

/* ----- Formulario → WhatsApp ----- */
$("#form").addEventListener("submit", (e) => {
  e.preventDefault();
  const text = isEnglish
    ? `Hello Lester, my name is ${$("#name").value} (${$("#email").value}).\n\n${$("#msg").value}`
    : `Hola Lester, soy ${$("#name").value} (${$("#email").value}).\n\n${$("#msg").value}`;
  open(
    `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(text)}`,
    "_blank",
    "noopener",
  );

  e.target.reset();
});

/* ----- Caja de herramientas ----- */
(() => {
  const tb = $(".tb");

  if (!tb) return;
  const box = $(".tb-box", tb),
    cards = $$(".tool-card", tb),
    msg = $(".tb-msg", tb),
    count = $(".tb-count", tb);
  const N = cards.length;
  let cur = -1,
    busy = false;
  const hint = () => {
    msg.textContent =
      cur < 0 ? tb.dataset.h0 : cur < N - 1 ? tb.dataset.h1 : tb.dataset.h2;
    count.textContent = cur + 1 + "/" + N;
  };

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const click = async () => {
    if (busy) return;
    busy = true;
    box.classList.remove("jolt");
    void box.offsetWidth;
    box.classList.add("jolt");

    if (cur >= 0) {
      cards[cur].classList.remove("up");
      await wait(420);
    } // la herramienta anterior vuelve a la caja; su tarjeta se queda
    if (cur >= N - 1) {
      box.classList.remove("open");
      cur = -1;
      hint();
      busy = false;
      return;
    } // última: cerrar la caja (las tarjetas siguen visibles)
    if (cur < 0) {
      cards.forEach((c) => c.classList.remove("kept"));
      box.classList.add("open");
      await wait(380);
    } // nueva vuelta: se vacía el tablero
    cards[++cur].classList.add("up", "kept");
    hint();
    busy = false;
  };

  box.addEventListener("click", click);
  box.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      click();
    }
  });
})();
