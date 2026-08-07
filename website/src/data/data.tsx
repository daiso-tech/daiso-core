import type {
    FeatureItemProps,
    ComponentItemProps,
    WhoIsThisForItem,
    CodeFile,
    CodeExample,
    ComparisonItem,
} from "./types";
import { SiTypescript, SiVitest } from "@icons-pack/react-simple-icons";
import {
    Box,
    ShieldCheck,
    Server,
    Clock,
    Layers,
    Bell,
    Users,
    Lock,
    Lightbulb,
    Plug,
    Search,
    Copy,
    Database,
    Send,
    Inbox,
    RefreshCw,
    Zap,
    Globe,
    HardDrive,
    Radio,
    CircuitBoard,
    ArrowLeftRight,
    List,
    Share2,
    GitBranch,
    Gauge,
    Terminal,
    MessageSquare,
    Reply,
    Leaf,
    Image,
    Activity,
    Package,
} from "lucide-react";

export const INSTALL_CMD = "npm install eridu-tech";

// ─── Components Record ──────────────────────────────────────────
// Single source of truth for every component — keyed by name.
// Each curated list below references entries from this record.

const EXISTING_FOUNDATION_RECORD = {
    // ─── Existing: Foundation ──────────────────────────────────
    MIDDLEWARE_AND_AOP: {
        name: "Middleware and AOP",
        icon: <Plug size="1.5rem" strokeWidth={1.5} />,
        title: <>Middleware and AOP</>,
        link: "/docs/components/middleware",
        maturity: 90,
        description: (
            <>
                Composable middleware pipeline with before/after hooks, error
                handling — the foundation for every
                component's plugin system.
            </>
        ),
    } satisfies ComponentItemProps,
    COLLECTION: {
        name: "Collection",
        icon: <Layers size="1.5rem" strokeWidth={1.5} />,
        title: <>Collection</>,
        link: "/docs/components/collection",
        maturity: 90,
        description: (
            <>
                Type-safe collection utilities with powerful query, transform,
                and pagination primitives.
            </>
        ),
    } satisfies ComponentItemProps,
    SERDE: {
        name: "Serde",
        icon: <ArrowLeftRight size="1.5rem" strokeWidth={1.5} />,
        title: <>Serde</>,
        link: "/docs/components/serde",
        maturity: 80,
        description: (
            <>
                Serialize and deserialize data with a built-in SuperJSON
                adapter (Date, Map, Set, BigInt) and custom serializers — the
                backbone for all data interchange across the ecosystem.
            </>
        ),
    } satisfies ComponentItemProps,
    CODEC: {
        name: "Codec",
        icon: <ArrowLeftRight size="1.5rem" strokeWidth={1.5} />,
        title: <>Codec</>,
        link: "/docs/components/codec",
        maturity: 80,
        description: (
            <>
                Encode and decode data with a unified, type-safe interface —
                includes a built-in Base64 codec and lets you build custom
                codecs for any protocol.
            </>
        ),
    } satisfies ComponentItemProps,
    EXECUTION_CONTEXT: {
        name: "Execution Context",
        icon: <Zap size="1.5rem" strokeWidth={1.5} />,
        title: <>Execution Context</>,
        link: "/docs/components/execution_context",
        maturity: 90,
        description: (
            <>
                Type-safe, composable context propagation for request IDs, user
                info, and tracing metadata across async boundaries — without
                thread-local hacks.
            </>
        ),
    } satisfies ComponentItemProps,
    TYPED_CONFIG_ACCESS: {
        name: "Typed Config Access",
        icon: <Globe size="1.5rem" strokeWidth={1.5} />,
        title: <>Typed Config Access</>,
        link: "/docs/components/config_accessor",
        maturity: 90,
        description: (
            <>
                Standardized type-safe access to domain configuration
                variables — with optional schema validation and full
                TypeScript inference.
            </>
        ),
    } satisfies ComponentItemProps,
    TYPED_ENV_ACCESS: {
        name: "Typed Env Access",
        icon: <Globe size="1.5rem" strokeWidth={1.5} />,
        title: <>Typed Env Access</>,
        link: "/docs/components/env_accessor",
        maturity: 90,
        description: (
            <>
                Type-safe environment variable access from multiple sync/async
                sources with parsing, defaults, and validation — never read
                process.env raw again.
            </>
        ),
    } satisfies ComponentItemProps,
};

const EXISTING_STORAGE_RECORD = {
    // ─── Existing: Storage ────────────────────────────────────
    CACHE: {
        name: "Cache",
        icon: <HardDrive size="1.5rem" strokeWidth={1.5} />,
        title: <>Cache</>,
        link: "/docs/components/cache/cache_usage",
        maturity: 90,
        description: (
            <>
                Caching with pluggable stores (in-memory, Redis,
                etc.), TTL policies, and stampede protection.
            </>
        ),
    } satisfies ComponentItemProps,
    FILE_STORAGE: {
        name: "File Storage",
        icon: <Database size="1.5rem" strokeWidth={1.5} />,
        title: <>File Storage</>,
        link: "/docs/components/file_storage/file_storage_usage",
        maturity: 90,
        description: (
            <>
                Abstract file storage with adapters for local disk,
                S3-compatible, and other backends — upload, stream, and serve
                with one API.
            </>
        ),
    } satisfies ComponentItemProps,
};

const EXISTING_RELIABILITY_RECORD = {
    // ─── Existing: Reliability ────────────────────────────────
    CIRCUIT_BREAKER: {
        name: "Circuit Breaker",
        icon: <CircuitBoard size="1.5rem" strokeWidth={1.5} />,
        title: <>Circuit Breaker</>,
        link: "/docs/components/circuit_breaker/circuit_breaker_usage",
        maturity: 90,
        description: (
            <>
                Prevent cascading failures with configurable thresholds,
                half-open recovery, and custom fallback strategies.
            </>
        ),
    } satisfies ComponentItemProps,
    RATE_LIMITER: {
        name: "Rate Limiter",
        icon: <Gauge size="1.5rem" strokeWidth={1.5} />,
        title: <>Rate Limiter</>,
        link: "/docs/components/rate-limiter/rate_limiter_usage",
        maturity: 90,
        description: (
            <>
                Throttle request rates with configurable limits, sliding
                windows, and pluggable backends — protect your services from
                overload.
            </>
        ),
    } satisfies ComponentItemProps,
    RESILIENCE: {
        name: "Resilience",
        icon: <ShieldCheck size="1.5rem" strokeWidth={1.5} />,
        title: <>Resilience</>,
        link: "/docs/components/resilience",
        maturity: 90,
        description: (
            <>
                Timeout, fallback, retry, with configurable policies and
                backoffs.
            </>
        ),
    } satisfies ComponentItemProps,
};

const EXISTING_CONCURRENCY_RECORD = {
    // ─── Existing: Concurrency ────────────────────────────────
    LOCK: {
        name: "Lock",
        icon: <Lock size="1.5rem" strokeWidth={1.5} />,
        title: <>Lock</>,
        link: "/docs/components/lock/lock_usage",
        maturity: 90,
        description: (
            <>
                Distributed lock primitives with lease management, blocking and
                non-blocking acquisition, and automatic release.
            </>
        ),
    } satisfies ComponentItemProps,
    SHARED_LOCK: {
        name: "Shared Lock",
        icon: <Share2 size="1.5rem" strokeWidth={1.5} />,
        title: <>Shared Lock</>,
        link: "/docs/components/shared_lock/shared_lock_usage",
        maturity: 90,
        description: (
            <>
                Read-write distributed locks for coordinating concurrent access
                with shared and exclusive modes.
            </>
        ),
    } satisfies ComponentItemProps,
    SEMAPHORE: {
        name: "Semaphore",
        icon: <List size="1.5rem" strokeWidth={1.5} />,
        title: <>Semaphore</>,
        link: "/docs/components/semaphore/semaphore_usage",
        maturity: 90,
        description: (
            <>
                Rate-limit concurrent access to shared resources with dynamic
                permit allocation.
            </>
        ),
    } satisfies ComponentItemProps,
};

const EXISTING_MESSAGING_RECORD = {
    // ─── Existing: Messaging ──────────────────────────────────
    EVENT_BUS: {
        name: "Event Bus",
        icon: <Radio size="1.5rem" strokeWidth={1.5} />,
        title: <>Event Bus</>,
        link: "/docs/components/event_bus/event_bus_usage",
        maturity: 90,
        description: (
            <>
                Pub/sub event bus for dispatching and listening to events with
                pluggable transport backends — independent of underlying
                technology.
            </>
        ),
    } satisfies ComponentItemProps,
};

const EXISTING_WEB_RECORD = {
    // ─── Existing: Web ───────────────────────────────────────
    HTTP_ROUTER: {
        name: "HTTP Router",
        icon: <GitBranch size="1.5rem" strokeWidth={1.5} />,
        title: <>HTTP Router</>,
        link: "/docs/components/http_router/http_router_usage",
        maturity: 90,
        description: (
            <>
                Framework-agnostic HTTP router built on the Hono router engine
                — implements the Winter TC fetch standard with middleware
                chains and typed path parameters.
            </>
        ),
    } satisfies ComponentItemProps,
};

const EXISTING_UTILITIES_RECORD = {
    // ─── Existing: Utilities ─────────────────────────────────
    TIME_SPAN: {
        name: "TimeSpan",
        icon: <Clock size="1.5rem" strokeWidth={1.5} />,
        title: <>TimeSpan</>,
        link: "/docs/components/time_span",
        maturity: 90,
        description: (
            <>
                Define, manipulate, and compare durations with a typed,
                immutable API — integrates easily with time libraries like
                Luxon and Dayjs.
            </>
        ),
    } satisfies ComponentItemProps,
    FILE_SIZE: {
        name: "FileSize",
        icon: <HardDrive size="1.5rem" strokeWidth={1.5} />,
        title: <>FileSize</>,
        link: "/docs/components/file_size",
        maturity: 90,
        description: (
            <>
                Define, manipulate, and compare file sizes with a typed API —
                from bytes to gigabytes, with easy unit conversion.
            </>
        ),
    } satisfies ComponentItemProps,
    BACKOFF_POLICIES: {
        name: "Backoff Policies",
        icon: <RefreshCw size="1.5rem" strokeWidth={1.5} />,
        title: <>Backoff Policies</>,
        link: "/docs/components/backoff_policies",
        maturity: 90,
        description: (
            <>
                Predefined retry backoff policies — constant and exponential —
                with configurable delay and jitter.
            </>
        ),
    } satisfies ComponentItemProps,
};

const UPCOMING_FOUNDATION_RUNTIME_RECORD = {
    // ─── Upcoming: Foundation & Runtime ──────────────────────
    DI_CONTAINER: {
        name: "DI Container",
        icon: <Box size="1.5rem" strokeWidth={1.5} />,
        title: <>DI Container</>,
        description: (
            <>
                A lightweight, type-safe dependency injection container for
                wiring application components without tight coupling.
            </>
        ),
    } satisfies ComponentItemProps,
    TRANSACTION_CONTEXT: {
        name: "Transaction Context",
        icon: <ShieldCheck size="1.5rem" strokeWidth={1.5} />,
        title: <>Transaction Context</>,
        description: (
            <>
                Coordinate database transactions across components with the
                after-commit pattern. Foundation for reliable messaging — powers
                the Outbox, Inbox, Scheduler, and Notifications.
            </>
        ),
    } satisfies ComponentItemProps,
    CLI_COMMAND: {
        name: "CLI Command",
        icon: <Terminal size="1.5rem" strokeWidth={1.5} />,
        title: <>CLI Command</>,
        description: (
            <>
                A unified API for defining and executing CLI commands with a
                transport adapter architecture. Run commands locally via child
                processes, remotely over SSH or HTTP, inside Docker containers,
                or through custom transports — all from the same command
                definition.
            </>
        ),
    } satisfies ComponentItemProps,
    STRUCTURED_CONCURRENCY: {
        name: "Structured concurrency",
        icon: <RefreshCw size="1.5rem" strokeWidth={1.5} />,
        title: <>Structured concurrency</>,
        description: (
            <>
                Run async tasks in structured scopes where child tasks are tied
                to their parent's lifetime — with automatic cancellation, error
                propagation, and resource cleanup.
            </>
        ),
    } satisfies ComponentItemProps,
    PROMISE_QUEUE: {
        name: "Promise Queue",
        icon: <Layers size="1.5rem" strokeWidth={1.5} />,
        title: <>Promise Queue</>,
        description: (
            <>
                A configurable promise queue to control the number of
                concurrently executing promises and prevent resource exhaustion.
            </>
        ),
    } satisfies ComponentItemProps,
    LOGGING_OBSERVABILITY: {
        name: "Logging & Observability",
        icon: <Server size="1.5rem" strokeWidth={1.5} />,
        title: <>Logging & Observability</>,
        description: (
            <>
                Support for observability — logging, metrics, and tracing — with
                a pluggable adapter system. Pre-built adapters for{" "}
                <a href="https://opentelemetry.io/">OpenTelemetry</a> and a
                local adapter that saves logs, traces, and metrics to disk.
            </>
        ),
    } satisfies ComponentItemProps,
    INTROSPECTION: {
        name: "Introspection",
        icon: <Search size="1.5rem" strokeWidth={1.5} />,
        title: <>Introspection</>,
        description: (
            <>
                Inspect the actual runtime state of any component through
                pre-built CLI commands — view registered handlers, active jobs,
                queue depth, lock holders, and more without digging into logs or
                metrics.
            </>
        ),
    } satisfies ComponentItemProps,
};

const UPCOMING_RELIABILITY_MESSAGING_RECORD = {
    // ─── Upcoming: Reliability & Messaging ───────────────────
    JOB_SCHEDULER: {
        name: "Job Scheduler",
        icon: <Clock size="1.5rem" strokeWidth={1.5} />,
        title: <>Job Scheduler</>,
        description: (
            <>
                Schedule work with full flexibility — immediate dispatch,
                delayed execution, and recurring jobs. Uses Transaction Context
                for reliable execution.
            </>
        ),
    } satisfies ComponentItemProps,
    NOTIFICATIONS: {
        name: "Notifications",
        icon: <Bell size="1.5rem" strokeWidth={1.5} />,
        title: <>Notifications</>,
        description: (
            <>
                Send notifications through multiple channels — synchronous
                dispatching, immediate enqueueing, delayed enqueueing, and
                recurring messages. Planned adapters include Slack, Discord,
                email, SMS, and WebSocket (browser push). Relies on Transaction
                Context and Scheduler.
            </>
        ),
    } satisfies ComponentItemProps,
    REQUEST_REPLY: {
        name: "Request Reply",
        icon: <Reply size="1.5rem" strokeWidth={1.5} />,
        title: <>Request Reply</>,
        description: (
            <>
                A request-reply messaging pattern for sending a message and
                awaiting a typed response. Supports timeouts, retries, and
                pluggable transport backends.
            </>
        ),
    } satisfies ComponentItemProps,
    MESSAGE_QUEUE: {
        name: "Message Queue",
        icon: <MessageSquare size="1.5rem" strokeWidth={1.5} />,
        title: <>Message Queue</>,
        description: (
            <>
                A message queue abstraction with pluggable backends (in-memory,
                Redis, SQS, RabbitMQ) for reliable async communication between
                services.
            </>
        ),
    } satisfies ComponentItemProps,
    IDEMPOTENT_CACHE: {
        name: "Idempotent Cache",
        icon: <Copy size="1.5rem" strokeWidth={1.5} />,
        title: <>Idempotent Cache</>,
        description: (
            <>
                Built-in idempotency support for the Job Scheduler and Event Bus
                to prevent duplicate job execution and event processing.
            </>
        ),
    } satisfies ComponentItemProps,
    OUTBOX_PATTERN: {
        name: "Outbox Pattern",
        icon: <Send size="1.5rem" strokeWidth={1.5} />,
        title: <>Outbox Pattern</>,
        description: (
            <>
                The transactional outbox pattern to reliably publish messages
                and events as part of a database transaction. Works with
                Transaction Context.
            </>
        ),
    } satisfies ComponentItemProps,
    INBOX_PATTERN: {
        name: "Inbox Pattern",
        icon: <Inbox size="1.5rem" strokeWidth={1.5} />,
        title: <>Inbox Pattern</>,
        description: (
            <>
                The transactional inbox pattern to reliably process incoming
                messages and events with deduplication. Works with Transaction
                Context.
            </>
        ),
    } satisfies ComponentItemProps,
};

const UPCOMING_SECURITY_RECORD = {
    // ─── Upcoming: Security ──────────────────────────────────
    AUTHENTICATION: {
        name: "Authentication",
        icon: <Plug size="1.5rem" strokeWidth={1.5} />,
        title: <>Authentication</>,
        description: (
            <>
                First-class support for username/password, email verification,
                OAuth, and WebAuthn — with a{" "}
                <a href="https://www.better-auth.com/">Better Auth</a>{" "}
                integration for batteries-included setups. Requires Sessions.
            </>
        ),
    } satisfies ComponentItemProps,
    SESSION_MANAGEMENT: {
        name: "Session Management",
        icon: <Users size="1.5rem" strokeWidth={1.5} />,
        title: <>Session Management</>,
        description: (
            <>
                Manage user sessions securely with a pluggable, adapter-driven
                API. Required by Authentication.
            </>
        ),
    } satisfies ComponentItemProps,
    AUTHORIZATION_GATES: {
        name: "Authorization Gates",
        icon: <Lock size="1.5rem" strokeWidth={1.5} />,
        title: <>Authorization Gates</>,
        description: (
            <>
                Gate primitives for fine-grained, policy-based access control.
                Works alongside Authentication.
            </>
        ),
    } satisfies ComponentItemProps,
    APACHE_CASBIN_INTEGRATION: {
        name: "Apache Casbin Integration",
        icon: <Lightbulb size="1.5rem" strokeWidth={1.5} />,
        title: <>Apache Casbin Integration</>,
        description: (
            <>
                Integration with <a href="https://casbin.org/">Casbin</a> for
                advanced authorization using attribute-based, role-based, and
                relationship-based access control models.
            </>
        ),
    } satisfies ComponentItemProps,
};

const UPCOMING_INTEGRATIONS_RECORD = {
    // ─── Upcoming: Integrations ──────────────────────────────
    TEXT_SEARCH: {
        name: "Text Search",
        icon: <Search size="1.5rem" strokeWidth={1.5} />,
        title: <>Text Search</>,
        description: (
            <>
                A pluggable text search abstraction with adapter support for
                Elasticsearch, SQL databases, and MongoDB. Integrates with
                MikroORM and other ORMs to automatically synchronise your data
                with search indexes — synchronously or asynchronously.
            </>
        ),
    } satisfies ComponentItemProps,
    OPEN_API: {
        name: "OpenAPI",
        icon: <Server size="1.5rem" strokeWidth={1.5} />,
        title: <>OpenAPI</>,
        description: (
            <>
                First-class OpenAPI support — define your API schema alongside
                your handlers and get spec generation, validation, and
                documentation out of the box.
            </>
        ),
    } satisfies ComponentItemProps,
    SQL_INTEGRATION: {
        name: "SQL Integration",
        icon: <Database size="1.5rem" strokeWidth={1.5} />,
        title: <>SQL Integration</>,
        description: (
            <>
                Pluggable SQL database adapters for Drizzle, Kysely, MikroORM,
                TypeORM, Sequelize, Knex, Prisma (SQL) and raw drivers. Internal
                SQL adapters abstract the database layer while using Kysely as a
                raw SQL query string builder — write queries once, run against
                any supported ORM or raw driver.
            </>
        ),
    } satisfies ComponentItemProps,
    MONGOOSE_NATIVE_MONGODB_INTEGRATION: {
        name: "Mongoose and Native MongoDB Integration",
        icon: <Database size="1.5rem" strokeWidth={1.5} />,
        title: <>Mongoose and Native MongoDB Integration</>,
        description: (
            <>
                Native and performant MongoDB-backed implementations of every
                Eridu-tech component — rate limiters, circuit breakers, event bus,
                message queues, job schedulers, request-reply, transaction
                context, and cache — all using MongoDB as the persistence layer.
                No additional dependencies required.
            </>
        ),
    } satisfies ComponentItemProps,
    POSTGRESQL_NATIVE_INTEGRATION: {
        name: "PostgreSQL Native Integration",
        icon: <Server size="1.5rem" strokeWidth={1.5} />,
        title: <>PostgreSQL Native Integration</>,
        description: (
            <>
                Native and performant PostgreSQL-backed implementations of every
                Eridu-tech component — rate limiters, circuit breakers, locks,
                semaphores, shared locks, event bus, message queues, job
                schedulers, request-reply, transaction context, and cache — all
                using PostgreSQL as the persistence layer via Kysely. No
                additional dependencies required.
            </>
        ),
    } satisfies ComponentItemProps,
    SSH_DEPLOYMENT: {
        name: "SSH Deployment",
        icon: <Globe size="1.5rem" strokeWidth={1.5} />,
        title: <>SSH Deployment</>,
        description: (
            <>
                Deploy and manage Eridu-tech applications on any VPS or bare-metal
                server via SSH. Push builds, manage processes, configure
                environment, and run health checks — all from a single CLI
                command, no Docker or orchestration required.
            </>
        ),
    } satisfies ComponentItemProps,
    IMAGE_MANIPULATOR: {
        name: "Image Manipulator",
        icon: <Image size="1.5rem" strokeWidth={1.5} />,
        title: <>Image Manipulator</>,
        description: (
            <>
                A pluggable image manipulation component with adapter support
                for resize, crop, rotate, format conversion, and optimization —
                process images locally via Sharp or delegate to cloud services
                like Cloudinary and Imgix.
            </>
        ),
    } satisfies ComponentItemProps,
    PROCESS_MANAGER: {
        name: "Process Manager",
        icon: <Activity size="1.5rem" strokeWidth={1.5} />,
        title: <>Process Manager</>,
        description: (
            <>
                Fork, monitor, and manage worker processes with automatic
                restart, health checks, log management, and graceful shutdown.
                Supports cluster mode and zero-downtime reload for Node.js
                applications.
            </>
        ),
    } satisfies ComponentItemProps,
};

const UPCOMING_DEV_TOOLING_RECORD = {
    // ─── Upcoming: Dev Tooling ───────────────────────────────
    DI_AUTODISCOVERY_VITE_PLUGIN: {
        name: "DI Autodiscovery Vite Plugin",
        icon: <Zap size="1.5rem" strokeWidth={1.5} />,
        title: <>DI Autodiscovery Vite Plugin</>,
        description: (
            <>
                A Vite plugin that automatically discovers and registers DI
                container modules — no manual import wiring required for new
                components or services.
            </>
        ),
    } satisfies ComponentItemProps,
    EVENT_AUTODISCOVERY_VITE_PLUGIN: {
        name: "Event Autodiscovery Vite Plugin",
        icon: <Radio size="1.5rem" strokeWidth={1.5} />,
        title: <>Event Autodiscovery Vite Plugin</>,
        description: (
            <>
                A Vite plugin that automatically discovers and registers event
                bus handlers and listeners.
            </>
        ),
    } satisfies ComponentItemProps,
    JOB_SCHEDULER_AUTODISCOVERY_VITE_PLUGIN: {
        name: "Job Scheduler Autodiscovery Vite Plugin",
        icon: <Clock size="1.5rem" strokeWidth={1.5} />,
        title: <>Job Scheduler Autodiscovery Vite Plugin</>,
        description: (
            <>
                A Vite plugin that automatically discovers and registers
                scheduled job definitions.
            </>
        ),
    } satisfies ComponentItemProps,
    REQUEST_REPLY_AUTODISCOVERY_VITE_PLUGIN: {
        name: "Request Reply Autodiscovery Vite Plugin",
        icon: <Reply size="1.5rem" strokeWidth={1.5} />,
        title: <>Request Reply Autodiscovery Vite Plugin</>,
        description: (
            <>
                A Vite plugin that automatically discovers and registers
                request-reply endpoints.
            </>
        ),
    } satisfies ComponentItemProps,
    MESSAGE_QUEUE_AUTODISCOVERY_VITE_PLUGIN: {
        name: "Message Queue Autodiscovery Vite Plugin",
        icon: <MessageSquare size="1.5rem" strokeWidth={1.5} />,
        title: <>Message Queue Autodiscovery Vite Plugin</>,
        description: (
            <>
                A Vite plugin that automatically discovers and registers message
                queue consumers and handlers.
            </>
        ),
    } satisfies ComponentItemProps,
    CLI_COMMAND_AUTODISCOVERY_VITE_PLUGIN: {
        name: "CLI Command Autodiscovery Vite Plugin",
        icon: <Terminal size="1.5rem" strokeWidth={1.5} />,
        title: <>CLI Command Autodiscovery Vite Plugin</>,
        description: (
            <>
                A Vite plugin that automatically discovers and registers CLI
                command definitions.
            </>
        ),
    } satisfies ComponentItemProps,
    SCAFFOLDING_CLI: {
        name: "Scaffolding CLI",
        icon: <Zap size="1.5rem" strokeWidth={1.5} />,
        title: <>Scaffolding CLI</>,
        description: (
            <>
                Predefined CLI commands to scaffold Eridu-tech projects and
                components. Initialize a new Eridu-tech project from scratch or add
                individual components (DI, Cache, Scheduler, Auth, etc.) to an
                existing project — with sensible defaults, config files, and
                boilerplate code generated automatically.
            </>
        ),
    } satisfies ComponentItemProps,
};

export const COMPONENT_RECORD = {
    ...EXISTING_FOUNDATION_RECORD,
    ...EXISTING_STORAGE_RECORD,
    ...EXISTING_RELIABILITY_RECORD,
    ...EXISTING_CONCURRENCY_RECORD,
    ...EXISTING_MESSAGING_RECORD,
    ...EXISTING_WEB_RECORD,
    ...EXISTING_UTILITIES_RECORD,
    ...UPCOMING_FOUNDATION_RUNTIME_RECORD,
    ...UPCOMING_RELIABILITY_MESSAGING_RECORD,
    ...UPCOMING_SECURITY_RECORD,
    ...UPCOMING_INTEGRATIONS_RECORD,
    ...UPCOMING_DEV_TOOLING_RECORD,
};

// ─── Existing — Production-Ready Components ──────────────────────

export const FOUNDATION_EXISTING_ITEMS: ComponentItemProps[] = [
    COMPONENT_RECORD.MIDDLEWARE_AND_AOP,
    COMPONENT_RECORD.COLLECTION,
    COMPONENT_RECORD.SERDE,
    COMPONENT_RECORD.CODEC,
    COMPONENT_RECORD.EXECUTION_CONTEXT,
    COMPONENT_RECORD.TYPED_CONFIG_ACCESS,
    COMPONENT_RECORD.TYPED_ENV_ACCESS,
];

export const STORAGE_EXISTING_ITEMS: ComponentItemProps[] = [
    COMPONENT_RECORD.CACHE,
    COMPONENT_RECORD.FILE_STORAGE,
];

export const RELIABILITY_EXISTING_ITEMS: ComponentItemProps[] = [
    COMPONENT_RECORD.CIRCUIT_BREAKER,
    COMPONENT_RECORD.RATE_LIMITER,
    COMPONENT_RECORD.RESILIENCE,
];

export const CONCURRENCY_EXISTING_ITEMS: ComponentItemProps[] = [
    COMPONENT_RECORD.LOCK,
    COMPONENT_RECORD.SHARED_LOCK,
    COMPONENT_RECORD.SEMAPHORE,
];

export const MESSAGING_EXISTING_ITEMS: ComponentItemProps[] = [
    COMPONENT_RECORD.EVENT_BUS,
];

export const WEB_EXISTING_ITEMS: ComponentItemProps[] = [
    COMPONENT_RECORD.HTTP_ROUTER,
];

export const UTILITIES_EXISTING_ITEMS: ComponentItemProps[] = [
    COMPONENT_RECORD.TIME_SPAN,
    COMPONENT_RECORD.FILE_SIZE,
    COMPONENT_RECORD.BACKOFF_POLICIES,
];

export const EXISTING_ITEMS: ComponentItemProps[] = [
    ...FOUNDATION_EXISTING_ITEMS,
    ...STORAGE_EXISTING_ITEMS,
    ...RELIABILITY_EXISTING_ITEMS,
    ...CONCURRENCY_EXISTING_ITEMS,
    ...MESSAGING_EXISTING_ITEMS,
    ...WEB_EXISTING_ITEMS,
    ...UTILITIES_EXISTING_ITEMS,
];

// ─── Foundation & Runtime ────────────────────────────────────────

export const FOUNDATION_RUNTIME_ITEMS: ComponentItemProps[] = [
    COMPONENT_RECORD.DI_CONTAINER,
    COMPONENT_RECORD.TRANSACTION_CONTEXT,
    COMPONENT_RECORD.CLI_COMMAND,
    COMPONENT_RECORD.STRUCTURED_CONCURRENCY,
    COMPONENT_RECORD.PROMISE_QUEUE,
    COMPONENT_RECORD.LOGGING_OBSERVABILITY,
    COMPONENT_RECORD.INTROSPECTION,
];

// ─── Reliability & Messaging ─────────────────────────────────────

export const RELIABILITY_MESSAGING_ITEMS: ComponentItemProps[] = [
    COMPONENT_RECORD.JOB_SCHEDULER,
    COMPONENT_RECORD.NOTIFICATIONS,
    COMPONENT_RECORD.REQUEST_REPLY,
    COMPONENT_RECORD.MESSAGE_QUEUE,
    COMPONENT_RECORD.IDEMPOTENT_CACHE,
    COMPONENT_RECORD.OUTBOX_PATTERN,
    COMPONENT_RECORD.INBOX_PATTERN,
];

// ─── Security ────────────────────────────────────────────────────

export const SECURITY_ITEMS: ComponentItemProps[] = [
    COMPONENT_RECORD.AUTHENTICATION,
    COMPONENT_RECORD.SESSION_MANAGEMENT,
    COMPONENT_RECORD.AUTHORIZATION_GATES,
    COMPONENT_RECORD.APACHE_CASBIN_INTEGRATION,
];

// ─── Integrations ────────────────────────────────────────────────

export const INTEGRATIONS_ITEMS: ComponentItemProps[] = [
    COMPONENT_RECORD.TEXT_SEARCH,
    COMPONENT_RECORD.OPEN_API,
    COMPONENT_RECORD.SQL_INTEGRATION,
    COMPONENT_RECORD.MONGOOSE_NATIVE_MONGODB_INTEGRATION,
    COMPONENT_RECORD.POSTGRESQL_NATIVE_INTEGRATION,
    COMPONENT_RECORD.SSH_DEPLOYMENT,
    COMPONENT_RECORD.IMAGE_MANIPULATOR,
    COMPONENT_RECORD.PROCESS_MANAGER,
];

// ─── Dev Tooling ─────────────────────────────────────────────────

export const DEV_TOOLING_ITEMS: ComponentItemProps[] = [
    COMPONENT_RECORD.DI_AUTODISCOVERY_VITE_PLUGIN,
    COMPONENT_RECORD.EVENT_AUTODISCOVERY_VITE_PLUGIN,
    COMPONENT_RECORD.JOB_SCHEDULER_AUTODISCOVERY_VITE_PLUGIN,
    COMPONENT_RECORD.REQUEST_REPLY_AUTODISCOVERY_VITE_PLUGIN,
    COMPONENT_RECORD.MESSAGE_QUEUE_AUTODISCOVERY_VITE_PLUGIN,
    COMPONENT_RECORD.CLI_COMMAND_AUTODISCOVERY_VITE_PLUGIN,
    COMPONENT_RECORD.SCAFFOLDING_CLI,
];

// ─── Homepage preview subset ─────────────────────────────────────

export const UPCOMING_ITEMS: ComponentItemProps[] = [
    COMPONENT_RECORD.DI_CONTAINER,
    COMPONENT_RECORD.TRANSACTION_CONTEXT,
    COMPONENT_RECORD.CLI_COMMAND,
    COMPONENT_RECORD.STRUCTURED_CONCURRENCY,
    COMPONENT_RECORD.PROMISE_QUEUE,
    COMPONENT_RECORD.LOGGING_OBSERVABILITY,
    COMPONENT_RECORD.INTROSPECTION,
    COMPONENT_RECORD.JOB_SCHEDULER,
];

// ─── Homepage Data ─────────────────────────────────────────────

export const FEATURE_ITEMS = {
    SWITCH_INFRASTRUCTURE_WITHOUT_REWRITING_BUSINESS_LOGIC: {
        name: "Switch infrastructure without rewriting business logic",
        icon: <Zap size="1.5rem" strokeWidth={1.5} />,
        title: <>Switch infrastructure without rewriting business logic</>,
        description: (
            <>
                The adapter pattern keeps your code decoupled from vendors. Use
                Redis today, Postgres tomorrow — no refactoring required.
            </>
        ),
    } satisfies FeatureItemProps,
    TEST_EVERYTHING_WITHOUT_DOCKER: {
        name: "Test everything without Docker",
        icon: <SiVitest size="1.5rem" />,
        title: <>Test everything without Docker</>,
        description: (
            <>
                Every component ships with an in-memory adapter and built-in
                Vitest helpers. Write fast, isolated tests — no external
                services needed.
            </>
        ),
    } satisfies FeatureItemProps,
    BRING_YOUR_OWN_FRAMEWORK: {
        name: "Bring your own framework",
        icon: <Plug size="1.5rem" strokeWidth={1.5} />,
        title: <>Bring your own framework</>,
        description: (
            <>
                No DI container required. Plug directly into Express, NestJS,
                AdonisJS, Next.js, Nuxt, or TanStack Start — it just works.
            </>
        ),
    } satisfies FeatureItemProps,
    TYPE_SAFE_FROM_DAY_ONE: {
        name: "Type-safe from day one",
        icon: <SiTypescript size="1.5rem" />,
        title: <>Type-safe from day one</>,
        description: (
            <>
                Full TypeScript support with precise generics, rich
                intellisense, and auto-import friendly APIs — errors caught at
                compile time, not runtime.
            </>
        ),
    } satisfies FeatureItemProps,
    STANDARD_SCHEMA_VALIDATION_BUILT_IN: {
        name: "Standard schema validation built in",
        icon: <ShieldCheck size="1.5rem" strokeWidth={1.5} />,
        title: <>Standard schema validation built in</>,
        description: (
            <>
                First-class integration with{" "}
                <a href="https://standardschema.dev/">Standard Schema</a>. Use{" "}
                <a href="https://zod.dev/">Zod</a>, Valibot, or ArkType to
                enforce both compile-time and runtime data safety.
            </>
        ),
    } satisfies FeatureItemProps,
    ESM_NATIVE_NO_COMMONJS_BAGGAGE: {
        name: "ESM native. No CommonJS baggage.",
        icon: <Package size="1.5rem" strokeWidth={1.5} />,
        title: <>ESM native. No CommonJS baggage.</>,
        description: (
            <>
                Built on modern JavaScript primitives. Fully compatible with
                Node.js, Bun, Deno, and the modern bundler ecosystem.
            </>
        ),
    } satisfies FeatureItemProps,
};

export const PERFECT_FOR = {
    BACKEND_APPLICATIONS: {
        name: "Backend applications:",
        title: <>Backend applications:</>,
        description: (
            <>
                Build REST APIs, background workers, CLIs, and backend other
                services using reusable, composable components.
            </>
        ),
    } satisfies WhoIsThisForItem,
    FRAMEWORK_AGNOSTIC_PROJECTS: {
        name: "Framework-agnostic projects:",
        title: <>Framework-agnostic projects:</>,
        description: (
            <>
                Works with Express, Fastify, Hono, Next.js, Nuxt, SvelteKit,
                Cloudflare Workers, Bun, Deno, Node.js, and any runtime
                supporting the standard winter tc Fetch api.
            </>
        ),
    } satisfies WhoIsThisForItem,
    ADAPTER_FIRST_ARCHITECTURES: {
        name: "Adapter-first architectures:",
        title: <>Adapter-first architectures:</>,
        description: (
            <>
                Switch between Redis, PostgreSQL, SQLite, MongoDB, S3, local
                storage, in-memory implementations, or your own adapters without
                changing business logic.
            </>
        ),
    } satisfies WhoIsThisForItem,
    DISTRIBUTED_SYSTEMS: {
        name: "Distributed systems:",
        title: <>Distributed systems:</>,
        description: (
            <>
                Use distributed locks, semaphores, shared locks, circuit
                breakers, rate limiters, caches, and event buses that work
                across multiple processes and machines.
            </>
        ),
    } satisfies WhoIsThisForItem,
    MODULAR_MONOLITHS: {
        name: "Modular monoliths:",
        title: <>Modular monoliths:</>,
        description: (
            <>
                Share the same abstractions, middleware, and adapters across a
                single deployable application. Some components or workers can be
                used in microservices, but the library is primarily designed for
                modular monolith architectures.
            </>
        ),
    } satisfies WhoIsThisForItem,
    LIBRARY_AND_FRAMEWORK_AUTHORS: {
        name: "Library and framework authors:",
        title: <>Library and framework authors:</>,
        description: (
            <>
                Build reusable backend libraries on stable interfaces instead of
                coupling to specific vendors or infrastructure.
            </>
        ),
    } satisfies WhoIsThisForItem,
    TESTING_AND_LOCAL_DEVELOPMENT: {
        name: "Testing and local development:",
        title: <>Testing and local development:</>,
        description: (
            <>
                Use in-memory and NoOp adapters for fast, deterministic tests,
                then swap to production infrastructure with configuration only.
            </>
        ),
    } satisfies WhoIsThisForItem,
    PORTABLE_BACKEND_CODE: {
        name: "Portable backend code:",
        title: <>Portable backend code:</>,
        description: (
            <>
                Write infrastructure-independent code that can move between
                cloud providers, databases, storage providers, and runtimes with
                minimal changes.
            </>
        ),
    } satisfies WhoIsThisForItem,
    ADOPTING_INDIVIDUAL_COMPONENTS: {
        name: "Adopting individual components:",
        title: <>Adopting individual components:</>,
        description: (
            <>
                Use specific components without being forced to adopt the entire
                library or a DI container — each component works standalone.
            </>
        ),
    } satisfies WhoIsThisForItem,
    INCREMENTAL_ADOPTION: {
        name: "Incremental adoption:",
        title: <>Incremental adoption:</>,
        description: (
            <>
                Start with a single component and gradually adopt more as your
                project grows.
            </>
        ),
    } satisfies WhoIsThisForItem,
};

export const NOT_IDEAL_FOR = {
    MICROSERVICES: {
        name: "Microservices:",
        title: <>Microservices:</>,
        description: (
            <>
                The library is designed for modular monoliths where components
                share the same process and runtime. While some components (like
                distributed locks, circuit breakers, and event buses) work
                across processes, the broader adapter model and shared
                abstractions are not optimized for microservice architectures.
            </>
        ),
    } satisfies WhoIsThisForItem,
    FRONTEND_ONLY_APPLICATIONS: {
        name: "Frontend-only applications:",
        title: <>Frontend-only applications:</>,
        description: (
            <>
                eridu-tech is designed for backend and server-side
                development, not browser applications.
            </>
        ),
    } satisfies WhoIsThisForItem,
    PROJECTS_TIGHTLY_COUPLED_TO_ONE_VENDOR: {
        name: "Projects tightly coupled to one vendor:",
        title: <>Projects tightly coupled to one vendor:</>,
        description: (
            <>
                If your application intentionally depends on provider-specific
                features instead of abstractions, the adapter model may provide
                little benefit.
            </>
        ),
    } satisfies WhoIsThisForItem,
    VERY_SMALL_SCRIPTS: {
        name: "Very small scripts:",
        title: <>Very small scripts:</>,
        description: (
            <>
                If you only need a single Redis call, file upload, or cache
                operation, the abstraction layer may be unnecessary overhead.
            </>
        ),
    } satisfies WhoIsThisForItem,
    APPLICATIONS_REQUIRING_PROVIDER_SPECIFIC_CAPABILITIES: {
        name: "Applications requiring provider-specific capabilities:",
        title: <>Applications requiring provider-specific capabilities:</>,
        description: (
            <>
                Features unique to a particular database, cache, or cloud
                service may require using that provider's native SDK directly
                instead of a generic abstraction.
            </>
        ),
    } satisfies WhoIsThisForItem,
    PURE_JAVASCRIPT_PROJECTS_PRIORITIZING_SIMPLICITY: {
        name: "Pure JavaScript projects prioritizing simplicity:",
        title: <>Pure JavaScript projects prioritizing simplicity:</>,
        description: (
            <>
                While usable from JavaScript, the library is designed around
                TypeScript's type system, generics, and inference for the best
                developer experience.
            </>
        ),
    } satisfies WhoIsThisForItem,
};

// ─── Code Showcase ────────────────────────────────────────────

export const CODE_FILES = {
    MAIN: {
        name: "main.ts",
        code: `import { lockFactory } from "./lock-factory.js";
import { cache } from "./cache.js";

// The LockFactory class uses Serde instance
// internally to register custom serialization logic
const lock = lockFactory.create("payment:order-42");

// The underlying RedisCacheAdapter uses by Cache class
// uses the Serde class to serialize and deserialize
// Will automatically serialize correctly
await cache.put(lock.key, lock);

// Will automatically deserialize correctly
const deserializedLock = await cache.get(lock.key);`,
    } satisfies CodeFile,
    LOCK_FACTORY: {
        name: "lock-factory.ts",
        code: `import { LockFactory } from "eridu-tech/lock";
import { RedisLockAdapter } from "eridu-tech/lock/redis-lock-adapter";
import { serde } from "./serde.js";

export const lockFactory = new LockFactory({
    adapter: new RedisLockAdapter(redis),
    serde,
});`,
    } satisfies CodeFile,
    CACHE: {
        name: "cache.ts",
        code: `import { Cache } from "eridu-tech/cache";
import { RedisCacheAdapter } from "eridu-tech/cache/redis-cache-adapter";
import { serde } from "./serde.js";

export const cache = new Cache({
    adapter: new RedisCacheAdapter({
        database: redis,
        serde,
    }),
});`,
    } satisfies CodeFile,
    SERDE: {
        name: "serde.ts",
        code: `import { Serde } from "eridu-tech/serde";
import { SuperJsonSerdeAdapter } from "eridu-tech/serde/super-json-serde-adapter";

export const serde = new Serde(new SuperJsonSerdeAdapter());`,
    } satisfies CodeFile,
    EXECUTION_CONTEXT: {
        name: "main.ts",
        code: `import { Cache } from "eridu-tech/cache";
import { MemoryCacheAdapter } from "eridu-tech/cache/memory-cache-adapter";
import { EventBus } from "eridu-tech/event-bus";
import { MemoryEventBusAdapter } from "eridu-tech/event-bus/memory-event-bus";

// A single context instance shared by every context-aware component
const executionContext = new ExecutionContext(new AlsExecutionContextAdapter());

// Cache and EventBus receive the same ExecutionContext (IReadableContext)
const cache = new Cache({
    adapter: new MemoryCacheAdapter(),
    context: executionContext,
});
const eventBus = new EventBus({
    adapter: new MemoryEventBusAdapter(),
    context: executionContext,
});`,
    } satisfies CodeFile,
    MIDDLEWARE: {
        name: "middleware.ts",
        code: `import { use } from "eridu-tech/middleware";
import { retry, timeout } from "eridu-tech/resilience";
import { TimeSpan } from "eridu-tech/time-span";

const fetchUser = async (id: string) => {
    const res = await fetch(\`/api/users/\${id}\`);
    if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
    return res.json();
};

const resilientFetch = use(fetchUser, [
    timeout({ waitTime: TimeSpan.fromSeconds(5) }),
    retry({ maxAttempts: 3, throwLastError: true }),
]);

// Times out after 5s per attempt, retries up to 3 times
const user = await resilientFetch("42");`,
    } satisfies CodeFile,
    ENHANCE: {
        name: "enhance.ts",
        code: `import { enhance, defineMiddleware } from "eridu-tech/middleware";
import { retry, timeout } from "eridu-tech/resilience";
import { TimeSpan } from "eridu-tech/time-span";

class UserService {
    async getUser(id: string) {
        const res = await fetch(\`/api/users/\${id}\`);
        if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
        return res.json();
    }
}

const service = new UserService();
enhance(service, "getUser", [
    timeout({ waitTime: TimeSpan.fromSeconds(10) }),
    retry({ maxAttempts: 3, throwLastError: true }),
]);

await service.getUser("42");
// Retries up to 3 times on failure
// Throws if a single attempt takes longer than 10s`,
    } satisfies CodeFile,
    PLUGIN: {
        name: "plugin.ts",
        code: `import { withPlugin, type PluginFn } from "eridu-tech/middleware";
import { retry, timeout } from "eridu-tech/resilience";
import { TimeSpan } from "eridu-tech/time-span";

class Fetcher {
    async getUser(id: string) {
        const res = await fetch(\`/api/users/\${id}\`);
        if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
        return res.json();
    }
}

// Reusable plugin factory — apply to any service
const withRetryAndTimeout: PluginFn<Fetcher> = () =>
    (instance, enhance) => {
        enhance(instance, "getUser", [
            timeout({ waitTime: TimeSpan.fromSeconds(10) }),
            retry({ maxAttempts: 3, throwLastError: true }),
        ]);
    };

const fetcher = withPlugin(new Fetcher(), [withRetryAndTimeout()]);

await fetcher.getUser("42");
// Retries up to 3 times, each attempt times out after 10s`,
    } satisfies CodeFile,
    APP_API_USERS_ROUTE: {
        name: "app/api/users/route.ts",
        code: `import { HttpRouter, defaultHttpRouterAdapter } from "eridu-tech/http-router";
import { z } from "zod";

const router = new HttpRouter({
    router: defaultHttpRouterAdapter,
});

router.endpoint({
    url: "/",
    method: "POST",
    validation: {
        json: z.object({ name: z.string(), email: z.string().email() }),
    },
    handler: async ({ req, json }) => {
        const { name, email } = await req.json();
        return json({ success: true, name, email });
    },
});

export const GET: RequestHandler = async ({ request }) => router.fetch(request);
export const POST: RequestHandler = async ({ request }) => router.fetch(request);
export const PUT: RequestHandler = async ({ request }) => router.fetch(request);
export const DELETE: RequestHandler = async ({ request }) => router.fetch(request);
export const PATCH: RequestHandler = async ({ request }) => router.fetch(request);`,
    } satisfies CodeFile,
    CONFIG_ACCESSOR: {
        name: "config.ts",
        code: `import { ConfigAccessor } from "eridu-tech/config-accessor";
import { z } from "zod";

// Typed schema for domain configuration
// Supports primitives, nested objects, and arrays
const schema = z.object({
    database: z.object({
        host: z.string(),
        port: z.number(),
    }),
    features: z.string().array(),
});

const accessor = new ConfigAccessor({
    config: {
        database: { host: "localhost", port: 5432 },
        features: ["cache", "queue"],
    },
    // Schema is optional — a type works just as well
    schema,
});

// Type-safe reads with full autocompletion
const host = accessor.get("database.host");
const port = accessor.getOr("database.port", 5432);
const missing = accessor.get("database.user"); // null`,
    } satisfies CodeFile,
    ENV_ACCESSOR: {
        name: "env.ts",
        code: `import { EnvAccessor } from "eridu-tech/env-accessor";
import { z } from "zod";
import {
    SecretsManagerClient,
    GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

// Multiple sources — later sources override earlier keys
const secretsManager = new SecretsManagerClient({ region: "us-east-1" });
const sources = [
    process.env,
    async () => {
        const secret = await secretsManager.send(
            new GetSecretValueCommand({ SecretId: "my-app/env" }),
        );
        return JSON.parse(secret.SecretString ?? "{}");
    },
];

const schema = z.object({
    NODE_ENV: z.string().optional(),
    PORT: z.string().pipe(z.coerce.number()).default("3000"),
});

const accessor = new EnvAccessor({ schema, sources });
await accessor.init();

// Type-safe reads with full autocompletion
const port = accessor.get("PORT");
const env = accessor.getOr("NODE_ENV", "DEV");`,
    } satisfies CodeFile,
};

export const CODE_EXAMPLES = {
    SERDE: {
        name: "Serde",
        label: <>Serde</>,
        heading: <>Serialize anything. Restore everything.</>,
        description: (
            <>
                The Serde component provides a unified serialization and
                deserialization engine with fully type-safe schemas. It supports
                custom serializers for any type and includes a built-in
                SuperJSON adapter that handles Date, Map, Set, and BigInt out of
                the box. Serde is used internally across LockFactory, Cache,
                EventBus, and other components.
            </>
        ),
        codeBlockDescription: (
            <>
                This example shows how a single Serde instance is shared across
                LockFactory and Cache. Acquire a lock, store it in the cache,
                and retrieve it — serialization and deserialization happen
                automatically.
            </>
        ),
        bullets: [
            <>Shared serialization engine used throughout Eridu-tech</>,
            <>Powers LockFactory, Cache, EventBus, and more</>,
            <>
                Built-in SuperJSON adapter — Date, Map, Set & BigInt out of the
                box
            </>,
            <>Register custom serializers for your own types</>,
        ],
        files: [
            CODE_FILES.MAIN,
            CODE_FILES.LOCK_FACTORY,
            CODE_FILES.CACHE,
            CODE_FILES.SERDE,
        ],
    } satisfies CodeExample,
    EXECUTION_CONTEXT: {
        name: "ExecutionContext",
        label: <>ExecutionContext</>,
        heading: <>Propagate context across async boundaries.</>,
        description: (
            <>
                The ExecutionContext component propagates any kind of async
                context across execution boundaries. Most components use it to
                become implicitly execution-context-aware, allowing them to
                automatically share the same transaction and other contextual
                state.
            </>
        ),
        codeBlockDescription: (
            <>
                This example shows how ExecutionContext propagates
                request-scoped state (request ID, user info) across async
                boundaries with AsyncLocalStorage — and how to test the same
                logic with a NoOp adapter, no runtime context required.
            </>
        ),
        bullets: [
            <>Type-safe context tokens</>,
            <>Async context propagation</>,
            <>No manual parameter passing</>,
        ],
        files: [CODE_FILES.EXECUTION_CONTEXT],
    } satisfies CodeExample,
    MIDDLEWARE: {
        name: "Middleware",
        label: <>Middleware</>,
        heading: <>AOP-style middleware. Compose behavior. Keep logic clean.</>,
        description: (
            <>
                The Middleware component provides a composable AOP-style
                middleware pipeline with before/after hooks, error handling, and
                context propagation. It supports wrapping standalone functions
                with use(), enhancing class methods with enhance(), and
                packaging reusable middleware into plugins with withPlugin().
                Built-in middlewares include retry, timeout, fallback, and more.
            </>
        ),
        codeBlockDescription: (
            <>
                This example demonstrates three approaches to AOP middleware:
                wrap a standalone function with use(), enhance a class method
                with enhance(), and package reusable middleware into plugins
                with withPlugin().
            </>
        ),
        bullets: [
            <>AOP with before/after hooks around any function</>,
            <>Built-in retry, timeout, fallback middlewares and so many more</>,
            <>
                Function wrapping with use(), class enhancement with enhance(),
                plugin system with withPlugin()
            </>,
            <>
                Built-in prefixing plugins for majority of components and so
                many more
            </>,
        ],
        files: [CODE_FILES.MIDDLEWARE, CODE_FILES.ENHANCE, CODE_FILES.PLUGIN],
    } satisfies CodeExample,
    HTTP_ROUTER: {
        name: "HttpRouter",
        label: <>HttpRouter</>,
        heading: <>Define routes. Stay framework-agnostic.</>,
        description: (
            <>
                The HttpRouter component provides a framework-agnostic HTTP
                routing layer with type-safe endpoint definitions,
                standard-schema validation, and middleware support. It works
                with any Winter TC compatible runtime or adapter and can be used
                across Express, Fastify, Hono, Next.js, Nuxt, SvelteKit, and
                more.
            </>
        ),
        codeBlockDescription: (
            <>
                This example defines a typed POST endpoint with Zod request
                validation and exports it as a SvelteKit server route handler —
                all with a framework-agnostic HTTP router.
            </>
        ),
        bullets: [
            <>Type-safe route definitions with standard-schema validation</>,
            <>
                Works with Next.js App Router, Nuxt, SvelteKit, and any winter
                tc compatible runtime or adapter
            </>,
            <>Build on top of Hono.js Router adapters</>,
            <>Middleware chains & route groups</>,
        ],
        files: [CODE_FILES.APP_API_USERS_ROUTE],
    } satisfies CodeExample,
    ENV_ACCESSOR: {
        name: "EnvAccessor",
        label: <>EnvAccessor</>,
        heading: <>Type-safe environment variables. From any source.</>,
        description: (
            <>
                The EnvAccessor component provides easy type-safe access to
                environment variables. It supports multiple sync and async
                sources (process.env, secrets managers), schema validation, and
                convenient access patterns.
            </>
        ),
        codeBlockDescription: (
            <>
                This example combines process.env with an async AWS Secrets
                Manager source — later sources override earlier keys — and
                validates the result with a Zod schema.
            </>
        ),
        bullets: [
            <>Type-safe reads with full autocompletion</>,
            <>Multiple sources — process.env and async secret providers</>,
            <>Optional Zod schema validation</>,
            <>
                get() returns null on missing fields; getOr() falls back to a
                default
            </>,
        ],
        files: [CODE_FILES.ENV_ACCESSOR],
    } satisfies CodeExample,
    CONFIG_ACCESSOR: {
        name: "ConfigAccessor",
        label: <>ConfigAccessor</>,
        heading: <>Read config safely. Stay type-safe.</>,
        description: (
            <>
                The ConfigAccessor component provides standardized type-safe
                access to domain configuration variables. It supports optional
                schema validation — useful for dynamic configurations like
                per-tenant settings.
            </>
        ),
        codeBlockDescription: (
            <>
                This example defines a typed config schema with Zod, then reads
                nested values with full autocompletion — get() returns null on
                missing paths, getOr() falls back to a default.
            </>
        ),
        bullets: [
            <>Type-safe reads with full autocompletion</>,
            <>Nested objects and arrays up to 2 levels deep</>,
            <>Optional Zod schema validation</>,
            <>
                get() returns null on missing paths; getOr() falls back to a
                default
            </>,
        ],
        files: [CODE_FILES.CONFIG_ACCESSOR],
    } satisfies CodeExample,
};

// ─── Framework Comparison ─────────────────────────────────────

export const COMPARISONS = {
    NESTJS: {
        name: "NestJS",
        heading:
            "A full framework with built-in DI vs a library that fits your needs.",
        instead: [
            "Opinionated framework with its own DI, decorators, and modules.",
            "Conventions wholesale: DI central, most primitives only work inside NestJS.",
            "NodeJS runtime only.",
            "Can't embed in a full-stack framework or host as one server.",
            "Not adapted for edge runtimes.",
            "Request-scoped only — no custom scopes.",
            "Wraps existing libs — BullMQ, cache-manager, class-validator, class-transformer, etc.",
            "Geared toward microservices and monoliths.",
            "No execution context flowing through all components.",
            "No shared serialization engine across components.",
            "No built-in transaction context.",
        ],
        eriduTech: [
            "A library, not a framework — DI optional, no decorators, plain classes.",
            "Same cache/lock/event bus in any framework — no lock-in.",
            "Runs anywhere Winter TC runs — Node, Bun, Deno, edge.",
            "Edge-adaptable via the adapter pattern.",
            "Embeds in any full-stack framework — host as one server.",
            "Scope-agnostic — request, custom, or no scope.",
            "Own primitives with pluggable adapters — in-memory adapters for testing.",
            "Built for modular monoliths — swap infrastructure without rewriting logic.",
            "Execution context flowing through all components.",
            "Shared serialization engine (Serde) across components.",
            "Will have a transaction context.",
        ],
    } satisfies ComparisonItem,
    ADONISJS: {
        name: "AdonisJS",
        heading:
            "A batteries-included full-stack framework vs composable primitives.",
        instead: [
            "Bundles routing, ORM (Lucid), auth, sessions, validation.",
            "Prescribed folder structure and conventions.",
            "NodeJS runtime only.",
            "Can't embed in a full-stack framework or host as one server.",
            "Not adapted for edge runtimes.",
            "No execution context flowing through all components.",
            "No shared serialization engine across components.",
            "No built-in transaction context.",
        ],
        eriduTech: [
            "No app framework, ORM, or auth — just infrastructure behind adapters.",
            "Combine with any application layer — you bring the structure.",
            "Runs anywhere Winter TC runs — Node, Bun, Deno, edge.",
            "Embeds in any full-stack framework — host as one server.",
            "Edge-adaptable via the adapter pattern.",
            "Execution context flowing through all components.",
            "Shared serialization engine (Serde) across components.",
            "Will have a transaction context.",
        ],
    } satisfies ComparisonItem,
    TRPC_ORPC: {
        name: "TRPC / ORPC",
        heading:
            "End-to-end typed APIs vs the server-side infrastructure behind them.",
        instead: [
            "End-to-end type safety between client and server.",
            "Define procedures once — call from the client with full inference, no codegen.",
            "Excellent for type-safe full-stack APIs at the client-server boundary.",
            "No built-in battery included backend infrastructure",
        ],
        eriduTech: [
            "Not an RPC framework — not a tRPC or ORPC replacement.",
            "Backend infrastructure behind pluggable adapters — caching, locks, rate limiting, scheduling, event buses.",
            "Complementary — tRPC procedures can call services backed by eridu-tech.",
            "Choose tRPC for typed transport; add eridu-tech for reusable server-side infra.",
        ],
    } satisfies ComparisonItem,
    FULLSTACK_FRAMEWORKS: {
        name: "Next.js, Nuxt, etc.",
        heading: "Meta-frameworks for the web vs a framework-agnostic backend.",
        instead: [
            "Excel at client rendering, SSR, routing, and a rich frontend ecosystem.",
            "Ship their own server-side APIs and route handlers.",
            "Often the best starting point for shipping a web app quickly.",
            "Backend logic locked into the meta-framework.",
            "No built-in battery included backend infrastructure",
        ],
        eriduTech: [
            "Not a web or frontend framework — not a replacement for Next.js or Nuxt.",
            "Complements them — route handlers and server actions can use cache, locks, queues, and schedulers.",
            "Same backend logic moves between a meta-framework and a standalone API service or worker.",
            "Add eridu-tech for portable, testable server-side infra.",
        ],
    } satisfies ComparisonItem,
    COMPOSING_YOUR_OWN_STACK: {
        name: "Composing your own stack",
        heading: "Hand-picked libraries vs a consistent, integrated layer.",
        instead: [
            "Maximum control and minimal dependencies — pick exactly the libraries you want.",
            "Simpler and lighter for small, focused use cases.",
            "Better when you need one or two primitives or rely on provider-specific features.",
            "No shared conventions — you wire libraries together yourself.",
            "Locked into what you picked — adding more means more glue code.",
        ],
        eriduTech: [
            "Consistent, integrated layer — shared patterns and common adapter interfaces.",
            "Heavier than a single raw library, but ships in-memory adapters for testing without Docker.",
            "Trade-off: an abstraction layer — raw libraries win for a single Redis call or a tiny script.",
            "No glue code — components interoperate through a shared serde and execution context.",
            "Adopt incrementally — start with one component and add more as the project grows.",
        ],
    } satisfies ComparisonItem,
};
