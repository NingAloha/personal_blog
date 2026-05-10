---
title: ForgeFlow
summary: 一个尝试将非确定性 LLM 流程收敛进确定性运行时的实验性编排项目，重点探索状态语义、可回放诊断与可验证边界。
tech: ["Python", "Workflow Orchestration", "State Machine", "LLM Runtime", "CLI/TUI"]
startDate: "2026-05"
status: 开发中（Early）
link: https://github.com/NingAloha/ForgeFlow
featured: true
---

## 项目简介

ForgeFlow 是一个面向工程场景的流程编排项目，目标是把“多阶段任务推进、状态管理、异常回流、人工介入”变成一套可验证、可演进的系统能力。  
ForgeFlow 关注的不是单次任务能否跑通，而是长期运行时是否具备稳定的状态语义、可恢复行为，以及对非确定性 LLM 调用的可诊断与可回放能力。

当前阶段不追求功能面广，而是先把核心流程模型做扎实：状态定义清晰、阶段推进可解释、失败回流可验证。

## 要解决的问题

在实际协作与自动化流程中，常见痛点不是“没有脚本”，而是：

- 流程状态定义混乱，难以判断下一步该由谁执行
- 异常后回流策略不一致，导致重试成本高
- 文档、代码、测试三者脱节，后续维护容易漂移
- 表面上流程在跑，实际产出链路不可重复

ForgeFlow 的定位是先解决这些“系统性问题”，再扩展功能层。

## 当前阶段目标

- 收敛状态与阶段语义，减少含混边界
- 先打通一条真实可运行的产出链路
- 保持文档、实现与测试同步演进

## 当前已实现（Current Runtime Capabilities）

- 基于状态机的阶段推进与回流控制
- 五阶段 Agent 主链路（Requirements -> Testing）
- LLM Gateway 边界层（解析 / retry / repair / failure classification）
- Typed runtime artifacts（RunSummary / LLMTrace）
- Replayable runtime diagnostics（`summary.json`）
- fail-closed 的 strict LLM 模式
- 基于 schema 的运行产物校验

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

## 当前进度（Early Runtime Phase）

当前主链路已能够完成从 Requirements -> Testing 的完整运行与 replay diagnostics。

已完成

- 主链路状态机与阶段推进
- Gateway 边界层
- replay diagnostics
- typed run summary / llm trace
- strict / compat LLM runtime mode

进行中

- execution trace typing
- runtime observability
- replay diagnostics 增强

后续方向

- 更稳定的 execution runtime
- 更细粒度 artifact contract
- TUI runtime visualization

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

- 完善状态契约文档，减少实现歧义
- 增强 orchestrator 在等待态/回流态下的可预测行为
- 补齐极端路径测试，提升异常情况下的恢复确定性

## 项目地址

[https://github.com/NingAloha/ForgeFlow](https://github.com/NingAloha/ForgeFlow)
