---
title: ForgeFlow
summary: 结构化 AI workflow runtime：以可审计的控制面（状态、事件、回放、治理与审批）收敛 LLM 非确定性，强调语义一致与可验证边界。
tech: ["Python", "Workflow Orchestration", "State Machine", "LLM Runtime", "Governance", "CLI/TUI"]
startDate: "2026-05"
status: 开发中（Early）
link: https://github.com/NingAloha/ForgeFlow
featured: true
---

## 项目简介

ForgeFlow 是一个结构化的 AI workflow runtime：它的重点不是“跑通一次”，而是把流程推进、回流、暂停、人工介入、治理与审计等长期运行时问题，收敛进一套明确的控制面语义（control plane semantics）。  
在这个前提下，LLM 的非确定性输出被视为 runtime 的不稳定输入源：ForgeFlow 优先提供可诊断、可回放、可验证的边界，而不是堆叠更多“自动能力”。

ForgeFlow SE 是 ForgeFlow 的第一个 target profile：软件工程工作流（Software Engineering pipeline profile），阶段链路为：`Requirements -> Solution -> Design -> Implementation -> Testing`。

## 要解决的问题

在实际协作与自动化流程中，常见痛点不是“没有脚本”，而是：

- 流程状态定义混乱，难以判断下一步该由谁执行
- 异常后回流策略不一致，导致重试成本高
- 文档、代码、测试三者脱节，后续维护容易漂移
- 表面上流程在跑，实际产出链路不可重复

ForgeFlow 的定位是先解决这些“系统性问题”，再扩展功能层。

## 当前阶段目标

- 收敛状态与阶段语义，减少含混边界（让“下一步是什么”可回答）
- 用可审计的 runtime artifacts 固化“发生了什么、为什么这么走”
- 先做治理与边界，再逐步开放安全、可回滚的真实执行能力

## 当前已实现（Current Runtime Capabilities）

- **三层概念**：Core（控制面）/ Profile（阶段产物）/ Shell（人机交互与观测）
- **主链路可运行**：`main.py` 支持一次调度与 `--auto-run` 连续推进
- **最小 TUI 壳（ForgeShell 雏形）**：`--tui` 启动只读观测与入口命令
- **Orchestrator 单控制面**：StateManager 作为单一状态源；TUI 不得成为第二控制面
- **Runtime artifacts**：`summary.json` + `events.jsonl` + `approvals/`（可审计、可回放）
- **Implementation 交接模式（handoff）**：输出 checklist / done criteria / blockers / suggested tests（不落盘、不执行）
- **执行治理语义（preview）**：dry-run 的 patch preview / patch draft（用于审阅与交接）

## 架构思路（当前）

- **流程层（Workflow）**：定义阶段顺序、前置条件、回流规则
- **状态层（State）**：维护结构化状态，约束状态变更路径
- **执行层（Agents/Steps）**：在给定状态下执行动作并返回统一结果
- **编排层（Orchestrator）**：负责调度、推进、暂停、恢复与异常处理
- **LLM Gateway**：收敛非确定性输出，处理 retry、repair 与 failure classification
- **Replay Runtime**：基于运行产物重放阶段决策与诊断链路
- **Typed Runtime Artifacts**：统一状态、trace 与 replay 的 schema 约束

核心原则：
> 状态语义先于实现技巧，流程一致性先于功能堆叠。

这背后的思路也和《[简单的事](/essays/on-simplicity)》一致：先收敛必要结构，再谈扩展能力。

## 技术方向

- 以 Python 为主，优先保障迭代速度与可读性
- 用显式状态模型驱动流程推进
- 用单元测试覆盖关键边界与回流路径

## 能力边界（以当前 repo 为准）

ForgeFlow 当前更重视“先把边界做硬”，所以明确区分已经具备的能力与暂时不开放的能力：

| 能力 | 当前状态 |
| --- | --- |
| Planning（Requirements / Solution / Design） | ✅ |
| Implementation Handoff | ✅ |
| Reviewable Execution Contract（可审阅执行契约） | ✅ |
| Approval Semantics | ✅ |
| Dry-run Apply Plan | ✅ |
| Real Mutation Runtime（真实写入/变更） | ❌ |
| Patch Apply | ❌ |
| Command Execution | ❌ |

## 快速开始（开发/调试入口）

常用入口：

```bash
python3.11 -m pip install -e ".[dev]"
python3.11 main.py --auto-run "<requirement>"
python3.11 main.py --tui
forgeflow --tui
```

当前质量门禁：

```bash
ruff check .
pytest -q
```

## Runtime Root 与产物形态（当前）

ForgeFlow 的默认 runtime root 为 `.forgeflow/`，其中 `runs/<run_id>/` 会保存可审计的运行产物（例如 `summary.json`、`events.jsonl`、`approvals/`）。

## 当前边界

ForgeFlow 当前更关注：

- 可验证流程
- 稳定状态语义
- 长期可维护 runtime

而不是：

- 通用 autonomous agent
- 大规模 agent swarm
- “一句话生成完整系统”

当前阶段优先保证主链路稳定，而非功能面扩张；接口和模块仍可能调整，属于快速迭代期。

## 下一步计划

- 强化 LLM fallback policy consistency（避免回退策略漂移）
- 在不破坏主 flow 的前提下，引入**安全、可审计**的执行能力（逐步开放真实 mutation）
- 继续坚持 Orchestrator 单控制面（TUI 只读观测，不扩成第二控制面）
- 补齐极端路径测试与 artifacts contract，提升异常恢复确定性

## 项目地址

[https://github.com/NingAloha/ForgeFlow](https://github.com/NingAloha/ForgeFlow)
