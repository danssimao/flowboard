# 0011 - Render Engines

## Objetivo

Fornecer uma abstração de **render engine** que permita trocar o motor de
renderização de edges. Isso permite suporte a diferentes tecnologias:
HTML+CSS (padrão), SVG, Canvas, entre outras.

## Dependências

- 0001 (Types)
- 0002 (Theme)
- 0003 (Utils)

## Arquivos a Criar

- `lib/engines/types.ts`
- `lib/engines/html-css/HtmlCssEdgeEngine.ts`
- `lib/engines/html-css/index.ts`
- `lib/engines/svg/SvgEdgeEngine.ts`
- `lib/engines/svg/index.ts`
- `lib/engines/canvas/CanvasEdgeEngine.ts`
- `lib/engines/canvas/index.ts`

---

## Interface EdgeRenderEngine

### Definição

```typescript
import type { Edge, Position, FlowboardTheme } from '../types';

export interface EdgeRenderEngineProps<TData = Record<string, unknown>> {
  edge: Edge<TData>;
  sourcePosition: Position;
  targetPosition: Position;
  selected: boolean;
  zoom: number;
  theme: FlowboardTheme;
}

export interface EdgeRenderEngine<TData = Record<string, unknown>> {
  /**
   * Renderiza uma edge específica
   */
  renderEdge(props: EdgeRenderEngineProps<TData>): React.ReactNode;

  /**
   * Renderiza o container para todas as edges (opcional)
   * Útil para SVG (precisa de um elemento <svg>) ou Canvas
   */
  renderContainer?(children: React.ReactNode): React.ReactNode;

  /**
   * Identificador único do engine
   */
  readonly id: string;

  /**
   * Nome descritivo do engine
   */
  readonly name: string;
}
```

### Campos

| Campo             | Tipo                      | Obrigatório | Descrição                                             |
| ----------------- | ------------------------- | ----------- | ----------------------------------------------------- |
| `id`              | `string`                  | Sim         | Identificador único (ex: 'html-css', 'svg', 'canvas') |
| `name`            | `string`                  | Sim         | Nome descritivo (ex: 'HTML+CSS', 'SVG', 'Canvas')     |
| `renderEdge`      | `(props) => ReactNode`    | Sim         | Renderiza uma edge                                    |
| `renderContainer` | `(children) => ReactNode` | Não         | Container para todas as edges                         |

---

## Engine Padrão: HTML+CSS

### Implementação

```typescript
import React, { useMemo } from 'react'
import { calcLineLength, calcLineAngle } from '../../utils/geometry'
import type { EdgeRenderEngine, EdgeRenderEngineProps } from '../types'
import type { FlowboardTheme } from '../../theme/types'

export class HtmlCssEdgeEngine implements EdgeRenderEngine {
  readonly id = 'html-css'
  readonly name = 'HTML+CSS'

  renderEdge({
    edge,
    sourcePosition,
    targetPosition,
    selected,
    zoom,
    theme,
  }: EdgeRenderEngineProps): React.ReactNode {
    const strokeWidth = selected ? theme.edge.selectedStrokeWidth : theme.edge.strokeWidth
    const color = selected ? theme.edge.selectedStroke : theme.edge.stroke
    const length = calcLineLength(sourcePosition, targetPosition)
    const angle = calcLineAngle(sourcePosition, targetPosition)

    const lineStyle: React.CSSProperties = {
      position: 'absolute',
      left: sourcePosition.x,
      top: sourcePosition.y - strokeWidth / 2,
      width: length,
      height: strokeWidth,
      background: color,
      transformOrigin: '0 50%',
      transform: `rotate(${angle}deg)`,
      borderRadius: strokeWidth / 2,
      pointerEvents: 'auto',
      cursor: 'pointer',
      zIndex: selected ? 2 : 1,
    }

    const handleStyle: React.CSSProperties = {
      position: 'absolute',
      width: 12,
      height: 12,
      borderRadius: '50%',
      background: 'transparent',
      cursor: 'grab',
      zIndex: 10,
    }

    return (
      <div
        data-edge
        data-edge-id={edge.id}
        style={lineStyle}
      >
        <div
          data-edge-handle="source"
          style={{
            ...handleStyle,
            left: -6,
            top: -6 + strokeWidth / 2,
          }}
        />
        <div
          data-edge-handle="target"
          style={{
            ...handleStyle,
            right: -6,
            top: -6 + strokeWidth / 2,
          }}
        />
      </div>
    )
  }

  renderContainer(children: React.ReactNode): React.ReactNode {
    return <>{children}</>
  }
}
```

---

## Engine SVG

### Implementação

```typescript
import React from 'react'
import type { EdgeRenderEngine, EdgeRenderEngineProps } from '../types'
import type { FlowboardTheme } from '../../theme/types'

export class SvgEdgeEngine implements EdgeRenderEngine {
  readonly id = 'svg'
  readonly name = 'SVG'

  renderEdge({
    edge,
    sourcePosition,
    targetPosition,
    selected,
    zoom,
    theme,
  }: EdgeRenderEngineProps): React.ReactNode {
    const strokeWidth = selected ? theme.edge.selectedStrokeWidth : theme.edge.strokeWidth
    const color = selected ? theme.edge.selectedStroke : theme.edge.stroke

    return (
      <g data-edge data-edge-id={edge.id}>
        <line
          x1={sourcePosition.x}
          y1={sourcePosition.y}
          x2={targetPosition.x}
          y2={targetPosition.y}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          style={{ cursor: 'pointer' }}
        />
        <circle
          cx={sourcePosition.x}
          cy={sourcePosition.y}
          r={6}
          fill="transparent"
          stroke="transparent"
          data-edge-handle="source"
          style={{ cursor: 'grab' }}
        />
        <circle
          cx={targetPosition.x}
          cy={targetPosition.y}
          r={6}
          fill="transparent"
          stroke="transparent"
          data-edge-handle="target"
          style={{ cursor: 'grab' }}
        />
      </g>
    )
  }

  renderContainer(children: React.ReactNode): React.ReactNode {
    return (
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          overflow: 'visible',
        }}
      >
        <g style={{ pointerEvents: 'auto' }}>
          {children}
        </g>
      </svg>
    )
  }
}
```

---

## Engine Canvas

### Implementação

```typescript
import React, { useRef, useEffect, useCallback } from 'react'
import type { EdgeRenderEngine, EdgeRenderEngineProps } from '../types'
import type { FlowboardTheme } from '../../theme/types'
import type { Edge, Position } from '../../types'

interface CanvasEdge {
  edge: Edge
  sourcePosition: Position
  targetPosition: Position
  selected: boolean
}

export class CanvasEdgeEngine implements EdgeRenderEngine {
  readonly id = 'canvas'
  readonly name = 'Canvas'

  private edges: CanvasEdge[] = []
  private canvasRef: HTMLCanvasElement | null = null
  private theme: FlowboardTheme | null = null

  renderEdge({
    edge,
    sourcePosition,
    targetPosition,
    selected,
    zoom,
    theme,
  }: EdgeRenderEngineProps): React.ReactNode {
    // Armazena a edge para renderização posterior
    this.edges.push({ edge, sourcePosition, targetPosition, selected })
    this.theme = theme

    // Canvas não renderiza elementos React individuais
    // A renderização acontece no container
    return null
  }

  renderContainer(children: React.ReactNode): React.ReactNode {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
      this.canvasRef = canvasRef.current
    }, [])

    useEffect(() => {
      if (!this.canvasRef || !this.theme) return

      const ctx = this.canvasRef.getContext('2d')
      if (!ctx) return

      // Limpa o canvas
      ctx.clearRect(0, 0, this.canvasRef.width, this.canvasRef.height)

      // Renderiza todas as edges
      for (const { edge, sourcePosition, targetPosition, selected } of this.edges) {
        const strokeWidth = selected
          ? this.theme.edge.selectedStrokeWidth
          : this.theme.edge.strokeWidth
        const color = selected
          ? this.theme.edge.selectedStroke
          : this.theme.edge.stroke

        ctx.beginPath()
        ctx.moveTo(sourcePosition.x, sourcePosition.y)
        ctx.lineTo(targetPosition.x, targetPosition.y)
        ctx.strokeStyle = color
        ctx.lineWidth = strokeWidth
        ctx.lineCap = 'round'
        ctx.stroke()

        // Handles
        const handleRadius = 6
        ctx.fillStyle = 'transparent'
        ctx.strokeStyle = 'transparent'

        ctx.beginPath()
        ctx.arc(sourcePosition.x, sourcePosition.y, handleRadius, 0, Math.PI * 2)
        ctx.fill()

        ctx.beginPath()
        ctx.arc(targetPosition.x, targetPosition.y, handleRadius, 0, Math.PI * 2)
        ctx.fill()
      }

      // Limpa para próxima renderização
      this.edges = []
    }, [this.edges, this.theme])

    return (
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      >
        {children}
      </canvas>
    )
  }
}
```

---

## Uso

### Modo Simples (motor padrão)

```tsx
import { Flowboard } from 'flowboard';

// Usa HTML+CSS por padrão
<Flowboard nodes={nodes} edges={edges} />;
```

### Com Motor SVG

```tsx
import { Flowboard } from 'flowboard'
import { SvgEdgeEngine } from 'flowboard/engines/svg'

const svgEngine = new SvgEdgeEngine()

<Flowboard
  nodes={nodes}
  edges={edges}
  edgeEngine={svgEngine}
/>
```

### Com Motor Canvas

```tsx
import { Flowboard } from 'flowboard'
import { CanvasEdgeEngine } from 'flowboard/engines/canvas'

const canvasEngine = new CanvasEdgeEngine()

<Flowboard
  nodes={nodes}
  edges={edges}
  edgeEngine={canvasEngine}
/>
```

### Engine Customizado

```typescript
import type { EdgeRenderEngine, EdgeRenderEngineProps } from 'flowboard'

class MyCustomEngine implements EdgeRenderEngine {
  readonly id = 'my-custom'
  readonly name = 'My Custom Engine'

  renderEdge(props: EdgeRenderEngineProps): React.ReactNode {
    // Sua lógica de renderização customizada
    return <MinhaEdgeCustomizada {...props} />
  }

  renderContainer(children: React.ReactNode): React.ReactNode {
    return <div className="my-container">{children}</div>
  }
}

// Uso
<Flowboard
  nodes={nodes}
  edges={edges}
  edgeEngine={new MyCustomEngine()}
/>
```

---

## Props do Flowboard (atualização)

```typescript
export interface FlowboardProps<TNode, TEdge> {
  // ... props existentes

  /**
   * Motor de renderização de edges
   * @default HtmlCssEdgeEngine
   */
  edgeEngine?: EdgeRenderEngine<TEdge>;
}
```

---

## Renderização no Stage

```typescript
// Dentro de Stage.tsx
function Stage({ children, containerSize, edgeEngine }: StageProps) {
  const { state, theme } = useFlowboard()
  const engine = edgeEngine ?? new HtmlCssEdgeEngine()

  return (
    <div className={styles.stage} style={{ /* ... */ }}>
      {theme.stage.gridVisible && <Grid />}

      {/* Container do engine (se houver) */}
      {engine.renderContainer ? (
        engine.renderContainer(
          <>
            {state.nodes.map((node) => (
              <Node key={node.id} node={node} zoom={state.zoom} />
            ))}
            {state.edges.map((edge) => {
              if (!edge.source || !edge.target) return null

              const sourceNode = state.nodes.find((n) => n.id === edge.source!.nodeId)
              const targetNode = state.nodes.find((n) => n.id === edge.target!.nodeId)
              if (!sourceNode || !targetNode) return null

              const sourcePos = getPortAbsolutePosition(sourceNode, edge.source.port, theme.port.size)
              const targetPos = getPortAbsolutePosition(targetNode, edge.target.port, theme.port.size)

              return engine.renderEdge({
                edge,
                sourcePosition: sourcePos,
                targetPosition: targetPos,
                selected: state.selectedEdgeId === edge.id,
                zoom: state.zoom,
                theme,
              })
            })}
          </>
        )
      ) : (
        <>
          {state.nodes.map((node) => (
            <Node key={node.id} node={node} zoom={state.zoom} />
          ))}
          {state.edges.map((edge) => {
            // ... mesma lógica acima
          })}
        </>
      )}
    </div>
  )
}
```

---

## Comparação de Engines

| Feature           | HTML+CSS          | SVG             | Canvas            |
| ----------------- | ----------------- | --------------- | ----------------- |
| **Performance**   | Boa (~100)        | Melhor (~500)   | Ótima (~1000+)    |
| **Bezier curves** | Manual            | Nativo          | Manual            |
| **Zoom/Pan**      | Via CSS transform | Via SVG viewBox | Via ctx.transform |
| **Eventos**       | Automático        | Automático      | Manual            |
| **Antialiasing**  | Browser           | Browser         | Canvas            |
| **Memória**       | Baixa             | Média           | Baixa             |
| **Complexidade**  | Baixa             | Média           | Alta              |

---

## Testes

### EdgeRenderEngine (interface)

- Interface define id, name, renderEdge
- renderContainer é opcional
- renderEdge recebe props corretas

### HtmlCssEdgeEngine

- Renderiza div com style correto
- Calcula ângulo e comprimento
- Renderiza handles de desconexão
- Aplica estilo selecionado
- Container retorna fragment

### SvgEdgeEngine

- Renderiza elemento <line>
- Renderiza handles como <circle>
- Container renderiza <svg>
- Usa namespace SVG correto

### CanvasEdgeEngine

- Armazena edges para renderização
- Container renderiza <canvas>
- Renderiza linhas no canvas
- Limpa canvas entre renders

### Integração

- Flowboard aceita edgeEngine prop
- Motor padrão é HTML+CSS
- Troca de engine funciona
- Events delegation funciona com qualquer engine
