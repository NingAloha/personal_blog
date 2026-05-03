---
title: 构建一个自愈的多跳 SSH 网络通道
summary: 记录一个基于 SSH ProxyJump、autossh、launchd 与 watchdog 的多跳网络通道设计，以及端口异常、半开连接和自动恢复的工程化处理。
tags: [SSH, macOS, Launchd, Networking]
date: "2026-05-03"
featured: true
---

## 背景
跨区域开发中的 SSH 隧道问题，通常不是“会不会断”，而是“断了以后是否能快速、可控地恢复”。

如果只把它当作一次性排障，很容易得到一套只适配当前机器的脚本；如果把它当作系统设计问题，可以沉淀成可迁移的自愈架构。

> 说明：本文所有配置均为脱敏示例，不包含真实主机名、IP、账号或密钥路径。

## TL;DR
中文：
这不是一篇“把 SSH 调到永不掉线”的文章，而是一套三层自愈模型：客户端维持连接、客户端真实探测、跳板机主动修复，目标是让故障在可控窗口内自动恢复。

English:
This is not about making SSH never disconnect. It is a three-layer self-healing model: keep the tunnel alive on the client, probe real SOCKS usability on the client, and repair `sshd` on the bastion, so failures recover within a controlled window.

## 目标与边界
### 目标
- 让跨区域连接具备可控出口和可预期路径
- 将“偶发断连”变成“可自动恢复的短暂抖动”
- 在系统重启、网络切换、睡眠唤醒后尽量自动恢复

### 适用场景
- 需要长期保持 SSH / SOCKS 连接的研发环境
- 对公网出口一致性有要求（例如访问策略受出口影响）
- 希望把手工重连转为系统托管

### 不适用场景
- 对极低延迟有硬实时要求的业务链路
- 不允许本地持久代理进程的受限终端环境
- 无法控制中间跳板和出口节点的场景

### 成功标准（可按需调整）
- 日常运行中，通道可用率达到预期（例如 > 99%）
- 单次断连可在可接受窗口内自动恢复（例如 1~3 分钟）
- 连续失败时进入冷却，避免高频重启

## SSH 隧道失效的三种形态
隧道失效不是一个问题，而是三类问题：

| 类型 | 表现 | 危害 |
|---|---|---|
| 控制连接断 | SSH 进程退出 | 明显，容易被发现 |
| 通道断 | 本地 `1080` 不监听 | 中等，代理直接不可用 |
| 假活 | `1080` 在监听但代理不可用 | 最危险，最容易误判为正常 |

这三类问题中，“假活”最难处理。它通常表现为：
- 本地端口仍在
- `autossh` 进程仍在
- 真实代理探测失败
- 手动重启后恢复

所以健康检查不能只看进程与端口，必须做真实出网探测。

## 系统架构
整体路径：

`Client (Mac) -> Bastion (JP) -> Target (US) -> Internet`

```mermaid
flowchart LR
    A[Client Mac<br/>autossh + health check] --> B[Bastion JP<br/>sshd + watchdog]
    B --> C[Target US<br/>service access]
    C --> D[Internet]
```

分层职责：
- `Client`：本地 `autossh` + `launchd health check`，保障用户侧可用性
- `Bastion (JP)`：`sshd watchdog`，处理入口服务异常和半开连接风暴
- `Target (US)`：业务访问目标节点

这个拆分的关键是：本地层不承担服务端修复职责，服务端层也不承担用户侧可用性检测职责。

## 恢复策略
### 1. 被动恢复（autossh）
职责：
- 维持 SSH 长连接
- 在进程退出后自动拉起

特点：
- 对“控制连接断”有效
- 对“假活”不充分

最小命令示例：
```bash
autossh -M 0 -N -D 127.0.0.1:1080 target \
  -o ServerAliveInterval=30 \
  -o ServerAliveCountMax=3 \
  -o TCPKeepAlive=yes \
  -o ExitOnForwardFailure=yes \
  -o Compression=no
```

### 2. 主动检测（本地 health check）
职责：
- 检测 `autossh` 是否存在
- 检测端口是否监听
- 检测代理是否真实可用

关键点：
- 仅 `lsof -i :1080` 不够
- 必须执行真实 SOCKS 探测，例如：

```bash
curl --socks5-hostname 127.0.0.1:1080 https://example.com --max-time 10
```

防抖逻辑示意：
```bash
if ! check_proxy; then
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi
```

说明：
- 使用 `FAIL_COUNT` 做连续失败确认
- 避免短时网络抖动触发误重启

### 3. 强制修复（Bastion watchdog）
职责：
- 处理跳板机 `sshd` 异常状态
- 在入口服务退化时主动恢复

建议触发条件：
- `sshd inactive`：立即重启
- SSH 端口不监听：连续确认后重启
- systemd leftover：连续确认后重启
- 大量连接中断或半开模式：达到阈值后重启

不建议：
- 仅依据 `kex_exchange_identification` 或 `banner exchange` 直接重启（容易被扫描流量误触发）

## macOS 托管
### LaunchAgent（托管 autossh）
最小可运行模板（示意）：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.example.ssh.tunnel</string>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/local/bin/autossh</string>
    <string>-M</string><string>0</string>
    <string>-N</string>
    <string>-D</string><string>127.0.0.1:1080</string>
    <string>target</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>/tmp/ssh-tunnel.out.log</string>
  <key>StandardErrorPath</key>
  <string>/tmp/ssh-tunnel.err.log</string>
</dict>
</plist>
```

常用命令：
```bash
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.example.ssh.tunnel.plist
launchctl kickstart -k gui/$(id -u)/com.example.ssh.tunnel
launchctl bootout gui/$(id -u) ~/Library/LaunchAgents/com.example.ssh.tunnel.plist
```

睡眠唤醒后可采用延迟重启策略（例如 `sleep 30` 后 `kickstart`），避免网络栈尚未恢复时误判。

## 自愈流程
```text
every N seconds:
  if local_port_missing:
    restart_tunnel()
    continue

  probe_result = real_socks_probe()
  if probe_result == ok:
    clear_failure_counter()
    continue

  wait short_window
  probe_result = real_socks_probe()
  if probe_result == failed:
    restart_tunnel()
    enter_cooldown()

restart_tunnel():
  kill only tunnel-related autossh/ssh processes
  do not pkill all ssh
  wait for old port release
  start launchd service
  wait 60~120 seconds with repeated real probes
```

### 恢复动作的边界
自愈脚本最大的风险不是“不重启”，而是“重启错对象”。

错误示例：
```bash
pkill ssh
```

风险：
- 杀掉正在排障的登录连接
- 杀掉 `ProxyJump` 会话
- 杀掉其他远程开发连接

更安全的方式是仅匹配本地 SOCKS 端口关联的 `autossh/ssh` 进程。

## 设计原则
1. 不追求不断线：网络抖动和跨区域路径波动不可避免。
2. 追求可恢复：系统目标是把故障收敛到可接受恢复时间。
3. 允许受控误杀，拒绝假活：Fail fast 好过 Fail silently。

一句话总结：

`隧道稳定性 ≠ 保证连接不断；隧道稳定性 = 保证系统最终可恢复。`

## 为什么不用其他方案
- `frp`：需要额外服务端组件与治理成本
- `wireguard`：网络维护与路由管理成本较高
- `mosh`：不支持端口转发场景
- `Cloudflare Tunnel`：可控性与依赖边界不一定满足要求

结论：在“轻量、可控、可脚本化”的前提下，`SSH + autossh` 仍是性价比较高的基线方案。

## 观测与指标
建议至少记录：
- 每日断连次数
- 平均恢复时长（MTTR）
- 连续稳定运行时长
- 恢复动作触发次数（人工/自动）

观测目标不是“日志越多越好”，而是能回答：
1. 什么时候断了
2. 多久恢复
3. 为什么恢复失败

## 排查建议
1. `lsof -i :1080`
2. `curl --socks5-hostname ...`
3. 查看 autossh / launchd 日志
4. `ssh -vvv` 分析连接过程
5. 单独测试每一跳节点

## 最终模型
```text
Client:
  autossh + health check
Server:
  sshd + watchdog
Strategy:
  detect -> decide -> force recover
```

## 总结
这套方案的重点不是“把 SSH 调到永不掉线”，而是通过分层职责和自愈策略，把故障控制在可恢复窗口内。

当你把问题从“连接参数调优”提升到“系统恢复设计”，这套方法可以迁移到更多隧道类场景，而不绑定某一台机器或某一份脚本。
