import {
    UPCOMING_ITEMS,
    FOUNDATION_EXISTING_ITEMS,
    STORAGE_EXISTING_ITEMS,
    RELIABILITY_EXISTING_ITEMS,
    CONCURRENCY_EXISTING_ITEMS,
    MESSAGING_EXISTING_ITEMS,
    WEB_EXISTING_ITEMS,
    FEATURE_ITEMS,
    PERFECT_FOR,
    NOT_IDEAL_FOR,
    CODE_EXAMPLES,
    COMPARISONS,
    INSTALL_CMD,
    GITHUB_REPO_URL,
} from "../data/data";
import type { FeatureItemProps } from "../data/types";
import { AvailableCategory } from "../roadmap/components/AvailableCategory";
import { PlannedCardGrid } from "../roadmap/components/PlannedCardGrid";
import { FeatureItem } from "../components/FeatureItem";
import { ArrowRight, Copy, Check, Star } from "lucide-react";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import { type ReactNode, useState, useCallback } from "react";
import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import CodeBlock from "@theme/CodeBlock";
import Tabs from "@theme/Tabs";
import TabItem from "@theme/TabItem";
import { COMPONENT_COUNT } from "../../utilities/package-json-data";

function InstallCommand() {
    const [copied, setCopied] = useState(false);
    const copy = useCallback(() => {
        void navigator.clipboard.writeText(INSTALL_CMD).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }, []);
    return (
        <div className="daiso-install-command">
            <code>{INSTALL_CMD}</code>
            <button
                className="daiso-copy-btn"
                onClick={copy}
                aria-label="Copy install command"
                title={copied ? "Copied!" : "Copy"}
            >
                {copied ? (
                    <Check size="1rem" strokeWidth={2.5} />
                ) : (
                    <Copy size="1rem" strokeWidth={2} />
                )}
            </button>
        </div>
    );
}

// --- Stats bar ---

function StatItem({ value, label }: { value: string; label: string }) {
    return (
        <div className="daiso-stat-item">
            <span className="daiso-stat-value">{value}</span>
            <span className="daiso-stat-label">{label}</span>
        </div>
    );
}

function StatsBar() {
    return (
        <div className="daiso-stats-bar">
            <div className="container">
                <div className="daiso-stats-inner">
                    <StatItem
                        value={String(COMPONENT_COUNT)}
                        label="Officially maintained components"
                    />
                    <StatItem value="100%" label="TypeScript" />
                    <StatItem
                        value="4,640+"
                        label="Integration & behavior tests"
                    />
                    <StatItem value="0" label="Docker needed for tests" />
                </div>
            </div>
        </div>
    );
}

function CodeShowcaseActions() {
    return (
        <div className="daiso-showcase-actions">
            <InstallCommand />
            <div className="daiso-showcase-ctas">
                <Link
                    className="button button--secondary button--lg"
                    to="./docs/getting_started"
                >
                    Get started{" "}
                    <ArrowRight
                        size="1rem"
                        style={{
                            marginLeft: "0.4rem",
                            verticalAlign: "middle",
                        }}
                    />
                </Link>
                <Link
                    className="button button--outline button--secondary button--lg"
                    href={GITHUB_REPO_URL}
                >
                    View on GitHub
                </Link>
            </div>
        </div>
    );
}

function CodeShowcase() {
    const [activeIndex, setActiveIndex] = useState(0);
    const [fading, setFading] = useState(false);
    const codeExamples = Object.values(CODE_EXAMPLES);

    const goTo = useCallback(
        (index: number) => {
            if (index === activeIndex) return;
            setFading(true);
            setTimeout(() => {
                setActiveIndex(index);
                setFading(false);
            }, 180);
        },
        [activeIndex],
    );

    return (
        <section className="padding-vert--xl">
            <div className="container">
                <div className="daiso-section-header daiso-section-header--split">
                    <h2 className="daiso-section-title">
                        Unified foundation
                    </h2>
                    <div className="daiso-segmented-control">
                        {codeExamples.map((ex, i) => (
                            <button
                                key={i}
                                className={`daiso-segmented-option${i === activeIndex ? " daiso-segmented-option--active" : ""}`}
                                onClick={() => goTo(i)}
                            >
                                {ex.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="row">
                    <div className="col col--5 daiso-showcase-text-col">
                        <div
                            className={`daiso-carousel-text${fading ? " daiso-carousel-text--fading" : ""}`}
                        >
                            <h3
                                className="daiso-section-subtitle"
                                style={{
                                    textAlign: "left",
                                    fontWeight: 700,
                                    color: "var(--ifm-color-emphasis-900)",
                                    fontSize: "1.25rem",
                                }}
                            >
                                {codeExamples[activeIndex].heading}
                            </h3>
                            <p
                                className="daiso-section-subtitle"
                                style={{
                                    margin: "0 0 1.25rem",
                                    textAlign: "left",
                                }}
                            >
                                {codeExamples[activeIndex].description}
                            </p>
                            <ul className="daiso-check-list">
                                {codeExamples[activeIndex].bullets.map(
                                    (b, i) => (
                                        <li key={i}>
                                            <Check
                                                size="1rem"
                                                strokeWidth={2.5}
                                            />{" "}
                                            {b}
                                        </li>
                                    ),
                                )}
                            </ul>
                        </div>

                        <CodeShowcaseActions />
                    </div>
                    <div className="col col--7 daiso-showcase-code-col">
                        {codeExamples[activeIndex].codeBlockDescription && (
                            <p className="daiso-carousel-description">
                                {codeExamples[activeIndex].codeBlockDescription}
                            </p>
                        )}
                        <div className="daiso-carousel">
                            <div
                                className={`daiso-carousel-body${fading ? " daiso-carousel-body--fading" : ""}`}
                            >
                                <Tabs key={activeIndex}>
                                    {codeExamples[activeIndex].files.map(
                                        (file, i) => (
                                            <TabItem
                                                key={i}
                                                value={file.name}
                                                label={file.name}
                                            >
                                                <CodeBlock language="typescript">
                                                    {file.code}
                                                </CodeBlock>
                                            </TabItem>
                                        ),
                                    )}
                                </Tabs>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function FeatureSection({ items }: { items: FeatureItemProps[] }) {
    return (
        <section className="padding-vert--xl daiso-section-alt">
            <div className="container">
                <div className="margin-bottom--xl">
                    <h2 className="daiso-section-title">Why eridu-tech?</h2>
                    <p className="daiso-section-subtitle">
                        Designed from the ground up for real-world backend
                        challenges — no vendor lock-in, no Docker required for
                        testing, no DI container overhead.
                    </p>
                </div>
                <div className="row">
                    {items.map((item, idx) => (
                        <div className="col col--4 margin-bottom--lg" key={idx}>
                            <FeatureItem {...item} />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function WhoIsThisFor() {
    return (
        <section className="padding-vert--xl">
            <div className="container">
                <div className="margin-bottom--xl">
                    <h2 className="daiso-section-title">Who is this for?</h2>
                    <p className="daiso-section-subtitle">
                        eridu-tech is built for backend and fullstack TypeScript
                        developers who value flexibility and testability.
                    </p>
                </div>
                <div
                    className="row"
                    style={{
                        justifyContent: "stretch",
                        alignItems: "start",
                    }}
                >
                    <div className="col col--6">
                        <div className="daiso-who-card daiso-who-yes">
                            <h3>
                                <Check
                                    size="1.25rem"
                                    strokeWidth={2.5}
                                    style={{
                                        marginRight: "0.5rem",
                                        verticalAlign: "middle",
                                        color: "var(--ifm-color-primary)",
                                    }}
                                />
                                Perfect for
                            </h3>
                            <ul className="daiso-who-list">
                                {Object.values(PERFECT_FOR).map((item, i) => (
                                    <li key={i}>
                                        <strong>{item.title}</strong>{" "}
                                        {item.description}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    <div className="col col--6">
                        <div className="daiso-who-card daiso-who-no">
                            <h3>
                                <Star
                                    size="1.25rem"
                                    strokeWidth={2}
                                    style={{
                                        marginRight: "0.5rem",
                                        verticalAlign: "middle",
                                        opacity: 0.7,
                                    }}
                                />
                                Not ideal for
                            </h3>
                            <ul className="daiso-who-list">
                                {Object.values(NOT_IDEAL_FOR).map((item, i) => (
                                    <li key={i}>
                                        <strong>{item.title}</strong>{" "}
                                        {item.description}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

// --- Components (Available Today) ---

function ComponentSection() {
    return (
        <section className="padding-vert--xl daiso-section-alt">
            <div className="container">
                <div className="margin-bottom--xl">
                    <h2 className="daiso-section-title">
                        Officially Maintained Components
                    </h2>
                    <p className="daiso-section-subtitle">
                        A growing collection of officially maintained
                        components. Every component ships with multiple built-in
                        adapters — swap infrastructure without changing a single
                        line of business logic.
                    </p>
                </div>
                <AvailableCategory
                    label="Foundation"
                    items={FOUNDATION_EXISTING_ITEMS}
                />
                <AvailableCategory
                    label="Storage"
                    items={STORAGE_EXISTING_ITEMS}
                />
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
                <div className="text--center margin-top--lg">
                    <Link
                        className="button button--outline button--secondary"
                        to="/docs/components/overview"
                    >
                        View all component docs{" "}
                        <ArrowRight
                            size="1rem"
                            style={{
                                marginLeft: "0.4rem",
                                verticalAlign: "middle",
                            }}
                        />
                    </Link>
                </div>
            </div>
        </section>
    );
}

// --- GitHub star banner ---

function GitHubStarBanner() {
    return (
        <section className="daiso-star-banner padding-vert--lg">
            <div className="container text--center">
                <Star
                    size="2rem"
                    className="daiso-star-icon"
                    strokeWidth={1.5}
                />
                <h2 className="daiso-star-title">
                    Find this library useful? Give it a ⭐
                </h2>
                <p className="daiso-star-subtitle">
                    If you see potential in eridu-tech, starring the repo on
                    GitHub helps others discover it and motivates continued
                    development. It takes one click and means a lot.
                </p>
                <Link
                    className="button button--primary button--lg"
                    href={GITHUB_REPO_URL}
                >
                    <Star
                        size="1rem"
                        style={{
                            marginRight: "0.5rem",
                            verticalAlign: "middle",
                        }}
                        strokeWidth={2}
                    />
                    Star on GitHub
                </Link>
            </div>
        </section>
    );
}

// --- CTA ---

function CtaSection() {
    return (
        <section className="daiso-cta-section padding-vert--xl">
            <div className="container text--center">
                <h2>Ready to build something great?</h2>
                <p className="daiso-cta-subtitle">
                    Get up and running in minutes with a single install.
                </p>
                <div className="margin-bottom--lg">
                    <InstallCommand />
                </div>
                <div className="daiso-hero-ctas">
                    <Link
                        className="button button--secondary button--lg"
                        to="./docs/getting_started"
                    >
                        Get started{" "}
                        <ArrowRight
                            size="1rem"
                            style={{
                                marginLeft: "0.4rem",
                                verticalAlign: "middle",
                            }}
                        />
                    </Link>
                    <Link
                        className="button button--outline button--secondary button--lg"
                        href={GITHUB_REPO_URL}
                    >
                        View on GitHub
                    </Link>
                </div>
            </div>
        </section>
    );
}

// --- Upcoming Components ---

function UpcomingSection() {
    return (
        <section className="padding-vert--xl daiso-section-alt">
            <div className="container">
                <div className="margin-bottom--xl">
                    <h2 className="daiso-section-title">
                        🔮 Upcoming Components
                    </h2>
                    <p className="daiso-section-subtitle">
                        Components currently in design or development — not yet
                        available in any release.
                    </p>
                </div>
                <PlannedCardGrid items={UPCOMING_ITEMS} />
                <div className="text--center margin-top--lg">
                    <Link
                        className="button button--outline button--secondary"
                        to="/docs/roadmap"
                    >
                        View full roadmap{" "}
                        <ArrowRight
                            size="1rem"
                            style={{
                                marginLeft: "0.4rem",
                                verticalAlign: "middle",
                            }}
                        />
                    </Link>
                </div>
            </div>
        </section>
    );
}

// --- Framework Comparison ---

function FrameworkComparison() {
    const [activeIndex, setActiveIndex] = useState(0);
    const comparisons = Object.values(COMPARISONS);

    return (
        <section className="padding-vert--xl">
            <div className="container">
                <div className="daiso-section-header daiso-section-header--split">
                    <h2 className="daiso-section-title">
                        How eridu-tech compares
                    </h2>
                    <div className="daiso-segmented-control">
                        {comparisons.map((comp, i) => (
                            <button
                                key={comp.name}
                                className={`daiso-segmented-option${i === activeIndex ? " daiso-segmented-option--active" : ""}`}
                                onClick={() => setActiveIndex(i)}
                            >
                                {comp.name}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="daiso-carousel-text">
                    <h3
                        className="daiso-section-subtitle"
                        style={{
                            width: "100%",
                            fontWeight: 700,
                            color: "var(--ifm-color-emphasis-900)",
                            fontSize: "1.25rem",
                        }}
                    >
                        {comparisons[activeIndex].heading}
                    </h3>
                </div>
                <div className="row">
                    <div className="col col--6">
                        <div className="daiso-comp-instead">
                            <div className="daiso-comp-label-daiso">
                                {comparisons[activeIndex].name}
                            </div>
                            <ul>
                                {comparisons[activeIndex].instead.map(
                                    (point, i) => (
                                        <li key={i}>{point}</li>
                                    ),
                                )}
                            </ul>
                        </div>
                    </div>
                    <div className="col col--6">
                        <div className="daiso-comp-daiso">
                            <div className="daiso-comp-label-daiso">
                                eridu-tech
                            </div>
                            <ul>
                                {comparisons[activeIndex].eriduTech.map(
                                    (point, i) => (
                                        <li key={i}>{point}</li>
                                    ),
                                )}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

// --- Header ---
function Header() {
    const { siteConfig } = useDocusaurusContext();
    return (
        <header className="daiso-hero hero hero--primary">
            <div className="container">
                <h1 className="hero__title">{siteConfig.title}</h1>
                <p className="daiso-hero-badge margin-bottom--md">
                    Cradle of Composable Backends
                </p>
                <p className="hero__subtitle daiso-hero-tagline">
                    Backend foundation for TypeScript.
                </p>
            </div>
        </header>
    );
}

// --- Page ---

export default function Home(): ReactNode {
    const { siteConfig } = useDocusaurusContext();

    return (
        <Layout title={siteConfig.title} description={siteConfig.tagline}>
            <Header />
            <main>
                <StatsBar />
                <FeatureSection items={Object.values(FEATURE_ITEMS)} />
                <CodeShowcase />
                <WhoIsThisFor />
                <ComponentSection />
                <UpcomingSection />
                <FrameworkComparison />
                <GitHubStarBanner />
                <CtaSection />
            </main>
        </Layout>
    );
}
