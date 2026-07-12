# 0002 - Theme

## Objetivo

Definir o sistema de temas para customização visual de todos os elementos do Flowboard.
O tema permite ao consumidor alterar cores, tamanhos, bordas, sombras e outros
estilos sem modificar o CSS diretamente.

## Dependências

- 0001 (Types)

## Arquivos a Criar

- `lib/theme/types.ts`
- `lib/theme/default.ts`

---

## Tipos do Tema

### FlowboardTheme

```typescript
export interface FlowboardTheme {
  stage: StageTheme;
  node: NodeTheme;
  edge: EdgeTheme;
  port: PortTheme;
  menu: MenuTheme;
  footer: FooterTheme;
}
```

### StageTheme

```typescript
export interface StageTheme {
  background: string;
  gridSize: number;
  gridColor: string;
  gridVisible: boolean;
}
```

| Campo         | Tipo      | Descrição                            |
| ------------- | --------- | ------------------------------------ |
| `background`  | `string`  | Cor de fundo do stage (CSS color)    |
| `gridSize`    | `number`  | Tamanho da célula da grade em pixels |
| `gridColor`   | `string`  | Cor dos pontos/linhas da grade       |
| `gridVisible` | `boolean` | Se a grade está visível              |

### NodeTheme

```typescript
export interface NodeTheme {
  background: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  boxShadow: string;
  selectedBorderColor: string;
  selectedBorderWidth: number;
  selectedBoxShadow: string;
  minWidth: number;
  minHeight: number;
  padding: number;
}
```

| Campo                 | Tipo     | Descrição                                |
| --------------------- | -------- | ---------------------------------------- |
| `background`          | `string` | Cor de fundo do node                     |
| `borderColor`         | `string` | Cor da borda padrão                      |
| `borderWidth`         | `number` | Largura da borda padrão (px)             |
| `borderRadius`        | `number` | Raio da borda (px)                       |
| `boxShadow`           | `string` | Sombra padrão (CSS box-shadow)           |
| `selectedBorderColor` | `string` | Cor da borda quando selecionado          |
| `selectedBorderWidth` | `number` | Largura da borda quando selecionado (px) |
| `selectedBoxShadow`   | `string` | Sombra quando selecionado                |
| `minWidth`            | `number` | Largura mínima do node (px)              |
| `minHeight`           | `number` | Altura mínima do node (px)               |
| `padding`             | `number` | Padding interno do node (px)             |

### EdgeTheme

```typescript
export interface EdgeTheme {
  stroke: string;
  strokeWidth: number;
  selectedStroke: string;
  selectedStrokeWidth: number;
  dashArray?: string;
}
```

| Campo                 | Tipo     | Descrição                                 |
| --------------------- | -------- | ----------------------------------------- |
| `stroke`              | `string` | Cor da aresta padrão                      |
| `strokeWidth`         | `number` | Largura da aresta padrão (px)             |
| `selectedStroke`      | `string` | Cor da aresta quando selecionada          |
| `selectedStrokeWidth` | `number` | Largura da aresta quando selecionada (px) |
| `dashArray`           | `string` | Padrão de tracejado (CSS border-style)    |

### PortTheme

```typescript
export interface PortTheme {
  size: number;
  background: string;
  borderColor: string;
  hoverBackground: string;
  hoverBorderColor: string;
  activeBackground: string;
  activeBorderColor: string;
}
```

| Campo               | Tipo     | Descrição                              |
| ------------------- | -------- | -------------------------------------- |
| `size`              | `number` | Diâmetro do port (px)                  |
| `background`        | `string` | Cor de fundo padrão                    |
| `borderColor`       | `string` | Cor da borda padrão                    |
| `hoverBackground`   | `string` | Cor de fundo no hover                  |
| `hoverBorderColor`  | `string` | Cor da borda no hover                  |
| `activeBackground`  | `string` | Cor de fundo quando ativo (arrastando) |
| `activeBorderColor` | `string` | Cor da borda quando ativo              |

### MenuTheme

```typescript
export interface MenuTheme {
  background: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  boxShadow: string;
  itemBackground: string;
  itemHoverBackground: string;
  itemBorderColor: string;
  itemBorderRadius: number;
  itemPadding: string;
  titleColor: string;
  titleFontSize: number;
  titleFontWeight: number;
}
```

| Campo                 | Tipo     | Descrição                         |
| --------------------- | -------- | --------------------------------- |
| `background`          | `string` | Cor de fundo do menu              |
| `borderColor`         | `string` | Cor da borda do menu              |
| `borderWidth`         | `number` | Largura da borda (px)             |
| `borderRadius`        | `number` | Raio da borda (px)                |
| `boxShadow`           | `string` | Sombra do menu                    |
| `itemBackground`      | `string` | Cor de fundo dos itens            |
| `itemHoverBackground` | `string` | Cor de fundo dos itens no hover   |
| `itemBorderColor`     | `string` | Cor da borda dos itens            |
| `itemBorderRadius`    | `number` | Raio da borda dos itens (px)      |
| `itemPadding`         | `string` | Padding dos itens (CSS shorthand) |
| `titleColor`          | `string` | Cor do título do menu             |
| `titleFontSize`       | `number` | Tamanho da fonte do título (px)   |
| `titleFontWeight`     | `number` | Peso da fonte do título           |

### FooterTheme

```typescript
export interface FooterTheme {
  background: string;
  borderColor: string;
  borderWidth: number;
  height: number;
  textColor: string;
  fontSize: number;
  toggleActiveColor: string;
  toggleInactiveColor: string;
}
```

| Campo                 | Tipo     | Descrição                       |
| --------------------- | -------- | ------------------------------- |
| `background`          | `string` | Cor de fundo do footer          |
| `borderColor`         | `string` | Cor da borda superior do footer |
| `borderWidth`         | `number` | Largura da borda (px)           |
| `height`              | `number` | Altura do footer (px)           |
| `textColor`           | `string` | Cor do texto                    |
| `fontSize`            | `number` | Tamanho da fonte (px)           |
| `toggleActiveColor`   | `string` | Cor do toggle quando ativo      |
| `toggleInactiveColor` | `string` | Cor do toggle quando inativo    |

---

## Tema Padrão (Light)

```typescript
export const defaultTheme: FlowboardTheme = {
  stage: {
    background: '#f8f9fa',
    gridSize: 20,
    gridColor: '#e9ecef',
    gridVisible: true,
  },
  node: {
    background: '#ffffff',
    borderColor: '#dee2e6',
    borderWidth: 1,
    borderRadius: 8,
    boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
    selectedBorderColor: '#4dabf7',
    selectedBorderWidth: 2,
    selectedBoxShadow: '0 0 0 2px rgba(77,171,247,0.25)',
    minWidth: 150,
    minHeight: 60,
    padding: 12,
  },
  edge: {
    stroke: '#adb5bd',
    strokeWidth: 2,
    selectedStroke: '#4dabf7',
    selectedStrokeWidth: 3,
  },
  port: {
    size: 12,
    background: '#ffffff',
    borderColor: '#adb5bd',
    hoverBackground: '#4dabf7',
    hoverBorderColor: '#4dabf7',
    activeBackground: '#228be6',
    activeBorderColor: '#228be6',
  },
  menu: {
    background: '#ffffff',
    borderColor: '#dee2e6',
    borderWidth: 1,
    borderRadius: 8,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    itemBackground: '#f8f9fa',
    itemHoverBackground: '#e9ecef',
    itemBorderColor: '#dee2e6',
    itemBorderRadius: 6,
    itemPadding: '8px 12px',
    titleColor: '#495057',
    titleFontSize: 14,
    titleFontWeight: 600,
  },
  footer: {
    background: '#ffffff',
    borderColor: '#dee2e6',
    borderWidth: 1,
    height: 32,
    textColor: '#495057',
    fontSize: 12,
    toggleActiveColor: '#4dabf7',
    toggleInactiveColor: '#adb5bd',
  },
};
```

---

## Função de Merge

```typescript
export function mergeTheme(
  base: FlowboardTheme,
  override?: Partial<FlowboardTheme>,
): FlowboardTheme {
  if (!override) return base;

  return {
    stage: { ...base.stage, ...override.stage },
    node: { ...base.node, ...override.node },
    edge: { ...base.edge, ...override.edge },
    port: { ...base.port, ...override.port },
    menu: { ...base.menu, ...override.menu },
    footer: { ...base.footer, ...override.footer },
  };
}
```

A função faz merge superficial (shallow) por seção. Se o consumidor quiser
sobrescrever apenas a cor dos nodes, basta passar `{ node: { borderColor: 'red' } }`
e todos os outros valores do `node` serão preservados do tema base.

---

## CSS Variables

O tema será aplicado via CSS custom properties no nível do Container. Cada
seção do tema gera um conjunto de variáveis:

```css
.flowboard-container {
  /* Stage */
  --stage-background: #f8f9fa;
  --stage-grid-size: 20px;
  --stage-grid-color: #e9ecef;

  /* Node */
  --node-background: #ffffff;
  --node-border-color: #dee2e6;
  --node-border-width: 1px;
  --node-border-radius: 8px;
  --node-box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
  --node-selected-border-color: #4dabf7;
  --node-selected-border-width: 2px;
  --node-selected-box-shadow: 0 0 0 2px rgba(77, 171, 247, 0.25);

  /* Edge */
  --edge-stroke: #adb5bd;
  --edge-stroke-width: 2px;
  --edge-selected-stroke: #4dabf7;
  --edge-selected-stroke-width: 3px;

  /* Port */
  --port-size: 12px;
  --port-background: #ffffff;
  --port-border-color: #adb5bd;
  --port-hover-background: #4dabf7;
  --port-hover-border-color: #4dabf7;
  --port-active-background: #228be6;
  --port-active-border-color: #228be6;

  /* Menu */
  --menu-background: #ffffff;
  --menu-border-color: #dee2e6;
  --menu-border-radius: 8px;
  --menu-box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  --menu-item-background: #f8f9fa;
  --menu-item-hover-background: #e9ecef;
  --menu-item-border-color: #dee2e6;
  --menu-item-border-radius: 6px;
  --menu-title-color: #495057;

  /* Footer */
  --footer-background: #ffffff;
  --footer-border-color: #dee2e6;
  --footer-height: 32px;
  --footer-text-color: #495057;
  --footer-toggle-active-color: #4dabf7;
  --footer-toggle-inactive-color: #adb5bd;
}
```

---

## Testes

- `defaultTheme` contém todas as seções obrigatórias (stage, node, edge, port, menu, footer)
- Cada seção contém todos os campos definidos no type
- `mergeTheme` com override parcial preserva valores do base
- `mergeTheme` com override completo substitui valores
- `mergeTheme` sem override retorna o base idêntico
- `mergeTheme` com override vazio `{}` retorna o base
- Todas as cores são strings válidas
- Todos os tamanhos são números positivos
