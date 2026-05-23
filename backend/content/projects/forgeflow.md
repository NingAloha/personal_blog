---
title: ForgeFlow
summary: 面向 AI 辅助软件开发的 engineering state system：把阶段、结论与证据绑定为可描述、可验证、可审计的工程状态，避免长周期项目中的需求漂移与伪完成。
tech: ["Python", "Engineering State", "State Machine", "LLM Tooling", "Governance", "CLI/TUI"]
startDate: "2026-05"
status: 开发中（Early）
link: https://github.com/NingAloha/ForgeFlow
featured: true
---

## 项目简介

ForgeFlow 是面向 AI 辅助软件开发的 **engineering state system**。  
它关注的不是“让 AI 多写几步代码”，而是把项目当前处于哪个工程阶段、哪些结论有证据、哪些 artifact 仍可信、失败后应该停留还是回流，收敛为**可描述、可验证、可审计**的工程状态。

在这个前提下，“agents”更像是工程状态的生产者（state producers）：它们可以提出结论、生成产物、给出建议，但这些输出必须落到可检查的工程状态里，而不是被当作系统的主要抽象。

## 要解决的问题

现代 AI coding agents 往往能局部推进，但在长周期项目中容易丢失系统级工程认知，导致工程状态不稳定、不可复用，常见失败形态包括：

- requirement drift（需求漂移）
- architecture erosion（架构侵蚀）
- pseudo-completion（伪完成：看起来“做完了”，但缺少可验证的 done criteria 与证据）
- broken traceability（可追溯性断裂：结论无法回指证据/输入/上下文）
- documentation/implementation divergence（文档与实现脱节）
- rollback ambiguity（失败后该停留还是回流、回流到哪里不明确）
- artifacts drifting away from runtime evidence（产物与运行证据脱节、难以复现）

这些问题往往不是“再加一个脚本/再多跑一次”能解决的，而是缺少一个明确的对象来承载与约束工程过程中的长期一致性。

## 核心定位

ForgeFlow 的 primary object 是 **project engineering state**：  
把“阶段（phase）/结论（claims）/证据（evidence）/产物可信度（artifact trust）/失败处置（stay vs. fallback）”组织成一套可描述、可验证、可重复的工程状态系统。

它不会把自己描述为通用 workflow engine，也不会把“多 agent”当作核心卖点；它更像是一个工程状态的控制面：把分散的推进动作约束到一套可检查的状态语义与证据绑定上。

当前阶段默认 profile（ForgeFlow SE）仍是软件工程阶段链路：`Requirements -> Solution -> Design -> Implementation -> Testing`。

## 当前已实现

- **三层概念**：Core（控制面）/ Profile（阶段产物）/ Shell（人机交互与观测）
- **主链路可运行**：`main.py` 支持一次调度与 `--auto-run` 连续推进
- **最小 TUI 壳（ForgeShell 雏形）**：`--tui` 启动只读观测与入口命令
- **Orchestrator 单控制面**：StateManager 作为单一状态源；TUI 不得成为第二控制面
- **Runtime artifacts**：`summary.json` + `events.jsonl` + `approvals/`（可审计、可复核）
- **Implementation 交接模式（handoff）**：输出 checklist / done criteria / blockers / suggested tests（不落盘、不执行）
- **执行治理语义（preview）**：dry-run 的 patch preview / patch draft（用于审阅与交接）

## 技术方向

- 以 Python 为主，优先保障迭代速度与可读性
- 用显式工程状态模型约束阶段推进与失败处置
- 用单元测试覆盖关键边界、状态迁移与证据绑定

## 当前能力边界（以当前 repo 为准）

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
| Git checkpointing / recovery | ❌（方向，但未实现） |

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

## 当前阶段重点

- 强化工程状态连续性：阶段语义、结论与证据的绑定方式保持稳定
- 强化 traceability：让结论能回指输入、上下文与产物证据
- 明确能力边界与人工介入点：不以“看起来能跑”替代可验证性
- 逐步补齐可回归性与极端路径测试，避免 artifacts 与 runtime evidence 漂移

同时明确：Git checkpointing / recovery 属于未来方向，当前版本不宣称自动回滚、不宣称真实 mutation runtime、更不把自己描述为任何现成工具的替代品。

## 项目地址

[https://github.com/NingAloha/ForgeFlow](https://github.com/NingAloha/ForgeFlow)
