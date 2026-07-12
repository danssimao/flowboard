import styles from './Flowboard.module.css';

export const Menu = () => {
  return (
    <nav className={styles.menu}>
      <button className={styles.menuButton}>Menu</button>
      <menu className={styles.menuList}>
        <li className={styles.menuItem}>
          <button className={styles.menuButtonItem}>Item 1</button>
        </li>
        <li className={styles.menuItem}>
          <button className={styles.menuButtonItem}>Item 2</button>
        </li>
        <li className={styles.menuItem}>
          <button className={styles.menuButtonItem}>Item 3</button>
        </li>
      </menu>
    </nav>
  );
};
