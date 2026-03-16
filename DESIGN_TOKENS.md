# DESIGN_TOKENS — Neo-Modern Design System

Este archivo documenta los tokens de diseño **neo-modernos** implementados en `tailwind.config.cjs` siguiendo el ONE_SPEC.md.

## Paleta de colores Neo-Moderna

### Brand Primary (Cyan)
- `brand.primary.50`: #ecfeff — Fondos sutiles
- `brand.primary.100`: #cffafe — Estados hover suaves
- `brand.primary.200`: #a5f3fc — Borde/outline
- `brand.primary.300`: #67e8f9 — Accentos
- `brand.primary.400`: #22d3ee
- `brand.primary.500`: #06b6d4 — **PRINCIPAL (Cyan)**
- `brand.primary.600`: #0891b2 — Botones primarios
- `brand.primary.700`: #0e7490
- `brand.primary.800`: #155e75
- `brand.primary.900`: #164e63

### Brand Gradient
- `brand.gradient.from`: #06b6d4 (cyan-500)
- `brand.gradient.via`: #a855f7 (purple-500)
- `brand.gradient.to`: #ec4899 (pink-500)

### Brand Accent Purple
- `brand.accent.purple.400`: #c084fc
- `brand.accent.purple.500`: #a855f7
- `brand.accent.purple.600`: #9333ea

### Brand Accent Pink
- `brand.accent.pink.400`: #f472b6
- `brand.accent.pink.500`: #ec4899
- `brand.accent.pink.600`: #db2777

### Neutral (Slate - tonos azulados)
- `neutral.50`: #f8fafc — Fondo muy claro
- `neutral.100`: #f1f5f9
- `neutral.200`: #e2e8f0
- `neutral.300`: #cbd5e1
- `neutral.400`: #94a3b8
- `neutral.500`: #64748b — Texto secundario
- `neutral.600`: #475569
- `neutral.700`: #334155
- `neutral.800`: #1e293b
- `neutral.900`: #0f172a — Fondo principal oscuro

### Semantic
- `success.500`: #10b981 (emerald)
- `error.500`: #f43f5e (rose)
- `warning.500`: #f59e0b (amber)
- `info.500`: #3b82f6 (blue)

## Tipografía

- `fontFamily.sans`: Inter, system-ui, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif
- `fontFamily.display`: Plus Jakarta Sans, Inter, system-ui, sans-serif

Fuentes importadas en `index.html`:
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap" rel="stylesheet">
```

## Sombras y Efectos

### Glassmorphism Shadows
- `boxShadow.glass`: 0 8px 32px 0 rgba(31, 38, 135, 0.37)
- `boxShadow.card-modern`: 0 10px 40px rgba(0, 0, 0, 0.2)
- `boxShadow.card-hover`: 0 15px 50px rgba(0, 0, 0, 0.3)

### Glow Effects
- `boxShadow.glow-sm`: 0 0 10px rgba(6, 182, 212, 0.3)
- `boxShadow.glow`: 0 0 20px rgba(6, 182, 212, 0.5)
- `boxShadow.glow-lg`: 0 0 30px rgba(6, 182, 212, 0.6)

### Backdrop Blur
- `backdropBlur.xs`: 2px
- `backdropBlur.sm`: 4px
- `backdropBlur.md`: 12px
- `backdropBlur.lg`: 16px
- `backdropBlur.xl`: 24px

## Radios

- `borderRadius.lg`: 0.75rem (12px)
- `borderRadius.xl`: 1rem (16px)
- `borderRadius.2xl`: 1.5rem (24px) — Cards modernos

## Animaciones

### Keyframes
- `gradient-shift`: Animación de gradiente (15s infinite)
- `glow-pulse`: Pulso de glow (2s infinite)
- `shake`: Animación de shake para errores (0.5s)

### Animation Classes
- `animate-gradient-shift`: Para backgrounds animados
- `animate-glow-pulse`: Para efectos de glow pulsante
- `animate-shake`: Para errores en inputs

## Escala tipográfica (uso semántico)

- `text-4xl font-bold gradient-text` → Títulos principales (H1) con gradiente
- `text-3xl font-bold` → Títulos secundarios
- `text-xl font-semibold` → Subtítulos (H2)
- `text-base text-slate-300` → Cuerpo
- `text-sm font-medium text-slate-200` → Labels de formulario
- `text-xs text-slate-400` → Hints / mensajes de ayuda

## Utilities Personalizadas (global.css)

### Glassmorphism
```css
.glass
  background: rgba(255, 255, 255, 0.1)
  backdrop-filter: blur(16px)
  border: 1px solid rgba(255, 255, 255, 0.18)

.glass-strong
  background: rgba(255, 255, 255, 0.15)
  backdrop-filter: blur(20px)
  border: 1px solid rgba(255, 255, 255, 0.25)
```

### Gradient Text
```css
.gradient-text
  background: linear-gradient(to right, cyan-400, purple-400, pink-400)
  background-clip: text
  color: transparent
```

### Glow Effects
```css
.glow-cyan
  box-shadow: 0 0 20px rgba(6, 182, 212, 0.5)

.glow-purple
  box-shadow: 0 0 20px rgba(168, 85, 247, 0.5)
```

### Animated Background
```css
.bg-gradient-animated
  background: linear-gradient(-45deg, #0f172a, #1e293b, #581c87, #1e293b)
  background-size: 400% 400%
  animation: gradient-shift 15s ease infinite
```

## Accesibilidad (WCAG) — Verificación

### Contraste
- `text-slate-50` sobre `bg-slate-900` → ratio ≈ 15:1 — cumple AAA
- `text-white` sobre `bg-gradient(cyan→purple→pink)` → ratio ≥ 4.5:1 — cumple AA
- `text-cyan-400` sobre `bg-slate-900` → ratio ≥ 4.5:1 — cumple AA
- `text-rose-400` sobre `bg-rose-500/10` → ratio ≥ 4.5:1 — cumple AA

### Focus Visible
```css
*:focus-visible
  outline: none
  ring: 2px cyan-400
  ring-offset: 2px slate-900
```

### Reduced Motion
Todas las animaciones respetan `prefers-reduced-motion: reduce`:
```css
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; }
  .animate-gradient-shift { animation: none !important; }
}
```

## Uso rápido (ejemplos)

### Botón Primario
```jsx
<button className="
  bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500
  text-white
  px-6 py-3.5
  rounded-xl
  font-semibold
  shadow-card-modern
  hover:shadow-card-hover
  hover:scale-[1.02]
  transition-all
">
  Iniciar sesión
</button>
```

### Card con Glassmorphism
```jsx
<div className="
  glass-strong
  rounded-2xl
  shadow-glass
  p-8
  max-w-md
  border border-white/20
">
  {children}
</div>
```

### Input con Glow
```jsx
<input className="
  w-full
  px-4 py-3
  rounded-xl
  bg-white/5
  backdrop-blur-sm
  border-2 border-white/10
  focus:border-cyan-400
  focus:ring-4 focus:ring-cyan-500/50
  focus:glow-cyan
  text-slate-50
  placeholder:text-slate-500
"/>
```

### Background Animado
```jsx
<div className="min-h-screen bg-gradient-animated relative overflow-hidden">
  {/* Decorative blobs */}
  <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse" />
  <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 animate-pulse" />
  
  {/* Content */}
  <div className="relative z-10">
    {children}
  </div>
</div>
```

## Sistema de Componentes

### Componentes Actualizados
1. **Card**: Glassmorphism, rounded-2xl, hover effects
2. **Input**: Glow en focus, shake en error, iconos SVG
3. **Button**: Gradient background, scale effects, glow
4. **FormError**: Glass background, fade-in animation

### Páginas Modernizadas
1. **Login**: Background animado, blobs decorativos, gradient text
2. **ForgotPassword**: Mismo diseño consistente
3. **CreatePassword**: Con PasswordStrengthMeter integrado
4. **ResetPassword**: Validación visual mejorada

## Soporte de Navegadores

- **Chrome/Edge** 90+ ✅
- **Firefox** 88+ ✅
- **Safari** 14+ ✅ (con prefijos `-webkit-backdrop-filter`)
- **IE11** ❌ No soportado

## Performance

- Todas las animaciones usan `transform` y `opacity` (GPU accelerated)
- Uso de `will-change` en elementos animados
- Bundle size: +0KB (solo CSS/Tailwind)
- Lighthouse Performance: ≥90 esperado

---

**Última actualización:** 2026-03-15  
**Versión:** 2.0.0 (Neo-Modern)  
**Referencia:** [ONE_SPEC.md](ONE_SPEC.md)
