/* =====================================================
   MUNDO 3D INMERSIVO
   El scroll es un vuelo de cámara por el espacio: inicio → sobre mí →
   stack → proyectos → contacto. Usa Three.js (js/vendor/three.min.js).
   Si no hay WebGL, el usuario prefiere menos movimiento o abre el archivo
   con file://, se usa la página clásica (secciones HTML de index.html).
   ===================================================== */
(function () {
  const html = document.documentElement;
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const EN = html.lang === "en";
  const modeBtn = $("#modeBtn");

  const webglOK = () => {
    try { const c = document.createElement("canvas"); return !!(window.THREE && (c.getContext("webgl") || c.getContext("experimental-webgl"))); }
    catch (e) { return false; }
  };
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const capable = location.protocol !== "file:" && !reduce && webglOK();
  if (!capable) { html.classList.remove("immersive"); return; }

  /* ---------- Estado ---------- */
  let ready = false, active = false, running = false;
  let fades = [], R, S, C, ico, knot, stars, cluster, rings = [], spheres = [], panels = [], labels = [], lineMats = [];
  let col = {}, cG, cO;
  let tp = 0, p = 0, tmx = 0, tmy = 0, mx = 0, my = 0, tagX = 0, tagY = 0;
  let lastTouch = false, selected = null;
  const mv = new THREE.Vector2(9, 9);
  const L = 160; // recorrido total de la cámara en z

  const STATIONS = [[-1, .10, "c0"], [.14, .30, "c1"], [.34, .50, "c2"], [.50, .86, "c3"], [.92, 2, "c4"]];
  const NAV_MAP  = [0, .22, .42, .70, .22, 1];   // posición (0-1) de cada enlace del menú
  const NAV_IDX  = p => p < .12 ? 0 : p < .32 ? 1 : p < .52 ? 2 : p < .88 ? 3 : 5;
  const maxScroll = () => Math.max(1, document.documentElement.scrollHeight - innerHeight);

  /* ---------- Etiquetas de texto (sprites) ---------- */
  function drawLabel(l) {
    const x = l.ctx; x.clearRect(0, 0, 512, 128);
    const font = n => `500 ${n}px 'JetBrains Mono', monospace`; x.font = font(46); x.textAlign = "center";
    const w = x.measureText(l.text).width; if (w > 480) x.font = font(Math.floor(46 * 480 / w));
    x.fillStyle = l.kind === "green" ? col.g : col.t; x.fillText(l.text, 256, 78);
    l.tex.needsUpdate = true;
  }
  function label(text, kind, sx, sy) {
    const cv = document.createElement("canvas"); cv.width = 512; cv.height = 128;
    const l = { text, kind, ctx: cv.getContext("2d"), tex: new THREE.CanvasTexture(cv) };
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: l.tex, transparent: true, depthWrite: false }));
    s.scale.set(sx, sy, 1); l.sprite = s; labels.push(l); drawLabel(l); return s;
  }

  /* ---------- Los objetos lejanos aparecen al acercarse ---------- */
  function reg(obj, z, start, near) {
    const mats = []; obj.traverse(o => { if (o.material) { o.material.transparent = true; mats.push([o.material, o.material.opacity]); } });
    fades.push({ obj, z, start, near, mats });
  }
  function updateFades() {
    fades.forEach(f => {
      const d = C.position.z - f.z;
      let k = Math.min(1, Math.max(0, (f.start - d) / 16));
      if (f.near) k = Math.min(k, Math.max(0, (d - f.near[0]) / f.near[1])); // se desvanece al pasar junto a la cámara
      f.obj.userData.k = k; f.obj.visible = k > .01; if (k > .01) f.mats.forEach(([m, base]) => { m.opacity = base * k; });
    });
  }

  /* ---------- Construcción de la escena ---------- */
  function build() {
    const narrow = innerWidth < 768;
    R = new THREE.WebGLRenderer({ canvas: $("#gl"), antialias: !narrow });
    S = new THREE.Scene(); S.fog = new THREE.FogExp2(0x060a14, .03); S.background = new THREE.Color(0x060a14);
    C = new THREE.PerspectiveCamera(60, 1, .1, 300);
    cG = new THREE.Color(); cO = new THREE.Color();
    const cs = getComputedStyle(html), v = k => cs.getPropertyValue(k).trim();
    col = { g: v("--green"), t: v("--text") };

    // estrellas
    const N = narrow ? 1800 : 3200, pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) { pos[i * 3] = (Math.random() - .5) * 90; pos[i * 3 + 1] = (Math.random() - .5) * 60; pos[i * 3 + 2] = 30 - Math.random() * 250; }
    const sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    stars = new THREE.Points(sg, new THREE.PointsMaterial({ size: .09, transparent: true, opacity: .85 })); S.add(stars);

    // inicio y sobre mí: figuras de alambre
    ico = new THREE.Mesh(new THREE.IcosahedronGeometry(3.2, 1), new THREE.MeshBasicMaterial({ wireframe: true, transparent: true, opacity: .35 }));
    knot = new THREE.Mesh(new THREE.TorusKnotGeometry(2.2, .5, 120, 12), new THREE.MeshBasicMaterial({ wireframe: true, transparent: true, opacity: .3 }));
    S.add(ico, knot); reg(knot, -38, 36);

    // stack: nodos en órbita (datos compartidos con la constelación de main.js)
    const NODES = window.STACK_NODES || [];
    const defT = $("#stackTitle").textContent, defD = $("#stackText").textContent;
    cluster = new THREE.Group(); cluster.position.set(0, 0, -75); S.add(cluster);
    NODES.forEach((n, i) => {
      const phi = Math.acos(1 - 2 * (i + .5) / NODES.length), th = Math.PI * (1 + Math.sqrt(5)) * i, r = 6;
      const m = new THREE.Mesh(new THREE.SphereGeometry(.55, 24, 24), new THREE.MeshBasicMaterial());
      m.position.set(r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi) * .8, r * Math.sin(phi) * Math.sin(th));
      m.userData = { kind: "node", i, name: n.n, text: n.d };
      const lb = label(n.n, "text", 4, 1); lb.position.set(0, 1.3, 0); m.add(lb);
      cluster.add(m); spheres.push(m);
    });
    const lp = [];
    spheres.forEach((a, i) => spheres.forEach((b, j) => { if (j > i && a.position.distanceTo(b.position) < 7.5) lp.push(a.position, b.position); }));
    const lmat = new THREE.LineBasicMaterial({ transparent: true, opacity: .35 }); lineMats.push(lmat);
    cluster.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(lp), lmat));
    S.userData.def = { t: defT, d: defD };
    reg(cluster, -75, 60, [8, 6]);

    // proyectos: paneles con las capturas reales (datos leídos del HTML)
    const tl = new THREE.TextureLoader(), target = 6 / 3.75;
    $$(".prow").forEach((row, i) => {
      const g = new THREE.Group(), side = i % 2 ? 1 : -1;
      g.position.set(side * 4.6, (i % 3 - 1) * 1.1, -92 - i * 11); g.rotation.y = -side * .35; g.userData = { side, base: 1 };
      const tex = tl.load($(".pthumb", row).getAttribute("src"), t => {
        const ar = t.image.width / t.image.height;
        if (ar > target) { t.repeat.x = target / ar; t.offset.x = (1 - t.repeat.x) / 2; } else { t.repeat.y = ar / target; t.offset.y = (1 - t.repeat.y) / 2; }
      });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(6, 3.75), new THREE.MeshBasicMaterial({ map: tex }));
      m.userData = { kind: "panel", url: row.href, name: $("h3", row).textContent, group: g };
      const fm = new THREE.LineBasicMaterial(); lineMats.push(fm);
      const fr = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(6.3, 4.05)), fm);
      const tg = label(`0${i + 1} · ${m.userData.name}`, "green", 5, 1.25); tg.position.set(0, -2.6, 0);
      g.add(m, fr, tg); S.add(g); panels.push(m); reg(g, g.position.z, 34, [6, 6]);
    });

    // contacto: anillos
    for (let i = 0; i < 4; i++) {
      const r = new THREE.Mesh(new THREE.TorusGeometry(1.6 + i * .9, .02, 8, 120), new THREE.MeshBasicMaterial({ transparent: true, opacity: .6 }));
      r.position.set(3.5, 0, -162); S.add(r); rings.push(r); reg(r, -162, 38);
    }
    applyTheme(); resize();
  }

  /* ---------- Tema claro/oscuro ---------- */
  function applyTheme() {
    if (!ready && !R) return;
    const cs = getComputedStyle(html), v = k => cs.getPropertyValue(k).trim();
    const light = html.dataset.theme === "light", bg = v("--bg");
    col = { g: v("--green"), t: v("--text"), b: v("--blue") };
    S.background.set(bg); S.fog.color.set(bg);
    cG.set(col.g); cO.set(v("--orange"));
    stars.material.color.set(light ? col.g : "#9fd8ff");
    ico.material.color.set(col.g); knot.material.color.set(col.b);
    rings.forEach((r, i) => r.material.color.set(i % 2 ? col.b : col.g));
    lineMats.forEach(m => m.color.set(col.g));
    labels.forEach(drawLabel);
  }
  new MutationObserver(applyTheme).observe(html, { attributes: true, attributeFilter: ["data-theme"] });
  if (document.fonts) document.fonts.ready.then(() => labels.forEach(drawLabel));

  /* ---------- Tamaño y composición (horizontal / vertical) ---------- */
  function resize() {
    if (!R) return;
    R.setPixelRatio(Math.min(devicePixelRatio || 1, innerWidth < 768 ? 1.5 : 2));
    R.setSize(innerWidth, innerHeight); C.aspect = innerWidth / innerHeight; C.updateProjectionMatrix();
    const port = C.aspect < 1;
    ico.position.set(port ? 0 : 5, port ? 3.6 : .5, -6); ico.scale.setScalar(port ? .6 : 1);
    knot.position.set(port ? 0 : 4.5, port ? 3.6 : 0, -38); knot.scale.setScalar(port ? .6 : 1);
    cluster.scale.setScalar(port ? .55 : 1);
    panels.forEach(m => { const g = m.userData.group; g.userData.base = port ? .62 : 1; g.position.x = g.userData.side * (port ? .9 : 4.6); });
  }
  addEventListener("resize", () => { resize(); });

  /* ---------- Interacción ---------- */
  const ray = new THREE.Raycaster();
  const tag = $("#worldTag"), bar = $("#worldBar"), tip = $("#worldTip"), sT = $("#stackTitle"), sD = $("#stackText");
  const setMV = e => { mv.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight * 2 - 1)); tagX = e.clientX; tagY = e.clientY; };
  addEventListener("pointermove", e => {
    if (!active || e.pointerType !== "mouse") return;
    lastTouch = false; setMV(e); tmx = mv.x; tmy = -mv.y;
    tag.style.left = tagX + "px"; tag.style.top = tagY + "px";
  }, { passive: true });
  addEventListener("scroll", () => { if (active) { tp = scrollY / maxScroll(); tip.classList.add("hide"); } }, { passive: true });

  // solo se pueden tocar los objetos visibles de la estación actual
  const pick = () => {
    ray.setFromCamera(mv, C);
    const list = [...(p > .28 && p < .5 ? spheres : []), ...panels.filter(m => (m.userData.group.userData.k || 0) > .5)];
    const h = ray.intersectObjects(list)[0]; return h ? h.object : null;
  };
  document.addEventListener("pointerdown", e => { if (active) lastTouch = e.pointerType !== "mouse"; });
  $("#gl").addEventListener("click", e => {
    if (!active) return;
    setMV(e); tag.style.left = tagX + "px"; tag.style.top = tagY + "px";
    const h = pick();
    if (lastTouch) {
      // táctil: el primer toque selecciona, el segundo abre el proyecto
      if (h && h === selected && h.userData.kind === "panel") window.open(h.userData.url, "_blank", "noopener");
      else selected = h;
    } else if (h && h.userData.kind === "panel") window.open(h.userData.url, "_blank", "noopener");
  });

  const goto = pr => scrollTo({ top: pr * maxScroll(), behavior: "smooth" });
  $$("#nav a").forEach((a, i) => a.addEventListener("click", e => { if (!active) return; e.preventDefault(); goto(NAV_MAP[i]); }));
  $(".pill-brand").addEventListener("click", e => { if (!active) return; e.preventDefault(); goto(0); });
  const cvBtn = $("[data-cv]"); if (cvBtn) cvBtn.addEventListener("click", () => $("#cvPreviewBtn").click());

  /* ---------- Bucle de animación ---------- */
  function loop(t) {
    if (!active) { running = false; return; }
    requestAnimationFrame(loop);
    p += (tp - p) * .06; mx += (tmx - mx) * .05; my += (tmy - my) * .05;
    C.position.set(Math.sin(p * 9) * 1.5 + mx * 1.2, Math.cos(p * 7) * .6 - my * .8, 8 - p * L);
    C.lookAt(C.position.x * .3 + mx * 2, C.position.y * .3 - my, C.position.z - 10);
    C.rotation.z = Math.sin(p * 6) * .03;
    ico.rotation.set(t * .0002, t * .00035, 0); knot.rotation.set(t * .0002, t * .0003, 0);
    stars.rotation.z = t * .00001; cluster.rotation.y = t * .0002;
    rings.forEach((r, i) => r.rotation.set(t * .00015 * (i + 1), t * .0001 * (i % 2 ? -1 : 1) * (i + 1), 0));

    updateFades();
    const hit = lastTouch ? selected : pick();
    spheres.forEach(s => { const on = s === hit; s.scale.setScalar(on ? 1.7 : 1); s.material.color.copy(on ? cO : cG); });
    panels.forEach(m => { const g = m.userData.group, goal = g.userData.base * (m === hit ? 1.1 : 1); g.scale.setScalar(g.scale.x + (goal - g.scale.x) * .12); });
    const ring = $(".cursor-ring"); if (ring) ring.classList.toggle("big", !!hit);
    tag.style.opacity = hit ? 1 : 0;
    if (hit) tag.textContent = hit.userData.kind === "panel" ? hit.userData.name + " ↗" : hit.userData.name;
    if (hit && hit.userData.kind === "node") { sT.textContent = hit.userData.name; sD.textContent = hit.userData.text; }
    else if (sT.textContent !== S.userData.def.t) { sT.textContent = S.userData.def.t; sD.textContent = S.userData.def.d; }

    STATIONS.forEach(([a, b, id]) => { $("#" + id).style.opacity = Math.min(1, Math.max(0, Math.min(p - a, b - p) / .04)); });
    bar.style.height = p * 100 + "%";
    const idx = NAV_IDX(p); $$("#nav a").forEach((a, i) => a.classList.toggle("active", i === idx));
    R.render(S, C);
  }

  /* ---------- Modo 3D / página ---------- */
  const label3d = { on: EN ? "Page view" : "Ver como página", off: EN ? "3D mode" : "Modo 3D" };
  function setMode(m) {
    if (m === "3d") {
      html.classList.add("immersive");
      try { if (!ready) { build(); ready = true; } }
      catch (e) { console.warn("WebGL no disponible, se usa la página clásica.", e); html.classList.remove("immersive"); modeBtn.hidden = true; return; }
      active = true; scrollTo({ top: 0, behavior: "instant" }); tp = p = 0; resize(); applyTheme();
      if (!running) { running = true; requestAnimationFrame(loop); }
    } else {
      active = false; html.classList.remove("immersive"); scrollTo({ top: 0, behavior: "instant" });
      $$("#nav a").forEach(a => a.classList.remove("active"));
    }
    modeBtn.textContent = m === "3d" ? label3d.on : label3d.off;
    try { localStorage.setItem("mode", m); } catch (e) {}
  }
  modeBtn.hidden = false;
  modeBtn.addEventListener("click", () => setMode(active ? "page" : "3d"));

  let saved = null; try { saved = localStorage.getItem("mode"); } catch (e) {}
  setMode(saved === "page" ? "page" : "3d");
})();
