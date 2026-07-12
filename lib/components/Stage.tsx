import styles from './Flowboard.module.css';

export const Stage = (props: { children: React.ReactNode }) => {
  return <div className={styles.stage}>{props.children}</div>;
};
