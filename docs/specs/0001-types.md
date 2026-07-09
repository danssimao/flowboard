# 0001 - Types

## Objetivo

Definir o modelo de dados completo do Flowboard. Todos os tipos são genéricos para
permitir que o consumidor aggregate dados customizados além dos campos obrigatórios.

## Dependências

Nenhuma (fase inicial).

## Arquivos a Criar/Modificar

- `lib/types/index.ts` (substituir conteúdo atual)

---

## Tipos Base

### Position

```typescript
export interface Position {
  x: number
  y: number
}
```

### Size

```typescript
export interface Size {
  width: number
  height: number
}
```

### PortId

```typescript
export type PortId = 'top' | 'right' | 'bottom' | 'left'
```

Representa os 4 ports de conexão de um node. Cada port fica posicionado
no centro de cada lado do node retangular.

---

## Node

```typescript
export interface Node<TData = Record<string, unknown>> {
  id: string
  position: Position
  size?: Size
  data: TData
}
```

| Campo      | Tipo            | Obrigatório | Descrição                                                    |
|------------|-----------------|-------------|--------------------------------------------------------------|
| `id`       | `string`        | Sim         | UUID único do node                                           |
| `position` | `Position`      | Sim         | Coordenada x,y do canto superior esquerdo                    |
| `size`     | `Size`          | Não         | Dimensões do node (largura x altura). Se não informado, calculado pelo componente |
| `data`     | `TData`         | Sim         | Dados customizados do consumidor                             |

### Exemplo

```typescript
type TaskNodeData = { label: string; priority: 'low' | 'medium' | 'high'; assignee?: string }

const taskNode: Node<TaskNodeData> = {
  id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  position: { x: 120, y: 80 },
  size: { width: 200, height: 100 },
  data: { label: 'Implementar login', priority: 'high', assignee: 'João' },
}
```

---

## Edge

```typescript
export interface Edge<TData = Record<string, unknown>> {
  id: string
  source: EdgeEndpoint | null
  target: EdgeEndpoint | null
  data: TData
}

export interface EdgeEndpoint {
  nodeId: string
  port: PortId
}
```

| Campo    | Tipo            | Obrigatório | Descrição                                      |
|----------|-----------------|-------------|------------------------------------------------|
| `id`     | `string`        | Sim         | UUID único da aresta                           |
| `source` | `EdgeEndpoint \| null` | Sim* | Endpoint de origem (node + port). Null quando a aresta está "flutuando" (desconectada de um lado) |
| `target` | `EdgeEndpoint \| null` | Sim* | Endpoint de destino (node + port). Null quando a aresta está "flutuando" |
| `data`   | `TData`         | Sim         | Dados customizados do consumidor               |

> *source e target são obrigatórios no estado final (edge conectada), mas podem
> ser null durante operações de drag (criação/desconexão).

### Restrições

- Um node não pode se conectar com ele mesmo (`source.nodeId !== target.nodeId`)
- Múltiplas arestas entre o mesmo par de nodes são permitidas (multigraph)
- Múltiplas arestas no mesmo port são permitidas
- Uma aresta deve ter pelo menos um endpoint não nulo

### Exemplo

```typescript
type ConnectionEdgeData = { label?: string; weight?: number }

const edge: Edge<ConnectionEdgeData> = {
  id: 'e1f2g3h4-i5j6-7890-abcd-ef1234567890',
  source: { nodeId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', port: 'right' },
  target: { nodeId: 'i5j6k7l8-m9n0-7890-abcd-ef1234567890', port: 'left' },
  data: { label: 'conecta A→B', weight: 1 },
}
```

---

## Render Props (passados para componentes customizados)

### NodeRenderProps

```typescript
export interface NodeRenderProps<TData = Record<string, unknown>> {
  node: Node<TData>
  selected: boolean
}
```

| Campo      | Tipo       | Descrição                                  |
|------------|------------|--------------------------------------------|
| `node`     | `Node<T>`  | Dados completos do node                    |
| `selected` | `boolean`  | Se o node está selecionado atualmente      |

### EdgeRenderProps

```typescript
export interface EdgeRenderProps<TData = Record<string, unknown>> {
  edge: Edge<TData>
  selected: boolean
  sourcePosition: Position
  targetPosition: Position
}
```

| Campo            | Tipo         | Descrição                                  |
|------------------|--------------|--------------------------------------------|
| `edge`           | `Edge<T>`    | Dados completos da aresta                  |
| `selected`       | `boolean`    | Se a aresta está selecionada               |
| `sourcePosition` | `Position`   | Posição absoluta do port de origem no stage |
| `targetPosition` | `Position`   | Posição absoluta do port de destino no stage|

---

## Render Engine (Extensibilidade de Renderização)

### EdgeRenderEngineProps

```typescript
export interface EdgeRenderEngineProps<TData = Record<string, unknown>> {
  edge: Edge<TData>
  sourcePosition: Position
  targetPosition: Position
  selected: boolean
  zoom: number
  theme: FlowboardTheme
}
```

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `edge` | `Edge<T>` | Dados completos da aresta |
| `sourcePosition` | `Position` | Posição absoluta do port de origem |
| `targetPosition` | `Position` | Posição absoluta do port de destino |
| `selected` | `boolean` | Se a aresta está selecionada |
| `zoom` | `number` | Nível de zoom atual |
| `theme` | `FlowboardTheme` | Tema aplicado |

### EdgeRenderEngine (Interface)

```typescript
export interface EdgeRenderEngine<TData = Record<string, unknown>> {
  /**
   * Identificador único do engine
   */
  readonly id: string

  /**
   * Nome descritivo do engine
   */
  readonly name: string

  /**
   * Renderiza uma edge específica
   */
  renderEdge(props: EdgeRenderEngineProps<TData>): React.ReactNode

  /**
   * Renderiza o container para todas as edges (opcional)
   * Útil para SVG (precisa de um elemento <svg>) ou Canvas
   */
  renderContainer?(children: React.ReactNode): React.ReactNode
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | `string` | Sim | Identificador único (ex: 'html-css', 'svg', 'canvas') |
| `name` | `string` | Sim | Nome descritivo do engine |
| `renderEdge` | `(props) => ReactNode` | Sim | Renderiza uma edge |
| `renderContainer` | `(children) => ReactNode` | Não | Container para todas as edges |

---

## Props do Componente Flowboard

```typescript
export interface FlowboardProps<TNode = Record<string, unknown>, TEdge = Record<string, unknown>> {
  nodes: Node<TNode>[]
  edges: Edge<TEdge>[]
  onNodesChange: (nodes: Node<TNode>[]) => void
  onEdgesChange: (edges: Edge<TEdge>[]) => void
  nodeTypes: Record<string, React.ComponentType<NodeRenderProps<TNode>>>
  edgeTypes?: Record<string, React.ComponentType<EdgeRenderProps<TEdge>>>
  edgeEngine?: EdgeRenderEngine<TEdge>
  theme?: FlowboardTheme
  minZoom?: number
  maxZoom?: number
  snapToGrid?: boolean
  snapSize?: number
  style?: React.CSSProperties
  className?: string
}
```

| Campo           | Tipo                                    | Obrigatório | Default | Descrição                                              |
|-----------------|-----------------------------------------|-------------|---------|--------------------------------------------------------|
| `nodes`         | `Node<TNode>[]`                         | Sim         | —       | Lista de nodes do grafo                                |
| `edges`         | `Edge<TEdge>[]`                         | Sim         | —       | Lista de arestas do grafo                              |
| `onNodesChange` | `(nodes: Node<TNode>[]) => void`        | Sim         | —       | Callback chamado quando nodes são alterados             |
| `onEdgesChange` | `(edges: Edge<TEdge>[]) => void`        | Sim         | —       | Callback chamado quando arestas são alteradas           |
| `nodeTypes`     | `Record<string, ComponentType<...>>`    | Sim         | —       | Mapa de tipo→componente para renderizar nodes           |
| `edgeTypes`     | `Record<string, ComponentType<...>>`    | Não         | `{}`    | Mapa de tipo→componente para renderizar arestas         |
| `edgeEngine`    | `EdgeRenderEngine<TEdge>`               | Não         | `HtmlCssEdgeEngine` | Motor de renderização de edges                |
| `theme`         | `FlowboardTheme`                        | Não         | light   | Tema visual                                             |
| `minZoom`       | `number`                                | Não         | `0.1`   | Zoom mínimo permitido                                   |
| `maxZoom`       | `number`                                | Não         | `3`     | Zoom máximo permitido                                   |
| `snapToGrid`    | `boolean`                               | Não         | `false` | Se nodes devem alinhar à grade                          |
| `snapSize`      | `number`                                | Não         | `20`    | Tamanho da célula da grade (px)                          |
| `style`         | `React.CSSProperties`                   | Não         | —       | Estilo customizado no wrapper                           |
| `className`     | `string`                                | Não         | —       | Classe CSS customizada no wrapper                       |

---

## Estado Interno (não exportado, usado pelo reducer)

```typescript
export interface FlowboardState<TNode = Record<string, unknown>, TEdge = Record<string, unknown>> {
  nodes: Node<TNode>[]
  edges: Edge<TEdge>[]
  selectedNodeId: string | null
  selectedEdgeId: string | null
  zoom: number
  panOffset: Position
  snapEnabled: boolean
  dragState: DragState | null
}
```

### DragState

O `DragState` representa o estado atual de uma operação de arrasto. É um
discriminated union baseado no campo `type`.

```typescript
export type DragState =
  | { type: 'node'; nodeId: string; startPos: Position; currentPos: Position }
  | { type: 'edge-create'; edgeId: string; source: EdgeEndpoint; mousePos: Position }
  | { type: 'edge-disconnect'; edgeId: string; disconnectedSide: 'source' | 'target'; mousePos: Position }
  | { type: 'menu-drag'; nodeType: string; mousePos: Position }
  | { type: 'pan'; startPos: Position; startOffset: Position }
```

| Tipo               | Descrição                                                       |
|--------------------|-----------------------------------------------------------------|
| `node`             | Arrastando um node existente no stage                           |
| `edge-create`      | Criando uma nova aresta (arrastando de um port para outro)      |
| `edge-disconnect`  | Desconectando uma ponta de uma aresta existente                 |
| `menu-drag`        | Arrastando um tipo de node do menu para o stage                 |
| `pan`              | Arrastando o fundo do stage (pan)                               |

---

## Ações do Reducer

```typescript
export type FlowboardAction<TNode = Record<string, unknown>, TEdge = Record<string, unknown>> =
  | { type: 'SET_NODES'; payload: Node<TNode>[] }
  | { type: 'SET_EDGES'; payload: Edge<TEdge>[] }
  | { type: 'ADD_NODE'; payload: Node<TNode> }
  | { type: 'MOVE_NODE'; payload: { id: string; position: Position } }
  | { type: 'RESIZE_NODE'; payload: { id: string; size: Size } }
  | { type: 'REMOVE_NODE'; payload: { id: string } }
  | { type: 'ADD_EDGE'; payload: Edge<TEdge> }
  | { type: 'UPDATE_EDGE'; payload: { id: string; source?: EdgeEndpoint | null; target?: EdgeEndpoint | null } }
  | { type: 'DISCONNECT_EDGE'; payload: { edgeId: string; side: 'source' | 'target' } }
  | { type: 'REMOVE_EDGE'; payload: { id: string } }
  | { type: 'SET_SELECTED_NODE'; payload: { id: string | null } }
  | { type: 'SET_SELECTED_EDGE'; payload: { id: string | null } }
  | { type: 'SET_ZOOM'; payload: number }
  | { type: 'SET_PAN'; payload: Position }
  | { type: 'SET_SNAP_ENABLED'; payload: boolean }
  | { type: 'SET_DRAG_STATE'; payload: DragState | null }
```

---

## Compound Components (API Híbrida)

O Flowboard suporta **Compound Pattern** para permitir customização avançada.
O consumidor pode usar a API simples (props) ou compor componentes internamente.

### FlowboardProps (modo compound)

Quando `children` é fornecido, o modo compound é ativado:

```typescript
export interface FlowboardProps<TNode = Record<string, unknown>, TEdge = Record<string, unknown>> {
  // Modo simples (mantido para backward compatibility)
  nodes?: Node<TNode>[]
  edges?: Edge<TEdge>[]
  onNodesChange?: (nodes: Node<TNode>[]) => void
  onEdgesChange?: (edges: Edge<TEdge>[]) => void
  nodeTypes?: Record<string, React.ComponentType<NodeRenderProps<TNode>>>
  edgeTypes?: Record<string, React.ComponentType<EdgeRenderProps<TEdge>>>

  // Modo compound
  children?: React.ReactNode

  // Configurações comuns
  theme?: FlowboardTheme
  minZoom?: number
  maxZoom?: number
  snapToGrid?: boolean
  snapSize?: number
  style?: React.CSSProperties
  className?: string
}
```

### Flowboard.Stage Props

```typescript
export interface FlowboardStageProps {
  children: React.ReactNode
}
```

### Flowboard.Node Props

```typescript
export interface FlowboardNodeProps<TData = Record<string, unknown>> {
  id: string
  position: Position
  size?: Size
  children: React.ReactNode
  nodeType?: string // Tipo do node para renderização (default: 'default')
}
```

### Flowboard.Node.Port Props

```typescript
export interface FlowboardNodePortProps {
  id: PortId
  children?: React.ReactNode // Conteúdo customizado do port
}
```

### Flowboard.Edge Props

```typescript
export interface FlowboardEdgeProps<TData = Record<string, unknown>> {
  id: string
  source: EdgeEndpoint
  target: EdgeEndpoint
  data?: TData
  children?: React.ReactNode // Conteúdo customizado da edge
}
```

### Flowboard.Menu Props

```typescript
export interface FlowboardMenuProps<TItem = Record<string, unknown>> {
  // Dados customizados do consumidor
  items: TItem[]
  
  // Renderiza cada item do menu
  // dragProps contém handlePointerDown para iniciar o drag
  renderItem: (item: TItem, dragProps: MenuDragProps) => React.ReactNode
  
  // Renderiza o container do menu (opcional)
  renderMenu?: (children: React.ReactNode) => React.ReactNode
  
  // Estilo/posicionamento
  style?: React.CSSProperties
  className?: string
}

export interface MenuDragProps {
  handlePointerDown: (e: React.PointerEvent) => void
  isDragging: boolean
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `items` | `TItem[]` | Sim | Lista de itens do menu (dados customizados) |
| `renderItem` | `(item, dragProps) => ReactNode` | Sim | Função que renderiza cada item |
| `renderMenu` | `(children) => ReactNode` | Não | Função que renderiza o container |
| `style` | `CSSProperties` | Não | Estilo inline no container |
| `className` | `string` | Não | Classe CSS no container |

### Flowboard.Footer Props

```typescript
export interface FlowboardFooterProps {
  children?: React.ReactNode // Conteúdo customizado do footer
}
```

### Flowboard.Target Props

```typescript
export interface FlowboardTargetProps {
  children?: React.ReactNode // Conteúdo customizado do target
}
```

---

## Testes

- Validação de que `Node` com campos obrigatórios compila sem erro
- Validação de que `Node` sem `id` gera erro de tipo
- Validação de que `FlowboardProps` com generics customizados compila
- Validação de `DragState` com todos os tipos possíveis
- Validação de `FlowboardAction` com todas as ações
- Validação de que `EdgeEndpoint` requer `nodeId` e `port`
- Validação de que `FlowboardProps` aceita `children` para modo compound
- Validação de que `FlowboardNodeProps` requer `id` e `position`
- Validação de que `FlowboardEdgeProps` requer `id`, `source` e `target`
- Validação de que `FlowboardNodePortProps` requer `id`
- Validação de que `FlowboardMenuProps` requer `items` e `renderItem`
- Validação de que `MenuDragProps` contém `handlePointerDown` e `isDragging`
