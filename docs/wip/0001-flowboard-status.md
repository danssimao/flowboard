# Flowboard — Status do Desenvolvimento

> **Última atualização:** 2026-07-09
> **Status:** Specs completas com Compound Pattern e Render Engines, implementação não iniciada
> **Próximo passo:** Implementar Fase 0001 (Types)

---

## Meta

**Flowboard** é um componente React extensível que renderiza grafos interativos.
O consumidor fornece nodes (com posições customizadas) e edges (conexões entre ports),
e o Flowboard cuida da renderização, interação (drag-and-drop, pan/zoom),
e sincronização de estado.

**Público-alvo:** Desenvolvedores que precisam de um canvas de grafos
customizável em aplicações React — quadros Kanban, diagramas, fluxogramas, etc.

**Stack:**
- React 18.3.1 (peer: ^18.2.0 || ^19.0.0)
- TypeScript 5.6.3
- Vite 8.1.3 (library mode)
- Vitest 4.1.10
- CSS Modules
- Publicação npm como pacote `flowboard`

---

## Decisões Tomadas

### Arquitetura

| # | Decisão | Resposta |
|---|---------|----------|
| 1 | Motor de renderização | HTML+CSS (SVG/Canvas futuro) |
| 2 | Arestas | Implementação do zero, retas (bezier futuro) |
| 3 | State management | Controlled — dados vêm de fora via props, callbacks notificam mudanças |
| 4 | Pan e Zoom | Sim, com limites (minZoom: 0.1, maxZoom: 3) |
| 5 | Menu | **Customização completa** via render props + hook useMenuDrag (mantém drag and drop) |
| 6 | Conexão de edges | 4 ports por node (top/right/bottom/left), arrastar port→port |
| 7 | Multigraph | Sim, múltiplas arestas entre o mesmo par de nodes são permitidas |
| 8 | Auto-conexão | Não permitida (source.nodeId !== target.nodeId) |
| 9 | Seleção | Elemento Target que segue o cursor durante drags |
| 10 | Performance | ~100 nodes como caso de uso esperado |
| 11 | Temas | Sim, via props (FlowboardTheme com seções: stage, node, edge, port, menu, footer) |
| 12 | Tipos | Genéricos (`<TNode, TEdge>`) — consumidor define dados customizados |
| 13 | Drag & Drop | Pointer Events customizados (não HTML5 DnD API) |
| 14 | Grid snap | Sim, com toggle no footer do container |
| 15 | Edge UUID | UUID como identificador (coordenadas mudam, UUID não) |
| 16 | Desconexão de edges | Desconectar ambos os endpoints, edge fica "flutuando", pode ser reconectada |
| 17 | Trackpad | Suporte completo: two-finger scroll → pan, pinch → zoom |
| 18 | **Compound Pattern** | **API híbrida: modo simples (props) + modo compound (sub-componentes)** |
| 19 | **Menu Customizável** | **Customização completa via render props + hook useMenuDrag** |
| 20 | **Render Engine** | **Motor de renderização extensível para edges (HTML+CSS padrão, SVG, Canvas)** |

### Componentes (Compound Pattern)

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

---

## Specs Criadas

Todas as 11 specs estão em `docs/specs/`:

| Spec | Arquivo | Conteúdo | Status |
|------|---------|----------|--------|
| 0001 | `0001-types.md` | Tipos base, Node, Edge, Props, State, Actions, EdgeRenderEngine | ✅ Completa |
| 0002 | `0002-theme.md` | FlowboardTheme, defaultTheme, mergeTheme, CSS vars | ✅ Completa |
| 0003 | `0003-utils.md` | UUID, geometria (getPortPosition, calcLineAngle, etc.) | ✅ Completa |
| 0004 | `0004-context-and-state.md` | Context, reducer, useFlowboard, sync | ✅ Completa |
| 0005 | `0005-container-and-footer.md` | Container events, Footer snap toggle, suporte mouse/trackpad | ✅ Completa |
| 0006 | `0006-stage-and-pan-zoom.md` | Stage transform, usePanZoom, auto-sizing, passive events | ✅ Completa |
| 0007 | `0007-menu.md` | Menu customizável, hook useMenuDrag, render props | ✅ Completa |
| 0008 | `0008-node-and-port.md` | Node drag, 4 ports, useDragNode | ✅ Completa |
| 0009 | `0009-edge-and-target.md` | Edge linha reta, useDragEdge, Target cursor | ✅ Completa |
| 0010 | `0010-integration.md` | Flowboard root, exports, cleanup, demo, critérios de aceite | ✅ Completa |
| 0011 | `0011-render-engines.md` | EdgeRenderEngine, HTML+CSS, SVG, Canvas engines | ✅ Completa |

**Total:** ~115 KB de especificação detalhada com tipos, implementação, CSS, e testes.

---

## Onde Paramos

### O que foi feito

1. ✅ Levantamento de requisitos com o usuário (todas as 20 decisões acima)
2. ✅ Criação de 11 specs detalhadas em `docs/specs/`
3. ✅ Atualização das specs 0005 e 0006 para suporte a trackpad
4. ✅ **Implementação do Compound Pattern nas specs (API híbrida)**
5. ✅ **Implementação do Menu Customizável com render props + hook useMenuDrag**
6. ✅ **Implementação do Render Engine para edges (HTML+CSS, SVG, Canvas)**
7. ✅ Criação deste documento WIP

### O que NÃO foi feito

- ❌ Nenhuma implementação de código foi iniciada
- ❌ O Widget antigo ainda existe e precisa ser removido
- ❌ Nenhum teste foi escrito
- ❌ Nenhum componente foi criado
- ❌ Nenhum render engine foi implementado

### Próximo passo

**Implementar Fase 0001 — Types** (`lib/types/index.ts`)

Seguir a ordem das specs:
1. `0001-types.md` → Tipos (inclui tipos compound + EdgeRenderEngine)
2. `0002-theme.md` → Tema
3. `0003-utils.md` → Utilitários
4. `0004-context-and-state.md` → Context + Reducer
5. `0005-container-and-footer.md` → Container (interno) + Footer
6. `0006-stage-and-pan-zoom.md` → Stage (Flowboard.Stage)
7. `0007-menu.md` → Menu (Flowboard.Menu)
8. `0008-node-and-port.md` → Node (Flowboard.Node) + Port
9. `0009-edge-and-target.md` → Edge (Flowboard.Edge) + Target
10. `0011-render-engines.md` → Render Engines (HTML+CSS, SVG, Canvas)
11. `0010-integration.md` → Compound Root + Integração + Limpeza

---

## Contexto para Continuação

### Estrutura do projeto

```
flowboard/
├── lib/                    # Código da biblioteca (publicada no npm)
│   ├── main.ts             # Entry point (ATUALIZAR: remover Widget, adicionar Flowboard)
│   ├── types/index.ts      # Tipos (ATUALIZAR: substituir WidgetTheme por tipos do Flowboard)
│   ├── components/         # Componentes React
│   │   └── Widget/         # ⚠️ REMOVER (substituir por Flowboard/)
│   ├── engines/            # Render engines para edges
│   │   ├── html-css/       # Motor padrão (HTML+CSS)
│   │   ├── svg/            # Motor SVG
│   │   └── canvas/         # Motor Canvas
│   ├── hooks/              # Hooks customizados
│   │   ├── useWidget.ts    # ⚠️ REMOVER (substituir por useFlowboard.ts)
│   │   └── useMenuDrag.ts  # NOVO: hook para drag and drop do menu
│   └── test/setup.ts       # Setup de testes
├── src/                    # Playground de desenvolvimento (não publicado)
│   ├── App.tsx             # ⚠️ ATUALIZAR: demo do Flowboard
│   └── main.tsx            # Entry point do dev server
├── docs/
│   ├── specs/              # 11 specs detalhadas
│   └── wip/                # Este documento
└── package.json            # Dependências e scripts
```

### Comandos úteis

```bash
npm run dev          # Dev server (playground)
npm run build        # Build da biblioteca
npm run test         # Rodar testes
npm run test:watch   # Testes em watch mode
npm run lint         # TypeScript check (tsc --noEmit)
```

### Convenções

- **Commits:** Conventional Commits (`feat:`, `fix:`, `chore:`, etc.)
- **Branches:** `tipo/descricao` (ex: `feat/add-widget`, `fix/button-color`)
- **PR:** Merge para `main` via squash merge
- **Release:** semantic-release automático ao merge no main

### Arquivos a remover na Fase 0010

```
lib/components/Widget/Widget.tsx
lib/components/Widget/Widget.module.css
lib/components/Widget/Widget.test.tsx
lib/hooks/useWidget.ts
lib/hooks/useWidget.test.ts
```

### Exemplo de uso final (para referência)

#### Modo Simples (backward compatible)

```tsx
import { Flowboard } from 'flowboard'
import type { Node, Edge, NodeRenderProps } from 'flowboard'

type MyNodeData = { label: string; color?: string }

function DefaultNode({ node, selected }: NodeRenderProps<MyNodeData>) {
  return (
    <div style={{ padding: 12, background: node.data.color ?? '#fff' }}>
      {node.data.label}
    </div>
  )
}

const nodes: Node<MyNodeData>[] = [
  { id: '1', position: { x: 100, y: 100 }, data: { label: 'A' } },
  { id: '2', position: { x: 400, y: 200 }, data: { label: 'B', color: '#e3f2fd' } },
]

const edges: Edge[] = [
  { id: 'e1', source: { nodeId: '1', port: 'right' }, target: { nodeId: '2', port: 'left' }, data: {} },
]

function App() {
  const [n, setN] = React.useState(nodes)
  const [e, setE] = React.useState(edges)
  return <Flowboard nodes={n} edges={e} onNodesChange={setN} onEdgesChange={setE} nodeTypes={{ default: DefaultNode }} />
}
```

#### Modo Compound (API avançada)

```tsx
import { Flowboard } from 'flowboard'
import type { Node, Edge } from 'flowboard'

type MyNodeData = { label: string; color?: string }

function CustomNode({ node, selected }: { node: Node<MyNodeData>; selected: boolean }) {
  return (
    <div style={{
      padding: 12,
      background: node.data.color ?? '#fff',
      border: selected ? '2px solid #4dabf7' : '1px solid #dee2e6',
    }}>
      {node.data.label}
    </div>
  )
}

function App() {
  const [nodes, setNodes] = React.useState<Node<MyNodeData>[]>([
    { id: '1', position: { x: 100, y: 100 }, data: { label: 'A' } },
    { id: '2', position: { x: 400, y: 200 }, data: { label: 'B', color: '#e3f2fd' } },
  ])

  const [edges, setEdges] = React.useState<Edge[]>([
    { id: 'e1', source: { nodeId: '1', port: 'right' }, target: { nodeId: '2', port: 'left' }, data: {} },
  ])

  return (
    <Flowboard nodes={nodes} edges={edges} onNodesChange={setNodes} onEdgesChange={setEdges}>
      <Flowboard.Stage>
        {nodes.map((node) => (
          <Flowboard.Node key={node.id} id={node.id} position={node.position}>
            <CustomNode node={node} selected={false} />
          </Flowboard.Node>
        ))}
        {edges.map((edge) => (
          <Flowboard.Edge key={edge.id} id={edge.id} source={edge.source!} target={edge.target!} />
        ))}
      </Flowboard.Stage>
      <Flowboard.Menu
        items={[
          { id: '1', label: 'Tarefa', nodeType: 'task' },
          { id: '2', label: 'Evento', nodeType: 'event' },
        ]}
        renderItem={(item, { handlePointerDown }) => (
          <div
            onPointerDown={handlePointerDown}
            style={{
              padding: '8px 12px',
              background: '#f8f9fa',
              border: '1px solid #dee2e6',
              borderRadius: 6,
              cursor: 'grab',
            }}
          >
            {item.label}
          </div>
        )}
      />
      <Flowboard.Footer />
    </Flowboard>
  )
}
```

---

## Referências

- Specs: `docs/specs/0001-types.md` até `docs/specs/0011-render-engines.md`
- **Novo:** `docs/specs/0007-menu.md` — Menu customizável com hook useMenuDrag
- **Novo:** `docs/specs/0011-render-engines.md` — Render Engine para edges
- Convenções: `AGENTS.md`
- Package: `package.json`
- CI/CD: `.github/workflows/pr-validation.yml`, `.github/workflows/release.yml`
