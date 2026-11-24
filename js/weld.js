/* =====================================================
   HERO DE SOLDADURA (usa Three.js, lo monta js/stage.js)
   Un arco recorre una placa de acero y va soldando mi nombre, cordón a
   cordón, entre chispas. Al terminar, el arco sigue el cursor.
   Assets (Poly Haven, CC0): assets/weld/*  — ver assets/weld/LICENSE.txt
   ===================================================== */
(function () {
  window.WeldHero = { create };

  function create(o) {
    const { S, R, C } = o;
    const W = 16,
      H = 8.8; // placa en unidades del mundo
    const CW = 1024,
      CH = Math.round((CW * H) / W); // lienzo del cordón
    const LINES = ["LESTER", "GARCÍA"];
    const g = new THREE.Group();
    g.position.set(0, 0.5, -7);
    S.add(g);
    const cart = new THREE.Group();
    cart.position.set(7.4, -4.4, -3.2);
    S.add(cart);

    /* ---------- Entorno de taller (HDRI) para los reflejos ---------- */
    if (THREE.RGBELoader && THREE.PMREMGenerator) {
      new THREE.RGBELoader().load(
        "assets/weld/foundry_1k.hdr",
        (tex) => {
          const pm = new THREE.PMREMGenerator(R);
          pm.compileEquirectangularShader();
          S.environment = pm.fromEquirectangular(tex).texture;
          tex.dispose();
          pm.dispose();
        },
        undefined,
        () => {},
      );
    }

    /* ---------- Placa de acero (texturas PBR) ---------- */
    const tl = new THREE.TextureLoader();
    const tx = (f) => {
      const t = tl.load("assets/weld/metal_plate_" + f + "_1k.jpg");
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(2, 1.1);
      t.anisotropy = 4;
      return t;
    };

    const plateMat = new THREE.MeshStandardMaterial({
      map: tx("diff"),
      normalMap: tx("nor_gl"),
      roughnessMap: tx("rough"),
      metalnessMap: tx("metal"),
      color: 0xb8c0cc,
      roughness: 1,
      metalness: 1,
      envMapIntensity: 0.9,
    });

    const PW = 140,
      PH = 22; // la placa es un muro de acero largo: la cámara lo recorre de lado
    [
      plateMat.map,
      plateMat.normalMap,
      plateMat.roughnessMap,
      plateMat.metalnessMap,
    ].forEach((t) => t.repeat.set(17.5, 2.8));
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), plateMat);
    plate.position.set(50, 0, -0.2);
    g.add(plate);

    /* ---------- Cordón de soldadura: nombre dibujado en lienzos ---------- */
    const mk = () => {
      const c = document.createElement("canvas");
      c.width = CW;
      c.height = CH;
      return c;
    };

    const mask = mk(),
      full = mk(),
      cvB = mk(),
      cvH = mk();
    const bx = cvB.getContext("2d"),
      hx = cvH.getContext("2d");
    const beadTex = new THREE.CanvasTexture(cvB),
      heatTex = new THREE.CanvasTexture(cvH);
    const bead = new THREE.Mesh(
      new THREE.PlaneGeometry(W, H),
      new THREE.MeshStandardMaterial({
        map: beadTex,
        bumpMap: beadTex,
        bumpScale: 3,
        emissive: 0xffffff,
        emissiveMap: heatTex,
        emissiveIntensity: 1.7,
        roughness: 0.38,
        metalness: 0.95,
        transparent: true,
        envMapIntensity: 1.2,
      }),
    );

    bead.position.z = 0.03;
    g.add(bead);

    const band = [
      [0, CH * 0.5],
      [CH * 0.5, CH],
    ]; // franja vertical de cada línea
    const lineY = [CH * 0.28, CH * 0.74];
    let textL = 0,
      textR = CW,
      textBot = CH * 0.87,
      textSize = CH * 0.36,
      ready = false;

    function paintText() {
      const fs = CH * 0.36;
      const f = (n) => `700 ${n}px Times, "Times New Roman", serif`;
      const m = mask.getContext("2d");
      m.clearRect(0, 0, CW, CH);
      m.font = f(fs);
      m.textAlign = "center";
      m.textBaseline = "middle";

      if ("letterSpacing" in m) m.letterSpacing = fs * 0.06 + "px";
      const w = Math.max(...LINES.map((t) => m.measureText(t).width)),
        k = Math.min(1, (CW * 0.86) / w),
        size = fs * k;
      m.font = f(size);

      if ("letterSpacing" in m) m.letterSpacing = size * 0.06 + "px";
      m.fillStyle = "#fff";
      LINES.forEach((t, i) => m.fillText(t, CW / 2, lineY[i]));
      textBot = lineY[1] + size * 0.37;
      textSize = size;
      textL = CW / 2 - (w * k) / 2;
      textR = CW / 2 + (w * k) / 2;

      // cordón: acero + escamas
      const t = document.createElement("canvas");
      t.width = CW;
      t.height = CH;
      const x = t.getContext("2d");
      const gr = x.createLinearGradient(0, 0, 0, CH);
      gr.addColorStop(0, "#d3dbe6");
      gr.addColorStop(0.5, "#7d8a9b");
      gr.addColorStop(1, "#b9c3cf");
      x.fillStyle = gr;
      x.fillRect(0, 0, CW, CH);
      x.lineWidth = 2.2;

      for (let yy = 0; yy < CH; yy += 22)
        for (let xx = -10; xx < CW + 10; xx += 11) {
          const off = ((yy / 22) % 2) * 5.5;
          x.strokeStyle = "rgba(255,255,255,.34)";
          x.beginPath();
          x.arc(xx + off, yy, 10, 0.15 * Math.PI, 0.85 * Math.PI);
          x.stroke();
          x.strokeStyle = "rgba(20,28,40,.38)";
          x.beginPath();
          x.arc(xx + off, yy + 3, 10, 0.15 * Math.PI, 0.85 * Math.PI);
          x.stroke();
        }
      x.globalCompositeOperation = "destination-in";
      x.drawImage(mask, 0, 0);
      x.globalCompositeOperation = "source-over";
      x.lineWidth = 3;
      x.strokeStyle = "rgba(16,20,28,.85)";
      x.font = m.font;
      x.textAlign = "center";
      x.textBaseline = "middle";

      if ("letterSpacing" in x) x.letterSpacing = m.letterSpacing;
      LINES.forEach((s, i) => x.strokeText(s, CW / 2, lineY[i]));
      const fx = full.getContext("2d");
      fx.clearRect(0, 0, CW, CH);
      fx.drawImage(t, 0, 0);
      ready = true;
      dispatchEvent(new Event("resize")); // recoloca la etiqueta HTML bajo el nombre
    }

    (document.fonts && document.fonts.load
      ? document.fonts.load("700 80px Times")
      : Promise.resolve()
    ).then(paintText, paintText);

    function drawBead(line, frac) {
      // revela el cordón hasta el frente del arco
      bx.clearRect(0, 0, CW, CH);
      bx.save();
      bx.beginPath();

      for (let i = 0; i < LINES.length; i++) {
        if (i < line) bx.rect(0, band[i][0], CW, band[i][1] - band[i][0]);
        else if (i === line)
          bx.rect(
            0,
            band[i][0],
            textL + (textR - textL) * frac + 4,
            band[i][1] - band[i][0],
          );
      }

      bx.clip();
      bx.drawImage(full, 0, 0);
      bx.restore();
      beadTex.needsUpdate = true;
    }

    function heat(px, py, on) {
      // calor: brilla y se enfría poco a poco
      hx.globalCompositeOperation = "destination-out";
      hx.fillStyle = "rgba(0,0,0,.035)";
      hx.fillRect(0, 0, CW, CH);
      hx.globalCompositeOperation = "source-over";

      if (on) {
        const r = 85,
          gr = hx.createRadialGradient(px, py, 0, px, py, r);
        gr.addColorStop(0, "rgba(255,252,235,1)");
        gr.addColorStop(0.3, "rgba(255,170,60,.95)");
        gr.addColorStop(1, "rgba(255,70,0,0)");
        hx.fillStyle = gr;
        hx.fillRect(px - r, py - r, r * 2, r * 2);
      }

      hx.globalCompositeOperation = "destination-in";
      hx.drawImage(mask, 0, 0);
      hx.globalCompositeOperation = "source-over";
      heatTex.needsUpdate = true;
    }

    /* ---------- Arco: luz + resplandor + chispas ---------- */
    const light = new THREE.PointLight(0xc4e6ff, 0, 38, 1.5);
    g.add(light);
    g.add(new THREE.AmbientLight(0x7a8aa0, 0.18));
    const glowTex = (() => {
      const c = document.createElement("canvas");
      c.width = c.height = 128;
      const x = c.getContext("2d");
      const gr = x.createRadialGradient(64, 64, 0, 64, 64, 64);
      gr.addColorStop(0, "rgba(255,255,255,1)");
      gr.addColorStop(0.18, "rgba(200,230,255,.9)");
      gr.addColorStop(0.5, "rgba(120,170,255,.25)");
      gr.addColorStop(1, "rgba(80,120,255,0)");
      x.fillStyle = gr;
      x.fillRect(0, 0, 128, 128);
      return new THREE.CanvasTexture(c);
    })();
    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTex,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        opacity: 1,
      }),
    );

    glow.visible = false;
    g.add(glow);

    const N = 420,
      pos = new Float32Array(N * 3),
      vel = new Float32Array(N * 3),
      life = new Float32Array(N),
      col = new Float32Array(N * 3);

    for (let i = 0; i < N; i++) pos[i * 3 + 1] = -999;
    const sg = new THREE.BufferGeometry();
    sg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    sg.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const sm = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const sparks = new THREE.Points(sg, sm);
    sparks.frustumCulled = false;
    g.add(sparks);
    let cursor = 0,
      onLightBg = false;
    const emit = (x, y, n) => {
      for (let k = 0; k < n; k++) {
        const i = cursor;
        cursor = (cursor + 1) % N;
        const a = Math.random() * Math.PI * 2,
          sp = 2 + Math.random() * 7,
          up = Math.random() * 1.2 + 0.2;
        pos[i * 3] = x;
        pos[i * 3 + 1] = y;
        pos[i * 3 + 2] = 0.1;
        vel[i * 3] = Math.cos(a) * sp * 0.8;
        vel[i * 3 + 1] = Math.sin(a) * sp * 0.5 + up * 2;
        vel[i * 3 + 2] = 1 + Math.random() * 4;
        life[i] = 0.5 + Math.random() * 1.1;
      }
    };

    /* ---------- Carro de soldadura (modelo 3D real) ---------- */
    let model = null;

    if (THREE.GLTFLoader)
      new THREE.GLTFLoader().load(
        "assets/weld/portable_welding_cart_1k.gltf",
        (gl) => {
          model = gl.scene;
          const b = new THREE.Box3().setFromObject(model),
            s = 5.2 / (b.max.y - b.min.y),
            c = b.getCenter(new THREE.Vector3());
          model.scale.setScalar(s);
          model.position.set(-c.x * s, -b.min.y * s, -c.z * s);
          const pivot = new THREE.Group();
          pivot.rotation.y = -0.7;
          pivot.add(model);
          cart.add(pivot);
          model.traverse((m) => {
            if (m.material) m.material.envMapIntensity = 1.1;
          });

          layout(portrait);
        },
        undefined,
        () => {},
      );

    /* ---------- Cursor → punto de la placa ---------- */
    const ray = new THREE.Raycaster(),
      ndc = new THREE.Vector2(9, 9);
    let lastMove = -1e9;
    addEventListener(
      "pointermove",
      (e) => {
        ndc.set(
          (e.clientX / innerWidth) * 2 - 1,
          -((e.clientY / innerHeight) * 2 - 1),
        );

        lastMove = performance.now();
      },
      { passive: true },
    );

    /* ---------- Frase al pasar sobre el carro ---------- */
    const cartTip = document.createElement("div");
    cartTip.className = "cart-tip";
    cartTip.textContent =
      document.documentElement.lang === "en"
        ? "My world before tech."
        : "Mi mundo antes de entrar a tecnología.";
    document.body.appendChild(cartTip);

    addEventListener(
      "pointermove",
      (e) => {
        let over = false;

        if (g.visible && !portrait && model) {
          ray.setFromCamera(ndc, C);
          over = ray.intersectObject(cart, true).length > 0;
        }

        cartTip.classList.toggle("show", over);
      },
      { passive: true },
    );

    /* ---------- Máquina de estados ---------- */
    const SPEED = 0.42; // líneas por segundo
    let s = -0.5,
      cool = 0,
      prev = 0,
      done = false,
      portrait = false,
      flick = 0;

    // la frase queda justo en medio del nombre (entre "LESTER" y "GARCÍA")
    const tipPoint = new THREE.Vector3();

    function placeCartTip() {
      const midY = ((lineY[0] + lineY[1]) / 2 / CH - 0.5) * -H;
      g.updateMatrixWorld(true);
      g.localToWorld(tipPoint.set(0, midY, 0.05));
      tipPoint.project(C);
      cartTip.style.left = ((tipPoint.x + 1) / 2) * innerWidth + "px";
      cartTip.style.top = ((1 - tipPoint.y) / 2) * innerHeight + "px";
    }

    function update(t, active) {
      if (!g.visible || !ready) {
        cartTip.classList.remove("show");
        return;
      }

      placeCartTip();
      const now = performance.now(),
        dt = Math.min(0.05, (now - prev) / 1000 || 0.016);
      prev = now;
      let px = 0,
        py = 0,
        on = false,
        wx = 0,
        wy = 0;

      if (s < LINES.length) {
        // soldando el nombre
        s += dt * SPEED;
        const line = Math.min(LINES.length - 1, Math.floor(Math.max(0, s))),
          fr = Math.min(1, Math.max(0, s - line));

        if (s >= 0) {
          on = true;
          px = textL + (textR - textL) * fr;
          py =
            lineY[line] +
            Math.sin(t * 0.02) * CH * 0.02 +
            Math.sin(fr * 34) * 3;
          wx = (px / CW - 0.5) * W;
          wy = (0.5 - py / CH) * H;
          drawBead(line, fr);
        }

        if (s >= LINES.length) {
          cool = 3.2;
        }
      } else {
        // libre: el arco sigue al cursor
        if (!done) {
          drawBead(LINES.length, 1);
          done = true;
        }

        ray.setFromCamera(ndc, C);
        const h =
          now - lastMove < 450 && active
            ? ray.intersectObject(plate, false)[0]
            : null;

        if (h) {
          const l = g.worldToLocal(h.point.clone());
          wx = l.x;
          wy = l.y;
          px = (wx / W + 0.5) * CW;
          py = (0.5 - wy / H) * CH;
          on = true;
          cool = 3.2;
        }
      }

      if (on || cool > 0) {
        heat(px, py, on);

        if (!on) cool -= dt;
      }

      if (on) {
        flick = 0.7 + Math.random() * 0.3 + (Math.random() < 0.08 ? 0.6 : 0);
        light.position.set(wx, wy, 1.2);
        light.intensity = 5 * flick;
        glow.visible = true;
        glow.position.set(wx, wy, 0.35);
        glow.scale.setScalar(1.3 * flick + 0.15);
        emit(wx, wy, Math.round(dt * 260));
      } else {
        light.intensity = 0;
        glow.visible = false;
      }

      // chispas: vuelo, gravedad y enfriamiento
      for (let i = 0; i < N; i++) {
        if (life[i] <= 0) {
          pos[i * 3 + 1] = -999;
          col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = 0;
          continue;
        }

        life[i] -= dt;
        vel[i * 3 + 1] -= 12 * dt;
        pos[i * 3] += vel[i * 3] * dt;
        pos[i * 3 + 1] += vel[i * 3 + 1] * dt;
        pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
        const k = Math.max(0, Math.min(1, life[i] / 0.8));
        col[i * 3] = 1;
        col[i * 3 + 1] = 0.35 + 0.55 * k * k;
        col[i * 3 + 2] = 0.08 + 0.6 * k * k * k;

        if (onLightBg) {
          col[i * 3] *= 0.85;
          col[i * 3 + 1] *= 0.45;
          col[i * 3 + 2] = 0;
        }

        col[i * 3] *= k;
        col[i * 3 + 1] *= k;
        col[i * 3 + 2] *= k;
      }

      sg.attributes.position.needsUpdate = true;
      sg.attributes.color.needsUpdate = true;
    }

    function layout(port) {
      portrait = port;
      g.scale.setScalar(port ? 0.46 : 1);
      g.position.set(0, port ? 2.2 : 0.5, -6.5);
      plate.scale.setScalar(port ? 2.3 : 1);
      cart.scale.setScalar(port ? 1e-4 : 1);
    }

    function theme(light) {
      // fondo claro: chispas no aditivas
      onLightBg = light;
      sm.blending = light ? THREE.NormalBlending : THREE.AdditiveBlending;
      sm.needsUpdate = true;
      glow.material.blending = light
        ? THREE.NormalBlending
        : THREE.AdditiveBlending;
      glow.material.needsUpdate = true;
    }

    // posición bajo el nombre (para la etiqueta HTML)
    function nameAnchor() {
      g.updateMatrixWorld(true);
      const y = H / 2 - (textBot / CH) * H;
      return {
        p: g.localToWorld(new THREE.Vector3(0, y - H * 0.03, 0.03)),
        cap: ((textSize * W) / CW) * g.scale.x,
      };
    }

    return { update, layout, theme, nameAnchor };
  }
})();
