import { integrationsItems } from "../../data";
import { PlannedCardGrid } from "./PlannedCardGrid";
import styles from "../roadmap.module.css";

export function IntegrationsSection() {
  return (<section className={styles.futureSection}><PlannedCardGrid items={integrationsItems} /></section>);
}
