---
sidebar_position: 1000
---

# LLM

This page is the gateway for AI assistants, LLM tooling, and anyone who wants
to consume the Eridu-tech documentation programmatically.

## Table of Contents

- [Overview](#overview)
- [Machine-Readable Documentation](#machine-readable-documentation)
    - [llms.txt](#llmstxt)
    - [llms-full.txt](#llms-fulltxt)
- [Agent Skill Package](#agent-skill-package)
- [How to Use These Files](#how-to-use-these-files)

## Overview

`eridu-tech` ships machine-readable versions of its documentation that are
optimized for large language models and AI-assisted tooling. These plain-text
files let an LLM quickly discover the library's components and usage patterns —
no need to crawl the entire site.

## Machine-Readable Documentation

Two plain-text files are published, each tuned for a different context budget:

### llms.txt

**[llms.txt](https://www.eridu-tech.dev/llms.txt)** is a concise, structured
index of the documentation. It gives AI assistants a compact map of the
ecosystem — ideal for quick context retrieval and navigation.

### llms-full.txt

**[llms-full.txt](https://www.eridu-tech.dev/llms-full.txt)** contains the
complete documentation in a single plain-text file. Use it when you need the
full context for deep understanding and comprehensive answers.

## Agent Skill Package

**[Download the skill package](/eridu-tech-skills.zip)** — a zip archive that
bundles the entire API surface of `eridu-tech` as an AI agent skill.

The archive contains:

- **`eridu-tech-skills/SKILL.md`** — the main skill file in the
  [SKILL.md](https://agentskills.io) format, with a quick reference to the
  full API.
- **`eridu-tech-skills/references/`** — on-demand reference files covering
  every export, grouped by kind: functions, classes, types, variables, and
  configuration options.

The skill is generated automatically from the library's TypeScript source —
every export with its signatures, parameters, return types, and usage
examples. It's designed to be loaded by AI agents and assistants: import it
into your agent of choice to give it accurate, up-to-date knowledge of the
`eridu-tech` API without crawling the site.

## How to Use These Files

- **Quick lookups** — start with `llms.txt` to locate the right component or
  section before diving deeper.
- **Full-context tasks** — feed `llms-full.txt` to your tool when you want the
  entire documentation available in a single pass.
- **Agent integration** — download `eridu-tech-skills.zip` to give your AI
  agent a ready-made, token-budgeted skill describing the whole API.
