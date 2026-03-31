# RTS - Real-Time 3D Application

React + Three.js project using TypeScript (strict mode) and Vite.

## Tech Stack

- **Runtime/Package Manager:** Bun
- **Framework:** React 19, Vite 7
- **3D:** Three.js 0.183, @react-three/fiber 9, @react-three/drei 10
- **Styling:** Tailwind CSS 4 (via `@tailwindcss/vite` plugin), shadcn/ui (new-york style)
- **UI:** Radix UI, Lucide icons, class-variance-authority
- **Language:** TypeScript 5.9 (strict mode, `noUnusedLocals`, `noUnusedParameters`)

## Commands

```bash
bun run dev       # Start dev server
bun run build     # Type-check (tsc -b) + Vite production build
bun run lint      # Run ESLint (flat config)
bun run preview   # Preview production build locally
```

## Directory Structure

```
rts/
├── public/                  # Static assets served as-is (favicons, models, textures)
├── src/
│   ├── main.tsx             # React entry point (createRoot, StrictMode)
│   ├── App.tsx              # Root component: Canvas setup + scene composition
│   ├── App.css              # App-level styles (viewport sizing)
│   ├── index.css            # Tailwind imports, CSS variables, theme tokens
│   │
│   ├── components/          # React components
│   │   ├── ui/              # shadcn/ui primitives (Button, Dialog, etc.)
│   │   └── ...              # App-specific UI components (HUD, panels, overlays)
│   │
│   ├── scene/               # 3D scene components (rendered inside <Canvas>)
│   │   ├── objects/         # 3D meshes, models, geometries
│   │   ├── environment/     # Lights, fog, sky, ground, post-processing
│   │   └── controls/        # Camera rigs, custom controls
│   │
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Pure utility functions
│   │   └── utils.ts         # cn() helper for Tailwind class merging
│   ├── stores/              # State management (Zustand or similar)
│   ├── types/               # Shared TypeScript types and interfaces
│   ├── constants/           # App-wide constants and configuration
│   └── assets/              # Imported assets (SVGs, images bundled by Vite)
│
├── components.json          # shadcn/ui configuration
├── eslint.config.js         # ESLint flat config
├── vite.config.ts           # Vite config (React plugin, Tailwind plugin, @ alias)
├── tsconfig.json            # TS project references root
├── tsconfig.app.json        # App TS config (strict, ES2022, react-jsx)
└── tsconfig.node.json       # Node/Vite TS config
```

## Architecture

### Layer Separation

The app has two rendering layers that must stay separate:

1. **HTML/DOM layer** - Standard React components, styled with Tailwind/shadcn. Used for UI overlays, HUD, menus, panels. These render **outside** `<Canvas>`.
2. **WebGL/Three.js layer** - R3F components that render **inside** `<Canvas>`. These use Three.js primitives (`<mesh>`, `<group>`, etc.) and drei helpers.

Never use DOM elements inside `<Canvas>`. Never use R3F hooks (`useFrame`, `useThree`) outside `<Canvas>`.

### Component Organization

```
# DOM components (outside Canvas) - standard React + Tailwind
src/components/ui/Button.tsx       # shadcn primitive
src/components/GameHUD.tsx         # overlay on top of canvas

# 3D scene components (inside Canvas) - R3F + Three.js
src/scene/objects/Player.tsx       # 3D mesh with useFrame
src/scene/environment/Lighting.tsx # lights, shadows
```

### Scene Composition Pattern

```tsx
// App.tsx - compose the scene declaratively
<Canvas camera={{ position: [3, 3, 3] }}>
  {/* Environment */}
  <ambientLight intensity={0.5} />
  <directionalLight position={[5, 5, 5]} />

  {/* Scene objects */}
  <Player />
  <Terrain />

  {/* Controls */}
  <OrbitControls />
</Canvas>
```

### State Management

- Use **Zustand** for game/app state shared between DOM and 3D layers
- Use **React refs** (`useRef`) for per-frame mutable state (positions, rotations, velocities) — never `useState` for values that change every frame
- Use **useState** only for UI state that triggers re-renders (menus, settings)

### Performance Rules

- `useFrame` callback runs every frame (~60fps). Keep it minimal — no allocations, no object creation
- Pre-create reusable `Vector3`/`Quaternion`/`Matrix4` outside the component or in `useMemo`
- Use `useRef` for values mutated in `useFrame` — never `useState`
- Prefer `<instancedMesh>` when rendering many identical objects
- Use `drei`'s `<Preload>` and `useGLTF.preload()` for asset loading
- Set `dispose={null}` on geometries/materials you want to reuse across mounts

## Coding Conventions

### General

- Path alias: `@/` maps to `src/` (configured in both Vite and tsconfig)
- Use named exports for components, default export only for page-level components
- Prefer `function` declarations for components, not arrow functions
- Use `type` imports: `import type { Mesh } from 'three'`
- Colocate types with their module unless shared across 3+ files

### File Naming

- Components: `PascalCase.tsx` (e.g., `RotatingBox.tsx`)
- Hooks: `camelCase.ts` prefixed with `use` (e.g., `useGameState.ts`)
- Utilities: `camelCase.ts` (e.g., `utils.ts`)
- Types: `camelCase.ts` or colocated in the component file
- Constants: `camelCase.ts` (e.g., `config.ts`)

### Import Order

```ts
// 1. React
import { useRef, useState } from 'react'
// 2. Third-party libraries
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
// 3. Internal modules (using @/ alias)
import { useGameStore } from '@/stores/gameStore'
import { cn } from '@/lib/utils'
// 4. Types
import type { Mesh } from 'three'
// 5. Styles
import './App.css'
```

### Three.js / R3F Patterns

```tsx
// Use ref for mutable 3D objects
const meshRef = useRef<Mesh>(null!)

// useFrame for per-frame updates — delta for frame-rate independence
useFrame((_state, delta) => {
  meshRef.current.rotation.y += delta
})

// Declarative scene graph — prefer JSX over imperative Three.js
<mesh ref={meshRef} position={[0, 1, 0]}>
  <boxGeometry args={[1, 1, 1]} />
  <meshStandardMaterial color="royalblue" />
</mesh>
```

### Styling (Tailwind / shadcn)

- Use `cn()` from `@/lib/utils` to merge Tailwind classes conditionally
- shadcn components in `src/components/ui/` — do not modify generated files directly; extend via wrapper components
- Add new shadcn components: `bunx shadcn@latest add <component>`
- Theme tokens defined as CSS variables in `src/index.css` (light/dark via `.dark` class)
- Use semantic color tokens (`bg-background`, `text-foreground`, `border-border`) not raw colors

### TypeScript

- Strict mode enforced: no implicit any, no unused locals/params
- Use `satisfies` for type-safe object literals
- Prefer `interface` for component props, `type` for unions and utility types
- Use `React.ComponentProps<typeof Component>` to derive prop types from existing components
