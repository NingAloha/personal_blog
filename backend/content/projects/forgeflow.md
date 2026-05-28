---
title: ForgeFlow
summary: 面向软件需求语义稳定化的 Rust 实验项目：通过原子化 requirements sieve，将模糊输入逐步收敛为结构化、可校验、可阻塞推进的 requirements artifact。
tech: ["Rust", "Requirements Engineering", "Structured Artifact", "LLM Tooling", "Typed Extraction", "Validation"]
startDate: "2026-05"
status: 开发中（Early）
link: https://github.com/NingAloha/ForgeFlow
featured: true
---

## 项目简介

ForgeFlow 是一个面向软件需求语义稳定化的 Rust 实验项目。

它关注的不是“让 AI 一次性生成完整软件方案”，而是把模糊需求逐步拆解为可校验的结构化 artifact：先识别意图，再澄清目标用户、应用形态、目标平台、能力边界、显式约束与非目标，直到 requirements 状态足够稳定，能够支撑后续设计与实现。

当前阶段的核心对象不是 agent，也不是 workflow，而是 **requirements artifact**：一个不断被澄清、校验、阻塞与推进的工程状态载体。

## 要解决的问题

AI 辅助软件开发中，最容易出问题的并不是局部代码生成，而是需求和工程语义在长链路中逐渐漂移：

- requirement drift：需求在多轮生成中变形
- premature solutioning：需求尚未澄清就进入方案设计
- pseudo-completion：字段看似填满，但关键问题并未被确认
- artifact pollution：LLM 把猜测、常识或技术实现直接写入需求产物
- boundary confusion：目标用户、平台、能力、约束、非目标混在一起
- missing blocking semantics：发现冲突后仍继续推进
- weak traceability：后续设计无法知道某个结论来自用户明确表达，还是模型推断

ForgeFlow 当前试图解决的是：**如何让 requirements capture 成为一个可验证、可阻塞、可恢复的结构化过程。**

## 核心定位

ForgeFlow 当前的核心定位是：

> 用一组原子化 requirements sieve，把模糊需求逐步转化为结构化 requirements artifact，并由 Rust 代码而不是 LLM 控制 artifact mutation、阶段推进与一致性校验。

这里的 sieve 指一个很小的需求澄清单元。每个 sieve 只负责一个边界问题，例如：

- 目标用户是谁？
- 产品以什么应用形态交付？
- 目标平台是什么？
- 高层能力类别有哪些？
- 是否存在额外显式约束？
- 是否存在明确不做的范围？

LLM 在 ForgeFlow 中不是 artifact 的所有者。  
LLM 只负责两类窄任务：

1. 生成更好的用户澄清问题；
2. 从用户回答中抽取 typed extraction result。

真正写入 artifact、移除 pending clarification、设置 maturity、生成 structured inconsistency 的权力都在 Rust 侧。

## 当前 artifact 模型

当前 requirements artifact 大致包含：

```json
{
  "artifact_type": "requirements",
  "schema_version": "0.1",
  "maturity": "intent",
  "intent": {
    "raw_input": "",
    "goal": "",
    "domain": ""
  },
  "product": {
    "target_users": [],
    "application_type": [],
    "target_platforms": []
  },
  "scope": {
    "capability_categories": [],
    "explicit_constraints": [],
    "non_goals": []
  },
  "functional_requirements": [],
  "non_functional_requirements": [],
  "external_interfaces": [],
  "data_requirements": [],
  "pending_clarifications": [],
  "inconsistencies": []
}
```

其中：

- `pending_clarifications` 表示仍待澄清的问题队列；
- `inconsistencies` 表示阻塞或警告级别的问题；
- `explicit_constraints` 表示除目标用户、应用形态、目标平台、能力边界、非目标之外，用户额外明确声明的约束。

ForgeFlow 把 requirements capture 视为一种 **progressive constraint formation**：  
目标用户、应用形态、目标平台、能力类别、非目标本质上都是一等约束字段；`explicit_constraints` 只承载那些没有被一等字段表达的额外约束。

## 当前已实现

- Rust project skeleton
- LLM JSON client
- requirements artifact schema
- requirements validator
- structured `pending_clarifications`
- structured `inconsistencies`
- structured `explicit_constraints`
- intent capture sieve
- `target_users` scope sieve
- `application_boundary` scope sieve
- `capability_categories` scope sieve
- `explicit_constraints` scope sieve
- manual requirements runner
- requirements 文档结构拆分

当前已实现的 scope sieves 都遵循同一条原则：

> Question LLM 只生成问题；Extraction LLM 只返回 typed result；Rust 负责 mutation 与 validation。

## 当前未完成

- router / CLI
- inconsistency review / resolution layer
- `non_goals` sieve
- functional requirements generation
- design / implementation stages
- end-to-end automated pipeline
- offline fixture runner
- LLM client 错误分层与更好的可观测性

## 能力边界

ForgeFlow 目前仍是早期实验项目，不宣称已经具备完整自动化软件工程能力。

当前它能做的是：

| 能力 | 当前状态 |
| --- | --- |
| Intent capture | ✅ |
| Target users clarification | ✅ |
| Application boundary clarification | ✅ |
| Capability categories clarification | ✅ |
| Explicit constraints clarification | ✅ |
| Structured pending clarification queue | ✅ |
| Structured inconsistency queue | ✅ |
| Manual development runner | ✅ |
| Non-goals clarification | ❌ |
| Functional requirements generation | ❌ |
| Design / implementation stages | ❌ |
| Automatic routing | ❌ |
| Real end-to-end pipeline | ❌ |

这里的重点不是“功能多”，而是先把需求边界做硬：  
LLM 可以参与澄清和抽取，但不能绕过结构、校验和阻塞语义直接污染 artifact。

## 快速开始

当前通过 manual runner 进行开发期测试：

```bash
cargo run -- requirements intent
cargo run -- requirements target-users
cargo run -- requirements application-boundary
cargo run -- requirements capability-categories
cargo run -- requirements explicit-constraints
```

manual runner 不是正式 CLI。它不自动选择下一步，不执行 blocking gate，也不代表最终的 router 设计。

当前质量门禁：

```bash
cargo check
cargo test -q
```

## 文档结构

项目文档已拆分到：

```text
docs/requirements/
  README.md
  artifact/
    schema.md
    constraint-model.md
  intent/
    llm-contract.md
  runner/
    manual-runner.md
  scope/
    architecture.md
    smoke-tests.md
```

这些文档分别描述 artifact schema、constraint model、LLM contract、manual runner 和 scope sieve architecture。

## 当前阶段重点

ForgeFlow 当前阶段重点是 requirements 层的稳定化：

- 让需求澄清过程原子化；
- 让 artifact mutation 由 Rust 控制；
- 让 LLM 输出保持 typed、局部、可验证；
- 让 blocking inconsistency 能真正阻止错误推进；
- 让每个 scope sieve 都可以独立测试；
- 在进入 design / implementation 前先保证 requirements artifact 的结构可信。

后续方向包括：

- `non_goals` sieve
- inconsistency review / resolution layer
- router / CLI
- offline fixture runner
- functional requirements generation
- design / implementation stages

## 项目地址

[https://github.com/NingAloha/ForgeFlow](https://github.com/NingAloha/ForgeFlow)