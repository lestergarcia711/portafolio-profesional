# Portafolio – Lester García

Portafolio web personal desarrollado con **HTML, CSS puro y JavaScript** (sin build; la escena 3D usa Three.js incluido en `js/vendor/`).

## Experiencia: del taller al código
Un muro de acero continuo que se recorre **de lado**: portada → sobre mí → habilidades → proyectos → trayectoria → contacto.

- **Portada**: el arco de una soldadura escribe mi nombre sobre la placa de acero, entre chispas (`js/weld.js`). Cuando termina, el arco sigue al cursor.
- **Balón**: en la esquina inferior derecha; al tocarlo rueda y avanza al siguiente apartado. También se avanza con flechas, rueda del ratón, deslizando con el dedo o desde la barra.
- **Ventanas**: cada apartado es una ventana de VS Code (sobre mí, habilidades) o de terminal (proyectos, trayectoria, contacto), con el contenido real.
- **Barra superior**: una viga de acero en 3D (`js/beam.js`) solo en pantallas anchas; en móvil queda la barra de acero hecha con CSS.
- **Respaldo sin 3D**: si no hay WebGL, si el usuario prefiere menos movimiento (`prefers-reduced-motion`) o si se abre con `file://` (las texturas requieren http), el muro es una imagen de CSS, el nombre se ve como texto y el avance es instantáneo. Las ventanas son las mismas.
- Selector de idioma en la barra.
- El contenido de las ventanas está escrito en `index.html` / `index-en.html` (bloque `.slide`).

## Paleta
Aqua `#2dd4bf` · Azul `#7dd3fc` · Ámbar `#f6bd60` · Fondo `#0b1220`

## Tipografía
Instrument Serif (títulos) · Inter (texto) · JetBrains Mono (etiquetas), alojadas en `fonts/`.

## Estructura
```
index.html
css/styles.css
js/main.js        ← CONFIG con tus datos de contacto
js/stage.js       ← escenario horizontal, balón y navegación
js/weld.js        ← portada: muro de acero, soldadura y chispas
js/beam.js        ← barra superior: viga de acero 3D
js/vendor/        ← Three.js (+ GLTFLoader y RGBELoader)
assets/           ← texturas, modelos 3D y entorno (Poly Haven, CC0; ver LICENSE.txt de cada carpeta)
img/              ← foto de perfil y logos de tecnologías
docs/             ← coloca aquí CV-Lester-Garcia.pdf
```

## Personalización
1. Abre `js/main.js` y edita el bloque `CONFIG` (WhatsApp, correo, LinkedIn).
2. En `index.html` cambia el `href` de cada proyecto por su enlace real.
3. Edita los textos de las ventanas en `index.html` e `index-en.html` (bloques `.slide`): proyectos, stack y trayectoria.

## Uso
Sirve la carpeta con un servidor local (Live Server en VS Code o `python3 -m http.server`) y abre `index.html`. Con `file://` se muestra el respaldo sin 3D.
