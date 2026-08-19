import {
    FOUNDATION_EXISTING_ITEMS,
    STORAGE_EXISTING_ITEMS,
    RELIABILITY_EXISTING_ITEMS,
    CONCURRENCY_EXISTING_ITEMS,
    MESSAGING_EXISTING_ITEMS,
    WEB_EXISTING_ITEMS,
    UTILITIES_EXISTING_ITEMS,
} from "../../data/data";
import { AvailableCategory } from "./AvailableCategory";
import styles from "../roadmap.module.css";

export function AvailableComponents() {
    return (
        <section className={styles.availableSection}>
            <AvailableCategory
                label="Foundation"
                items={FOUNDATION_EXISTING_ITEMS}
            />
            <AvailableCategory label="Storage" items={STORAGE_EXISTING_ITEMS} />
            <AvailableCategory
                label="Resilience"
                items={RELIABILITY_EXISTING_ITEMS}
            />
            <AvailableCategory
                label="Concurrency"
                items={CONCURRENCY_EXISTING_ITEMS}
            />
            <AvailableCategory
                label="Messaging"
                items={MESSAGING_EXISTING_ITEMS}
            />
            <AvailableCategory label="Web" items={WEB_EXISTING_ITEMS} />
            <AvailableCategory label="Utilities" items={UTILITIES_EXISTING_ITEMS} />
        </section>
    );
}
