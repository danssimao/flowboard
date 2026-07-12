import { Root } from './Root';
import { TopBar } from './TopBar';
import { Control } from './Control';
import { Menu } from './Menu';
import { Container } from './Container';
import { Cursor } from './Cursor';
import { Edge } from './Edge';
import { Node } from './Node';
import { Stage } from './Stage';
import { BottomBar } from './BottomBar';

export interface WidgetProps {
  title: string;
}

export function Flowboard() {
  return (
    <Root>
      <TopBar>
        <Control />
        <Menu />
      </TopBar>

      <Container>
        <Stage>
          <Node id="Node 1" />
          <Edge id="Edge 1" />
        </Stage>

        <Cursor />
      </Container>

      <BottomBar />
    </Root>
  );
}
