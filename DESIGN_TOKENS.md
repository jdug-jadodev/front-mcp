# DESIGN_TOKENS — Fase 1

Este archivo documenta los tokens de diseño implementados en `tailwind.config.cjs` como entregable de la Fase 1.

## Paleta de colores

### Brand Primary (Blue)
- `brand.primary.50`: #eff6ff — Fondos sutiles
- `brand.primary.100`: #dbeafe — Estados hover suaves
- `brand.primary.200`: #bfdbfe — Borde/outline
- `brand.primary.300`: #93c5fd — Accentos
- `brand.primary.400`: #60a5fa
- `brand.primary.500`: #3b82f6
- `brand.primary.600`: #2563eb — Botones primarios (PRINCIPAL)
- `brand.primary.700`: #1d4ed8
- `brand.primary.800`: #1e40af
- `brand.primary.900`: #1e3a8a

### Brand Secondary
- `brand.secondary.100`: #f3e8ff
- `brand.secondary.500`: #a855f7
- `brand.secondary.700`: #7e22ce

### Neutral (Grises)
- `neutral.50`: #f9fafb — Fondo general
- `neutral.100`: #f3f4f6
- `neutral.200`: #e5e7eb
- `neutral.300`: #d1d5db
- `neutral.400`: #9ca3af
- `neutral.500`: #6b7280 — Texto secundario
- `neutral.600`: #4b5563
- `neutral.700`: #374151
- `neutral.800`: #1f2937
- `neutral.900`: #111827 — Texto principal (AAA sobre blanco)

### Semantic
- `success.500`: #10b981
- `error.500`: #ef4444
- `warning.500`: #f59e0b
- `info.500`: #3b82f6

## Tipografía

- `fontFamily.sans`: Inter, system-ui, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif
- `fontFamily.display`: Plus Jakarta Sans, Inter, system-ui, sans-serif

Recomendación de import en `index.html` (ya aplicado):

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

## Radios y sombras

- `borderRadius.lg`: 0.75rem (12px)
- `borderRadius.xl`: 1rem (16px)
- `boxShadow.card`: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)
- `boxShadow.card-hover`: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)

## Escala tipográfica (uso semántico)

- `text-3xl font-bold` → Títulos principales (H1)
- `text-xl font-semibold` → Subtítulos (H2)
- `text-base font-normal` → Cuerpo
- `text-sm font-medium` → Labels de formulario
- `text-xs` → Hints / mensajes de ayuda

## Accesibilidad (WCAG) — comprobaciones rápidas

- `text-neutral-900` sobre `bg-white` → ratio muy alto (≈ 12:1) — cumple AAA.
- `text-white` sobre `brand.primary.600` (#2563eb) → ratio ≥ 4.5:1 — cumple AA para texto normal.
- `text-error-700` sobre `error.50` → ratio >= 4.5:1 — cumplir en variantes de mensaje.

> Nota: Para evidencia formal, ejecutar un comprobador de contraste (WebAIM) y adjuntar capturas en esta carpeta.

## Uso rápido (ejemplos)

- Botón primario: `class="bg-brand-primary-600 text-white hover:bg-brand-primary-700 shadow-card transition duration-250"`
- Card: `class="bg-white/80 backdrop-blur rounded-xl shadow-card p-6 max-w-sm mx-auto"`
- Label: `class="text-sm font-medium text-neutral-700"`

## Siguientes pasos recomendados

1. Verificar visualmente con `pnpm dev` y revisar que las nuevas clases funcionan.
2. Generar capturas de contraste y añadirlas en `docs/contrast/`.
3. Avanzar a Fase 2: crear componentes `Card`, `Input`, `Button` usando estos tokens.
