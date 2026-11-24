/* =====================================================
   BARRA SUPERIOR: VIGA IPS
   La barra de navegación es una viga de acero en 3D, fija, con el alma de
   frente: ahí van las secciones del menú.

   Cómo está hecho (poco código):
   1. La forma: el perfil en "I" (dibujado como una línea) se extruye a lo largo.
   2. El material: texturas reales de acero (Poly Haven, CC0)  assets/nav/
   Solo en pantallas anchas y con WebGL; en el resto queda la barra de CSS.
   ===================================================== */
(function () {
  const nav = document.querySelector(".pillnav");
  const html = document.documentElement;
  const mq = matchMedia("(min-width: 901px)");

  if (
    !nav ||
    !window.THREE ||
    matchMedia("(prefers-reduced-motion: reduce)").matches
  )
    return;

  const BAR_H = 64; // alto de la barra (px) — igual que en el CSS
  const SEC_H = 46,
    SEC_B = 38,
    TF = 6,
    TW = 5,
    FIL = 4; // sección: alto, ala, espesores, radio de empalme
  let ready = false,
    R,
    S,
    cam,
    mesh,
    w = 0;

  function profile() {
    // perfil en "I"
    const H = SEC_H / 2,
      B = SEC_B / 2,
      t = TW / 2,
      f = H - TF,
      r = FIL,
      s = new THREE.Shape();
    s.moveTo(-B, -H);
    s.lineTo(B, -H);
    s.lineTo(B, -f);
    s.lineTo(t + r, -f);
    s.quadraticCurveTo(t, -f, t, -f + r);
    s.lineTo(t, f - r);
    s.quadraticCurveTo(t, f, t + r, f);
    s.lineTo(B, f);
    s.lineTo(B, H);
    s.lineTo(-B, H);
    s.lineTo(-B, f);
    s.lineTo(-t - r, f);
    s.quadraticCurveTo(-t, f, -t, f - r);
    s.lineTo(-t, -f + r);
    s.quadraticCurveTo(-t, -f, -t - r, -f);
    s.lineTo(-B, -f);
    s.closePath();
    return s;
  }

  function build() {
    const cv = document.createElement("canvas");
    cv.className = "beam-gl";
    cv.setAttribute("aria-hidden", "true");
    nav.prepend(cv);
    R = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
    R.setClearColor(0x000000, 0);
    S = new THREE.Scene();
    cam = new THREE.OrthographicCamera(-1, 1, 1, -1, -2000, 2000);
    cam.position.z = 800;

    // estática: se redibuja al llegar cada textura
    const tl = new THREE.TextureLoader(),
      tex = (f) => {
        const t = tl.load("assets/nav/blue_metal_plate_" + f + "_1k.jpg", draw);
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.repeat.set(0.012, 0.012);
        t.anisotropy = 4;
        return t;
      };
    const mat = new THREE.MeshStandardMaterial({
      map: tex("diff"),
      normalMap: tex("nor_gl"),
      roughnessMap: tex("rough"),
      color: 0x9fadc4,
      metalness: 0.6,
      roughness: 1,
      envMapIntensity: 0.85,
    });

    const geo = new THREE.ExtrudeGeometry(profile(), {
      depth: 100,
      bevelEnabled: true,
      bevelSize: 0.9,
      bevelThickness: 0.9,
      bevelSegments: 2,
      curveSegments: 6,
    });

    geo.translate(0, 0, -50);
    mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.y = Math.PI / 2; // el eje de extrusión pasa a ser el largo de la barra (x)
    S.add(mesh);

    const sun = new THREE.DirectionalLight(0xdfe8ff, 0.9);
    sun.position.set(-300, 400, 600);
    S.add(sun, new THREE.AmbientLight(0x90a0b8, 0.35));

    if (THREE.RGBELoader && THREE.PMREMGenerator)
      new THREE.RGBELoader().load(
        "assets/weld/foundry_1k.hdr",
        (t) => {
          const pm = new THREE.PMREMGenerator(R);
          pm.compileEquirectangularShader();
          S.environment = pm.fromEquirectangular(t).texture;
          t.dispose();
          pm.dispose();
          draw();
        },
        undefined,
        () => {},
      );
    ready = true;
  }

  function resize() {
    if (!ready) return;
    w = nav.clientWidth;
    R.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    R.setSize(w, BAR_H, false);
    cam.left = -w / 2;
    cam.right = w / 2;
    cam.top = BAR_H / 2;
    cam.bottom = -BAR_H / 2;
    cam.updateProjectionMatrix();
    draw();
  }

  function draw() {
    if (!ready || !w) return;
    mesh.scale.z = (w - 26) / 100; // la viga ocupa el ancho de la barra
    R.render(S, cam);
  }

  function sync() {
    // activa la viga solo en pantallas anchas
    const on = mq.matches;

    if (on && !ready) {
      try {
        build();
      } catch (e) {
        console.warn("Viga 3D no disponible", e);
        return;
      }
    }

    html.classList.toggle("beam-on", on);

    if (on) resize();
  }

  mq.addEventListener("change", sync);
  addEventListener("resize", resize);
  sync();
})();
