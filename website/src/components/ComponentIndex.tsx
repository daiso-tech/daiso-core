import type { ComponentItemProps } from "../data/types";
import Link from "@docusaurus/Link";

export type ComponentSection = {
    label: string;
    intro?: string;
    items: readonly ComponentItemProps[];
};

export function ComponentIndex({ sections }: { sections: readonly ComponentSection[] }) {
    return (
        <>
            {sections.map((section) => {
                if (section.items.length === 0) return null;
                return (
                    <section key={section.label}>
                        <h2>{section.label}</h2>
                        {section.intro ? <p>{section.intro}</p> : null}
                        <ul>
                            {section.items.map((item, i) => (
                                <li key={i}>
                                    {item.link ? (
                                        <Link to={item.link}>{item.title}</Link>
                                    ) : (
                                        item.title
                                    )}
                                    {" — "}
                                    {item.description}
                                </li>
                            ))}
                        </ul>
                    </section>
                );
            })}
        </>
    );
}
