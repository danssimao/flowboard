# 0003 - Utils

## Objetivo

Funções utilitárias puras para geração de UUIDs e cálculos geométricos.
Essas funções são usadas por todos os outros módulos e são testadas isoladamente.

## Dependências

- 0001 (Types)

## Arquivos a Criar

- `lib/utils/uuid.ts`
- `lib/utils/uuid.test.ts`
- `lib/utils/geometry.ts`
- `lib/utils/geometry.test.ts`

---

## uuid.ts

### generateId()

Gera um UUID v4. Usa `crypto.randomUUID()` quando disponível, com fallback
para ambientes que não suportam (ex: testes com jsdom antigo).

```typescript
export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
```

### Testes

- Retorna string no formato UUID v4 (`xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`)
- Duas chamadas retornam IDs diferentes (unicidade)
- Fallback funciona quando `crypto.randomUUID` não existe

---

## geometry.ts

### getPortPosition(node, portId, defaultNodeSize?)

Calcula a posição absoluta de um port no stage, baseado na posição do node
e no portId.

```typescript
export function getPortPosition(
  node: { position: Position; size?: Size },
  portId: PortId,
  defaultNodeSize: Size = { width: 150, height: 60 }
): Position {
  const size = node.size ?? defaultNodeSize
  const { x, y } = node.position

  switch (portId) {
    case 'top':
      return { x: x + size.width / 2, y }
    case 'right':
      return { x: x + size.width, y: y + size.height / 2 }
    case 'bottom':
      return { x: x + size.width / 2, y: y + size.height }
    case 'left':
      return { x, y: y + size.height / 2 }
  }
}
```

**Port positions visualizadas:**

```
        top (centro superior)
          ↓
    ┌─────────────┐
    │             │
left ──→       ←── right
(cento    │             │  (cento
 esquerda)│             │  direita)
    │             │
    └─────────────┘
          ↑
        bottom (centro inferior)
```

### getPortAbsolutePosition(node, portId, portSize, defaultNodeSize?)

Calcula a posição absoluta do centro do port (considerando o tamanho do port).
Usado para posicionar handles de desconexão e para renderizar edges.

```typescript
export function getPortAbsolutePosition(
  node: { position: Position; size?: Size },
  portId: PortId,
  portSize: number,
  defaultNodeSize: Size = { width: 150, height: 60 }
): Position {
  const size = node.size ?? defaultNodeSize
  const halfPort = portSize / 2
  const { x, y } = node.position

  switch (portId) {
    case 'top':
      return { x: x + size.width / 2, y: y - halfPort }
    case 'right':
      return { x: x + size.width + halfPort, y: y + size.height / 2 }
    case 'bottom':
      return { x: x + size.width / 2, y: y + size.height + halfPort }
    case 'left':
      return { x: x - halfPort, y: y + size.height / 2 }
  }
}
```

### calcLineAngle(from, to)

Calcula o ângulo em graus entre dois pontos. Usado para rotacionar a linha
reta que representa uma edge.

```typescript
export function calcLineAngle(from: Position, to: Position): number {
  return Math.atan2(to.y - from.y, to.x - from.x) * (180 / Math.PI)
}
```

### calcLineLength(from, to)

Calcula a distância euclidiana entre dois pontos. Usado para definir a
largura da linha reta que representa uma edge.

```typescript
export function calcLineLength(from: Position, to: Position): number {
  const dx = to.x - from.x
  const dy = to.y - from.y
  return Math.sqrt(dx * dx + dy * dy)
}
```

### clamp(value, min, max)

Limita um valor a um range [min, max].

```typescript
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}
```

### snapToGrid(position, gridSize)

Alinha uma posição à grade mais próxima.

```typescript
export function snapToGrid(position: Position, gridSize: number): Position {
  return {
    x: Math.round(position.x / gridSize) * gridSize,
    y: Math.round(position.y / gridSize) * gridSize,
  }
}
```

### getOppositePort(portId)

Retorna o port oposto ao informado. Usado para lógica de reconexão.

```typescript
export function getOppositePort(portId: PortId): PortId {
  const opposites: Record<PortId, PortId> = {
    top: 'bottom',
    right: 'left',
    bottom: 'top',
    left: 'right',
  }
  return opposites[portId]
}
```

### distanceBetween(a, b)

Retorna a distância euclidiana entre dois pontos. Alias mais legível para `calcLineLength`.

```typescript
export function distanceBetween(a: Position, b: Position): number {
  return calcLineLength(a, b)
}
```

### findClosestPort(position, ports)

Dada uma posição do mouse e uma lista de portas com suas posições absolutas,
retorna o port mais próximo dentro de um threshold.

```typescript
interface PortWithPosition {
  nodeId: string
  portId: PortId
  position: Position
}

export function findClosestPort(
  position: Position,
  ports: PortWithPosition[],
  threshold: number = 20
): PortWithPosition | null {
  let closest: PortWithPosition | null = null
  let minDist = threshold

  for (const port of ports) {
    const dist = distanceBetween(position, port.position)
    if (dist < minDist) {
      minDist = dist
      closest = port
    }
  }

  return closest
}
```

---

## Testes

### getPortPosition

- Port 'top' retorna centro superior do node
- Port 'right' retorna centro direita do node
- Port 'bottom' retorna centro inferior do node
- Port 'left' retorna centro esquerda do node
- Usa size default quando node não tem size definido
- Funciona com size customizado
- Posições são relativas ao canto superior esquerdo do node

### getPortAbsolutePosition

- Retorna posição com offset do portSize
- Port 'top' fica acima do node
- Port 'right' fica à direita do node
- Port 'bottom' fica abaixo do node
- Port 'left' fica à esquerda do node

### calcLineAngle

- Linha horizontal para direita (0,0)→(100,0) retorna 0°
- Linha vertical para baixo (0,0)→(0,100) retorna 90°
- Linha horizontal para esquerda (0,0)→(-100,0) retorna 180° ou -180°
- Linha diagonal (0,0)→(100,100) retorna 45°

### calcLineLength

- Distância entre pontos idênticos é 0
- Distância (0,0)→(3,4) é 5
- Distância (0,0)→(-3,4) é 5
- Distância é sempre positiva
- Distância é simétrica (A→B = B→A)

### clamp

- Valor dentro do range retorna ele mesmo: `clamp(5, 0, 10)` → `5`
- Valor abaixo do min retorna min: `clamp(-5, 0, 10)` → `0`
- Valor acima do max retorna max: `clamp(15, 0, 10)` → `10`
- Min igual ao max retorna min: `clamp(5, 3, 3)` → `3`

### snapToGrid

- (25, 35) com gridSize 20 → (20, 40)
- (10, 10) com gridSize 20 → (20, 20)
- (0, 0) com gridSize 20 → (0, 0)
- (19, 19) com gridSize 20 → (20, 20)
- (-5, -5) com gridSize 20 → (0, 0)
- Posições negativas são arredondadas corretamente

### getOppositePort

- top → bottom
- right → left
- bottom → top
- left → right

### distanceBetween

- Mesmo ponto retorna 0
- (0,0)→(3,4) retorna 5
- (0,0)→(-3,-4) retorna 5
- Simétrico: distanceBetween(A, B) === distanceBetween(B, A)

### findClosestPort

- Retorna null quando nenhum port está dentro do threshold
- Retorna o port mais próximo quando há múltiplos dentro do threshold
- Ignora ports de outros nodes (filtra por nodeId se necessário)
- Threshold padrão é 20
