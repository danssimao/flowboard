# 0010 - Integration & Cleanup

## Objetivo

Montar o componente Flowboard root que integra todos os componentes,
atualizar as exportações públicas, remover o Widget antigo, e criar
uma demo no playground.

> **Render Engine:** O componente Flowboard suporta motores de renderização
> extensíveis via prop `edgeEngine`. Veja `0011-render-engines.md` para
> mais detalhes.

> **Compound Pattern:** O componente Flowboard root suporta dois modos:
> 1. **Modo Simples** — usa props para definir nodes/edges (backward compatible)
> 2. **Modo Compound** — usa sub-componentes para customização avançada

## Dependências

- Todas as fases anteriores (0001–0010)
- 0011 (Render Engines)

## Arquivos a Criar/Modificar

- `lib/components/Flowboard/Flowboard.tsx`
- `lib/components/Flowboard/Flowboard.module.css`
- `lib/components/Flowboard/Flowboard.test.tsx`
- `lib/components/Flowboard/Flowboard.Stage.tsx`
- `lib/components/Flowboard/Flowboard.Node.tsx`
- `lib/components/Flowboard/Flowboard.Node.Port.tsx`
- `lib/components/Flowboard/Flowboard.Edge.tsx`
- `lib/components/Flowboard/Flowboard.Menu.tsx`
- `lib/components/Flowboard/Flowboard.Footer.tsx`
- `lib/components/Flowboard/Flowboard.Target.tsx`
- `lib/main.ts` (atualizar exports)
- `src/App.tsx` (demo)

## Arquivos a Remover

- `lib/components/Widget/Widget.tsx`
- `lib/components/Widget/Widget.module.css`
- `lib/components/Widget/Widget.test.tsx`
- `lib/hooks/useWidget.ts`
- `lib/hooks/useWidget.test.ts`

---

## Flowboard Component

### Props

Usa `FlowboardProps` definido na Fase 1.

```typescript
import type { FlowboardProps } from '../../types'
```

### Comportamento

1. Valida props com defaults
2. Cria estado inicial a partir das props
3. Renderiza a árvore de componentes:
   ```
   FlowboardProvider
   └── div.flowboard
       └── Container
           ├── Stage
           │   ├── Grid (opcional)
           │   ├── Nodes (mapeados)
           │   └── Edges (mapeados)
           ├── Menu
           └── Target
   ```

### Implementação

```typescript
import { useMemo, useRef, useCallback } from 'react'
import { FlowboardProvider } from '../../context/FlowboardContext'
import { useFlowboardSync } from '../../hooks/useFlowboardSync'
import { useFlowboard, useFlowboardActions } from '../../hooks/useFlowboard'
import { usePanZoom } from '../../hooks/usePanZoom'
import { mergeTheme, defaultTheme } from '../../theme/default'
import { generateId } from '../../utils/uuid'
import { snapToGrid, getPortAbsolutePosition } from '../../utils/geometry'
import { Container } from '../Container/Container'
import { Stage } from '../Stage/Stage'
import { Node } from '../Node/Node'
import { Edge } from '../Edge/Edge'
import { Menu } from '../Menu/Menu'
import { Target } from '../Target/Target'
import type { FlowboardProps, FlowboardState, Node, Edge as EdgeType } from '../../types'
import styles from './Flowboard.module.css'

function FlowboardInner<TNode, TEdge>({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  nodeTypes,
  edgeTypes = {},
}: FlowboardProps<TNode, TEdge>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { state, theme } = useFlowboard()
  const actions = useFlowboardActions()
  const { screenToStage } = usePanZoom()

  // Sincronizar com props externas
  useFlowboardSync(nodes, edges, onNodesChange, onEdgesChange)

  // Lógica de drop do menu
  const handleMenuDrop = useCallback(
    (e: PointerEvent) => {
      if (state.dragState?.type !== 'menu-drag') return

      const containerRect = containerRef.current?.getBoundingClientRect()
      if (!containerRect) return

      const mouseX = e.clientX - containerRect.left
      const mouseY = e.clientY - containerRect.top

      if (mouseX >= 0 && mouseY >= 0) {
        const stagePos = screenToStage({ x: mouseX, y: mouseY })
        const defaultSize = { width: theme.node.minWidth, height: theme.node.minHeight }
        let position = {
          x: stagePos.x - defaultSize.width / 2,
          y: stagePos.y - defaultSize.height / 2,
        }

        if (state.snapEnabled) {
          position = snapToGrid(position, theme.stage.gridSize)
        }

        actions.addNode({
          id: generateId(),
          position,
          data: {},
        })
      }

      actions.setDragState(null)
    },
    [state.dragState, state.snapEnabled, theme, screenToStage, actions]
  )

  // Lógica de drop de edge
  const handleEdgeDrop = useCallback(
    (e: PointerEvent) => {
      if (state.dragState?.type !== 'edge-create') return

      // Procurar se há um port sob o cursor
      const target = document.elementFromPoint(e.clientX, e.clientY)
      const portEl = target?.closest('[data-port]')
      if (portEl) {
        const nodeId = portEl.getAttribute('data-port-node-id')!
        const portId = portEl.getAttribute('data-port-id')!
        actions.addEdge({
          id: state.dragState.edgeId,
          source: state.dragState.source,
          target: { nodeId, port: portId as any },
          data: {},
        })
      }

      actions.setDragState(null)
    },
    [state.dragState, actions]
  )

  // Lógica de drop de disconnect
  const handleDisconnectDrop = useCallback(
    (e: PointerEvent) => {
      if (state.dragState?.type !== 'edge-disconnect') return

      const target = document.elementFromPoint(e.clientX, e.clientY)
      const portEl = target?.closest('[data-port]')
      if (portEl) {
        const nodeId = portEl.getAttribute('data-port-node-id')!
        const portId = portEl.getAttribute('data-port-id')!
        const update = state.dragState.disconnectedSide === 'source'
          ? { source: { nodeId, port: portId as any } }
          : { target: { nodeId, port: portId as any } }
        actions.updateEdge(state.dragState.edgeId, update)
      } else {
        actions.removeEdge(state.dragState.edgeId)
      }

      actions.setDragState(null)
    },
    [state.dragState, actions]
  )

  // Determinar qual componente de node usar
  const getNodeTypeComponent = useCallback(
    (node: Node<TNode>) => {
      const keys = Object.keys(nodeTypes)
      return nodeTypes[keys[0]] ?? nodeTypes['default']
    },
    [nodeTypes]
  )

  // Determinar qual componente de edge usar
  const getEdgeTypeComponent = useCallback(
    (edge: EdgeType<TEdge>) => {
      return edgeTypes['default'] ?? undefined
    },
    [edgeTypes]
  )

  const containerSize = useMemo(
    () => ({
      width: containerRef.current?.clientWidth ?? 800,
      height: containerRef.current?.clientHeight ?? 600,
    }),
    [containerRef.current?.clientWidth, containerRef.current?.clientHeight]
  )

  return (
    <div className={styles.flowboard}>
      <Container ref={containerRef}>
        <Stage containerSize={containerSize}>
          {state.nodes.map((node) => (
            <Node
              key={node.id}
              node={node}
              nodeComponent={getNodeTypeComponent(node)}
              zoom={state.zoom}
            />
          ))}
          {state.edges.map((edge) => {
            if (!edge.source || !edge.target) return null

            const sourceNode = state.nodes.find((n) => n.id === edge.source!.nodeId)
            const targetNode = state.nodes.find((n) => n.id === edge.target!.nodeId)
            if (!sourceNode || !targetNode) return null

            const sourcePos = getPortAbsolutePosition(sourceNode, edge.source.port, theme.port.size)
            const targetPos = getPortAbsolutePosition(targetNode, edge.target.port, theme.port.size)

            return (
              <Edge
                key={edge.id}
                edge={edge}
                edgeComponent={getEdgeTypeComponent(edge)}
                sourcePosition={sourcePos}
                targetPosition={targetPos}
                selected={state.selectedEdgeId === edge.id}
                zoom={state.zoom}
              />
            )
          })}

          {/* Preview de edge em criação */}
          {state.dragState?.type === 'edge-create' && (() => {
            const sourceNode = state.nodes.find((n) => n.id === state.dragState!.source.nodeId)
            if (!sourceNode) return null

            const sourcePos = getPortAbsolutePosition(sourceNode, state.dragState.source.port, theme.port.size)
            const targetPos = screenToStage(state.dragState.mousePos)

            return (
              <Edge
                key="temp-edge"
                edge={{ id: 'temp', source: state.dragState.source, target: null, data: {} }}
                sourcePosition={sourcePos}
                targetPosition={targetPos}
                selected={false}
                zoom={state.zoom}
              />
            )
          })()}
        </Stage>
        <Menu nodeTypes={nodeTypes} />
        <Target />
      </Container>
    </div>
  )
}

// Componente wrapper que monta o Provider
export function Flowboard<TNode = Record<string, unknown>, TEdge = Record<string, unknown>>(
  props: FlowboardProps<TNode, TEdge>
) {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    nodeTypes,
    edgeTypes,
    theme: themeOverride,
    minZoom = 0.1,
    maxZoom = 3,
    snapToGrid: snapToGridProp = false,
    snapSize = 20,
    style,
    className,
  } = props

  const theme = useMemo(() => mergeTheme(defaultTheme, themeOverride), [themeOverride])

  const initialState: FlowboardState<TNode, TEdge> = useMemo(
    () => ({
      nodes,
      edges,
      selectedNodeId: null,
      selectedEdgeId: null,
      zoom: 1,
      panOffset: { x: 0, y: 0 },
      snapEnabled: snapToGridProp,
      dragState: null,
    }),
    [nodes, edges, snapToGridProp]
  )

  return (
    <FlowboardProvider
      initialState={initialState}
      theme={theme}
      minZoom={minZoom}
      maxZoom={maxZoom}
    >
      <FlowboardInner
        {...props}
        snapToGrid={snapToGridProp}
        snapSize={snapSize}
        style={style}
        className={className}
      />
    </FlowboardProvider>
  )
}
```

### CSS Module

```css
.flowboard {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}
```

---

## Compound Pattern

### Estrutura de Componentes

```
Flowboard (root - Context Provider)
├── Flowboard.Stage (transform pan+zoom)
│   ├── Flowboard.Node (arrastável, com ports)
│   │   └── Flowboard.Node.Port (ponto de conexão)
│   └── Flowboard.Edge (linha reta entre ports)
├── Flowboard.Menu (drag source para criar nodes)
├── Flowboard.Footer (toggle snap-to-grid)
└── Flowboard.Target (cursor follower)
```

### Modo Simples (backward compatible)

```tsx
<Flowboard
  nodes={nodes}
  edges={edges}
  onNodesChange={setNodes}
  onEdgesChange={setEdges}
  nodeTypes={{ default: DefaultNode }}
/>
```

### Modo Compound

```tsx
<Flowboard
  nodes={nodes}
  edges={edges}
  onNodesChange={setNodes}
  onEdgesChange={setEdges}
>
  <Flowboard.Stage>
    <Flowboard.Node id="node-1" position={{ x: 100, y: 100 }}>
      <MyCustomNode />
    </Flowboard.Node>
    <Flowboard.Edge
      id="edge-1"
      source={{ nodeId: 'node-1', port: 'right' }}
      target={{ nodeId: 'node-2', port: 'left' }}
    />
  </Flowboard.Stage>
  <Flowboard.Menu />
  <Flowboard.Footer />
</Flowboard>
```

### Implementação do Root Component

```typescript
import { useMemo } from 'react'
import { FlowboardProvider } from '../../context/FlowboardContext'
import { mergeTheme, defaultTheme } from '../../theme/default'
import { FlowboardInner } from './FlowboardInner'
import { FlowboardStage } from './Flowboard.Stage'
import { FlowboardNode } from './Flowboard.Node'
import { FlowboardNodePort } from './Flowboard.Node.Port'
import { FlowboardEdge } from './Flowboard.Edge'
import { FlowboardMenu } from './Flowboard.Menu'
import { FlowboardFooter } from './Flowboard.Footer'
import { FlowboardTarget } from './Flowboard.Target'
import type { FlowboardProps, FlowboardState } from '../../types'

function FlowboardRoot<TNode = Record<string, unknown>, TEdge = Record<string, unknown>>(
  props: FlowboardProps<TNode, TEdge>
) {
  const {
    nodes = [],
    edges = [],
    onNodesChange = () => {},
    onEdgesChange = () => {},
    nodeTypes = {},
    edgeTypes = {},
    theme: themeOverride,
    minZoom = 0.1,
    maxZoom = 3,
    snapToGrid: snapToGridProp = false,
    snapSize = 20,
    style,
    className,
    children,
  } = props

  const theme = useMemo(() => mergeTheme(defaultTheme, themeOverride), [themeOverride])

  const initialState: FlowboardState<TNode, TEdge> = useMemo(
    () => ({
      nodes,
      edges,
      selectedNodeId: null,
      selectedEdgeId: null,
      zoom: 1,
      panOffset: { x: 0, y: 0 },
      snapEnabled: snapToGridProp,
      dragState: null,
    }),
    [nodes, edges, snapToGridProp]
  )

  return (
    <FlowboardProvider
      initialState={initialState}
      theme={theme}
      minZoom={minZoom}
      maxZoom={maxZoom}
    >
      {children ? (
        // Modo compound — renderiza children
        <div className="flowboard" style={style}>
          {children}
        </div>
      ) : (
        // Modo simples — renderiza layout padrão
        <FlowboardInner
          {...props}
          snapToGrid={snapToGridProp}
          snapSize={snapSize}
          style={style}
          className={className}
        />
      )}
    </FlowboardProvider>
  )
}

// Compound components
FlowboardRoot.Stage = FlowboardStage
FlowboardRoot.Node = FlowboardNode
FlowboardRoot.Node.Port = FlowboardNodePort
FlowboardRoot.Edge = FlowboardEdge
FlowboardRoot.Menu = FlowboardMenu
FlowboardRoot.Footer = FlowboardFooter
FlowboardRoot.Target = FlowboardTarget

export const Flowboard = FlowboardRoot
```

---

## Atualização de exports (lib/main.ts)

```typescript
// Componentes
export { Flowboard } from './components/Flowboard'

// Compound components (acessíveis via Flowboard.Stage, etc.)
export { FlowboardStage } from './components/Flowboard/Flowboard.Stage'
export { FlowboardNode } from './components/Flowboard/Flowboard.Node'
export { FlowboardNodePort } from './components/Flowboard/Flowboard.Node.Port'
export { FlowboardEdge } from './components/Flowboard/Flowboard.Edge'
export { FlowboardMenu } from './components/Flowboard/Flowboard.Menu'
export { FlowboardFooter } from './components/Flowboard/Flowboard.Footer'
export { FlowboardTarget } from './components/Flowboard/Flowboard.Target'

// Render Engines
export { HtmlCssEdgeEngine } from './engines/html-css'
export { SvgEdgeEngine } from './engines/svg'
export { CanvasEdgeEngine } from './engines/canvas'

// Hooks
export { useFlowboard } from './hooks/useFlowboard'
export { useFlowboardActions } from './hooks/useFlowboardActions'
export { useMenuDrag } from './hooks/useMenuDrag'

// Tipos
export type {
  FlowboardProps,
  FlowboardStageProps,
  FlowboardNodeProps,
  FlowboardNodePortProps,
  FlowboardEdgeProps,
  FlowboardMenuProps,
  FlowboardFooterProps,
  FlowboardTargetProps,
  MenuDragProps,
  EdgeRenderEngine,
  EdgeRenderEngineProps,
  Node,
  Edge,
  EdgeEndpoint,
  PortId,
  Position,
  Size,
  NodeRenderProps,
  EdgeRenderProps,
} from './types'

export type { FlowboardTheme } from './theme/types'
```

---

## Demo no Playground (src/App.tsx)

### Modo Simples (backward compatible)

```typescript
import { Flowboard } from '../lib/main'
import type { Node, Edge, NodeRenderProps } from '../lib/main'

type MyNodeData = { label: string; color?: string }
type MyEdgeData = { label?: string }

function DefaultNode({ node, selected }: NodeRenderProps<MyNodeData>) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: node.data.color ?? 'transparent',
        color: '#333',
        fontSize: 14,
        fontWeight: 500,
      }}
    >
      {node.data.label}
    </div>
  )
}

const initialNodes: Node<MyNodeData>[] = [
  {
    id: 'node-1',
    position: { x: 100, y: 100 },
    size: { width: 180, height: 80 },
    data: { label: 'Início' },
  },
  {
    id: 'node-2',
    position: { x: 400, y: 150 },
    size: { width: 180, height: 80 },
    data: { label: 'Processo A', color: '#e3f2fd' },
  },
  {
    id: 'node-3',
    position: { x: 400, y: 300 },
    size: { width: 180, height: 80 },
    data: { label: 'Processo B', color: '#f3e5f5' },
  },
  {
    id: 'node-4',
    position: { x: 700, y: 200 },
    size: { width: 180, height: 80 },
    data: { label: 'Fim', color: '#e8f5e9' },
  },
]

const initialEdges: Edge<MyEdgeData>[] = [
  {
    id: 'edge-1',
    source: { nodeId: 'node-1', port: 'right' },
    target: { nodeId: 'node-2', port: 'left' },
    data: { label: 'caminho A' },
  },
  {
    id: 'edge-2',
    source: { nodeId: 'node-1', port: 'right' },
    target: { nodeId: 'node-3', port: 'left' },
    data: { label: 'caminho B' },
  },
  {
    id: 'edge-3',
    source: { nodeId: 'node-2', port: 'right' },
    target: { nodeId: 'node-4', port: 'left' },
    data: {},
  },
  {
    id: 'edge-4',
    source: { nodeId: 'node-3', port: 'right' },
    target: { nodeId: 'node-4', port: 'left' },
    data: {},
  },
]

export default function App() {
  const [nodes, setNodes] = React.useState(initialNodes)
  const [edges, setEdges] = React.useState(initialEdges)

  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0 }}>
      <Flowboard
        nodes={nodes}
        edges={edges}
        onNodesChange={setNodes}
        onEdgesChange={setEdges}
        nodeTypes={{ default: DefaultNode }}
      />
    </div>
  )
}
```

### Modo Compound

```typescript
import { Flowboard } from '../lib/main'
import type { Node, Edge } from '../lib/main'

type MyNodeData = { label: string; color?: string }

function CustomNode({ node, selected }: { node: Node<MyNodeData>; selected: boolean }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: node.data.color ?? '#fff',
        border: selected ? '2px solid #4dabf7' : '1px solid #dee2e6',
        borderRadius: 8,
        padding: 12,
      }}
    >
      {node.data.label}
    </div>
  )
}

export default function App() {
  const [nodes, setNodes] = React.useState<Node<MyNodeData>[]>([
    { id: 'node-1', position: { x: 100, y: 100 }, data: { label: 'A' } },
    { id: 'node-2', position: { x: 400, y: 200 }, data: { label: 'B', color: '#e3f2fd' } },
  ])

  const [edges, setEdges] = React.useState<Edge[]>([
    { id: 'edge-1', source: { nodeId: 'node-1', port: 'right' }, target: { nodeId: 'node-2', port: 'left' }, data: {} },
  ])

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Flowboard nodes={nodes} edges={edges} onNodesChange={setNodes} onEdgesChange={setEdges}>
        <Flowboard.Stage>
          {nodes.map((node) => (
            <Flowboard.Node key={node.id} id={node.id} position={node.position} size={node.size}>
              <CustomNode node={node} selected={false} />
            </Flowboard.Node>
          ))}
          {edges.map((edge) => (
            <Flowboard.Edge
              key={edge.id}
              id={edge.id}
              source={edge.source!}
              target={edge.target!}
            />
          ))}
        </Flowboard.Stage>
        <Flowboard.Menu
          items={[
            { id: '1', label: 'Tarefa', nodeType: 'task' },
            { id: '2', label: 'Evento', nodeType: 'event' },
            { id: '3', label: 'Nota', nodeType: 'note' },
          ]}
          renderItem={(item, { handlePointerDown }) => (
            <div
              key={item.id}
              onPointerDown={handlePointerDown}
              style={{
                padding: '8px 12px',
                background: '#f8f9fa',
                border: '1px solid #dee2e6',
                borderRadius: 6,
                cursor: 'grab',
                userSelect: 'none',
              }}
            >
              {item.label}
            </div>
          )}
        />
        <Flowboard.Footer />
      </Flowboard>
    </div>
  )
}
```

---

## Limpeza

### Arquivos a Remover

| Arquivo | Substituído por |
|---------|----------------|
| `lib/components/Widget/Widget.tsx` | `lib/components/Flowboard/Flowboard.tsx` |
| `lib/components/Widget/Widget.module.css` | `lib/components/Flowboard/Flowboard.module.css` |
| `lib/components/Widget/Widget.test.tsx` | `lib/components/Flowboard/Flowboard.test.tsx` |
| `lib/hooks/useWidget.ts` | `lib/hooks/useFlowboard.ts` |
| `lib/hooks/useWidget.test.ts` | `lib/hooks/useFlowboard.test.ts` |

### Atualização de Imports

- `src/App.tsx`: remover import do Widget antigo, adicionar import do Flowboard
- `lib/main.ts`: remover todos os exports do Widget, adicionar exports do Flowboard

### Verificação

1. `npm run lint` (tsc --noEmit) — sem erros
2. `npm run test` — todos os testes passam
3. `npm run build` — build produz dist/ com os arquivos corretos
4. `npm run dev` — demo funciona no playground

---

## Testes

### Flowboard (Modo Simples)

- Renderiza sem erros com props mínimas (nodes, edges, onNodesChange, onEdgesChange, nodeTypes)
- Renderiza nodes na posição correta
- Renderiza edges entre ports conectados
- Aplica tema customizado via props
- Callbacks onNodesChange/onEdgesChange são chamados quando nodes/edges mudam
- Menu é renderizado com os nodeTypes fornecidos
- Footer é renderizado com toggle de snap

### Flowboard (Modo Compound)

- Renderiza children quando fornecidos
- Flowboard.Stage renderiza children com transform de pan/zoom
- Flowboard.Node renderiza conteúdo customizado
- Flowboard.Node renderiza 4 ports por padrão
- Flowboard.Node.Port renderiza na posição correta
- Flowboard.Edge renderiza linha reta entre source e target
- Flowboard.Menu renderiza itens de criação
- Flowboard.Footer renderiza toggle de snap
- Flowboard.Target segue o cursor durante drags
- Todos os compound components acessam o context corretamente

### Integração

- Criar node via menu drag-and-drop → node aparece no stage
- Arrastar node → posição é atualizada
- Conectar dois ports via drag → edge reta aparece
- Desconectar edge de um port → edge fica flutuando
- Reconectar edge a outro port → edge é atualizada
- Pan com mouse (pointerDown no fundo + arrastar) move a vista
- Pan com trackpad (two-finger scroll) move a vista
- Zoom com mouse (ctrl+scroll) aproxima/afasta
- Zoom com trackpad (pinch) aproxima/afasta
- Target segue o cursor durante drags
- Snap to grid funciona com toggle no footer

### E2E (futuro)

- Usar Playwright ou Cypress para testar interações completas
- Testar fluxo: criar node → mover → conectar → desconectar → reconectar
- Testar com mouse e trackpad (simular wheel events)
- Testar modo compound com customização avançada

---

## Critérios de Aceite Finais

### Modo Simples (backward compatible)

1. ✅ `import { Flowboard } from 'flowboard'` funciona
2. ✅ Componente renderiza nodes com posição customizada
3. ✅ Nodes são arrastáveis dentro do stage
4. ✅ 4 ports aparecem nos lados de cada node
5. ✅ Arrastar port→port cria aresta reta
6. ✅ Arestas podem ser desconectadas e reconectadas
7. ✅ Menu cria novos nodes via drag-and-drop
8. ✅ Pan funciona com mouse (pointerDown no fundo + arrastar)
9. ✅ Pan funciona com trackpad (two-finger scroll)
10. ✅ Zoom funciona com mouse (ctrl+scroll) com limites
11. ✅ Zoom funciona com trackpad (pinch) com limites
12. ✅ Target segue o cursor durante drags
13. ✅ Snap to grid funciona com toggle no footer
14. ✅ Tema é customizável via props
15. ✅ Tipos são genéricos

### Modo Compound

16. ✅ `Flowboard.Stage` renderiza children com transform
17. ✅ `Flowboard.Node` renderiza conteúdo customizado
18. ✅ `Flowboard.Node.Port` renderiza na posição correta
19. ✅ `Flowboard.Edge` renderiza linha reta
20. ✅ `Flowboard.Menu` renderiza itens customizados via renderItem
21. ✅ `Flowboard.Menu` suporta renderMenu para container customizado
22. ✅ `Flowboard.Footer` renderiza toggle de snap
23. ✅ `Flowboard.Target` segue o cursor

### Menu Customizável

24. ✅ `useMenuDrag` retorna handlePointerDown e isDragging
25. ✅ Consumidor pode criar menu totalmente customizado
26. ✅ Drag and drop funciona com qualquer aparência
27. ✅ nodeType é extraído corretamente do item
28. ✅ Drop cria node com dados do item

### Qualidade

29. ✅ Todos os testes passam
30. ✅ `tsc --noEmit` sem erros
31. ✅ Widget antigo removido
32. ✅ Build produz dist/ com os arquivos corretos
33. ✅ Demo funciona no playground (ambos os modos)

---

## Estrutura Final de Arquivos

```
lib/
├── main.ts
├── types/
│   └── index.ts
├── theme/
│   ├── types.ts
│   └── default.ts
├── utils/
│   ├── geometry.ts
│   ├── geometry.test.ts
│   ├── uuid.ts
│   └── uuid.test.ts
├── context/
│   └── FlowboardContext.tsx
├── hooks/
│   ├── useFlowboard.ts
│   ├── useFlowboard.test.ts
│   ├── useFlowboardActions.ts
│   ├── useFlowboardSync.ts
│   ├── usePanZoom.ts
│   ├── usePanZoom.test.ts
│   ├── useDragNode.ts
│   ├── useDragNode.test.ts
│   ├── useDragEdge.ts
│   ├── useDragEdge.test.ts
│   ├── useMenuDrag.ts              # Hook para drag and drop do menu
│   └── useMenuDrag.test.ts
└── components/
    ├── Flowboard/
    │   ├── Flowboard.tsx              # Root component
    │   ├── Flowboard.module.css
    │   ├── Flowboard.test.tsx
    │   ├── Flowboard.Inner.tsx        # Modo simples (interno)
    │   ├── Flowboard.Stage.tsx        # Compound: Stage
    │   ├── Flowboard.Node.tsx         # Compound: Node
    │   ├── Flowboard.Node.Port.tsx    # Compound: Port
    │   ├── Flowboard.Edge.tsx         # Compound: Edge
    │   ├── Flowboard.Menu.tsx         # Compound: Menu
    │   ├── Flowboard.Footer.tsx       # Compound: Footer
    │   └── Flowboard.Target.tsx       # Compound: Target
    ├── Container/
    │   ├── Container.tsx              # Interno (não exportado)
    │   ├── Container.module.css
    │   └── Container.test.tsx
    ├── Stage/
    │   ├── Stage.tsx                  # Interno (usado por Flowboard.Stage)
    │   ├── Stage.module.css
    │   └── Stage.test.tsx
    ├── Menu/
    │   ├── Menu.tsx                   # Interno (usado por Flowboard.Menu)
    │   ├── Menu.module.css
    │   └── Menu.test.tsx
    ├── Node/
    │   ├── Node.tsx                   # Interno (usado por Flowboard.Node)
    │   ├── Node.module.css
    │   └── Node.test.tsx
    ├── Port/
    │   ├── Port.tsx                   # Interno (usado por Flowboard.Node.Port)
    │   ├── Port.module.css
    │   └── Port.test.tsx
    ├── Edge/
    │   ├── Edge.tsx                   # Interno (usado por Flowboard.Edge)
    │   ├── Edge.module.css
    │   └── Edge.test.tsx
    ├── Target/
    │   ├── Target.tsx                 # Interno (usado por Flowboard.Target)
    │   ├── Target.module.css
    │   └── Target.test.tsx
    └── Footer/
        ├── Footer.tsx                 # Interno (usado por Flowboard.Footer)
        ├── Footer.module.css
        └── Footer.test.tsx
```
