import styles from './Flowboard.module.css';

export const Root = ({ children }: { children: React.ReactNode }) => {
  return <div className={styles.root}>{children}</div>;
};
