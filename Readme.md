# 🚀 Portafolio – Lester García

Portafolio web personal desarrollado con **HTML, CSS puro y JavaScript** (sin build; la escena 3D usa Three.js incluido en `js/vendor/`).

## 🌌 Experiencia inmersiva
El scroll es un vuelo de cámara por un espacio 3D: inicio → sobre mí → stack → proyectos → contacto. Los nodos y paneles se pueden tocar; un clic en un panel abre el proyecto.

- **Ver como página / Modo 3D**: botón en la píldora de navegación para alternar con la página clásica.
- Respaldo automático a la página clásica si no hay WebGL, si el usuario prefiere menos movimiento (`prefers-reduced-motion`) o si se abre con `file://` (las texturas requieren http).
- Los datos (proyectos, stack) se leen del HTML y de `STACK_NODES` en `main.js`.

## ✨ Secciones (página clásica)
- **Inicio**: foto principal, presentación y botones de acción (incluye descarga de CV)
- **Sobre mí**
- **Habilidades**: constelación interactiva en canvas
- **Proyectos** (5): lista editorial con vista previa flotante
- **Trayectoria**
- **Contacto**: WhatsApp, correo, LinkedIn y GitHub + formulario
- **Navegación**: píldora flotante (menú desplegable en móvil), con selector de idioma y tema
- Cursor propio, foco de luz y botones magnéticos (solo con ratón; respeta `prefers-reduced-motion`)

## 🎨 Paleta
Aqua `#2dd4bf` · Azul `#7dd3fc` · Ámbar `#f6bd60` · Fondo `#0b1220`

## 🔤 Tipografía
Instrument Serif (títulos) · Inter (texto) · JetBrains Mono (etiquetas), alojadas en `fonts/`.

## 📁 Estructura
```
index.html
css/styles.css
js/main.js        ← CONFIG con tus datos de contacto
js/world.js       ← escena 3D (Three.js en js/vendor/)
img/              ← perfil, proyectos y capturas
docs/             ← coloca aquí CV-Lester-Garcia.pdf
```

## ⚙️ Personalización
1. Abre `js/main.js` y edita el bloque `CONFIG` (WhatsApp, correo, LinkedIn).
2. En `index.html` cambia el `href` de cada proyecto por su enlace real.
3. Edita los nodos de la constelación (`NODES` en `js/main.js`) y los textos de Trayectoria.
4. Reemplaza las imágenes de `img/` por capturas reales de tus proyectos.

## ▶️ Uso
Sirve la carpeta con un servidor local (Live Server en VS Code o `python3 -m http.server`) y abre `index.html`. Con `file://` se muestra la página clásica.
