# Sección "Así lo hacemos" — narrativa de scroll

Fecha: 2026-11-25
Estado: aprobado e implementado

## Idea

La sección reemplaza la antigua lista estática de cuatro pasos (`#proceso`). El mensaje central es
**"lo importante es lo de adentro"**: el valor está en el proceso, no en el envase. El scroll
controla una escena 3D continua que recorre el viaje del producto, desde la semilla hasta la mesa.

El usuario no mira una animación: la mueve. Cada píxel de scroll es un fotograma.

## Estructura

```
┌─────────────────────────────────────────────┐
│ 05 — ASÍ LO HACEMOS                         │
│ Así lo hacemos.                             │  intro (scroll normal)
│ Seis pasos entre el olivar y tu mesa.       │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│  ┌───────────────┐  ┌───────────────────┐   │
│  │               │  │ 01 · ORIGEN       │   │
│  │   escena 3D   │  │ Todo empieza...   │   │  sticky 100vh
│  │   (cámara     │  │ Colonia, Uruguay. │   │  track 600vh
│  │   panorámica) │  │                   │   │
│  │               │  │ 01 / 06  ····     │   │
│  └───────────────┘  └───────────────────┘   │
└─────────────────────────────────────────────┘
```

En móvil la escena va arriba (≈60%) y el texto abajo (≈40%). En escritorio el texto flota a la
izquierda sobre un degradado y la escena ocupa todo el ancho.

## Guion por beat

| Beat | Ventana de scroll | Producto | Entorno | Copy |
|---|---|---|---|---|
| 01 Origen | 0 – 1/6 | Semilla pequeña, verde oscura | Suelo en capas, olivos, colinas | **Todo empieza en un olivo que ya estaba acá.** Colonia, Uruguay. 18 hectáreas, cuatro variedades. |
| 02 Cultivo | 1/6 – 2/6 | La semilla crece a aceituna madura | Agricultor, canasta, rama, olivos | **Lo cuidamos todo el año para cosechar en el momento justo.** A mano, en abril. Antes de que el fruto madure del todo. |
| 03 Almazara | 2/6 – 3/6 | La aceituna se disuelve en aceite dorado | Molino de piedra, tolva, prensa, tanque | **Del árbol a la prensa en menos de 24 horas.** Solo presión y frío. Nada más. |
| 04 Transporte | 3/6 – 4/6 | El aceite se vuelve botella | Camión, ruta, bidones de acero | **Viaja en acero, con su lote y su fecha.** Trazabilidad de principio a fin. |
| 05 Negocio | 4/6 – 5/6 | La botella queda exhibida | Estantería, mostrador, lámparas | **Llega a la góndola y a la cocina.** El mismo aceite que salió del olivar. |
| 06 Mesa | 5/6 – 1 | La botella sirve en la mesa | Mesa de madera, pan, plato, vaso, lámpara | **En la mesa se termina de hacer.** *Lo importante es lo de adentro.* |

## Storyboard de la evolución

```
semilla ──▶ aceituna ──▶ gota de aceite ──▶ botella ──▶ botella en mesa
   ↑            ↑              ↑                ↑             ↑
 escala      escala+color   partículas      aparece       viaja con
 y color      maduración     y chorro       y crece       la cámara
```

Los cambios ocurren **dentro de la misma toma**: la cámara nunca corta. El morph se apoya en
movimiento (caída de frutos, chorro de aceite, llenado) para que el cambio de forma no se lea
como un salto.

## Enfoque técnico

- **Three.js** con `LatheGeometry`, `IcosahedronGeometry`, cajas y cilindros, todo `flatShading`.
- Un solo **mundo continuo**: seis estaciones separadas 7 unidades sobre el eje X. La cámara
  hace una panorámica con `smoothstep` entre estaciones; no hay cross-fades de escena.
- **GSAP ScrollTrigger** solo aporta el progreso (`start: top top`, `end: bottom bottom`,
  sección de 600vh con hijo `position: sticky`). El scrub se suaviza con interpolación en el
  loop de render: el usuario siente que arrastra la historia.
- **Un único `progress` 0–1** gobierna cámara, posición del producto, morphs y opacidad de los
  textos. Nada se reproduce solo.
- Carga diferida (`import()` cuando la sección se acerca), pausa por `IntersectionObserver` y
  `visibilitychange`, DPR limitado.
- **Sin WebGL o con `prefers-reduced-motion`**: la sección queda como lista vertical de seis
  pasos. El HTML de los beats es el mismo: nunca hay contenido solo-imagen.

## Assets

No hay modelos ni texturas externas. Todo se genera por código:

- Paleta de materiales planos (`MeshStandardMaterial`, `flatShading`).
- Sombra de contacto: textura de canvas con degradado radial.
- Etiqueta de botella: banda crema + filete dorado (sin texto, ilegible a ese tamaño).
- Partículas de aceite: `THREE.Points` con sprite circular generado en canvas.

## Accesibilidad

- El canvas es decorativo (`aria-hidden`); el texto del proceso es HTML real.
- Los seis beats están siempre en el DOM, así que un lector de pantalla recibe la narración
  completa aunque visualmente se muestre uno por vez.
- Contraste: texto tinta oscura sobre crema (≥ 7:1 en títulos).
- `prefers-reduced-motion` y fallback sin WebGL: lista secuencial, sin pin.
