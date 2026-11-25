# ORIGEN 34° — Landing B2B de aceite de oliva

Landing page para una marca ficticia de aceite de oliva extra virgen uruguayo, pensada para
vender a restaurantes, tiendas gourmet, hoteles, empresas y distribuidores.

**Demo:** https://gusdv16.github.io/relay-demo/

> ORIGEN 34° es una marca ficticia creada para este demo. Los casos, testimonios y datos
> comerciales son inventados. La estética está inspirada en landings editoriales de estudio,
> con escena 3D propia y animaciones al hacer scroll.

## Stack

- **Astro 5** (salida estática)
- **Three.js** — botella de aceite construida con geometría procedural (`LatheGeometry`),
  etiqueta dibujada en canvas y aceitunas/hojas 3D. Se carga con `import()` diferido.
- **GSAP + ScrollTrigger** — entradas del hero, títulos por líneas, contadores, medidores,
  parallax, marquee y revelados por lotes.
- **CSS propio** con variables, tipografía Cormorant Garamond + Inter y diseño responsive.
- Sin frameworks de UI, sin backend.

## Secciones

1. **Hero** — titular, botella 3D interactiva y datos de cosecha.
2. **Origen** — finca, ilustración SVG del olivar y cifras de producción.
3. **Calidad** — acidez, polifenoles, perfil sensorial y ficha técnica.
4. **Formatos** — 250 ml, 500 ml, 1 L, 5 L, lata 3 L y pack corporativo.
5. **Negocios** — casos de uso por canal (restaurantes, tiendas, hoteles, regalo, distribución).
6. **Proceso** — de la cosecha al envasado.
7. **Clientes** — testimonios y nombres de clientes ficticios.
8. **Contacto** — formulario B2B corto (mailto), WhatsApp y email directo.

## Formulario

No hay backend. Al enviar, el formulario valida los campos y abre el cliente de correo con
todos los datos de la consulta ya redactados (`mailto:`). Para producción real conviene
reemplazarlo por un endpoint (Formspree, Cloudflare Worker, Resend, etc.).

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:4321/relay-demo/
npm run build    # genera dist/
npm run preview  # sirve el build
```

El sitio se publica bajo el prefijo `/relay-demo`. Si cambia el nombre del repositorio,
actualizar `base` en `astro.config.mjs` y las URLs de `public/robots.txt` y `public/sitemap.xml`.

## Accesibilidad y rendimiento

- `prefers-reduced-motion`: desactiva animaciones y deja la botella en un frame estático.
- La escena 3D se pausa cuando sale de pantalla o la pestaña queda oculta.
- Fallback SVG si WebGL no está disponible.
- Menú móvil con `aria-expanded`, bloqueo de scroll, cierre con `Escape` y foco gestionado.
- Foco visible, enlaces de salto y contraste alto en textos principales.
- Three.js va en un chunk aparte que solo se descarga después del primer render.

## Estructura

```
src/
  layouts/Layout.astro     metadatos, fuentes y carga del script
  pages/index.astro        contenido y SVG de la ilustración
  pages/404.astro          página de error
  scripts/main.js          navegación, GSAP, contadores, formulario
  scripts/bottle.js        escena 3D de la botella
  styles/global.css        tokens, tipografía y utilidades
  styles/home.css          estilos de secciones
public/
  favicon.svg, og.jpg, robots.txt, sitemap.xml
```

Diseño y desarrollo: [Gustavo Bentancor](https://gustavobentancor.com).
