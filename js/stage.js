/* =====================================================
   ESCENARIO HORIZONTAL
   Un muro de acero continuo (el mismo de la portada) con una ventana por
   apartado: editor de código o terminal. El balón, en la esquina, es el
   botón de avance: al tocarlo rueda y todo se desplaza hacia el lado.

   Piezas:
   - Fondo 3D ........ js/weld.js (muro de acero, nombre soldado, carro)
   - Balón 3D ........ modelo real dirty_football (assets/ball/), dibujado sobre el botón de la esquina
   - Ventanas ........ HTML normal en index.html (.slide > .win), sin canvas
   - Movimiento ...... un número `pos` (0 = portada … 5 = contacto) que se suaviza

   Respaldo: sin WebGL, con "movimiento reducido" o abierto con file:// no hay
   3D: el muro es una imagen de CSS, el nombre es texto y el avance es instantáneo.
   ===================================================== */
(function () {
  const html = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const EN = html.lang === "en";

  const webglOK = () => {
    try {
      const c = document.createElement("canvas");
      return !!(
        window.THREE &&
        (c.getContext("webgl") || c.getContext("experimental-webgl"))
      );
    } catch (e) {
      return false;
    }
  };

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const use3d = location.protocol !== "file:" && !reduce && webglOK(); // las texturas necesitan http

  /* ---------- Estado ---------- */
  const slides = $$(".slide"),
    N = slides.length;
  const track = $("#track"),
    bar = $("#worldBar"),
    tip = $("#worldTip");
  const nextBtn = $("#stageNext"),
    prevBtn = $("#stagePrev"),
    nextLbl = $("#nextLbl");
  const names = $$("#nav a").map((a) => a.textContent.trim()); // nombres de los apartados, en orden
  const STEP = 15; // unidades del mundo que avanza el fondo por apartado
  let R,
    S,
    C,
    bs,
    oc,
    weld,
    ball,
    spin,
    hover = 0,
    hoverGoal = 0;
  let pos = 0,
    tgt = 0,
    tmx = 0,
    tmy = 0,
    mx = 0,
    my = 0;

  track.style.width = N * 100 + "vw";

  /* ---------- Construcción de la escena (solo con 3D) ---------- */
  function build() {
    R = new THREE.WebGLRenderer({
      canvas: $("#gl"),
      antialias: innerWidth >= 768,
    });

    S = new THREE.Scene();
    S.background = new THREE.Color(0x060a14);
    C = new THREE.PerspectiveCamera(60, 1, 0.1, 300);
    C.position.set(0, 0, 8);
    S.add(C);

    weld = window.WeldHero ? WeldHero.create({ S, R, C }) : null; // muro de acero + nombre soldado + carro

    // balón: cámara ortogonal propia
    R.autoClear = false;
    bs = new THREE.Scene();
    oc = new THREE.OrthographicCamera(0, 1, 1, 0, -500, 500);
    ball = new THREE.Group();
    spin = new THREE.Group();
    ball.add(spin);
    bs.add(ball);
    const sun = new THREE.DirectionalLight(0xfff2e0, 1.5);
    sun.position.set(-0.4, 0.8, 1);
    bs.add(sun, new THREE.AmbientLight(0xaab6cc, 0.55));

    if (THREE.GLTFLoader)
      new THREE.GLTFLoader().load(
        "assets/ball/dirty_football_1k.gltf",
        (gl) => {
          const m = gl.scene,
            b = new THREE.Box3().setFromObject(m),
            c = b.getCenter(new THREE.Vector3()),
            s = (1 / Math.max(...b.getSize(new THREE.Vector3()).toArray())) * 2;
          m.scale.setScalar(s);
          m.position.set(-c.x * s, -c.y * s, -c.z * s);
          m.traverse((n) => {
            if (n.material) n.material.envMapIntensity = 1.2;
          });

          spin.add(m);
        },
      );
    applyTheme();
  }

  function applyTheme() {
    if (!S) return;
    const cs = getComputedStyle(html);
    S.background.set(cs.getPropertyValue("--bg").trim());
  }

  /* ---------- Tamaño ---------- */
  function resize() {
    if (!R) return;
    R.setPixelRatio(
      Math.min(devicePixelRatio || 1, innerWidth < 768 ? 1.5 : 2),
    );

    R.setSize(innerWidth, innerHeight);
    C.aspect = innerWidth / innerHeight;
    C.updateProjectionMatrix();

    if (weld) weld.layout(C.aspect < 1);
    oc.right = innerWidth;
    oc.top = innerHeight;
    oc.updateProjectionMatrix();
    const r = nextBtn.getBoundingClientRect();
    ball.position.set(
      r.left + r.width / 2,
      innerHeight - (r.top + r.height / 2),
      0,
    );

    placeTag();
    ball.scale.setScalar(r.width * 0.42); // el modelo mide radio 1 → el radio en píxeles
  }

  // etiqueta bajo el nombre
  function placeTag() {
    const tag = $(".hero-tag"),
      cap = $(".hero-cap");

    if (!tag || !cap || !weld || !weld.nameAnchor) return;
    C.updateMatrixWorld(true);
    const a = weld.nameAnchor(),
      v = a.p.clone().project(C),
      up = a.p
        .clone()
        .add(new THREE.Vector3(0, a.cap, 0))
        .project(C);
    const x = ((v.x + 1) / 2) * innerWidth,
      y = ((1 - v.y) / 2) * innerHeight,
      letterPx = (Math.abs(v.y - up.y) / 2) * innerHeight;
    cap.parentNode.classList.add("gl-tag");
    tag.style.fontSize = Math.max(18, letterPx * 0.42) + "px";
    tag.style.left = x - cap.offsetLeft + "px";
    tag.style.top = y - cap.offsetTop + "px";
  }

  addEventListener("resize", resize);

  /* ---------- Navegación entre apartados ---------- */
  function label() {
    const last = Math.round(tgt) >= N - 1;
    nextLbl.textContent = last
      ? EN
        ? "Back to start"
        : "Volver al inicio"
      : names[Math.round(tgt) + 1];
    prevBtn.hidden = Math.round(tgt) === 0;
  }

  const goto = (i) => {
    tgt = Math.max(0, Math.min(N - 1, i));
    tip.style.opacity = 0;
    label();
  };

  const next = () => goto(Math.round(tgt) >= N - 1 ? 0 : Math.round(tgt) + 1);
  const prev = () => goto(Math.round(tgt) - 1);

  nextBtn.addEventListener("click", next);
  prevBtn.addEventListener("click", prev);
  nextBtn.addEventListener("pointerenter", () => (hoverGoal = 1));
  nextBtn.addEventListener("pointerleave", () => (hoverGoal = 0));
  nextBtn.addEventListener("focus", () => (hoverGoal = 1));
  nextBtn.addEventListener("blur", () => (hoverGoal = 0));
  $$("#nav a").forEach((a, i) =>
    a.addEventListener("click", (e) => {
      e.preventDefault();
      goto(i);
    }),
  );

  $(".pill-brand").addEventListener("click", (e) => {
    e.preventDefault();
    goto(0);
  });

  // teclado, rueda y deslizar
  addEventListener("keydown", (e) => {
    if (
      e.target.closest("input, textarea") ||
      e.ctrlKey ||
      e.metaKey ||
      e.altKey
    )
      return;

    if (e.key === "ArrowRight" || e.key === "PageDown") {
      e.preventDefault();
      goto(Math.round(tgt) + 1);
    } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
      e.preventDefault();
      prev();
    } else if (e.key === "Home") goto(0);
    else if (e.key === "End") goto(N - 1);
  });

  let wheelLock = 0;
  addEventListener(
    "wheel",
    (e) => {
      const body = e.target.closest(".win-body");

      if (body && body.scrollHeight > body.clientHeight + 2) return; // si la ventana tiene scroll propio, no cambiar de apartado
      const now = performance.now();

      if (now < wheelLock || Math.abs(e.deltaY) + Math.abs(e.deltaX) < 20)
        return;
      wheelLock = now + 800;
      e.deltaY + e.deltaX > 0 ? goto(Math.round(tgt) + 1) : prev();
    },
    { passive: true },
  );

  let sx = null;
  addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") sx = e.clientX;
  });

  addEventListener("pointerup", (e) => {
    if (sx === null) return;
    const dx = e.clientX - sx;
    sx = null;

    if (Math.abs(dx) > 60) dx < 0 ? goto(Math.round(tgt) + 1) : prev();
  });

  addEventListener(
    "pointermove",
    (e) => {
      if (e.pointerType === "mouse") {
        tmx = (e.clientX / innerWidth) * 2 - 1;
        tmy = (e.clientY / innerHeight) * 2 - 1;
      }
    },
    { passive: true },
  );

  /* ---------- Bucle de animación ---------- */
  function loop(t) {
    requestAnimationFrame(loop);
    const before = pos;
    pos += (tgt - pos) * (reduce ? 1 : 0.075);

    if (Math.abs(tgt - pos) < 0.0005) pos = tgt;
    track.style.transform = `translate3d(${-pos * 100}vw,0,0)`;
    const idx = Math.round(pos);
    slides.forEach((s, i) => s.classList.toggle("on", i === idx));
    $$("#nav a").forEach((a, i) => a.classList.toggle("active", i === idx));
    bar.style.height = (pos / (N - 1)) * 100 + "%";

    if (!R) return;

    mx += (tmx - mx) * 0.05;
    my += (tmy - my) * 0.05;
    C.position.set(pos * STEP + mx * 0.5, -my * 0.3, 8);
    C.rotation.set(-my * 0.015, -mx * 0.02, 0);

    // el balón rueda con el avance
    spin.rotation.z -= (pos - before) * STEP * 1.7;
    spin.rotation.x += (pos - before) * STEP * 0.3;
    hover += (hoverGoal - hover) * 0.2;
    spin.scale.setScalar(
      (1 + hover * 0.12) * (1 + Math.sin(t * 0.003) * 0.025),
    );

    if (weld) weld.update(t, true); // el arco sigue al cursor en todos los apartados
    R.clear();
    R.render(S, C);
    bs.environment = S.environment;
    R.clearDepth();
    R.render(bs, oc);
  }

  /* ---------- Arranque ---------- */
  if (use3d) {
    try {
      build();
      resize();
    } catch (e) {
      console.warn("WebGL no disponible, se usa el respaldo sin 3D.", e);
      R = null;
      html.classList.add("no-gl");
    }
  } else html.classList.add("no-gl");
  label();
  requestAnimationFrame(loop);
})();
