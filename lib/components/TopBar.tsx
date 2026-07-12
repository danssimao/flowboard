import styles from './Flowboard.module.css';

export const TopBar = ({ children }: { children: React.ReactNode }) => {
  return <header className={styles.header}>{children}</header>;
};
