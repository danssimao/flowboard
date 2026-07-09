# 0006 - Stage & Pan/Zoom

## Objetivo

O Stage é o "mundo" onde nodes e arestas habitam. Suporta pan (arrastar o fundo)
e zoom (scroll do mouse). Seu tamanho cresce/diminui dinamicamente baseado nas
posições dos nodes.

> **Compound Pattern:** No modo compound, este componente é exposto como
> `Flowboard.Stage`. No modo simples, é renderizado internamente pelo
> `Flowboard` root.

## Dependências

- 0001 (Types)
- 0002 (Theme)
- 0003 (Utils)
- 0004 (Context)
- 0005 (Container)

## Arquivos a Criar

- `lib/components/Stage/Stage.tsx`
- `lib/components/Stage/Stage.module.css`
- `lib/components/Stage/Stage.test.tsx`
- `lib/hooks/usePanZoom.ts`
- `lib/hooks/usePanZoom.test.ts`

---

## usePanZoom Hook

### Suporte a Mouse e Trackpad

O hook `usePanZoom` unifica o tratamento de pan e zoom para mouse e trackpad:

| Evento | Comportamento | Dispositivo |
|--------|---------------|-------------|
| `wheel` + `ctrlKey: false` | **Pan** (two-finger scroll) | Trackpad |
| `wheel` + `ctrlKey: true` | **Zoom** (pinch) | Trackpad |
| `wheel` + `ctrlKey: false` + `deltaMode: 1` | **Pan** (scroll do mouse) | Mouse wheel |
| `wheel` + `ctrlKey: true` + `deltaMode: 1` | **Zoom** (ctrl+scroll) | Mouse wheel |
| `pointerDown` no fundo | **Pan** (drag) | Mouse (tratado no Container) |

**Normalização de delta:**
- `deltaMode === 0` (pixels): valor direto do trackpad (pequeno, preciso)
- `deltaMode === 1` (lines): valor do mouse wheel (multiplicar por ~16 para normalizar)
- `deltaMode === 2` (pages): raro, tratar como lines

### Estado

```typescript
interface PanZoomState {
  offset: Position
  zoom: number
}
```

### Retorno

```typescript
interface UsePanZoomReturn {
  offset: Position
  zoom: number
  handleWheel: (e: React.WheelEvent) => void
  startPan: (startPos: Position) => void
  updatePan: (currentPos: Position) => void
  endPan: () => void
  screenToStage: (screenPos: Position) => Position
  stageToScreen: (stagePos: Position) => Position
}
```

### Implementação

```typescript
import { useCallback, useRef } from 'react'
import { useFlowboard } from './useFlowboard'
import { useFlowboardActions } from './useFlowboardActions'
import { clamp } from '../utils/geometry'

export function usePanZoom() {
  const { state, minZoom, maxZoom } = useFlowboard()
  const { zoom, panOffset } = state
  const actions = useFlowboardActions()
  const panStartRef = useRef<{ startPos: Position; startOffset: Position } | null>(null)

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault()

      const rect = (e.target as HTMLElement).getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      if (e.ctrlKey) {
        // ===== ZOOM (pinch no trackpad ou ctrl+scroll no mouse) =====
        const zoomFactor = 1.1
        const delta = e.deltaY > 0 ? 1 / zoomFactor : zoomFactor
        const newZoom = clamp(zoom * delta, minZoom, maxZoom)

        // Zoom centrado no ponto do mouse/pinch
        const stageX = (mouseX - panOffset.x) / zoom
        const stageY = (mouseY - panOffset.y) / zoom
        const newOffsetX = mouseX - stageX * newZoom
        const newOffsetY = mouseY - stageY * newZoom

        actions.setZoom(newZoom)
        actions.setPan({ x: newOffsetX, y: newOffsetY })
      } else {
        // ===== PAN (two-finger scroll no trackpad ou scroll no mouse) =====
        // Normalizar delta baseado no deltaMode
        // deltaMode 0 = pixels (trackpad), 1 = lines (mouse wheel), 2 = pages
        let dx: number
        let dy: number

        switch (e.deltaMode) {
          case 0: // Pixels (trackpad)
            dx = -e.deltaX
            dy = -e.deltaY
            break
          case 1: // Lines (mouse wheel)
            dx = -e.deltaX * 16
            dy = -e.deltaY * 16
            break
          case 2: // Pages (raro)
            dx = -e.deltaX * 400
            dy = -e.deltaY * 400
            break
          default:
            dx = -e.deltaX
            dy = -e.deltaY
        }

        actions.setPan({
          x: panOffset.x + dx,
          y: panOffset.y + dy,
        })
      }
    },
    [zoom, panOffset, minZoom, maxZoom, actions]
  )

  const startPan = useCallback(
    (startPos: Position) => {
      panStartRef.current = {
        startPos,
        startOffset: { ...panOffset },
      }
    },
    [panOffset]
  )

  const updatePan = useCallback(
    (currentPos: Position) => {
      if (!panStartRef.current) return

      const dx = currentPos.x - panStartRef.current.startPos.x
      const dy = currentPos.y - panStartRef.current.startPos.y

      actions.setPan({
        x: panStartRef.current.startOffset.x + dx,
        y: panStartRef.current.startOffset.y + dy,
      })
    },
    [actions]
  )

  const endPan = useCallback(() => {
    panStartRef.current = null
  }, [])

  const screenToStage = useCallback(
    (screenPos: Position): Position => ({
      x: (screenPos.x - panOffset.x) / zoom,
      y: (screenPos.y - panOffset.y) / zoom,
    }),
    [panOffset, zoom]
  )

  const stageToScreen = useCallback(
    (stagePos: Position): Position => ({
      x: stagePos.x * zoom + panOffset.x,
      y: stagePos.y * zoom + panOffset.y,
    }),
    [panOffset, zoom]
  )

  return {
    offset: panOffset,
    zoom,
    handleWheel,
    startPan,
    updatePan,
    endPan,
    screenToStage,
    stageToScreen,
  }
}
```

### Lógica de Pan (wheel events)

```
1. Container detecta wheel event (do Stage)
2. Se ctrlKey === true → zoom (ver seção de zoom abaixo)
3. Se ctrlKey === false → pan:
   a. Normalizar delta baseado no deltaMode:
      - deltaMode 0 (pixels): usar valor direto (trackpad)
      - deltaMode 1 (lines): multiplicar por 16 (mouse wheel)
      - deltaMode 2 (pages): multiplicar por 400
   b. Inverter sinal (delta positivo = scroll para baixo = mover stage para cima)
   c. Somar ao panOffset atual
   d. Aplicar limites (clampPan) para não sair do container
```

### Lógica de Zoom (wheel events)

```
1. Container detecta wheel event com ctrlKey === true
2. Delta Y negativo = zoom in, positivo = zoom out
3. Fator de zoom: 1.1 (10% por step)
4. Novo zoom = zoom * (deltaY > 0 ? 1/fator : fator)
5. Limitar entre minZoom e maxZoom
6. Zoom centrado no ponto do mouse/pinch:
   - Calcular posição do mouse no stage antes do zoom
   - Ajustar offset para manter essa posição fixa
```

### Conversão de Coordenadas

```typescript
// Screen → Stage: desconta pan e zoom
screenToStage(screenPos) = {
  x: (screenPos.x - offset.x) / zoom,
  y: (screenPos.y - offset.y) / zoom,
}

// Stage → Screen: aplica zoom e pan
stageToScreen(stagePos) = {
  x: stagePos.x * zoom + offset.x,
  y: stagePos.y * zoom + offset.y,
}
```

---

## Stage Component

### Props

```typescript
interface StageProps {
  children: React.ReactNode
}
```

### Comportamento

- Transform CSS: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`
- `transform-origin: 0 0` (canto superior esquerdo como âncora)
- Tamanho: auto-calculado para conter todos os nodes com margem
- Renderiza grid de fundo (pontos) baseado no tema
- Contém todos os nodes e edges como filhos

### Auto-sizing

```typescript
function calculateStageSize(
  nodes: Node[],
  containerSize: Size,
  zoom: number,
  offset: Position,
  margin: number = 200
): Size {
  if (nodes.length === 0) {
    return { width: containerSize.width, height: containerSize.height }
  }

  let maxX = 0
  let maxY = 0

  for (const node of nodes) {
    const nodeWidth = node.size?.width ?? 150
    const nodeHeight = node.size?.height ?? 60
    const right = node.position.x + nodeWidth
    const bottom = node.position.y + nodeHeight

    if (right > maxX) maxX = right
    if (bottom > maxY) maxY = bottom
  }

  return {
    width: Math.max(maxX + margin, containerSize.width),
    height: Math.max(maxY + margin, containerSize.height),
  }
}
```

### Implementação

```typescript
import { useMemo } from 'react'
import { useFlowboard } from '../../hooks/useFlowboard'
import { usePanZoom } from '../../hooks/usePanZoom'
import styles from './Stage.module.css'

interface StageProps {
  children: React.ReactNode
  containerSize: Size
}

export function Stage({ children, containerSize }: StageProps) {
  const { state, theme } = useFlowboard()
  const { offset, zoom, handleWheel } = usePanZoom()

  const stageSize = useMemo(
    () => calculateStageSize(state.nodes, containerSize, zoom, offset),
    [state.nodes, containerSize, zoom, offset]
  )

  return (
    <div
      className={styles.stage}
      style={{
        transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
        width: stageSize.width,
        height: stageSize.height,
      }}
      onWheel={handleWheel}
    >
      {theme.stage.gridVisible && (
        <div
          className={styles.grid}
          style={{
            backgroundSize: `${theme.stage.gridSize}px ${theme.stage.gridSize}px`,
            backgroundImage: `radial-gradient(circle, ${theme.stage.gridColor} 1px, transparent 1px)`,
          }}
        />
      )}
      {children}
    </div>
  )
}
```

### CSS Module

```css
.stage {
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: 0 0;
}

.grid {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
```

### Event Listener Passivo (passive: false)

O `handleWheel` usa `e.preventDefault()` para impedir que o browser faça
scroll da página ao usar two-finger trackpad ou ctrl+scroll. Porém, no
Chrome/Edge, wheel events são passive por padrão, o que impede `preventDefault()`.

Para resolver, o wheel event listener precisa ser registrado com `passive: false`:

```typescript
// Dentro do Stage.tsx, usando useEffect para registrar com passive: false
useEffect(() => {
  const el = stageRef.current
  if (!el) return

  const handler = (e: WheelEvent) => {
    e.preventDefault()
    // delegar para handleWheel do usePanZoom
    handleWheel(e as unknown as React.WheelEvent)
  }

  el.addEventListener('wheel', handler, { passive: false })
  return () => el.removeEventListener('wheel', handler)
}, [handleWheel])
```

**Nota:** Usar `onWheel={handleWheel}` no JSX não funciona para `preventDefault()`
no Chrome porque React registra como passive. A solução é usar `addEventListener`
diretamente com `{ passive: false }`.

### Limites de Pan

O pan deve ser limitado para que o stage não "saia" do container:

```typescript
function clampPan(
  offset: Position,
  stageSize: Size,
  containerSize: Size,
  zoom: number
): Position {
  const minX = -(stageSize.width * zoom - containerSize.width)
  const minY = -(stageSize.height * zoom - containerSize.height)
  const maxX = 0
  const maxY = 0

  return {
    x: clamp(offset.x, minX, maxX),
    y: clamp(offset.y, minY, maxY),
  }
}
```

**Nota:** Essa limitação é aplicada no `updatePan` do hook usePanZoom.

---

## Testes

### usePanZoom

- Offset inicial é {x: 0, y: 0}
- Zoom inicial é 1
- Zoom in aumenta zoom (deltaY negativo com ctrlKey)
- Zoom out diminui zoom (deltaY positivo com ctrlKey)
- Zoom respeita minZoom e maxZoom
- Zoom centrado no ponto do mouse
- Pan via wheel (ctrlKey=false, deltaMode=0) funciona (trackpad)
- Pan via wheel (ctrlKey=false, deltaMode=1) funciona (mouse wheel)
- Pan normaliza deltaMode=1 multiplicando por 16
- Pan normaliza deltaMode=2 multiplicando por 400
- Pan é limitado pelos bounds do stage
- screenToStage e stageToScreen são inversos um do outro
- screenToStage({x: 0, y: 0}) retorna posição relativa ao offset

### Stage

- Renderiza children
- Aplica transform CSS correta (translate + scale)
- Renderiza grid quando gridVisible é true
- Não renderiza grid quando gridVisible é false
- Auto-sizing cresce quando nodes se aproximam das bordas
- Auto-sizing usa tamanho do container quando não há nodes
- Tamanho mínimo é o tamanho do container

### Integração Mouse vs Trackpad

- Mouse: pointerDown no fundo inicia pan, wheel faz zoom (se ctrl pressionado)
- Trackpad: two-finger scroll (wheel sem ctrl) faz pan
- Trackpad: pinch (wheel com ctrl) faz zoom
- Wheel events são capturados no Stage e tratados pelo usePanZoom
