/* Caja de herramientas 3D (Habilidades). Modelo: Poly Haven (CC0).
   Las 8 herramientas se modelan aquí con Three.js.
   Sin WebGL queda la caja CSS. */
(() => {
  const box = document.querySelector(".tb-box");

  if (!box || !window.THREE || !THREE.GLTFLoader) return;

  if (
    location.protocol === "file:" ||
    matchMedia("(prefers-reduced-motion: reduce)").matches
  )
    return;

  const cv = document.createElement("canvas");
  cv.className = "tb-gl";
  cv.setAttribute("aria-hidden", "true");
  let R;

  try {
    R = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
  } catch (e) {
    return;
  }

  R.setClearColor(0x000000, 0);
  R.outputEncoding = THREE.sRGBEncoding;
  R.toneMapping = THREE.ACESFilmicToneMapping;
  R.toneMappingExposure = 1.05;
  R.localClippingEnabled = true;

  const S = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 20);
  const target = new THREE.Vector3(-0.03, 0.32, 0.02);
  cam.position.copy(target).add(new THREE.Vector3(0, 1.0, 1.65));
  cam.lookAt(target);

  const sun = new THREE.DirectionalLight(0xfff0dc, 2.2);
  sun.position.set(-0.8, 1.6, 1.2);
  S.add(sun);
  const rim = new THREE.DirectionalLight(0x9fc4ff, 1.1);
  rim.position.set(1.2, 1.0, -1.0);
  S.add(rim);
  S.add(new THREE.HemisphereLight(0xbcd0ee, 0x1a2230, 0.9));

  const MOUTH = new THREE.Vector3(-0.027, 0.349, 0.02); // centro de la boca de la caja
  const CLOSED = Math.PI / 2,
    OPEN = -0.2; // el modelo viene con la tapa abierta a 90°
  let pivot = null,
    cur = CLOSED,
    vel = 0,
    tgt = CLOSED,
    raf = 0,
    UP = 0;

  /* ---------- Herramientas ---------- */
  const std = (color, metalness = 0.6, roughness = 0.4) =>
    new THREE.MeshStandardMaterial({ color, metalness, roughness });
  const MAT = {
    steel: std(0xc3ccd6, 1, 0.25),
    dark: std(0x20252c, 0.3, 0.55),
    rubber: std(0x15181c, 0, 0.8),
    cream: std(0xf3ead2, 0, 0.6),
    html: std(0xe44d26, 0.45, 0.4),
    wood: std(0xc98a4b, 0, 0.55),
    css: std(0x2965f1, 0.2, 0.35),
    js: std(0xf5c800, 0, 0.5),
    node: std(0x5fa04e, 0, 0.6),
    tape: std(0xf4c430, 0.3, 0.5),
    case: std(0x3a4049, 0.5, 0.4),
    sql: std(0x0b7893, 0.55, 0.4),
    sqlLight: std(0x1fa0bf, 0.4, 0.4),
    git: std(0xf05133, 0.1, 0.5),
    meter: std(0xf2b01e, 0.1, 0.5),
    accent: std(0xf6bd60, 0.4, 0.4),
    screen: new THREE.MeshBasicMaterial({ color: 0x9bffd8 }),
    bar: new THREE.MeshBasicMaterial({ color: 0x063d33 }),
  };

  const mesh = (geo, mat, x = 0, y = 0, z = 0) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    return m;
  };

  const bx = (w, h, d, mat, x, y, z) =>
    mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z);
  const cyl = (rt, rb, h, mat, x, y, z, axis) => {
    const g = new THREE.CylinderGeometry(rt, rb, h, 28);

    if (axis === "x") g.rotateZ(Math.PI / 2);
    else if (axis === "z") g.rotateX(Math.PI / 2);
    return mesh(g, mat, x, y, z);
  };

  const ring = (r, tube, mat, x, y, z) =>
    mesh(new THREE.TorusGeometry(r, tube, 8, 36), mat, x, y, z);
  const poly = (pts) => {
    const s = new THREE.Shape();
    pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
    s.closePath();
    return s;
  };

  const rrPath = (w, h, r, cx = 0, cy = 0, p = new THREE.Path()) => {
    const x0 = cx - w / 2,
      x1 = cx + w / 2,
      y0 = cy - h / 2,
      y1 = cy + h / 2;
    p.moveTo(x0 + r, y0);
    p.lineTo(x1 - r, y0);
    p.quadraticCurveTo(x1, y0, x1, y0 + r);
    p.lineTo(x1, y1 - r);
    p.quadraticCurveTo(x1, y1, x1 - r, y1);
    p.lineTo(x0 + r, y1);
    p.quadraticCurveTo(x0, y1, x0, y1 - r);
    p.lineTo(x0, y0 + r);
    p.quadraticCurveTo(x0, y0, x0 + r, y0);
    return p;
  };

  const rr = (w, h, r, cx, cy) => {
    const s = new THREE.Shape();
    rrPath(w, h, r, cx, cy, s);
    return s;
  };

  const ext = (shape, d, mat, bev = 0.003) => {
    const g = new THREE.ExtrudeGeometry(shape, {
      depth: d,
      bevelEnabled: bev > 0,
      bevelThickness: bev,
      bevelSize: bev,
      bevelSegments: 2,
      curveSegments: 8,
    });

    g.translate(0, 0, -d / 2);
    return new THREE.Mesh(g, mat);
  };

  // HTML · escuadra de carpintero (estructura)
  function tSquare() {
    const g = new THREE.Group();
    g.add(
      ext(
        poly([
          [-0.12, -0.18],
          [0.12, -0.18],
          [0.12, -0.14],
          [-0.08, -0.14],
          [-0.08, 0.18],
          [-0.12, 0.18],
        ]),
        0.012,
        MAT.html,
      ),
    );

    for (let i = 0; i < 20; i++) {
      const l = i % 5 === 0 ? 0.026 : i % 2 ? 0.012 : 0.018;
      g.add(
        bx(
          l,
          0.0025,
          0.002,
          MAT.cream,
          -0.12 + l / 2 + 0.004,
          -0.12 + i * 0.0145,
          0.0105,
        ),
      );
    }

    for (let i = 0; i < 13; i++) {
      const l = i % 5 === 0 ? 0.026 : i % 2 ? 0.012 : 0.018;
      g.add(
        bx(
          0.0025,
          l,
          0.002,
          MAT.cream,
          -0.06 + i * 0.0145,
          -0.18 + l / 2 + 0.004,
          0.0105,
        ),
      );
    }

    return { g, len: 0.36 };
  }

  // CSS · brocha (estilo)
  function tBrush() {
    const g = new THREE.Group();
    const prof = [
      [0, -0.2],
      [0.016, -0.198],
      [0.02, -0.18],
      [0.028, -0.12],
      [0.03, -0.07],
      [0.022, -0.03],
      [0.02, -0.02],
    ].map(([r, y]) => new THREE.Vector2(r, y));
    g.add(mesh(new THREE.LatheGeometry(prof, 32), MAT.wood));
    const fer = cyl(0.036, 0.022, 0.075, MAT.steel, 0, 0.018, 0);
    fer.scale.z = 0.42;
    g.add(fer);
    g.add(bx(0.072, 0.115, 0.022, MAT.cream, 0, 0.113, 0));
    g.add(bx(0.074, 0.055, 0.024, MAT.css, 0, 0.15, 0));
    g.add(bx(0.06, 0.02, 0.02, MAT.css, 0, 0.19, 0));
    return { g, len: 0.4 };
  }

  // JavaScript · taladro
  function tDrill() {
    const g = new THREE.Group(),
      inner = new THREE.Group();
    g.add(inner);
    inner.add(cyl(0.047, 0.047, 0.18, MAT.js, -0.03, 0, 0, "x"));
    inner.add(cyl(0.036, 0.047, 0.03, MAT.js, 0.075, 0, 0, "x"));
    inner.add(cyl(0.034, 0.034, 0.05, MAT.dark, 0.115, 0, 0, "x"));
    const grip = bx(0.052, 0.15, 0.065, MAT.js, -0.065, -0.1, 0);
    grip.rotation.z = 0.12;
    inner.add(grip);
    inner.add(bx(0.054, 0.12, 0.067, MAT.rubber, -0.07, -0.1, 0).rotateZ(0.12));
    inner.add(bx(0.1, 0.04, 0.08, MAT.dark, -0.075, -0.185, 0));
    inner.add(bx(0.016, 0.03, 0.022, MAT.accent, -0.03, -0.065, 0.0)); // gatillo
    const chuck = new THREE.Group();
    chuck.position.x = 0.17;
    chuck.add(cyl(0.027, 0.027, 0.06, MAT.steel, 0, 0, 0, "x"));

    for (const x of [-0.015, 0, 0.015])
      chuck.add(
        mesh(
          new THREE.TorusGeometry(0.027, 0.0025, 6, 24).rotateY(Math.PI / 2),
          MAT.dark,
          x,
          0,
          0,
        ),
      );
    chuck.add(cyl(0.0065, 0.0065, 0.11, MAT.steel, 0.085, 0, 0, "x"));

    for (let k = 0; k < 6; k++)
      chuck.add(
        cyl(0.0075, 0.0075, 0.006, MAT.dark, 0.04 + k * 0.017, 0, 0, "x"),
      );
    inner.add(chuck);
    inner.rotation.z = Math.PI / 2;
    return {
      g,
      len: 0.36,
      tick: (t) => {
        chuck.rotation.x = t * 14;
      },
    };
  }

  // Node.js · llave inglesa (backend)
  function tWrench() {
    const g = new THREE.Group();
    const s = poly([
      [-0.022, -0.22],
      [0.022, -0.22],
      [0.022, 0.07],
      [0.06, 0.09],
      [0.06, 0.22],
      [0.025, 0.22],
      [0.025, 0.13],
      [-0.025, 0.13],
      [-0.025, 0.22],
      [-0.06, 0.22],
      [-0.06, 0.09],
      [-0.022, 0.07],
    ]);

    const h = new THREE.Path();
    h.absarc(0, -0.195, 0.008, 0, Math.PI * 2, true);
    s.holes.push(h);
    g.add(ext(s, 0.02, MAT.steel, 0.004));
    g.add(
      ext(
        poly([
          [-0.0245, -0.168],
          [0.0245, -0.168],
          [0.0245, -0.02],
          [-0.0245, -0.02],
        ]),
        0.026,
        MAT.node,
        0.004,
      ),
    );

    for (let i = 0; i < 5; i++)
      g.add(bx(0.052, 0.004, 0.028, MAT.rubber, 0, -0.145 + i * 0.026, 0));
    return { g, len: 0.4 };
  }

  // Express · cinta métrica
  function tTape() {
    const g = new THREE.Group();
    g.add(cyl(0.085, 0.085, 0.05, MAT.case, 0, 0, 0, "z"));
    g.add(ring(0.085, 0.007, MAT.dark, 0, 0, 0.025));
    g.add(ring(0.085, 0.007, MAT.dark, 0, 0, -0.025));
    g.add(cyl(0.036, 0.036, 0.056, MAT.steel, 0, 0, 0, "z"));
    g.add(cyl(0.012, 0.012, 0.06, MAT.dark, 0, 0, 0, "z"));
    g.add(bx(0.024, 0.014, 0.022, MAT.accent, 0.05, 0.086, 0));
    g.add(bx(0.034, 0.3, 0.003, MAT.tape, 0, 0.23, 0));

    for (let i = 0; i < 25; i++) {
      const l = i % 5 === 0 ? 0.016 : 0.009;
      g.add(
        bx(
          l,
          0.0015,
          0.0012,
          MAT.rubber,
          -0.017 + l / 2 + 0.001,
          0.09 + i * 0.0115,
          0.0023,
        ),
      );
    }

    g.add(bx(0.04, 0.012, 0.004, MAT.steel, 0, 0.386, 0));
    g.add(bx(0.04, 0.004, 0.014, MAT.steel, 0, 0.392, 0.005));
    return { g, len: 0.42 };
  }

  // MySQL · cajonera de datos
  function tCabinet() {
    const g = new THREE.Group();
    g.add(ext(rr(0.17, 0.24, 0.012), 0.13, MAT.sql, 0.004));

    for (const [y, out] of [
      [0.075, 0],
      [0, 0.045],
      [-0.075, 0],
    ]) {
      g.add(bx(0.15, 0.064, 0.012, MAT.sqlLight, 0, y, 0.069 + out));
      g.add(bx(0.06, 0.008, 0.012, MAT.steel, 0, y + 0.006, 0.08 + out));
      g.add(bx(0.036, 0.014, 0.003, MAT.cream, 0, y - 0.014, 0.0765 + out));

      if (out) g.add(bx(0.14, 0.05, 0.045, MAT.dark, 0, y, 0.066 + out / 2));
    }

    for (const x of [-0.065, 0.065])
      g.add(cyl(0.012, 0.015, 0.014, MAT.dark, x, -0.127, -0.045, null));
    return { g, len: 0.29 };
  }

  // Git · serrucho (ramas)
  function tSaw() {
    const g = new THREE.Group();
    const pts = [
        [-0.045, -0.1],
        [0.045, -0.1],
      ],
      N = 22,
      y0 = -0.1,
      y1 = 0.26,
      st = (y1 - y0) / N;
    const xr = (y) => 0.045 - ((y - y0) / (y1 - y0)) * 0.035;

    for (let i = 0; i < N; i++) {
      const y = y0 + i * st;
      pts.push([xr(y + st * 0.5) + 0.011, y + st * 0.5], [xr(y + st), y + st]);
    }

    pts.push([-0.01, y1], [-0.045, -0.1 + 0.0001]);
    g.add(ext(poly(pts.slice(0, -1)), 0.006, MAT.steel, 0.0015));
    const hs = rr(0.1, 0.16, 0.03, 0, -0.18);
    hs.holes.push(rrPath(0.044, 0.07, 0.018, 0.0, -0.175));
    g.add(ext(hs, 0.022, MAT.git, 0.004));

    for (const y of [-0.12, -0.235])
      g.add(cyl(0.006, 0.006, 0.03, MAT.steel, 0, y, 0, "z"));
    return { g, len: 0.42 };
  }

  // IA · multímetro
  function tMeter() {
    const g = new THREE.Group();
    g.add(ext(rr(0.15, 0.26, 0.022), 0.05, MAT.meter, 0.004));
    g.add(bx(0.126, 0.236, 0.006, MAT.dark, 0, 0, 0.029));
    g.add(bx(0.104, 0.058, 0.004, MAT.screen, 0, 0.075, 0.034));
    const bars = [];

    for (let i = 0; i < 7; i++) {
      const b = bx(
        0.009,
        0.034,
        0.002,
        MAT.bar,
        -0.036 + i * 0.012,
        0.075,
        0.037,
      );

      bars.push(b);
      g.add(b);
    }

    g.add(cyl(0.036, 0.036, 0.012, MAT.steel, 0, -0.02, 0.033, "z"));
    const needle = bx(0.005, 0.028, 0.004, MAT.accent, 0, -0.02, 0.041);
    needle.geometry.translate(0, 0.012, 0);
    g.add(needle);

    for (let k = 0; k < 9; k++) {
      const a = -2.2 + k * 0.55,
        t = bx(
          0.003,
          0.008,
          0.002,
          MAT.cream,
          Math.sin(a) * 0.05,
          -0.02 + Math.cos(a) * 0.05,
          0.033,
        );
      t.rotation.z = -a;
      g.add(t);
    }

    [0.0, 0.04, -0.04].forEach((x, i) =>
      g.add(
        cyl(
          0.011,
          0.011,
          0.008,
          i === 0 ? MAT.accent : MAT.steel,
          x,
          0.02 - 0,
          0.036,
          "z",
        ),
      ),
    );

    [-0.04, 0, 0.04].forEach((x, i) => {
      g.add(cyl(0.009, 0.009, 0.01, MAT.rubber, x, -0.097, 0.033, "z"));
      g.add(
        ring(
          0.0125,
          0.002,
          i === 0 ? MAT.git : i === 1 ? MAT.cream : MAT.accent,
          x,
          -0.097,
          0.035,
        ),
      );
    });

    return {
      g,
      len: 0.34,
      tick: (t) =>
        bars.forEach((b, i) => {
          const s = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 2.4 + i * 1.1));
          b.scale.y = s;
          b.position.y = 0.058 + (0.034 * s) / 2;
          needle.rotation.z = Math.sin(t * 1.3) * 0.9;
        }),
    };
  }

  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -(MOUTH.y - 0.004)); // lo que queda dentro de la caja no se dibuja
  const clipped = new Set();
  const tools = [
    tSquare,
    tBrush,
    tDrill,
    tWrench,
    tTape,
    tCabinet,
    tSaw,
    tMeter,
  ].map((make) => {
    const t = make();
    t.len *= 1.7;
    const holder = new THREE.Group(),
      fit = new THREE.Group();
    fit.add(t.g);
    holder.add(fit);
    const b = new THREE.Box3().setFromObject(t.g),
      c = b.getCenter(new THREE.Vector3()),
      sz = b.getSize(new THREE.Vector3());
    t.g.position.sub(c);
    fit.scale.setScalar(t.len / Math.max(sz.x, sz.y, sz.z));
    holder.visible = false;
    holder.traverse((n) => {
      if (n.material && !clipped.has(n.material)) {
        clipped.add(n.material);
        n.material.clippingPlanes = [plane];
        n.material.envMapIntensity = 0.55;
      }
    });

    S.add(holder);
    return { holder, tick: t.tick, p: 0, tp: 0 };
  });

  /* ---------- Escena ---------- */
  function size() {
    const w = box.clientWidth,
      h = box.clientHeight;

    if (!w || !h) return;
    UP = Math.round(h * 0.8); // altura extra por encima de la caja para las herramientas
    const H = h + UP;
    R.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    R.setSize(w, H, false);
    cv.style.height = H + "px";
    cam.aspect = w / h;
    cam.setViewOffset(w, h, 0, -UP, w, H);
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld(true); // sin esto la proyección usa una vista sin actualizar
    const v = MOUTH.clone().project(cam),
      y = ((1 - v.y) / 2) * H - UP;

    if (tb) tb.style.setProperty("--up", UP + "px");
    box.style.setProperty(
      "--mouth",
      (isFinite(y) ? Math.min(Math.max(y, h * 0.25), h * 0.9) : h * 0.5) + "px",
    );

    R.render(S, cam);
  }

  let last = 0,
    ang = 0,
    time = 0,
    dragging = false;

  function frame(now) {
    raf = 0;
    const dt = Math.min(((now || 0) - (last || now || 0)) / 1000, 0.05);
    last = now || 0;
    time += dt;
    vel += (tgt - cur) * 0.06;
    vel *= 0.8;
    cur += vel; // resorte: la tapa rebota un poco al abrir
    const done = Math.abs(vel) < 0.0008 && Math.abs(tgt - cur) < 0.003;

    if (done) {
      cur = tgt;
      vel = 0;
    }

    pivot.rotation.x = cur;

    if (!dragging) ang += dt * 0.8;
    let live = false;

    for (const T of tools) {
      T.p += (T.tp - T.p) * (1 - Math.exp(-dt * 6.5));

      if (Math.abs(T.tp - T.p) < 0.003) T.p = T.tp;
      T.holder.visible = T.p > 0.003;

      if (!T.holder.visible) continue;
      live = true;
      const p = T.p,
        h = T.holder;
      h.position.set(
        MOUTH.x,
        MOUTH.y -
          0.32 +
          p * 0.82 +
          Math.sin(p * Math.PI) * 0.05 +
          Math.sin(time * 1.7) * 0.01 * p,
        MOUTH.z + 0.03 + p * 0.04,
      );

      h.scale.setScalar(0.55 + 0.45 * p);
      h.rotation.set(
        0,
        ang + (1 - p) * 3.2,
        (1 - p) * 0.6 + Math.sin(time * 1.1) * 0.05 * p,
      );

      if (T.tick) T.tick(time);
    }

    R.render(S, cam);

    if (!done || live) raf = requestAnimationFrame(frame);
    else last = 0;
  }

  const kick = () => {
    if (pivot && !raf) raf = requestAnimationFrame(frame);
  };

  new MutationObserver(() => {
    tgt = box.classList.contains("open") ? OPEN : CLOSED;
    kick();
  }).observe(box, { attributes: true, attributeFilter: ["class"] });
  const tb = box.closest(".tb");
  const sync = () => {
    tb.querySelectorAll(".tool-card").forEach((c, i) => {
      if (tools[i]) tools[i].tp = c.classList.contains("up") ? 1 : 0;
    });

    kick();
  };

  const cardObs = new MutationObserver(sync);
  document
    .querySelectorAll(".tb .tool-card")
    .forEach((c) =>
      cardObs.observe(c, { attributes: true, attributeFilter: ["class"] }),
    );
  addEventListener("resize", () => {
    if (pivot) size();
  });

  /* arrastrar gira la herramienta */
  let px = 0,
    moved = 0;
  cv.addEventListener("pointerdown", (e) => {
    dragging = true;
    moved = 0;
    px = e.clientX;
    cv.setPointerCapture(e.pointerId);
  });

  cv.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - px;
    px = e.clientX;
    moved += Math.abs(dx);
    ang += dx * 0.015;
    kick();
  });

  const stop = () => {
    dragging = false;
  };

  cv.addEventListener("pointerup", stop);
  cv.addEventListener("pointercancel", stop);
  cv.addEventListener("click", (e) => {
    if (moved > 6) {
      e.stopPropagation();
      moved = 0;
    }
  });

  if (THREE.RGBELoader && THREE.PMREMGenerator) {
    new THREE.RGBELoader().load(
      "assets/weld/foundry_1k.hdr",
      (tex) => {
        const pm = new THREE.PMREMGenerator(R);
        pm.compileEquirectangularShader();
        S.environment = pm.fromEquirectangular(tex).texture;
        tex.dispose();
        pm.dispose();

        if (pivot) R.render(S, cam);
      },
      undefined,
      () => {},
    );
  }

  new THREE.GLTFLoader().load(
    "assets/toolbox/metal_tool_chest_1k.gltf",
    (gl) => {
      const m = gl.scene,
        lid = m.getObjectByName("metal_tool_chest_lid"),
        liner = m.getObjectByName("metal_tool_chest_hinge_lid");

      if (!lid) return;
      pivot = new THREE.Group();
      pivot.position.copy(lid.position);
      m.add(pivot); // bisagra en el borde trasero
      pivot.attach(lid);

      if (liner) pivot.attach(liner);
      pivot.rotation.x = cur;
      m.traverse((n) => {
        if (n.material) n.material.envMapIntensity = 1.1;
      });

      S.add(m);
      box.insertBefore(cv, box.firstChild);
      box.classList.add("tb-3d");

      if (tb) tb.classList.add("tb-3d-on");
      size();
      let n = 0;
      const t = setInterval(() => {
        R.render(S, cam);

        if (++n > 25) clearInterval(t);
      }, 120); // las texturas llegan después
      tgt = box.classList.contains("open") ? OPEN : CLOSED;
      sync();
      kick();
    },
    undefined,
    () => {},
  );
})();
