# 0004 - Context & State

## Objetivo

Gerenciar o estado centralizado do Flowboard com React Context + useReducer.
O componente é "controlled": o estado é mantido internamente mas sincronizado
com as props externas via callbacks (`onNodesChange`, `onEdgesChange`).

## Dependências

- 0001 (Types)
- 0002 (Theme)
- 0003 (Utils)

## Arquivos a Criar

- `lib/context/FlowboardContext.tsx`
- `lib/hooks/useFlowboard.ts`
- `lib/hooks/useFlowboard.test.ts`

---

## FlowboardContext

### Context Value

```typescript
interface FlowboardContextValue<TNode, TEdge> {
  state: FlowboardState<TNode, TEdge>
  theme: FlowboardTheme
  dispatch: React.Dispatch<FlowboardAction<TNode, TEdge>>
  minZoom: number
  maxZoom: number
  defaultNodeSize: Size
}
```

### Provider Props

```typescript
interface FlowboardProviderProps<TNode, TEdge> {
  children: React.ReactNode
  initialState: FlowboardState<TNode, TEdge>
  theme: FlowboardTheme
  minZoom: number
  maxZoom: number
}
```

O `FlowboardProvider` envolve todo o Flowboard e fornece o contexto para
todos os componentes filhos (Stage, Nodes, Edges, Menu, etc.).

### Implementação

```typescript
import { createContext, useContext, useReducer, useMemo } from 'react'
import type { FlowboardState, FlowboardAction } from '../types'
import type { FlowboardTheme } from '../theme/types'
import type { Size } from '../types'

const FlowboardContext = createContext<FlowboardContextValue<any, any> | null>(null)

export function FlowboardProvider<TNode, TEdge>({
  children,
  initialState,
  theme,
  minZoom,
  maxZoom,
}: FlowboardProviderProps<TNode, TEdge>) {
  const [state, dispatch] = useReducer(flowboardReducer, initialState)

  const value = useMemo<FlowboardContextValue<TNode, TEdge>>(
    () => ({
      state,
      theme,
      dispatch,
      minZoom,
      maxZoom,
      defaultNodeSize: { width: theme.node.minWidth, height: theme.node.minHeight },
    }),
    [state, theme, minZoom, maxZoom]
  )

  return (
    <FlowboardContext.Provider value={value}>
      {children}
    </FlowboardContext.Provider>
  )
}
```

---

## Reducer

```typescript
function flowboardReducer<TNode, TEdge>(
  state: FlowboardState<TNode, TEdge>,
  action: FlowboardAction<TNode, TEdge>
): FlowboardState<TNode, TEdge> {
  switch (action.type) {
    case 'SET_NODES':
      return { ...state, nodes: action.payload }

    case 'SET_EDGES':
      return { ...state, edges: action.payload }

    case 'ADD_NODE':
      return { ...state, nodes: [...state.nodes, action.payload] }

    case 'MOVE_NODE':
      return {
        ...state,
        nodes: state.nodes.map((n) =>
          n.id === action.payload.id
            ? { ...n, position: action.payload.position }
            : n
        ),
      }

    case 'RESIZE_NODE':
      return {
        ...state,
        nodes: state.nodes.map((n) =>
          n.id === action.payload.id
            ? { ...n, size: action.payload.size }
            : n
        ),
      }

    case 'REMOVE_NODE': {
      const nodeId = action.payload.id
      return {
        ...state,
        nodes: state.nodes.filter((n) => n.id !== nodeId),
        edges: state.edges.filter(
          (e) =>
            e.source?.nodeId !== nodeId &&
            e.target?.nodeId !== nodeId
        ),
        selectedNodeId:
          state.selectedNodeId === nodeId ? null : state.selectedNodeId,
      }
    }

    case 'ADD_EDGE':
      return { ...state, edges: [...state.edges, action.payload] }

    case 'UPDATE_EDGE':
      return {
        ...state,
        edges: state.edges.map((e) => {
          if (e.id !== action.payload.id) return e
          return {
            ...e,
            ...(action.payload.source !== undefined && { source: action.payload.source }),
            ...(action.payload.target !== undefined && { target: action.payload.target }),
          }
        }),
      }

    case 'DISCONNECT_EDGE':
      return {
        ...state,
        edges: state.edges.map((e) => {
          if (e.id !== action.payload.edgeId) return e
          if (action.payload.side === 'source') {
            return { ...e, source: null }
          }
          return { ...e, target: null }
        }),
      }

    case 'REMOVE_EDGE':
      return {
        ...state,
        edges: state.edges.filter((e) => e.id !== action.payload.id),
        selectedEdgeId:
          state.selectedEdgeId === action.payload.id
            ? null
            : state.selectedEdgeId,
      }

    case 'SET_SELECTED_NODE':
      return {
        ...state,
        selectedNodeId: action.payload.id,
        selectedEdgeId: null,
      }

    case 'SET_SELECTED_EDGE':
      return {
        ...state,
        selectedEdgeId: action.payload.id,
        selectedNodeId: null,
      }

    case 'SET_ZOOM':
      return { ...state, zoom: action.payload }

    case 'SET_PAN':
      return { ...state, panOffset: action.payload }

    case 'SET_SNAP_ENABLED':
      return { ...state, snapEnabled: action.payload }

    case 'SET_DRAG_STATE':
      return { ...state, dragState: action.payload }

    default:
      return state
  }
}
```

### Comportamento do Reducer

- **REMOVE_NODE**: Remove o node e todas as arestas conectadas a ele
- **DISCONNECT_EDGE**: Define um dos endpoints como null (edge fica "flutuando")
- **SET_SELECTED_NODE**: Seleciona o node e deseleciona qualquer edge
- **SET_SELECTED_EDGE**: Seleciona a edge e deseleciona qualquer node
- **SET_DRAG_STATE**: Atualiza o estado de arrasto global

---

## Hook useFlowboard

```typescript
export function useFlowboard<TNode = Record<string, unknown>, TEdge = Record<string, unknown>>() {
  const context = useContext(FlowboardContext)
  if (!context) {
    throw new Error('useFlowboard must be used within a FlowboardProvider')
  }
  return context as FlowboardContextValue<TNode, TEdge>
}
```

---

## Hook useFlowboardActions (complementar)

Para simplificar o uso pelos componentes, um hook que retorna apenas as
ações (dispatches) prontas:

```typescript
export function useFlowboardActions<TNode, TEdge>() {
  const { dispatch, state } = useFlowboard<TNode, TEdge>()

  return useMemo(() => ({
    addNode: (node: Node<TNode>) =>
      dispatch({ type: 'ADD_NODE', payload: node }),

    removeNode: (id: string) =>
      dispatch({ type: 'REMOVE_NODE', payload: { id } }),

    moveNode: (id: string, position: Position) =>
      dispatch({ type: 'MOVE_NODE', payload: { id, position } }),

    addEdge: (edge: Edge<TEdge>) =>
      dispatch({ type: 'ADD_EDGE', payload: edge }),

    removeEdge: (id: string) =>
      dispatch({ type: 'REMOVE_EDGE', payload: { id } }),

    updateEdge: (id: string, update: { source?: EdgeEndpoint | null; target?: EdgeEndpoint | null }) =>
      dispatch({ type: 'UPDATE_EDGE', payload: { id, ...update } }),

    disconnectEdge: (edgeId: string, side: 'source' | 'target') =>
      dispatch({ type: 'DISCONNECT_EDGE', payload: { edgeId, side } }),

    selectNode: (id: string | null) =>
      dispatch({ type: 'SET_SELECTED_NODE', payload: { id } }),

    selectEdge: (id: string | null) =>
      dispatch({ type: 'SET_SELECTED_EDGE', payload: { id } }),

    setZoom: (zoom: number) =>
      dispatch({ type: 'SET_ZOOM', payload: zoom }),

    setPan: (offset: Position) =>
      dispatch({ type: 'SET_PAN', payload: offset }),

    setSnapEnabled: (enabled: boolean) =>
      dispatch({ type: 'SET_SNAP_ENABLED', payload: enabled }),

    setDragState: (dragState: DragState | null) =>
      dispatch({ type: 'SET_DRAG_STATE', payload: dragState }),
  }), [dispatch])
}
```

---

## Hook useFlowboardSync

Sincroniza o estado interno com as props externas. Chamado no componente
Flowboard root.

```typescript
export function useFlowboardSync<TNode, TEdge>(
  nodes: Node<TNode>[],
  edges: Edge<TEdge>[],
  onNodesChange: (nodes: Node<TNode>[]) => void,
  onEdgesChange: (edges: Edge<TEdge>[]) => void
) {
  const { state } = useFlowboard<TNode, TEdge>()
  const prevNodesRef = useRef(state.nodes)
  const prevEdgesRef = useRef(state.edges)

  useEffect(() => {
    if (prevNodesRef.current !== state.nodes) {
      prevNodesRef.current = state.nodes
      onNodesChange(state.nodes)
    }
  }, [state.nodes, onNodesChange])

  useEffect(() => {
    if (prevEdgesRef.current !== state.edges) {
      prevEdgesRef.current = state.edges
      onEdgesChange(state.edges)
    }
  }, [state.edges, onEdgesChange])
}
```

**Importante:** A comparação usa referência (`!==`) pois o reducer sempre
cria novos arrays/objetos quando há mudança. Isso evita loops infinitos.

---

## Testes

### FlowboardContext

- Provider renderiza children corretamente
- Provider sem initialState não quebra (usa undefined, mas reducer inicializa)

### useFlowboard

- Retorna state inicial correto com todos os campos
- Dispara erro quando usado fora do Provider

### Reducer - Nodes

- `SET_NODES` substitui a lista de nodes
- `ADD_NODE` adiciona node à lista
- `MOVE_NODE` atualiza posição do node correto
- `RESIZE_NODE` atualiza tamanho do node correto
- `MOVE_NODE` com id inexistente não altera nada
- `REMOVE_NODE` remove o node
- `REMOVE_NODE` remove arestas conectadas ao node removido
- `REMOVE_NODE` deseleciona o node se estava selecionado

### Reducer - Edges

- `SET_EDGES` substitui a lista de arestas
- `ADD_EDGE` adiciona edge à lista
- `UPDATE_EDGE` atualiza source e/ou target
- `DISCONNECT_EDGE` com side='source' zera o source
- `DISCONNECT_EDGE` com side='target' zera o target
- `REMOVE_EDGE` remove a edge
- `REMOVE_EDGE` deseleciona a edge se estava selecionada

### Reducer - Seleção

- `SET_SELECTED_NODE` seleciona node e deseleciona edge
- `SET_SELECTED_EDGE` seleciona edge e deseleciona node
- `SET_SELECTED_NODE` com null deseleciona node

### Reducer - Viewport

- `SET_ZOOM` atualiza zoom
- `SET_PAN` atualiza panOffset
- `SET_SNAP_ENABLED` alterna snap
- `SET_DRAG_STATE` atualiza dragState

### useFlowboardActions

- Todas as ações dispatcham a action correta
- Memoização funciona (mesma referência entre renders)
