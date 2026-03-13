# Plan de Trabajo — Rediseño y estilizado del Login

Objetivo: Rediseñar el formulario de inicio de sesión para que sea más atractivo, accesible, responsivo y reusable dentro del proyecto (usa Tailwind).

Resumen del análisis rápido del proyecto
- Proyecto configurado con Tailwind (`src/styles/global.css` usa `@tailwind`).
- El componente actual `src/pages/Login.tsx` usa utilidades Tailwind básicas sin componentes reutilizables.
- Existe `src/services/authService.ts` que maneja la API de autenticación; la lógica de negocio está separada.

Ideas de estilizado (alto nivel)
- Layout: pantalla con fondo en gradiente sutil, card centrada con sombra suave y bordes redondeados (glassmorphism opcional).
- Espaciado: card con `max-w-sm`, padding cómodo y grid vertical alineado al centro.
- Tipografía: jerarquía clara (titulo, subtítulo, labels). Usar font-weight y tamaños consistentes.
- Inputs: componentes con icono a la izquierda, borde sutil, states (focus, error) claros con `ring` de Tailwind.
- Botón principal: color de marca (ej. `bg-blue-600`), sombra leve, transición `transform` en hover.
- Accesibilidad: labels visibles, atributos aria, control de foco visible (`focus:outline-none focus:ring-2 focus:ring-brand`).
- Microinteracciones: mostrar/ocultar contraseña, animación al enviar, indicación de carga en botón.
- Mobile-first: diseño responsivo con márgenes y tamaños ajustados.

Sugerencias técnicas concretas
- Centralizar tokens en `tailwind.config.cjs` (colores brand, radios, spacing) para consistencia.
- Crear componentes atómicos en `src/components/`:
  - `Card.tsx` — wrapper visual reutilizable.
  - `Input.tsx` — acepta icono, label, error, type, show/hide password.
  - `Button.tsx` — variantes `primary`, `ghost`, estados `loading`, `disabled`.
  - `FormError.tsx` — message component para errores de formulario.
- Añadir utilidades de transición en `global.css` o `tailwind.config.cjs` (duraciones, easing).
- Mantener la lógica de auth en `authService` y en `src/lib/api.ts`.

Plan por fases y tareas pequeñas (lista ejecutable)

Fase 1 — Diseño y tokens
2.1. Definir paleta de colores (primario, secundario, fondo, error, success).
2.2. Escoger tipografías y pesos (usar las que ya están o agregar en `index.html`).
2.3. Actualizar `tailwind.config.cjs`: agregar `colors.brand`, `borderRadius.lg`, `spacing` si hace falta.
2.4. Crear un pequeño mock visual (Figma/sketch rápido) o un screenshot con anotaciones.

Fase 2 — Componentes atómicos
3.1. Crear `src/components/Card.tsx` con props `children`, `className`.
3.2. Crear `src/components/Input.tsx` con props `label`, `icon?`, `type`, `value`, `onChange`, `error?`, `showPasswordToggle?`.
3.3. Crear `src/components/Button.tsx` con variante `primary` y estado `loading`.
3.4. Crear `src/components/FormError.tsx` para mensajes de error accesibles.
3.5. Escribir tests unitarios simples (opcional) o snapshots si el proyecto tiene test infra.

Fase 3 — Implementar nuevo Login
4.1. Maquetar `Login.tsx` usando `Card`, `Input`, `Button`.
4.2. Añadir control show/hide password y accesibilidad (`aria-pressed`, `aria-label`).
4.3. Integrar `PasswordStrengthMeter.tsx` (ya existe) para `CreatePassword` y opcionalmente para login si es necesario.
4.4. Manejar estados: loading, error, success, y mostrar mensajes con `FormError`.
4.5. Ajustar navegación y éxito (`saveAuth` y `navigate`).

Fase 4 — Pulir UX y microinteracciones
5.1. Añadir transiciones CSS para hover/focus (botón e inputs).
5.2. Añadir animación al enviar (spinner inline en el botón).
5.3. Agregar focus management (focus en primer input, focus trap si modal).
5.4. Verificar contraste y tamaño de hit targets.

Fase 5 — QA, accesibilidad y responsive
6.1. Pruebas manuales en móvil, tablet y desktop.
6.2. Evaluar con Lighthouse/Axe para issues A11y.
6.3. Arreglar problemas de contraste o labels faltantes.
6.4. Hacer testing cross-browser rápido (Chrome, Edge, Firefox).

Fase 6 — Documentación y entrega
7.1. Documentar el componente `Login` y componentes nuevos en README o en una `STYLE_GUIDE.md`.
7.2. Crear PR, agregar capturas de pantalla del antes/después.
7.3. Revisiones y merge.

Tareas pequeñas extra (por completar si hay tiempo)
- Agregar soporte para inicio con SSO / social (botones secundarios).
- Añadir Storybook o ejemplos visuales en `public` o `docs`.

Medidas de éxito
- Interfaz consistente con tokens compartidos en Tailwind.
- Formulario accesible (aria, focus visible).
- UX fluida con feedback visual y estados claros.
- Componentes reutilizables para futuras pantallas.

Archivos a revisar/editar
- `src/pages/Login.tsx`
- `src/services/authService.ts`
- `src/components/` (nuevos componentes)
- `tailwind.config.cjs`
- `src/styles/global.css`

Pistas de implementación rápidas (código útil)
- Card: `div` con `bg-white/80 backdrop-blur rounded-lg shadow-lg p-6`.
- Input focus: `focus:outline-none focus:ring-2 focus:ring-brand/60`.
- Button hover: `transition transform hover:-translate-y-0.5`.

-- Fin del plan detallado --
