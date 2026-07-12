# 0009 - Edge & Target

## Objetivo

Edges são linhas retas que conectam dois ports de nodes diferentes.
O Target é um elemento que segue o cursor durante operações de drag
(menu→stage, criação de edge, desconexão de edge).

> **Render Engine:** O motor de renderização de edges é extensível via
> `EdgeRenderEngine`. O padrão é HTML+CSS, mas podem ser usados SVG ou Canvas.
> Veja `0011-render-engines.md` para mais detalhes.

> **Compound Pattern:** No modo compound, estes componentes são expostos como
> `Flowboard.Edge` e `Flowboard.Target`. No modo simples, são renderizados
> internamente pelo `Flowboard` root.

## Dependências

- 0001 (Types)
- 0002 (Theme)
- 0003 (Utils)
- 0004 (Context)
- 0006 (Stage)

## Arquivos a Criar

- `lib/components/Edge/Edge.tsx`
- `lib/components/Edge/Edge.module.css`
- `lib/components/Edge/Edge.test.tsx`
- `lib/components/Target/Target.tsx`
- `lib/components/Target/Target.module.css`
- `lib/components/Target/Target.test.tsx`
- `lib/hooks/useDragEdge.ts`
- `lib/hooks/useDragEdge.test.ts`

---

## useDragEdge Hook

### Estado

```typescript
interface DragEdgeState {
  edgeId: string | null;
  source: EdgeEndpoint | null;
  target: EdgeEndpoint | null;
  mousePosition: Position;
  mode: 'create' | 'disconnect';
}
```

### Retorno

```typescript
interface UseDragEdgeReturn {
  startCreate: (source: EdgeEndpoint, mousePos: Position) => void;
  updateMouse: (pos: Position) => void;
  completeConnection: (target: EdgeEndpoint) => void;
  cancelDrag: () => void;
  dragState: DragEdgeState | null;
}
```

### Implementação

```typescript
import { useCallback } from 'react';
import { useFlowboard } from './useFlowboard';
import { useFlowboardActions } from './useFlowboardActions';
import { generateId } from '../utils/uuid';

export function useDragEdge() {
  const { state } = useFlowboard();
  const actions = useFlowboardActions();

  const startCreate = useCallback(
    (source: EdgeEndpoint, mousePos: Position) => {
      actions.setDragState({
        type: 'edge-create',
        edgeId: generateId(),
        source,
        mousePos,
      });
    },
    [actions],
  );

  const updateMouse = useCallback(
    (pos: Position) => {
      if (!state.dragState) return;

      if (state.dragState.type === 'edge-create') {
        actions.setDragState({
          ...state.dragState,
          mousePos: pos,
        });
      } else if (state.dragState.type === 'edge-disconnect') {
        actions.setDragState({
          ...state.dragState,
          mousePos: pos,
        });
      }
    },
    [state.dragState, actions],
  );

  const completeConnection = useCallback(
    (target: EdgeEndpoint) => {
      if (!state.dragState) return;

      if (state.dragState.type === 'edge-create') {
        // Validar: não auto-conexão
        if (state.dragState.source.nodeId === target.nodeId) {
          actions.setDragState(null);
          return;
        }

        actions.addEdge({
          id: state.dragState.edgeId,
          source: state.dragState.source,
          target,
          data: {},
        });
      } else if (state.dragState.type === 'edge-disconnect') {
        // Reconectar o endpoint desconectado
        const update =
          state.dragState.disconnectedSide === 'source'
            ? { source: target }
            : { target };

        actions.updateEdge(state.dragState.edgeId, update);
      }

      actions.setDragState(null);
    },
    [state.dragState, actions],
  );

  const cancelDrag = useCallback(() => {
    if (state.dragState?.type === 'edge-disconnect') {
      // Se estava desconectando e cancelou, remover a edge
      actions.removeEdge(state.dragState.edgeId);
    }
    actions.setDragState(null);
  }, [state.dragState, actions]);

  return {
    startCreate,
    updateMouse,
    completeConnection,
    cancelDrag,
    dragState:
      state.dragState?.type === 'edge-create' ||
      state.dragState?.type === 'edge-disconnect'
        ? state.dragState
        : null,
  };
}
```

### Lógica de Criação (port → port)

```
1. Usuário faz pointerDown em um Port
2. Port chama startCreate({ nodeId, port }, mousePos)
3. Edge temporário é exibida (source fixo, target = mousePos)
4. Target mostra preview da aresta
5. Se mouse passa sobre outro Port (hover):
   - Port fica ativo (highlight via classe CSS)
   - Se mouse faz pointerUp nesse Port:
     a. Valida: source.nodeId !== target.nodeId
     b. Dispatch ADD_EDGE com:
        - id: UUID gerado no startCreate
        - source: endpoint original
        - target: endpoint do port de destino
        - data: {}
     c. Dispatch SET_DRAG_STATE null
6. Se mouse faz pointerUp fora de qualquer Port:
   - cancelDrag() — edge não é criada
```

### Lógica de Desconexão

```
1. Usuário faz pointerDown em uma ponta de edge conectada
   (handle invisible no endpoint da edge)
2. Determinar qual endpoint está mais próximo do clique
3. Dispatch DISCONNECT_EDGE com o lado correspondente
4. Edge fica com um endpoint null
5. O endpoint desconectado segue o mouse
6. Se mouse hover em um Port válido:
   - Port fica ativo (highlight)
   - Se pointerUp nesse Port:
     a. Atualiza o endpoint desconectado via UPDATE_EDGE
     b. Valida: não auto-conexão
     c. Edge é reconectada
7. Se pointerUp fora:
   - cancelDrag() — Dispatch REMOVE_EDGE (edge é removida)
```

### Validação de Auto-conexão

```typescript
function isValidConnection(
  source: EdgeEndpoint,
  target: EdgeEndpoint,
  existingEdges: Edge[],
): boolean {
  // Não pode conectar um node consigo mesmo
  if (source.nodeId === target.nodeId) return false;

  // Pode haver múltiplas arestas entre o mesmo par de nodes (multigraph)
  // Então não precisamos verificar duplicatas

  return true;
}
```

---

## Edge Component

### Props

```typescript
interface EdgeProps<TData> {
  edge: Edge<TData>;
  edgeComponent?: React.ComponentType<EdgeRenderProps<TData>>;
  sourcePosition: Position;
  targetPosition: Position;
  selected: boolean;
  zoom: number;
}
```

### Comportamento

- Renderiza uma linha reta entre sourcePosition e targetPosition
- Implementação HTML+CSS:
  - Calcula ângulo e comprimento da linha
  - Usa `transform: rotate()` e `width` para posicionar
- Se `edgeComponent` é fornecido, renderiza o componente customizado
- Caso contrário, renderiza linha reta padrão
- Destaque visual quando selecionado
- Handle invisível nos endpoints para desconexão
- `data-edge` attribute para identificação no Container

### Cálculo da Linha Reta

```typescript
function calcLineStyle(
  from: Position,
  to: Position,
  strokeWidth: number,
  color: string,
): React.CSSProperties {
  const length = calcLineLength(from, to);
  const angle = calcLineAngle(from, to);

  return {
    position: 'absolute',
    left: from.x,
    top: from.y - strokeWidth / 2,
    width: length,
    height: strokeWidth,
    background: color,
    transformOrigin: '0 50%',
    transform: `rotate(${angle}deg)`,
    borderRadius: strokeWidth / 2,
    pointerEvents: 'none',
  };
}
```

### Implementação

```typescript
import { useMemo } from 'react'
import { useFlowboard } from '../../hooks/useFlowboard'
import { calcLineLength, calcLineAngle } from '../../utils/geometry'
import type { Edge, EdgeRenderProps, Position } from '../../types'
import styles from './Edge.module.css'
import classNames from 'classnames'

interface EdgeProps<TData> {
  edge: Edge<TData>
  edgeComponent?: React.ComponentType<EdgeRenderProps<TData>>
  sourcePosition: Position
  targetPosition: Position
  selected: boolean
  zoom: number
}

export function Edge<TData>({
  edge,
  edgeComponent: EdgeComponent,
  sourcePosition,
  targetPosition,
  selected,
  zoom,
}: EdgeProps<TData>) {
  const { theme } = useFlowboard()

  const lineStyle = useMemo(() => {
    const strokeWidth = selected ? theme.edge.selectedStrokeWidth : theme.edge.strokeWidth
    const color = selected ? theme.edge.selectedStroke : theme.edge.stroke
    const length = calcLineLength(sourcePosition, targetPosition)
    const angle = calcLineAngle(sourcePosition, targetPosition)

    return {
      position: 'absolute' as const,
      left: sourcePosition.x,
      top: sourcePosition.y - strokeWidth / 2,
      width: length,
      height: strokeWidth,
      background: color,
      transformOrigin: '0 50%',
      transform: `rotate(${angle}deg)`,
      borderRadius: strokeWidth / 2,
    }
  }, [sourcePosition, targetPosition, selected, theme.edge])

  // Se há componente customizado, renderiza ele
  if (EdgeComponent) {
    return (
      <EdgeComponent
        edge={edge}
        selected={selected}
        sourcePosition={sourcePosition}
        targetPosition={targetPosition}
      />
    )
  }

  return (
    <div
      data-edge
      data-edge-id={edge.id}
      className={classNames(styles.edge, selected && styles.edgeSelected)}
      style={lineStyle}
    >
      {/* Handle de desconexão na origem */}
      <div
        className={styles.handle}
        data-edge-handle="source"
        style={{
          left: -6,
          top: -6 + (selected ? theme.edge.selectedStrokeWidth : theme.edge.strokeWidth) / 2,
        }}
      />
      {/* Handle de desconexão no destino */}
      <div
        className={styles.handle}
        data-edge-handle="target"
        style={{
          right: -6,
          top: -6 + (selected ? theme.edge.selectedStrokeWidth : theme.edge.strokeWidth) / 2,
        }}
      />
    </div>
  )
}
```

### CSS Module

```css
.edge {
  position: absolute;
  transform-origin: 0 50%;
  pointer-events: auto;
  cursor: pointer;
  z-index: 1;
}

.edgeSelected {
  z-index: 2;
}

.handle {
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: transparent;
  cursor: grab;
  z-index: 10;
  pointer-events: auto;
}

.handle:hover {
  background: var(--port-hover-background);
}
```

---

## Target Component

### Props

```typescript
interface TargetProps {
  // Sem props externas — lê do context
}
```

### Comportamento

- Elemento 1:1 dentro do Container
- Segue o cursor quando `dragState` não é null
- Posicionamento: `position: fixed` relativo à viewport
- Conteúdo varia conforme o tipo de drag:
  - `menu-drag`: mostra preview do node sendo criado (caixa com nome do tipo)
  - `edge-create`: mostra marcador visual no endpoint (círculo)
  - `edge-disconnect`: mostra marcador visual no endpoint (círculo)
  - `node`: (não mostra target — node já é visível)
  - `pan`: (não mostra target)

### Implementação

```typescript
import { useFlowboard } from '../../hooks/useFlowboard'
import styles from './Target.module.css'
import classNames from 'classnames'

export function Target() {
  const { state, theme } = useFlowboard()
  const { dragState } = state

  if (!dragState) return null
  if (dragState.type === 'pan' || dragState.type === 'node') return null

  const pos = dragState.type === 'menu-drag' || dragState.type === 'edge-create' || dragState.type === 'edge-disconnect'
    ? dragState.mousePos
    : null

  if (!pos) return null

  return (
    <div
      className={classNames(styles.target, styles.targetDrag)}
      style={{
        left: pos.x,
        top: pos.y,
        transform: 'translate(-50%, -50%)',
      }}
    >
      {dragState.type === 'menu-drag' && (
        <div className={styles.menuPreview}>
          {dragState.nodeType}
        </div>
      )}
      {(dragState.type === 'edge-create' || dragState.type === 'edge-disconnect') && (
        <div className={styles.edgePreview} />
      )}
    </div>
  )
}
```

### CSS Module

```css
.target {
  position: fixed;
  pointer-events: none;
  z-index: 10000;
  opacity: 0.8;
}

.targetDrag {
  opacity: 1;
}

.menuPreview {
  background: var(--node-background);
  border: 2px dashed var(--node-selected-border-color);
  border-radius: var(--node-border-radius);
  padding: 8px 12px;
  font-size: 14px;
  color: var(--node-border-color);
  white-space: nowrap;
}

.edgePreview {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--port-active-background);
  border: 2px solid var(--port-active-border-color);
}
```

---

## Renderização dentro do Stage (edges existentes)

Edges já criados são renderizados como filhos do Stage:

```typescript
// Dentro de Stage.tsx
{edges.map((edge) => {
  if (!edge.source || !edge.target) return null

  const sourceNode = nodes.find((n) => n.id === edge.source!.nodeId)
  const targetNode = nodes.find((n) => n.id === edge.target!.nodeId)
  if (!sourceNode || !targetNode) return null

  const sourcePos = getPortAbsolutePosition(sourceNode, edge.source.port, theme.port.size)
  const targetPos = getPortAbsolutePosition(targetNode, edge.target.port, theme.port.size)

  return (
    <Edge
      key={edge.id}
      edge={edge}
      sourcePosition={sourcePos}
      targetPosition={targetPos}
      selected={selectedEdgeId === edge.id}
      zoom={zoom}
    />
  )
})}
```

### Preview de Edge em Criação

Durante a criação de uma edge (dragState.type === 'edge-create'),
uma edge temporária é renderizada conectando o source ao mouse:

```typescript
{dragState?.type === 'edge-create' && (() => {
  const sourceNode = nodes.find((n) => n.id === dragState.source.nodeId)
  if (!sourceNode) return null

  const sourcePos = getPortAbsolutePosition(sourceNode, dragState.source.port, theme.port.size)
  // targetPos é a posição do mouse convertida para coordenadas do stage
  const targetPos = screenToStage(dragState.mousePos)

  return (
    <Edge
      key="temp-edge"
      edge={{ id: 'temp', source: dragState.source, target: null, data: {} }}
      sourcePosition={sourcePos}
      targetPosition={targetPos}
      selected={false}
      zoom={zoom}
    />
  )
})()}
```

---

## Testes

### useDragEdge

- startCreate inicializa estado de criação com source correto
- startCreate gera UUID para edgeId
- completeConnection cria edge no state com source e target
- Validação de auto-conexão (source.nodeId === target.nodeId) rejeita
- cancelDrag limpa estado
- cancelDrag em modo disconnect remove a edge
- updateMouse atualiza mousePos

### Edge

- Renderiza linha reta entre dois pontos
- Calcula ângulo correto (0°, 90°, 45°)
- Calcula comprimento correto
- Aplica estilo selecionado (cor e largura diferentes)
- Renderiza handles de desconexão
- data-edge attribute está presente
- data-edge-id attribute está presente

### Target

- Não renderiza quando dragState é null
- Não renderiza quando dragState.type é 'pan' ou 'node'
- Renderiza preview do menu durante menu-drag
- Renderiza preview da aresta durante edge-create
- Renderiza preview da aresta durante edge-disconnect
- Posiciona-se na posição do mouse (left, top)
- pointer-events: none (não interfere com其他 interações)
- z-index alto (acima de tudo)
