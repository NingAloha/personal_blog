---
title: Authority 比 Abstraction 更重要：ForgeFlow 的一次语义收缩
summary: ForgeFlow 曾经一路膨胀成“workflow runtime / orchestration runtime / multi-agent system”。直到我开始为长周期项目负责：我才逐渐意识到，真正缺的不是抽象层，而是工程状态的 authority——哪些结论可信、凭什么可信、失败后该 STAY 还是 BACKFLOW。
tags: [ForgeFlow, Engineering, AI, State, Workflow]
date: "2026-05-23"
featured: true
---

这篇文章不是在介绍 ForgeFlow 的“能力”，而是在复盘它的一次语义修正：我为什么开始删 abstraction，以及我删的其实不是“未来”，而是当前不可承担的语义债。

## 早期：我把它越讲越像一个 runtime

ForgeFlow 一开始的动机很朴素：我在做 AI-assisted coding 时，经常感觉自己在“局部盲动”——能推进两步，但很难稳定回答三个问题：

- 我们现在到底处在哪个工程阶段？
- 我们有哪些结论？它们的证据是什么？哪些还可信？
- 出现失败/不确定性时，到底应该停留（STAY）还是回流（BACKFLOW）？

但在写 README、画架构、补术语的时候，我的叙事开始滑向另一个方向：

- “AI workflow runtime”
- “orchestration runtime”
- “multi-agent system”
- “layered governance runtime”

我不断加层：Core / Profile / Shell、控制面语义、治理与审批、回放与审计……它们都不一定错，但一个更关键的问题被遮住了：

ForgeFlow 的 primary object 到底是什么？

当 primary object 不清晰时，抽象会变成一种“默认扩写”：每遇到一个不确定点，就用更大的框架把它包起来；每遇到一个边界问题，就用新术语把它命名掉。

这在早期很容易发生，因为早期没有真实压力——系统还没跑进长期项目，语义也还没有被现实验证。

## 压力出现：我开始为“长期一致性”付代价

真正的压力来自两类体验：

第一类是 Codex-driven development 的体感：  
它确实能让局部推进更快，但这种速度会放大“工程状态不稳定”的问题：你会更频繁地进入一种状态——看起来完成了，但你不敢相信它真的完成了。

第二类是语义漂移本身开始反噬：

- README / docs 说的是一套东西，runtime artifacts 暗示的是另一套东西
- “流程在跑”的叙事变强了，但“结论可信度”的交代变弱了
- 失败之后，STAY vs BACKFLOW 变成一种靠直觉的选择，而不是可复核的决策
- 文档与实现开始脱节（documentation/implementation divergence），并且脱节的成本越来越真实

外部反馈也把这个问题戳得更明显：当别人问我“你到底在解决什么”时，我能讲出一套架构，但很难用一个稳定对象把所有语义收敛起来。

其中一次更具体的压力来自一位长期高频使用 AI coding agents 的软件工程老师：他指出 ForgeFlow 最大的风险并不是“功能不够”，而是 primary object 与语义边界不稳定，导致你很难判断哪些结论已经落地、哪些只是叙事。  
这类反馈让我更清楚地看到：当对象不清晰时，系统会不断用 abstraction 自我扩写，但这种扩写并不会自动带来可复核的 authority。

最痛的其实不是“抽象不够”，而是出现了几种典型的工程性失败：

- pseudo-completion：看起来 done，但缺少可验证的 done criteria 和证据
- rollback ambiguity：失败后不确定该回到哪里，回流条件也不稳定
- broken traceability：结论无法回指输入、上下文或产生它的过程
- artifacts drifting away from runtime evidence：产物存在，但它不再能解释 runtime 发生了什么

这些问题会累积成一种“工程认知不稳定”：同一个项目，隔一周再看，你会发现自己只能相信少量东西，其余都要重新问一遍、跑一遍、对一遍。

## 关键意识：我缺的不是 orchestration，而是 continuity

直到那一刻我才把两件事拆开：

- workflow orchestration 解决的是“怎么把步骤串起来跑”
- engineering-state continuity 解决的是“长期项目里，什么是当前状态，什么结论可信，为什么可信”

我之前不断扩写的很多抽象，属于“未来可能性”，而不是“当前必要性”。  
而且最关键的是：它们不自带 authority。

这里的 authority 不是权力或组织结构，而是一个很工程化的含义：

当 README、口头解释、以及 runtime artifacts 产生冲突时，谁是最终裁决？

如果答案不是 runtime artifacts，那你就很难在长周期里建立可迁移的工程状态，因为你随时可能被“解释”带偏。

## 语义回滚：把 ForgeFlow 开始收缩到 engineering state system

我做的修正本质上很简单：把叙事从“workflow runtime”开始收缩回“工程状态系统”（并且刻意避免把这种收缩描述成“已经完成”）。

具体落地是几件可以被检验的事情：

- README 重写：把 primary object 改成 `project engineering state`
- 项目页重写：把“workflow runtime”改成 “engineering state system”，并把失败模式写清楚
- “agents”降级：它们不是主抽象，只是 state producers（产生状态与建议的实现手段）
- STAY vs BACKFLOW 从“术语”变成“失败处置的显式决策”
- hard vs soft evidence 明确化：未来可能做很多自动化，但当前要先把“哪些证据算数”讲清楚

我开始刻意强调一句话：**future possibility ≠ current implementation**。  
这不是保守，而是在避免把“可想象的架构”当作“已经拥有的 authority”。

### hard / soft evidence（一个可操作的区分）

对我来说，一个足够可操作的划分是：

- hard evidence：能被复查、能回放、能从 runtime artifacts 中直接读出来的东西（例如运行事件、审批记录、summary 的结构化输出）
- soft evidence：来自人或模型的解释性输出（例如一段看似合理的结论、一个“我觉得可以”的设计描述），它可以被记录，但默认不应当自动升级为“已证实”

需要补一句现实：ForgeFlow 目前真正具备的 deterministic authority 其实很少；多数结论仍然由人来扛，hard/soft 的语义也还处在早期探索期。  
所以这里的区分更像是一个“写作与实现都要遵守的自我约束”，而不是已经成熟的证据体系。

这并不意味着 soft evidence 没价值；相反，长周期项目里大部分结论最初都只能以 soft 形式出现。  
但它必须有一个被 hard 化的路径，否则它就会在下一次推进中变成语义漂移的起点。

## 我删掉的 abstraction，实际上是在删语义债

回头看，我删掉的主要是这些“未经授权的宏大叙事”：

- 把自己称为通用 workflow engine
- 把多 agent 当作核心卖点
- 过早许诺 rollback / checkpoint / mutation runtime（哪怕只是“将来会有”）
- 用架构层级替代证据链路

我保留的，是能让 authority 逐步变强的最小骨架：

- 单一状态源与可检查的状态语义（谁负责裁决）
- runtime artifacts（发生了什么，为什么这么走）
- 明确的边界矩阵（实现了什么，没实现什么）

当抽象带来的复杂度超过它能提供的 authority 时，它几乎必然会变成 semantic debt。

## 结论：软件工程不是让 agent 写更多，而是让状态可迁移

我现在更愿意把目标说得非常克制：

软件工程的关键不是“让 agent 写更多代码”，而是让工程状态变得：

- inspectable（可检查）
- evidence-bound（与证据绑定）
- reproducible（可复现）
- transferable（可交接、可迁移）

ForgeFlow 仍然很早，runtime authority 也仍然很弱：很多决策依然依赖人，很多证据仍然是 soft。  
但这次语义收缩至少让我重新开始区分一件事：**如果 authority 还不在 runtime，那么很多复杂度就只是在叙事层面累积。**

下一步也应该同样克制：不是继续扩写架构，而是让更多关键结论拥有可复核的证据路径；同时承认在相当长一段时间里，人仍然会是最终 authority——ForgeFlow 更像是在逐步外置工程连续性，而不是在做“自治工程”。
