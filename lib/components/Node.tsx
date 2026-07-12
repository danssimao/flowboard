import styles from './Flowboard.module.css';

export type NodeProps = {
  id: string;
};

export const Node = (props: NodeProps) => {
  return (
    <div className={styles.node}>
      <span className="node-title">{props.id}</span>
    </div>
  );
};
