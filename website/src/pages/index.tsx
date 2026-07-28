import { SiTypescript, SiVitest } from "@icons-pack/react-simple-icons";
import {
    upcomingItems,
    foundationExistingItems,
    storageExistingItems,
    reliabilityExistingItems,
    concurrencyExistingItems,
    messagingExistingItems,
    webExistingItems,
} from "../roadmap";
import { AvailableCategory } from "../roadmap/components/AvailableCategory";
import { ArchitectureOverview } from "../roadmap/components/ArchitectureOverview";
import { PlannedCardGrid } from "../roadmap/components/PlannedCardGrid";
import {
    ShieldCheck,
    ArrowRight,
    Zap,
    Plug,
    Package,
    Copy,
    Check,
    Star,
} from "lucide-react";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import { type ReactNode, useState, useCallback } from "react";
import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import CodeBlock from "@theme/CodeBlock";
import Tabs from "@theme/Tabs";
import TabItem from "@theme/TabItem";

const INSTALL_CMD = "npm install @daiso-tech/core";

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
                    <StatItem value="17" label="Production-ready components" />
                    <StatItem value="100%" label="TypeScript" />
                    <StatItem value="4,640+" label="Integration & behavior tests" />
                    <StatItem value="0" label="Docker needed for tests" />
                </div>
            </div>
        </div>
    );
}

// --- Code Showcase ---

type CodeFile = {
    name: string;
    code: string;
};

type CodeExample = {
    label: string;
    heading: string;
    description: string;
    bullets: string[];
    files: CodeFile[];
};

const CODE_EXAMPLES: CodeExample[] = [
    {
        label: "Cache",
        heading: "Cache anything. Swap backends anytime.",
        description:
            "Speed up your application by caching expensive database queries and API responses. Use Redis in production, in-memory for tests — same API, zero rewrites.",
        bullets: [
            "Memory, Redis, Kysely & MongoDB adapters",
            "TTL policies with automatic eviction",
            "Stampede protection built in",
        ],
        files: [
            {
                name: "cache.ts",
                code: `import { createCache } from "@daiso-tech/core";
import { RedisCacheAdapter } from "@daiso-tech/core/cache";

const cache = createCache({
    adapter: new RedisCacheAdapter({ client: redis }),
});

await cache.set("user:42", { name: "Alice" });
const user = await cache.get("user:42");
// { name: "Alice" }`,
            },
            {
                name: "cache.test.ts",
                code: `import { createCache } from "@daiso-tech/core";
import { MemoryCacheAdapter } from "@daiso-tech/core/cache";

// Tests: in-memory — no Docker needed
const cache = createCache({
    adapter: new MemoryCacheAdapter(),
});

// Same API, same assertions — zero changes`,
            },
        ],
    },
    {
        label: "Lock",
        heading: "Distributed locking. No race conditions.",
        description:
            "Guarantee mutual exclusion across multiple processes. Prevent duplicate payment processing, job execution, or any critical section — with automatic lease management and deadlock protection.",
        bullets: [
            "Blocking & non-blocking acquisition",
            "Automatic lease renewal & release",
            "Works across processes and machines",
        ],
        files: [
            {
                name: "payment.service.ts",
                code: `import { createLock, type ILock } from "@daiso-tech/core";
import { RedisLockAdapter } from "@daiso-tech/core/lock";

const lock: ILock = createLock({
    adapter: new RedisLockAdapter({ client: redis }),
});

export async function processOrderPayment(order: Order) {
    const acquired = await lock.acquire(
        \`payment:order-\${order.id}\`,
        { ttl: "30s" },
    );

    if (!acquired) throw new Error("Payment already in progress");

    try {
        await chargeCustomer(order);
    } finally {
        await lock.release(\`payment:order-\${order.id}\`);
    }
}`,
            },
            {
                name: "payment.test.ts",
                code: `import { createLock } from "@daiso-tech/core";
import { MemoryLockAdapter } from "@daiso-tech/core/lock";

// Tests: in-memory — no Redis, no Docker
const lock = createLock({
    adapter: new MemoryLockAdapter(),
});

// Same API, same behavior — zero changes`,
            },
        ],
    },
    {
        label: "File Storage",
        heading: "Upload once. Store anywhere.",
        description:
            "Manage files with a unified API across local disk, in-memory, and AWS S3. Build photo upload services and document management — swap the storage backend without touching business logic.",
        bullets: [
            "Local filesystem, in-memory & S3 adapters",
            "Streaming uploads & downloads",
            "Metadata & lifecycle management",
        ],
        files: [
            {
                name: "storage.ts",
                code: `import { createFileStorage } from "@daiso-tech/core";
import { S3FileStorageAdapter } from "@daiso-tech/core/file-storage";

const storage = createFileStorage({
    adapter: new S3FileStorageAdapter({
        bucket: "uploads",
        region: "eu-west-1",
    }),
});

await storage.put("avatars/alice.png", buffer);
const file = await storage.get("avatars/alice.png");`,
            },
            {
                name: "storage.dev.ts",
                code: `import { createFileStorage } from "@daiso-tech/core";
import { LocalFileStorageAdapter } from "@daiso-tech/core/file-storage";

// Dev: local disk — same API, zero code changes
const storage = createFileStorage({
    adapter: new LocalFileStorageAdapter({
        basePath: "./uploads",
    }),
});`,
            },
        ],
    },
    {
        label: "Event Bus",
        heading: "Publish events. Decouple services.",
        description:
            "Publish and subscribe to events across distributed server instances. Fire-and-forget or guaranteed delivery — with pluggable transport backends that swap without changing your handlers.",
        bullets: [
            "In-memory, Redis & more transports",
            "Topic routing & wildcard patterns",
            "Guaranteed delivery semantics",
        ],
        files: [
            {
                name: "bus.ts",
                code: `import { createEventBus } from "@daiso-tech/core";
import { RedisEventBusAdapter } from "@daiso-tech/core/event-bus";

const bus = createEventBus({
    adapter: new RedisEventBusAdapter({
        client: redis,
    }),
});

bus.subscribe("order.placed", async (event) => {
    await sendEmail(event.payload.userId);
});`,
            },
            {
                name: "publish.ts",
                code: `import { bus } from "./bus";

await bus.publish("order.placed", {
    userId: 42,
    total: 99.95,
});`,
            },
            {
                name: "bus.test.ts",
                code: `import { createEventBus } from "@daiso-tech/core";
import { MemoryEventBusAdapter } from "@daiso-tech/core/event-bus";

// Tests: in-memory — no Docker
const bus = createEventBus({
    adapter: new MemoryEventBusAdapter(),
});

// Same API, same behavior — zero changes`,
            },
        ],
    },
];

function CodeShowcase() {
    const [activeIndex, setActiveIndex] = useState(0);
    const [fading, setFading] = useState(false);

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
                <div className="daiso-segmented-control">
                    {CODE_EXAMPLES.map((ex, i) => (
                        <button
                            key={ex.label}
                            className={`daiso-segmented-option${i === activeIndex ? " daiso-segmented-option--active" : ""}`}
                            onClick={() => goTo(i)}
                        >
                            {ex.label}
                        </button>
                    ))}
                </div>
                <div className="row">
                    <div className="col col--6">
                        <div
                            className={`daiso-carousel-text${fading ? " daiso-carousel-text--fading" : ""}`}
                        >
                            <h2 className="daiso-section-title">
                                {CODE_EXAMPLES[activeIndex].heading}
                            </h2>
                            <p
                                className="daiso-section-subtitle"
                                style={{
                                    margin: "0 0 1.25rem",
                                    textAlign: "left",
                                }}
                            >
                                {CODE_EXAMPLES[activeIndex].description}
                            </p>
                            <ul className="daiso-check-list">
                                {CODE_EXAMPLES[activeIndex].bullets.map(
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
                    </div>
                    <div className="col col--6">
                        <div className="daiso-carousel">
                            <div
                                className={`daiso-carousel-body${fading ? " daiso-carousel-body--fading" : ""}`}
                            >
                                <Tabs key={activeIndex}>
                                    {CODE_EXAMPLES[activeIndex].files.map(
                                        (f) => (
                                            <TabItem
                                                key={f.name}
                                                value={f.name}
                                                label={f.name}
                                            >
                                                <CodeBlock language="typescript">
                                                    {f.code}
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

// --- Features ---

type FeatureItemProps = {
    icon?: ReactNode;
    title: ReactNode;
    description: ReactNode;
};

function FeatureItem(props: FeatureItemProps) {
    return (
        <div className="col col--6 margin-bottom--lg">
            <div className="daiso-feature-card">
                <div className="daiso-feature-icon">{props.icon}</div>
                <h3>{props.title}</h3>
                <p>{props.description}</p>
            </div>
        </div>
    );
}

function FeatureSection({ items }: { items: FeatureItemProps[] }) {
    return (
        <section className="padding-vert--xl daiso-section-alt">
            <div className="container">
                <div className="text--center margin-bottom--xl">
                    <h2 className="daiso-section-title">
                        Why @daiso-tech/core?
                    </h2>
                    <p className="daiso-section-subtitle">
                        Designed from the ground up for real-world backend
                        challenges — no vendor lock-in, no Docker required for
                        testing, no DI container overhead.
                    </p>
                </div>
                <div className="row">
                    {items.map((item, idx) => (
                        <FeatureItem key={idx} {...item} />
                    ))}
                </div>
            </div>
        </section>
    );
}

// --- Who is this for ---

function WhoIsThisFor() {
    return (
        <section className="padding-vert--xl">
            <div className="container">
                <div className="text--center margin-bottom--xl">
                    <h2 className="daiso-section-title">Who is this for?</h2>
                    <p className="daiso-section-subtitle">
                        @daiso-tech/core is built for backend and fullstack
                        TypeScript developers who value flexibility and
                        testability.
                    </p>
                </div>
                <div className="row">
                    <div className="col col--6">
                        <div className="daiso-who-card daiso-who-yes">
                            <h3>✅ Perfect for</h3>
                            <ul>
                                <li>SaaS applications</li>
                                <li>Internal tools &amp; admin panels</li>
                                <li>REST &amp; GraphQL APIs</li>
                                <li>Enterprise backend services</li>
                                <li>Modular monoliths</li>
                                <li>Microservices</li>
                                <li>Teams that want to avoid vendor lock-in</li>
                            </ul>
                        </div>
                    </div>
                    <div className="col col--6">
                        <div className="daiso-who-card daiso-who-no">
                            <h3>❌ Not ideal for</h3>
                            <ul>
                                <li>Frontend-only applications</li>
                                <li>Browser-only libraries</li>
                                <li>Projects that don't use TypeScript</li>
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
                <div className="text--center margin-bottom--xl">
                    <h2 className="daiso-section-title">
                        Production-Ready Components
                    </h2>
                    <p className="daiso-section-subtitle">
                        A growing collection of officially maintained
                        components. Every component ships with multiple
                        built-in adapters — swap infrastructure without
                        changing a single line of business logic.
                    </p>
                </div>
                <AvailableCategory
                    label="Foundation"
                    items={foundationExistingItems}
                />
                <AvailableCategory
                    label="Storage"
                    items={storageExistingItems}
                />
                <AvailableCategory
                    label="Resilience"
                    items={reliabilityExistingItems}
                />
                <AvailableCategory
                    label="Concurrency"
                    items={concurrencyExistingItems}
                />
                <AvailableCategory
                    label="Messaging"
                    items={messagingExistingItems}
                />
                <AvailableCategory
                    label="Web"
                    items={webExistingItems}
                />
                <div className="text--center margin-top--lg">
                    <Link
                        className="button button--outline button--secondary"
                        to="/docs/components/collection"
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

// --- Comparison Section ---

function ComparisonSection() {
    return (
        <section className="padding-vert--xl">
            <div className="container">
                <div className="text--center margin-bottom--xl">
                    <h2 className="daiso-section-title">
                        Why not just combine existing libraries?
                    </h2>
                    <p className="daiso-section-subtitle">
                        You could piece together separate libraries. Here's what
                        you get with a unified toolkit instead.
                    </p>
                </div>
                <div className="daiso-comparison-table-wrapper">
                    <table className="daiso-comparison-table">
                        <thead>
                            <tr>
                                <th>Instead of</th>
                                <th>
                                    <span className="daiso-comparison-highlight">
                                        @daiso-tech/core
                                    </span>{" "}
                                    gives
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Tied to a specific vendor (Redis, S3)</td>
                                <td>
                                    Adapter abstraction — swap infrastructure
                                    anytime
                                </td>
                            </tr>
                            <tr>
                                <td>DI container required (NestJS, Inversify)</td>
                                <td>
                                    Plain TypeScript classes — instantiate
                                    directly
                                </td>
                            </tr>
                            <tr>
                                <td>Docker required for integration tests</td>
                                <td>
                                    In-memory adapters — fast, isolated tests
                                </td>
                            </tr>
                            <tr>
                                <td>Different APIs for each library</td>
                                <td>
                                    Unified interfaces — learn once, use
                                    everywhere
                                </td>
                            </tr>
                            <tr>
                                <td>Wiring libraries together manually</td>
                                <td>
                                    Components integrate seamlessly — shared
                                    execution context, serde, adapters
                                </td>
                            </tr>
                            <tr>
                                <td>Framework-specific solutions</td>
                                <td>
                                    Framework agnostic — works with Express,
                                    Next.js, Nuxt, NestJS, and more
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
}

// --- Architecture Diagram ---

function ArchitectureSection() {
    return (
        <section className="padding-vert--xl daiso-section-alt">
            <div className="container">
                <div className="text--center margin-bottom--xl">
                    <h2 className="daiso-section-title">
                        How it fits together
                    </h2>
                    <p className="daiso-section-subtitle">
                        Every component is self-contained with zero hard
                        dependencies — but when used together, they share
                        conventions, adapters, and context.
                    </p>
                </div>
                <ArchitectureOverview />
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
                    If you see potential in @daiso-tech/core, starring the repo
                    on GitHub helps others discover it and motivates continued
                    development. It takes one click and means a lot.
                </p>
                <Link
                    className="button button--primary button--lg"
                    href="https://github.com/daiso-tech/daiso-core"
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
                        to="./docs/installation"
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
                        href="https://github.com/daiso-tech/daiso-core"
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
                <div className="text--center margin-bottom--xl">
                    <h2 className="daiso-section-title">
                        🔮 Upcoming Components
                    </h2>
                    <p className="daiso-section-subtitle">
                        Components currently in design or development — not yet
                        available in any release.
                    </p>
                </div>
                <PlannedCardGrid items={upcomingItems} />
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

// --- Vision ---

type VisionItemProps = {
    title: string;
    comingSoon?: boolean;
    description: ReactNode;
};

function VisionItem({ title, comingSoon, description }: VisionItemProps) {
    return (
        <div className="col col--6 margin-bottom--lg">
            <div className="daiso-feature-card" style={{ height: "100%" }}>
                <h3 style={{ marginTop: 0 }}>{title}</h3>
                <p style={{ margin: 0 }}>{description}</p>
            </div>
        </div>
    );
}

function VisionSection({ items }: { items: VisionItemProps[] }) {
    return (
        <section className="padding-vert--xl">
            <div className="container">
                <div className="text--center margin-bottom--xl">
                    <h2 className="daiso-section-title">🌟 Vision</h2>
                    <p
                        className="daiso-section-subtitle"
                        style={{ textAlign: "left" }}
                    >
                        @daiso-tech/core will be built around one core idea:{" "}
                        <strong>
                            production-grade backend primitives that work great
                            standalone, but are even better together
                        </strong>{" "}
                        — all inside your existing fullstack TypeScript app.
                    </p>
                </div>
                <div className="row">
                    {items.map((item, idx) => (
                        <VisionItem key={idx} {...item} />
                    ))}
                </div>
            </div>
        </section>
    );
}

// --- Data ---

const featureItems: FeatureItemProps[] = [
    {
        icon: <Zap size="1.5rem" strokeWidth={1.5} />,
        title: "Switch infrastructure without rewriting business logic",
        description:
            "The adapter pattern keeps your code decoupled from vendors. Use Redis today, Postgres tomorrow — no refactoring required.",
    },
    {
        icon: <SiVitest size="1.5rem" />,
        title: "Test everything without Docker",
        description:
            "Every component ships with an in-memory adapter and built-in Vitest helpers. Write fast, isolated tests — no external services needed.",
    },
    {
        icon: <Plug size="1.5rem" strokeWidth={1.5} />,
        title: "Bring your own framework",
        description:
            "No DI container required. Plug directly into Express, NestJS, AdonisJS, Next.js, Nuxt, or TanStack Start — it just works.",
    },
    {
        icon: <SiTypescript size="1.5rem" />,
        title: "Type-safe from day one",
        description:
            "Full TypeScript support with precise generics, rich intellisense, and auto-import friendly APIs — errors caught at compile time, not runtime.",
    },
    {
        icon: <ShieldCheck size="1.5rem" strokeWidth={1.5} />,
        title: "Standard schema validation built in",
        description: (
            <>
                First-class integration with{" "}
                <a href="https://standardschema.dev/">Standard Schema</a>. Use{" "}
                <a href="https://zod.dev/">Zod</a>, Valibot, or ArkType to
                enforce both compile-time and runtime data safety.
            </>
        ),
    },
    {
        icon: <Package size="1.5rem" strokeWidth={1.5} />,
        title: "ESM native. No CommonJS baggage.",
        description:
            "Built on modern JavaScript primitives. Fully compatible with Node.js, Bun, Deno, and the modern bundler ecosystem.",
    },
];

const visionItems: VisionItemProps[] = [
    {
        title: "Composable by design, not by requirement",
        description:
            "Every component will be self-contained and will have zero hard dependencies on the others. You will be able to drop the Cache, the Lock, or the EventBus into any project in isolation. But when you use them together, they will integrate seamlessly — sharing the same execution context, serde layer, adapters, and conventions without any extra wiring.",
    },
    {
        title: "No DI container required — but supported when you want it",
        comingSoon: true,
        description:
            "Components will remain plain classes you instantiate yourself. There will be no forced dependency injection framework. The DI container will become a first-class citizen that understands every component in the library — so when you do want a container, it will work with no adapters and no boilerplate.",
    },
    {
        title: "One server, one app",
        description: (
            <>
                The library's HTTP primitives will be built on the standard Web
                platform <code>Request</code>/<code>Response</code> API, which
                will allow your route handlers to run natively inside{" "}
                <strong>
                    Next.js, SvelteKit, Nuxt, SolidStart, Analog (Angular),
                    TanStack Start, Cloudflare Workers, Vercel Functions,
                    Netlify Functions, and many more platforms via Hono
                </strong>{" "}
                — with no separate backend server to host, deploy, or maintain.
                Your fullstack app will become your backend.
            </>
        ),
    },
    {
        title: "A cohesive experience for the JavaScript ecosystem",
        description:
            "The long-term vision will be to give TypeScript developers a cohesive, batteries-included experience — authentication, authorization, job scheduling, notifications, queues, caching, file storage, and more — designed from the ground up for the modern JavaScript fullstack world. There will be no framework lock-in, no vendor lock-in, just great primitives that fit together.",
    },
    {
        title: "The framework experience",
        description: (
            <>
                On top of the agnostic core, a separate opinionated,
                batteries-included framework layer will be introduced. Unlike
                the core library, it will not be agnostic — it will make
                deliberate choices so you will not have to. It will be delivered
                as a <strong>Vite plugin</strong> that can be dropped into most
                modern frontend frameworks — Next.js, SvelteKit, Nuxt,
                SolidStart, TanStack Start, Analog, and more — and will lean
                heavily on <strong>code generation</strong> to eliminate
                boilerplate, auto-wire components, and provide a truly
                integrated developer experience with a
                convention-over-configuration feel directly inside your existing
                fullstack app.
            </>
        ),
    },
];

// --- Page ---

export default function Home(): ReactNode {
    const { siteConfig } = useDocusaurusContext();

    return (
        <Layout title={siteConfig.title} description={siteConfig.tagline}>
            <header className="daiso-hero hero hero--primary">
                <div className="container">
                    <p className="daiso-hero-badge margin-bottom--md">
                        The adapter-first backend toolkit for TypeScript
                    </p>
                    <h1 className="hero__title">{siteConfig.title}</h1>
                    <p className="hero__subtitle daiso-hero-tagline">
                        Write business logic once.
                        <br />
                        Replace infrastructure anytime.
                    </p>
                    <p className="daiso-hero-subtext">
                        Swap Redis, S3, Postgres, and more — without rewriting
                        your application. 4,640+ integration and behavior tests
                        ensure reliability in real-world scenarios.
                    </p>
                    <div className="margin-bottom--xl">
                        <InstallCommand />
                    </div>
                    <div className="daiso-hero-ctas">
                        <Link
                            className="button button--secondary button--lg"
                            to="./docs/installation"
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
                            href="https://github.com/daiso-tech/daiso-core"
                        >
                            View on GitHub
                        </Link>
                    </div>
                </div>
            </header>

            <StatsBar />

            <main>
                <CodeShowcase />
                <FeatureSection items={featureItems} />
                <WhoIsThisFor />
                <ComponentSection />
                <ComparisonSection />
                <ArchitectureSection />
                <UpcomingSection />
                <VisionSection items={visionItems} />
                <GitHubStarBanner />
                <CtaSection />
            </main>
        </Layout>
    );
}
