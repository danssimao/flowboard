# 0005 - Container & Footer

## Objetivo

O Container é a camada mais externa visível do Flowboard. Delimita a viewport,
captura eventos globais de pointer e hospeda o Stage, Target e Footer.
O Footer é uma barra fixa no fundo com controles (snap-to-grid toggle).

> **Nota:** O Container é um componente **interno** do Flowboard e não é
> exportado publicamente. No modo compound, ele é renderizado automaticamente
> pelo componente `Flowboard` root.

## Dependências

- 0001 (Types)
- 0002 (Theme)
- 0004 (Context)

## Arquivos a Criar

- `lib/components/Container/Container.tsx`
- `lib/components/Container/Container.module.css`
- `lib/components/Container/Container.test.tsx`
- `lib/components/Footer/Footer.tsx`
- `lib/components/Footer/Footer.module.css`
- `lib/components/Footer/Footer.test.tsx`

---

## Container

### Props

```typescript
interface ContainerProps {
  children: React.ReactNode
  style?: React.CSSProperties
  className?: string
}
```

### Comportamento

- `position: relative` — referência para posicionamento absoluto do Stage e Target
- `overflow: hidden` — conteúdos fora da viewport não vazam
- Captura `onPointerDown`, `onPointerMove`, `onPointerUp` globais para:
  - Pan do stage (arrastar fundo com mouse)
  - Drag de nodes
  - Drag de edges
  - Drag do menu
- **Pan via trackpad** é tratado pelo `usePanZoom` (wheel events), não pelo Container
- Calcula e armazena suas próprias dimensões (`clientWidth`, `clientHeight`)
- Expõe dimensões via ref para o Stage calcular limites de pan
- Quando nenhum drag está ativo e o clique é no fundo (não em node/edge):
  → inicia pan (apenas para mouse, não trackpad)
- Quando um clique atinge um node → seleciona o node
- Quando um clique atinge uma aresta → seleciona a aresta
- Quando um clique atinge vazio → deseleciona tudo

### Suporte a Mouse e Trackpad

O Container distingue entre mouse e trackpad pela origem do evento:

| Input | Pan | Zoom | Como funciona |
|-------|-----|------|---------------|
| **Mouse** | Pointer drag no fundo | Scroll wheel | pointerDown inicia pan, pointerMove atualiza, pointerUp finaliza |
| **Trackpad** | Two-finger scroll | Pinch (ctrl+scroll) | wheel events tratados pelo usePanZoom no Stage |

**Regra:** O `pointerDown` no fundo só inicia pan quando `e.pointerType === 'mouse'`.
Para trackpad, o pan é feito via wheel events (two-finger scroll), que são
tratados pelo hook `usePanZoom` no Stage.

### Lógica de Eventos

```
pointerDown:
  1. Se já existe dragState ativo → ignorar (evita múltiplos drags)
  2. Se target é um port → ignorar (port inicia seu próprio drag)
  3. Se target é um node → ignorar (node inicia seu próprio drag)
  4. Se target é um edge → SET_SELECTED_EDGE
  5. Se target é o stage (fundo):
     - Se pointerType === 'mouse' → SET_DRAG_STATE type='pan' (mouse drag)
     - Se pointerType !== 'mouse' → ignorar (trackpad usa wheel events)

pointerMove:
  1. Se dragState.type === 'pan' → atualizar panOffset
  2. Se dragState.type === 'node' → atualizar posição do node
  3. Se dragState.type === 'edge-create' → atualizar mousePos
  4. Se dragState.type === 'edge-disconnect' → atualizar mousePos
  5. Se dragState.type === 'menu-drag' → atualizar mousePos

pointerUp:
  1. Se dragState.type === 'pan' → SET_DRAG_STATE null
  2. Se dragState.type === 'menu-drag' e mouse dentro do stage → criar node
  3. Se dragState.type === 'menu-drag' e mouse fora → cancelar
  4. Se dragState.type === 'edge-create' e hover em port → conectar
  5. Se dragState.type === 'edge-create' e sem port → cancelar
  6. Se dragState.type === 'edge-disconnect' e hover em port → reconectar
  7. Se dragState.type === 'edge-disconnect' e sem port → remover edge
  8. SET_DRAG_STATE null
```

### Implementação

```typescript
import { useRef, useCallback, useEffect } from 'react'
import { useFlowboard } from '../../hooks/useFlowboard'
import { useFlowboardActions } from '../../hooks/useFlowboardActions'
import styles from './Container.module.css'
import classNames from 'classnames'

interface ContainerProps {
  children: React.ReactNode
  style?: React.CSSProperties
  className?: string
}

export function Container({ children, style, className }: ContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { state, theme } = useFlowboard()
  const actions = useFlowboardActions()

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (state.dragState) return
      if ((e.target as HTMLElement).closest('[data-port]')) return
      if ((e.target as HTMLElement).closest('[data-node]')) return

      if ((e.target as HTMLElement).closest('[data-edge]')) {
        const edgeId = (e.target as HTMLElement)
          .closest('[data-edge]')?.getAttribute('data-edge-id')
        if (edgeId) actions.selectEdge(edgeId)
        return
      }

      // Clique no fundo → iniciar pan apenas com mouse
      // Trackpad usa wheel events (tratados pelo usePanZoom)
      if (e.pointerType === 'mouse') {
        actions.setDragState({
          type: 'pan',
          startPos: { x: e.clientX, y: e.clientY },
          startOffset: { ...state.panOffset },
        })
      }
    },
    [state.dragState, state.panOffset, actions]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!state.dragState) return

      const pos = { x: e.clientX, y: e.clientY }

      switch (state.dragState.type) {
        case 'pan': {
          const dx = pos.x - state.dragState.startPos.x
          const dy = pos.y - state.dragState.startPos.y
          actions.setPan({
            x: state.dragState.startOffset.x + dx,
            y: state.dragState.startOffset.y + dy,
          })
          break
        }
        // Outros tipos de drag são tratados por seus respectivos hooks
      }
    },
    [state.dragState, actions]
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!state.dragState) return

      if (state.dragState.type === 'pan') {
        actions.setDragState(null)
      }
      // Outros tipos de drag são tratados por seus respectivos hooks
    },
    [state.dragState, actions]
  )

  return (
    <div
      ref={containerRef}
      className={classNames(styles.container, className)}
      style={style}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {children}
    </div>
  )
}
```

### CSS Module

```css
.container {
  position: relative;
  overflow: hidden;
  width: 100%;
  height: 100%;
  user-select: none;
  touch-action: none;
}
```

### Testes

- Renderiza children
- Aplica className e style customizados
- Captura pointer events (onPointerDown disparado)
- Previne default em touch events (`touch-action: none`)
- Clique com mouse no fundo inicia pan
- Clique com trackpad (pointerType !== 'mouse') no fundo NÃO inicia pan
- Clique em edge seleciona a edge
- Clique em node não inicia pan (node cuida do seu drag)
- Clique em port não inicia pan
- Pan via mouse funciona (pointerDown → pointerMove → pointerUp)

---

## Footer

### Props

```typescript
interface FooterProps {
  // Sem props externas — lê do context
}
```

### Comportamento

- Barra fixa na parte inferior do Container
- Altura definida pelo tema (`theme.footer.height`)
- Contém:
  - Checkbox/toggle para "Snap to Grid"
  - (futuramente: zoom indicator, outros controles)
- Lê `snapEnabled` do context
- Ao clicar no toggle, dispara `SET_SNAP_ENABLED`

### Implementação

```typescript
import { useFlowboard } from '../../hooks/useFlowboard'
import { useFlowboardActions } from '../../hooks/useFlowboardActions'
import styles from './Footer.module.css'

export function Footer() {
  const { state, theme } = useFlowboard()
  const actions = useFlowboardActions()

  return (
    <div className={styles.footer}>
      <label className={styles.toggle}>
        <input
          type="checkbox"
          checked={state.snapEnabled}
          onChange={(e) => actions.setSnapEnabled(e.target.checked)}
          className={styles.toggleInput}
        />
        Snap to Grid
      </label>
    </div>
  )
}
```

### CSS Module

```css
.footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  padding: 0 12px;
  border-top: 1px solid var(--footer-border-color);
  background: var(--footer-background);
  height: var(--footer-height);
  font-size: var(--footer-font-size);
  color: var(--footer-text-color);
  z-index: 10;
}

.toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: inherit;
}

.toggleInput {
  width: 14px;
  height: 14px;
  cursor: pointer;
  accent-color: var(--footer-toggle-active-color);
}
```

### Renderização

```tsx
<div className={styles.footer}>
  <label className={styles.toggle}>
    <input
      type="checkbox"
      checked={state.snapEnabled}
      onChange={(e) => actions.setSnapEnabled(e.target.checked)}
      className={styles.toggleInput}
    />
    Snap to Grid
  </label>
</div>
```

### CSS Variables

O Footer usa CSS variables que são definidas no Container pelo tema:

```css
.container {
  --footer-background: #ffffff;
  --footer-border-color: #dee2e6;
  --footer-height: 32px;
  --footer-font-size: 12px;
  --footer-text-color: #495057;
  --footer-toggle-active-color: #4dabf7;
  --footer-toggle-inactive-color: #adb5bd;
}
```

### Testes

- Renderiza toggle de snap
- snapEnabled inicia como false (ou valor do prop)
- Clicar no toggle alterna snapEnabled no context
- Aplica estilos do tema (altura, cores)
- Footer fica posicionado no fundo do container
- z-index alto o suficiente para ficar acima do stage
