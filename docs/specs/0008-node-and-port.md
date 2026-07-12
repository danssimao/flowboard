# 0008 - Node & Port

## Objetivo

Nodes são elementos arrastáveis no Stage que renderizam componentes customizados
do consumidor. Cada node possui 4 ports (top, right, bottom, left) que servem
como pontos de conexão para arestas.

> **Compound Pattern:** No modo compound, estes componentes são expostos como
> `Flowboard.Node` e `Flowboard.Node.Port`. No modo simples, são renderizados
> internamente pelo `Flowboard` root.

## Dependências

- 0001 (Types)
- 0002 (Theme)
- 0003 (Utils)
- 0004 (Context)
- 0006 (Stage — para coordenadas)

## Arquivos a Criar

- `lib/components/Node/Node.tsx`
- `lib/components/Node/Node.module.css`
- `lib/components/Node/Node.test.tsx`
- `lib/components/Port/Port.tsx`
- `lib/components/Port/Port.module.css`
- `lib/components/Port/Port.test.tsx`
- `lib/hooks/useDragNode.ts`
- `lib/hooks/useDragNode.test.ts`

---

## useDragNode Hook

### Parâmetros

```typescript
interface UseDragNodeOptions {
  nodeId: string;
  position: Position;
  size: Size;
  zoom: number;
}
```

### Retorno

```typescript
interface UseDragNodeReturn {
  handlePointerDown: (e: React.PointerEvent) => void;
  isDragging: boolean;
}
```

### Implementação

```typescript
import { useCallback, useRef, useState } from 'react';
import { useFlowboardActions } from './useFlowboardActions';
import { useFlowboard } from './useFlowboard';
import { clamp, snapToGrid } from '../utils/geometry';

export function useDragNode({
  nodeId,
  position,
  size,
  zoom,
}: UseDragNodeOptions) {
  const { state, theme } = useFlowboard();
  const actions = useFlowboardActions();
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{
    startPos: Position;
    nodeStartPos: Position;
  } | null>(null);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();

      dragRef.current = {
        startPos: { x: e.clientX, y: e.clientY },
        nodeStartPos: { ...position },
      };

      setIsDragging(true);
      actions.setDragState({
        type: 'node',
        nodeId,
        startPos: { x: e.clientX, y: e.clientY },
        currentPos: { x: e.clientX, y: e.clientY },
      });
      actions.selectNode(nodeId);

      // Capturar pointer para receber eventos mesmo fora do elemento
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [nodeId, position, actions],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current) return;

      const dx = (e.clientX - dragRef.current.startPos.x) / zoom;
      const dy = (e.clientY - dragRef.current.startPos.y) / zoom;

      let newPos = {
        x: dragRef.current.nodeStartPos.x + dx,
        y: dragRef.current.nodeStartPos.y + dy,
      };

      // Aplicar snap-to-grid se habilitado
      if (state.snapEnabled) {
        newPos = snapToGrid(newPos, theme.stage.gridSize);
      }

      // Limitar aos bounds do stage (x >= 0, y >= 0)
      newPos = {
        x: Math.max(0, newPos.x),
        y: Math.max(0, newPos.y),
      };

      actions.moveNode(nodeId, newPos);
    },
    [nodeId, zoom, state.snapEnabled, theme.stage.gridSize, actions],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current) return;

      setIsDragging(false);
      dragRef.current = null;
      actions.setDragState(null);
    },
    [actions],
  );

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    isDragging,
  };
}
```

### Lógica

```
1. pointerDown no node:
   - Salvar posição inicial do mouse e do node
   - Set isDragging = true
   - Dispatch SET_DRAG_STATE com type 'node'
   - Dispatch SET_SELECTED_NODE
   - setPointerCapture para receber eventos globais

2. pointerMove (capturado pelo elemento):
   - Calcular delta = (currentPos - startPos) / zoom
   - Nova posição = startPos + delta
   - Aplica snap-to-grid se habilitado
   - Limitar x >= 0, y >= 0
   - Dispatch MOVE_NODE com nova posição

3. pointerUp:
   - Set isDragging = false
   - Dispatch SET_DRAG_STATE null
```

---

## Node Component

### Props

```typescript
interface NodeProps<TData> {
  node: Node<TData>;
  nodeComponent: React.ComponentType<NodeRenderProps<TData>>;
  zoom: number;
}
```

### Comportamento

- Posicionamento `position: absolute` com `left: node.position.x`, `top: node.position.y`
- Renderiza o componente customizado via `nodeComponent`
- Passa `node` e `selected` como props ao componente customizado
- Highlight visual quando selecionado (borda + shadow do tema)
- Arrastável via `useDragNode`
- Renderiza 4 `Port` como filhos
- z-index: nodes arrastando ficam acima de outros
- `data-node` attribute para identificação no Container

### Implementação

```typescript
import { useMemo } from 'react'
import { useFlowboard } from '../../hooks/useFlowboard'
import { useDragNode } from '../../hooks/useDragNode'
import { Port } from '../Port/Port'
import type { Node, NodeRenderProps, PortId } from '../../types'
import styles from './Node.module.css'
import classNames from 'classnames'

interface NodeProps<TData> {
  node: Node<TData>
  nodeComponent: React.ComponentType<NodeRenderProps<TData>>
  zoom: number
}

const PORT_IDS: PortId[] = ['top', 'right', 'bottom', 'left']

export function Node<TData>({ node, nodeComponent: NodeComponent, zoom }: NodeProps<TData>) {
  const { state, theme } = useFlowboard()
  const selected = state.selectedNodeId === node.id

  const nodeSize = useMemo(
    () => ({
      width: node.size?.width ?? theme.node.minWidth,
      height: node.size?.height ?? theme.node.minHeight,
    }),
    [node.size, theme.node]
  )

  const { handlePointerDown, handlePointerMove, handlePointerUp, isDragging } =
    useDragNode({
      nodeId: node.id,
      position: node.position,
      size: nodeSize,
      zoom,
    })

  return (
    <div
      data-node
      data-node-id={node.id}
      className={classNames(styles.node, selected && styles.nodeSelected)}
      style={{
        left: node.position.x,
        top: node.position.y,
        width: nodeSize.width,
        height: nodeSize.height,
        zIndex: isDragging ? 1000 : 1,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div className={styles.content}>
        <NodeComponent node={node} selected={selected} />
      </div>
      {PORT_IDS.map((portId) => (
        <Port
          key={portId}
          nodeId={node.id}
          portId={portId}
          nodeSize={nodeSize}
          zoom={zoom}
        />
      ))}
    </div>
  )
}
```

### CSS Module

```css
.node {
  position: absolute;
  cursor: grab;
  user-select: none;
  touch-action: none;
}

.node:active {
  cursor: grabbing;
}

.nodeSelected {
  border-color: var(--node-selected-border-color);
  border-width: var(--node-selected-border-width);
  box-shadow: var(--node-selected-box-shadow);
}

.content {
  width: 100%;
  height: 100%;
  pointer-events: none;
  box-sizing: border-box;
  border: var(--node-border-width) solid var(--node-border-color);
  border-radius: var(--node-border-radius);
  background: var(--node-background);
  box-shadow: var(--node-box-shadow);
  padding: var(--node-padding);
}
```

### CSS Variables

```css
.node {
  --node-background: #ffffff;
  --node-border-color: #dee2e6;
  --node-border-width: 1px;
  --node-border-radius: 8px;
  --node-box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
  --node-selected-border-color: #4dabf7;
  --node-selected-border-width: 2px;
  --node-selected-box-shadow: 0 0 0 2px rgba(77, 171, 247, 0.25);
  --node-padding: 12px;
}
```

---

## Port Component

### Props

```typescript
interface PortProps {
  nodeId: string;
  portId: PortId;
  nodeSize: Size;
  zoom: number;
}
```

### Comportamento

- Posicionamento absolute relativo ao node (4 posições possíveis)
- Indicador visual: círculo com tamanho do tema
- Hover: muda cor (theme port hover)
- pointerDown: inicia criação de edge (dispatch SET_DRAG_STATE com type 'edge-create')
- **Importante:** `e.stopPropagation()` para não iniciar drag do node pai
- `data-port` attribute para identificação no Container

### Posicionamento dos Ports

```
        top: left: 50%, top: -halfPortSize
              transform: translateX(-50%)

    ┌─────────────────────┐
    │                     │
left:│                     │:right
left:│                     │:right
top: -halfPortSize        │ top: -halfPortSize
    │                     │
    └─────────────────────┘
              │
        bottom: left: 50%, bottom: -halfPortSize
              transform: translateX(-50%)
```

### Implementação

```typescript
import { useCallback } from 'react'
import { useFlowboard } from '../../hooks/useFlowboard'
import { useFlowboardActions } from '../../hooks/useFlowboardActions'
import { generateId } from '../../utils/uuid'
import type { PortId, Size } from '../../types'
import styles from './Port.module.css'
import classNames from 'classnames'

interface PortProps {
  nodeId: string
  portId: PortId
  nodeSize: Size
  zoom: number
}

export function Port({ nodeId, portId, nodeSize, zoom }: PortProps) {
  const { theme } = useFlowboard()
  const actions = useFlowboardActions()

  const halfPort = theme.port.size / 2

  const positionStyle = (() => {
    switch (portId) {
      case 'top':
        return {
          top: -halfPort,
          left: nodeSize.width / 2 - halfPort,
        }
      case 'right':
        return {
          top: nodeSize.height / 2 - halfPort,
          right: -halfPort,
        }
      case 'bottom':
        return {
          bottom: -halfPort,
          left: nodeSize.width / 2 - halfPort,
        }
      case 'left':
        return {
          top: nodeSize.height / 2 - halfPort,
          left: -halfPort,
        }
    }
  })()

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      e.stopPropagation()

      actions.setDragState({
        type: 'edge-create',
        edgeId: generateId(),
        source: { nodeId, port: portId },
        mousePos: { x: e.clientX, y: e.clientY },
      })
    },
    [nodeId, portId, actions]
  )

  return (
    <div
      data-port
      data-port-node-id={nodeId}
      data-port-id={portId}
      className={classNames(styles.port, styles[`port${portId.charAt(0).toUpperCase() + portId.slice(1)}`])}
      style={positionStyle}
      onPointerDown={handlePointerDown}
    />
  )
}
```

### CSS Module

```css
.port {
  position: absolute;
  width: var(--port-size);
  height: var(--port-size);
  border-radius: 50%;
  background: var(--port-background);
  border: 2px solid var(--port-border-color);
  cursor: crosshair;
  z-index: 5;
  transition:
    background 0.15s,
    border-color 0.15s;
  pointer-events: auto;
}

.port:hover {
  background: var(--port-hover-background);
  border-color: var(--port-hover-border-color);
}

.portActive {
  background: var(--port-active-background);
  border-color: var(--port-active-border-color);
}
```

### CSS Variables

```css
.port {
  --port-size: 12px;
  --port-background: #ffffff;
  --port-border-color: #adb5bd;
  --port-hover-background: #4dabf7;
  --port-hover-border-color: #4dabf7;
  --port-active-background: #228be6;
  --port-active-border-color: #228be6;
}
```

---

## Testes

### useDragNode

- pointerDown inicia drag (isDragging = true)
- pointerDown cria dragState com type 'node'
- pointerDown seleciona o node
- pointerMove atualiza posição do node
- Divide delta pelo zoom para compensar escala
- Aplica snap-to-grid quando habilitado
- Limita posição a x >= 0, y >= 0
- pointerUp finaliza drag (isDragging = false)
- pointerUp limpa dragState

### Node

- Renderiza componente customizado
- Posiciona node na posição correta (left, top)
- Aplica tamanho correto (width, height)
- Aplica classe selected quando selecionado
- Aplica estilos do tema (border, shadow)
- Renderiza 4 ports
- z-index alto quando arrastando
- data-node attribute está presente
- data-node-id attribute está presente

### Port

- Renderiza na posição correta (top/right/bottom/left)
- Cálculo de posição usa halfPortSize
- Hover aplica estilo do tema
- pointerDown inicia drag de edge (type 'edge-create')
- .stopPropagation() impede drag do node pai
- data-port attribute está presente
- data-port-node-id attribute está presente
- data-port-id attribute está presente
- Usa generateId para edgeId temporário
