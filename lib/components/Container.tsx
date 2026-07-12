import styles from './Flowboard.module.css';

export const Container = (props: { children: React.ReactNode }) => {
  return <article className={styles.container}>{props.children}</article>;
};
