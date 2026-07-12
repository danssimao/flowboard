import styles from './Flowboard.module.css';

export type EdgeProps = {
  id: string;
};

export const Edge = (props: EdgeProps) => {
  return (
    <div className={styles.edge}>
      <span className="edge-label">{props.id}</span>
    </div>
  );
};
