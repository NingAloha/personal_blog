---
title: 从“全能主力机”到“职责分离”：一次个人设备架构重构
summary: 这不是一篇“Mac 和 Windows 谁更好”的评测，而是一份真实的个人工作流演化记录：我如何从“让一台游戏本承担所有角色”，最终走向 Mac、Lima、Windows、AI node 分层共存的结构。
tags: [Workflow, Engineering, AI, Infrastructure]
date: "2026-05-08"
featured: false
---

## 背景：我曾经想让一台机器解决所有问题
很长一段时间里，我默认认为：性能最强的机器，就应该成为主力机器。

于是我的游戏本开始承担越来越多职责：

- Windows 日常
- Linux 开发
- SSH
- 远程工作流
- CUDA
- AI
- x86 编译
- 课程作业
- Docker
- 网络实验
- 长期开机节点

最开始这看起来很合理。毕竟它有：

- x86
- NVIDIA
- 更强的性能
- 更大的散热
- 更高的兼容性

问题在于，当所有职责都叠加到同一台机器上后，系统开始变得越来越不稳定。

## 转折点：Mac 并没有像我想象中那样“受限”
最开始我对 Apple Silicon 一直有一种潜意识里的不信任。

总觉得：

- ARM 不够通用
- x86 才是真正的开发平台
- Linux 才是严肃工作环境

所以游戏本一直被我默认为真正的生产力核心。

但后面事情开始变化。

我逐渐开始长期使用：

- SSH
- CLI
- Remote Workflow
- Agent
- AI Coding
- 多终端工作流

与此同时，Mac 上的体验开始变得越来越顺滑：

- 唤醒即用
- 续航稳定
- Terminal 体验稳定
- 网络切换稳定
- 多设备切换稳定

最关键的是，我开始越来越少真正依赖本地 x86。

## Lima：x86 不一定需要物理 x86
真正改变我认知的是 Lima。

我最开始只是想解决一个现实问题：课程作业要求 x86 Linux。

于是我开始折腾：

- QEMU
- VMware
- 远程 Linux
- VSCode Remote
- 游戏本远控

后来我发现：`Lima + QEMU` 已经足够解决绝大部分 x86 兼容问题。

最终跑通后的状态其实非常简单：

```bash
limactl start --name=x86dev x86dev.yaml
ssh x86dev
uname -m
# x86_64
```

那一刻我第一次认真意识到：

“我真正需要的是 x86 环境，而不是一台 x86 主力电脑。”

这是完全不同的两件事。

## 设备开始失去“唯一性”
当 Lima 跑通后，事情开始变化。

游戏本原本最大的不可替代性“它是唯一 x86 Linux 环境”开始消失。

与此同时，Mac 已经逐渐承担：

- 主力 Terminal
- SSH 控制面
- Agent Workflow
- AI Coding
- 日常开发

而游戏本开始越来越少真正参与核心工作流。

最后甚至出现一种很奇怪的状态：性能最强的机器，反而两个月没真正用过。

## 我开始尝试“节点化”
接下来我做了一件很典型的工程师行为：我开始尝试给游戏本重新定义角色。

既然它不再适合做主力工作站，那它还能干什么？

于是我开始尝试：

- Ubuntu Server
- 有线网络
- SSH
- AI node
- local inference
- automation
- ForgeFlow
- 本地多模态模型

这时候它不再是“我的电脑”，而开始变成“我的一个节点”。

## 现实：校园网不适合长期基础设施
问题也很快出现。

Linux 装好后：

- Wi-Fi 正常
- 有线始终卡在 Getting IP Configuration
- DHCP 一直只有 DHCPDISCOVER
- IPv6 正常
- IPv4 始终没有 DHCPOFFER

最开始我怀疑过 Ubuntu、驱动、Realtek、`r8169`、`r8168`。

后来发现，真正不稳定的其实是校园网环境。

也就是说，机器能发出请求，但校园网没有给它分配 IPv4 地址。

游戏本并不是不能当 node，只是宿舍网络环境并不适合长期基础设施。

## 我最后意识到：设备职责应该分离
折腾到最后，我开始重新划分职责，而不是继续给单机叠加能力。

最终形成的结构非常清晰：

| 角色 | 设备 |
| --- | --- |
| 主力生产力 | MacBook |
| x86 compatibility layer | Lima |
| 游戏 / CUDA / AI sandbox | Windows 游戏本 |
| AI reasoning | DeepSeek |
| 本地多模态 | Gemma / Qwen-VL |

设备终于不再互相争夺角色。

## 为什么最后又装回 Windows
最后我还是把 Ubuntu 删了。

不是因为 Linux 不好，而是因为游戏本真正适合的是：高性能 + 娱乐 + CUDA + AI 沙盒，而不是“每天都依赖的主力工作站”。

于是我最后装回：`Windows 11 + WSL2`。

原因也很现实：

- NVIDIA 最稳定
- 游戏最稳定
- 校园网兼容最好
- WSL2 已经足够承担 Linux 小实验
- 不需要维护第二套完整 Linux Desktop

那一刻我终于接受：Mac 已经是我的真正主力，而游戏本终于可以不再被强迫承担它不适合的角色。

## ForgeFlow：设备开始变成系统的一部分
这次折腾还有一个意外收获。

我开始越来越少把设备理解成“电脑”，而开始理解成“系统中的节点”。

比如：

| 职责 | 节点 |
| --- | --- |
| Control Plane | Mac |
| Compatibility Layer | Lima |
| AI Sandbox | Windows + WSL2 |
| Reasoning | DeepSeek |
| Orchestration | ForgeFlow |

这时候设备本身已经不再重要，真正重要的是谁负责什么。

## 和《简单的事》的关系
《简单的事》讲的是复杂度控制。

这篇文章想表达的是：很多时候，问题并不是“设备不够强”，而是系统里没有明确的职责边界。

如果你还没读过，可以先看《[简单的事](/essays/on-simplicity)》。

## 结论：设备不该承担所有角色
我最后得到的结论其实很简单：真正成熟的工作流，不是让一台机器承担所有职责，而是让每个节点只承担它擅长的角色。

Mac 不需要强行变成 CUDA 工作站。游戏本也不需要强行变成长期 Linux bastion。Lima 不需要替代真实 Linux。Windows 也不需要承担主力开发。

当职责边界清晰后，整个系统反而第一次真正稳定了。

也许这也是我越来越喜欢“简单系统”的原因：不炫技，只是把东西放在该放的地方。
