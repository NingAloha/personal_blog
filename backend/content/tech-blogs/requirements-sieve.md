---
title: 从 Engineering State 到 Requirements Sieve：ForgeFlow 的第二次语义收缩
summary: ForgeFlow 的关注点从“工程状态系统”进一步收缩到 requirements artifact：用原子化 sieve、typed extraction、pending clarification 与 blocking inconsistency，把模糊需求逐步变成可校验、可阻塞、可继续追问的结构化状态。
tags: [ForgeFlow, Engineering, AI, Requirements, Rust, State]
date: "2026-05-28"
featured: false
---

上一篇写 ForgeFlow 时，我把它从“workflow runtime / orchestration runtime / multi-agent system”的叙事里拉了回来，重新定义为一个更克制的东西：engineering state system。

那次收缩解决的是一个大问题：ForgeFlow 的 primary object 不应该是 workflow，也不应该是 agent，而应该是 project engineering state。  
也就是：一个项目当前处于什么阶段，哪些结论可信，凭什么可信，失败后应该停留还是回流。

但最近继续写下去，我发现这个定义仍然太大。

“Engineering state” 是正确方向，但它仍然宽到可以容纳太多东西。只要它还没有落到一个具体 artifact 上，它就仍然容易重新膨胀成宏大叙事。

于是 ForgeFlow 发生了第二次语义收缩：

> 先不要试图治理整个软件工程过程。先把 requirements capture 这一个阶段做硬。

## 从状态系统到 requirements artifact

这次重写以后，ForgeFlow 当前真正的核心对象变成了 **requirements artifact**。

不是 agent。  
不是 workflow。  
不是完整 pipeline。  
不是“AI 软件工程平台”。

而是一个会被逐步澄清、校验、阻塞与推进的结构化 requirements artifact。

它大致长这样：

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

这个结构本身并不复杂，但它强迫我面对一个更具体的问题：

如果用户说“做一个 IDE”，系统到底应该先写什么？  
如果用户说“目标用户是学生”，这个回答是否足够？  
如果用户说“做 CLI 工具，支持 iOS 和 Android”，系统是继续推进，还是停住？  
如果用户说“暂无其他约束”，这和“先这样吧”是不是同一种回答？

这些问题都不是 workflow 层能直接解决的。  
它们属于 requirements artifact 内部的语义稳定性问题。

## Sieve：把需求澄清拆成原子层

现在 ForgeFlow 采用的是一组很小的 requirements sieve。

每个 sieve 只负责一个问题：

- `intent capture`：用户原始意图是什么？
- `target_users`：目标用户是谁？
- `application_boundary`：应用形态和目标平台是什么？
- `capability_categories`：高层能力类别有哪些？
- `explicit_constraints`：除一等字段之外，还有哪些额外显式约束？
- `non_goals`：明确不做或暂不支持什么？目前还没实现。

这里的关键不是“让 LLM 多问几个问题”，而是让每个问题都有独立的 artifact target、pending clarification、typed extraction 和 validation rule。

以前我容易把需求分析理解成一整段自然语言推理：  
用户说一句，模型总结一大段，然后继续往下走。

现在我更倾向于把它看成一个有阶段门的状态机：

```text
pending clarification
→ user answer
→ typed extraction
→ Rust mutation
→ validation
→ remove pending or keep pending
→ maybe blocking inconsistency
```

这比“让模型生成一个完整 requirements 文档”慢，但它更可检查。

## LLM 不再拥有 artifact

这次重构里，一个很重要的边界是：LLM 不再直接修改完整 artifact。

我把 LLM 的职责压缩成两类：

第一类是 question LLM：  
根据当前 artifact context，把一个冷冰冰的 pending clarification 改写成更适合问用户的问题。

例如，不要只问：

```text
目标用户是谁？
```

而是可以问：

```text
这个 IDE 主要面向哪类使用者？请说明他们的经验水平、背景或使用场景，因为这会影响后续的复杂度取舍、默认工作流和能力边界。
```

第二类是 extraction LLM：  
它只从用户回答中抽取 typed result，例如：

```json
{
  "target_users": [
    "有一定开发经验并掌握工业化开发流程的学生",
    "有一定开发经验并掌握工业化开发流程的开发者"
  ]
}
```

它不能返回完整 artifact。  
不能返回 operations。  
不能决定 maturity。  
不能移除 pending clarification。  
不能写 inconsistency 的系统字段。

真正的 authority 在 Rust 侧。

Rust 负责：

- 写入 artifact 字段；
- 移除或保留 pending clarification；
- 设置 maturity；
- 构造 structured inconsistency；
- 执行 validator；
- 决定是否允许阶段继续推进。

这一步是 ForgeFlow 这次重构里最重要的工程边界：**LLM 可以参与语义抽取，但不能拥有 mutation authority。**

## Pending clarification 不是提示语，而是状态

一开始我把 pending question 看得比较轻，好像它只是“还要问用户的问题”。

后来发现不对。

`pending_clarifications` 实际上是 artifact 的推进边界。  
一个 pending item 存在，意味着对应字段还没有被确认。  
一个 pending item 被移除，意味着系统认为这个字段已经完成。

所以 pending 的移除必须非常谨慎。

比如在 `application_boundary` 中，用户回答：

```text
做 CLI 工具，支持 iOS 和 Android
```

系统可以抽取到：

```json
{
  "application_type": ["CLI 工具"],
  "target_platforms": ["iOS", "Android"]
}
```

但这两者存在冲突：CLI 工具通常不是直接运行在 iOS / Android 上。  
此时系统应该写入 blocking inconsistency，但不能移除相关 pending clarification。

否则就会出现一个荒谬状态：

```text
系统说这里需要澄清
但澄清问题已经不在队列里
```

这类 bug 很小，但它暴露了一个核心原则：

> 如果 inconsistency requires clarification，那么对应 pending clarification 必须仍有后续路径。

这也是我后来修掉的一个问题：`application_boundary` 需要和 `capability_categories`、`explicit_constraints` 一样，在冲突存在时保留 pending，而不是因为字段被写入了就默认完成。

## Inconsistency 不是错误日志，而是阻塞语义

`inconsistencies` 也不是普通 error list。

它表示 artifact 中存在需要处理的问题。  
有些问题是 warning，有些是 blocking。当前 scope sieve 里最重要的是 blocking inconsistency。

例如：

```json
{
  "id": "scope.application_boundary.cli_mobile_platform_conflict",
  "stage": "scope",
  "sieve": "requirements.scope.application_boundary",
  "severity": "blocking",
  "target_paths": [
    ["product", "application_type"],
    ["product", "target_platforms"]
  ],
  "message": "CLI 工具通常不以 iOS/Android 作为直接运行平台，需要进一步澄清目标运行环境。",
  "requires_clarification": true
}
```

这个结构的意义不只是“记录一个问题”。  
它表达的是：

- 哪个 sieve 发现了问题；
- 问题属于哪个 stage；
- 影响哪些 artifact path；
- 是否阻塞推进；
- 是否需要用户继续澄清。

换句话说，inconsistency 是 requirements state machine 的一部分，不是日志附属品。

## 显式约束：我重新理解了 constraints

写到 `constraints` 这一层时，我卡住了。

因为我突然意识到：目标用户、应用形态、目标平台，本质上不也都是约束吗？

目标用户会约束交互复杂度、权限设计、语言表达和能力优先级。  
应用形态会约束部署方式、交互模型和集成能力。  
目标平台会约束技术选择、兼容性和测试矩阵。

如果从“约束后续设计空间”的角度看，它们全部都是 constraints。

所以我不能再把 `scope.constraints` 当作“所有约束”的容器。那会变成垃圾桶字段。

后来我把它改名为：

```text
scope.explicit_constraints
```

含义是：**除了一等字段已经表达的约束之外，用户额外明确声明的约束。**

例如：

```json
{
  "kind": "technical",
  "text": "必须使用 React、PostgreSQL 和 Redis"
}
```

或者：

```json
{
  "kind": "policy",
  "text": "只能使用校内邮箱注册"
}
```

这里有一个细节很重要：  
技术栈在 `capability_categories` 里是错误输入，因为它不是能力类别；  
但技术栈在 `explicit_constraints` 里是合法输入，因为它确实是设计阶段必须遵守的技术约束。

同一句话，在不同 sieve 中语义不同。  
这说明 sieve 的价值不只是“抽取字段”，而是定义语义边界。

## “暂无其他约束”必须明确说出

`explicit_constraints` 还暴露了另一个问题：  
什么时候可以认为“没有额外约束”？

一开始很容易把用户没提约束当成“没有约束”。  
但这会把“未回答”误判成“无约束”。

所以我后来把规则收紧：

只有用户明确说：

```text
暂无其他约束
没有其他约束
除了前面说的没有了
暂时没有额外限制
没有补充约束
```

系统才能认为 `explicit_constraints` 已完成，并移除 pending。

但如果用户说：

```text
先这样
暂时没想好
应该没啥
你看着办
```

这都不能算完成。  
系统应该保留 pending，并写入 blocking inconsistency：

```json
{
  "id": "scope.explicit_constraints.uncertain_explicit_constraints_absence",
  "severity": "blocking",
  "requires_clarification": true
}
```

这看起来有点啰嗦，但它解决的是一个很实际的问题：  
需求阶段最危险的不是“不知道”，而是把“不知道”伪装成“已经确认”。

## Rust 重写后的变化

这次 ForgeFlow 也从之前的 Python 版本转向 Rust。

原因不是性能，而是约束。

Python 版本让我很容易快速堆结构，但也容易让边界变软：字典到处传，字段形态不稳定，schema 和 runtime 的关系容易变成约定俗成。

Rust 不是自动带来正确性，但它迫使我更早面对这些问题：

- artifact struct 到底长什么样？
- 字段是否应该结构化？
- validator 检查什么，不检查什么？
- LLM output 是否能被 typed struct 接住？
- mutation authority 到底在哪里？
- 一个 pending 被移除的条件是否真的明确？

对 ForgeFlow 这种还在寻找语义边界的项目来说，Rust 的价值不是“快”，而是让错误更早变硬。

## 文档也被拆开了

另一个变化是文档结构。

以前 README 承载了太多东西：项目介绍、架构叙事、artifact schema、manual runner、smoke tests、LLM contract。  
这导致 README 很快变成新的语义垃圾桶。

现在我把 requirements 相关文档拆到了：

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

这次拆文档不是为了“显得正式”，而是为了让 Codex 和我自己都更难读错上下文。

README 只保留入口、状态和文档导航。  
真正的规则放到对应的 docs 文件里。

这其实和代码里的收缩是一致的：  
不要让一个对象承担太多语义。

## DeepSeek 挂了，但这反而验证了一个方向

今天开发过程中还有一个很现实的插曲：DeepSeek API 的 chat completions 卡住了。

`/models` 很快返回 200，说明 API key、base URL 和基础网络没问题；  
但 `/chat/completions` 要么 body 长时间不返回，要么直接返回：

```text
Service is too busy.
```

这导致在线 smoke test 被卡住。

一开始这很烦，但它也反过来说明了 ForgeFlow 现在的方向是对的：  
LLM 不应该成为本地工程验证的唯一入口。

如果一个 requirements sieve 的 Rust mutation、validator、pending removal、inconsistency construction 都必须依赖实时 LLM 才能测试，那这个系统仍然太脆。

所以后面 ForgeFlow 需要补的是：

- offline fixture runner
- typed extraction fixture
- 更好的 LLM client 错误分层
- 区分 send timeout、body read timeout、status error、JSON parse error

今天这个问题本身不是 ForgeFlow 的逻辑 bug，但它暴露了 ForgeFlow 需要继续降低对实时 LLM 的测试依赖。

## 这次我真正学到的

这次推进让我对“工程成长”有一个很具体的体感：

以前我喜欢从大的抽象开始：workflow、agent、runtime、governance。  
这些概念不是没价值，但它们太容易让人感觉自己已经理解了系统。

而真正推动项目变清楚的，反而是非常小的问题：

- 一个 pending 什么时候能删？
- 一个字段为空代表“没有”，还是“还没问”？
- 用户说“先这样”算不算完成？
- 技术栈到底是能力类别，还是显式约束？
- 冲突存在时，系统有没有继续提问的路径？
- LLM 返回的东西到底有没有 mutation authority？

这些问题没有宏大的架构感，但它们决定系统是否真的可信。

所以如果上一篇的结论是：

> Authority 比 abstraction 更重要。

那这篇的结论就是：

> Authority 必须落到 artifact 的具体状态转移上，否则它仍然只是一个好听的词。

ForgeFlow 现在仍然很早。  
它没有完整 router，没有 review layer，没有 design / implementation stages，也没有自动 pipeline。

但它现在比之前更真实了一点：  
它不再急着宣称自己能自动完成软件工程，而是在很小的 requirements 层里，认真区分什么是用户明确表达，什么是模型推断，什么可以推进，什么必须停下。

这可能比多写几个 agent 慢得多。  
但对长周期项目来说，慢一点的语义稳定，可能比快一点的伪完成更重要。

## 相关阅读

- [Authority 比 Abstraction 更重要：ForgeFlow 的一次语义收缩](/tech-blogs/authority-over-abstraction)
- [ForgeFlow 项目页](/projects/forgeflow)
