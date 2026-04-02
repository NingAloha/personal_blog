---
title: bootoo
summary: 适用于 Apple Silicon Mac 的启动盘制作工具。专注 M 系列芯片，把设备检测、写盘流程、引导兼容、错误恢复做到稳定易用。
tech: ["Python", "macOS (Apple Silicon)", "diskutil", "dd", "asr"]
startDate: "2026-04"
status: 进行中
link: https://github.com/NingAloha/bootoo
featured: true
---

## 项目简介

bootoo 是一个面向 **Apple Silicon（M 系列）Mac** 的启动盘制作工具，目标是把“选盘/卸载/写入/校验/失败恢复”这一整套流程做得稳定、可预测、可自动化。  
当前范围仅覆盖 Apple Silicon，不包含 Intel Mac，也不做 Windows/Linux 本地客户端。

## 技术栈

- **Python** — 核心实现语言（设备检测、权限检查、镜像校验、磁盘操作、写入引擎、写后校验、恢复建议、日志与错误码）
- **macOS（Apple Silicon）** — 平台限定与系统能力依赖
- **diskutil** — 磁盘信息查询、卸载/挂载、抹盘与分区等操作的底层命令工具
- **dd** — `.iso` / `.img` 镜像写入引擎
- **asr** — `.dmg` 镜像写入引擎（Apple Software Restore）

## 设计理念

- **安全优先**：尽量降低误选系统盘的风险，写入前做设备筛选与确认。
- **可恢复**：失败时尽量把设备恢复到可识别状态，并提供明确的下一步建议。
- **稳定接口边界**：通过 `core/api` 提供统一返回结构 `{ok, code, message, data}`，方便未来 CLI/GUI 或脚本集成。

## 开发过程

先把 core 的关键链路跑通：设备扫描与筛选 → 权限与环境检查 → 镜像校验 → 自动卸载/抹盘 → 写入并展示进度 → 写后校验 → 成功收尾或失败恢复。  
在 MVP 阶段以 **Python 快速实现** 为主，后续如遇性能瓶颈再按需引入 **C/C++** 优化。

## 项目地址

bootoo 的源码仓库托管在 GitHub，所有开发进度、历史变更、文档说明和问题追踪都集中在同一处。无论是下载试用、查阅最新代码、提交 Issue 还是参与协作开发，都推荐直接访问项目主页：

👉 **项目主页**：  
[https://github.com/NingAloha/bootoo](https://github.com/NingAloha/bootoo)

如果你有 Apple Silicon 设备，想要自定义启动盘制作流程，或者对 macOS 下的磁盘写入、校验与恢复感兴趣，都非常欢迎来交流、反馈和贡献建议/代码。  
项目支持通过 Issue 报错与提需求，也欢迎通过 Pull Request 贡献新功能或平台适配。  
未来如需平台扩展（比如支持 Intel Mac 或 Windows/Linux 工具链），也会在该地址统一规划和迭代。

**把复杂的系统操作封装成可控的流程与明确的错误码，是这个项目的核心价值。**