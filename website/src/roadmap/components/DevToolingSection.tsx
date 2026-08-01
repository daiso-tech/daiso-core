import { DEV_TOOLING_ITEMS } from "../../data/data";
import { PlannedCardGrid } from "./PlannedCardGrid";
import styles from "../roadmap.module.css";

export function DevToolingSection() {
  return (<section className={styles.futureSection}><PlannedCardGrid items={DEV_TOOLING_ITEMS} /></section>);
}
