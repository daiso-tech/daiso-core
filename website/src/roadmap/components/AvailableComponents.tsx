import { foundationExistingItems, storageExistingItems, reliabilityExistingItems, concurrencyExistingItems, messagingExistingItems, webExistingItems } from "../../data";
import { AvailableCategory } from "./AvailableCategory";
import styles from "../roadmap.module.css";

export function AvailableComponents() {
  return (
    <section className={styles.availableSection}>
      <AvailableCategory label="Foundation" items={foundationExistingItems} />
      <AvailableCategory label="Storage" items={storageExistingItems} />
      <AvailableCategory label="Resilience" items={reliabilityExistingItems} />
      <AvailableCategory label="Concurrency" items={concurrencyExistingItems} />
      <AvailableCategory label="Messaging" items={messagingExistingItems} />
      <AvailableCategory label="Web" items={webExistingItems} />
    </section>
  );
}
