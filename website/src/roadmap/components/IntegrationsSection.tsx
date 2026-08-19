import { INTEGRATIONS_ITEMS } from "../../data/data";
import { PlannedCardGrid } from "./PlannedCardGrid";
import styles from "../roadmap.module.css";

export function IntegrationsSection() {
  return (<section className={styles.futureSection}><PlannedCardGrid items={INTEGRATIONS_ITEMS} /></section>);
}
