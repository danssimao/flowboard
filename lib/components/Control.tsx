import styles from './Flowboard.module.css';

export const Control = () => {
  return (
    <menu className={styles.control}>
      <li className={styles.controlItem}>
        <button className={styles.controlButton}>Zoom In</button>
      </li>
      <li className={styles.controlItem}>
        <button className={styles.controlButton}>Zoom Out</button>
      </li>
      <li className={styles.controlItem}>
        <button className={styles.controlButton}>Snap</button>
      </li>
      <li className={styles.controlItem}>
        <button className={styles.controlButton}>Realign</button>
      </li>
    </menu>
  );
};
