---
title: 从“自动恢复”到“删除恢复器”：一次 SSH 双跳事故复盘
summary: 这不是一篇 SSH 调参教程，而是一份真实故障复盘：我如何把一个不断叠加 autossh、watchdog、launchd、sleepwatcher 的“自愈系统”，最后删回一个普通 SSH tunnel。
tags: [SSH, Networking, Engineering]
date: "2026-05-06"
featured: true
---

## 背景：一个本来很小的问题
这次改造最初只有一个目标：在 Local Machine 上保留一个稳定的 SOCKS5 入口，给应用流量使用。

流量入口是 `127.0.0.1:1080`，链路是：

`Local Machine -> Entry Server -> Exit Server -> Internet`

Entry Server 只负责跳板，Exit Server 只负责出口。

## 最初的双跳：一个 SSH 进程就够了
第一版只有一条命令：

```bash
ssh -N -D 127.0.0.1:1080 exit
```

这个版本很直接：一个 SSH 进程、一个本地端口、一个固定路径。

问题也很直接：合盖、网络切换、Wi-Fi 抖动后，隧道会断，需要手动重连。

最开始我一直把这当成偶发问题。后来它开始变得更频繁：有时合盖后复现，有时网络切换后复现，有时甚至什么都没做也会卡死。真正危险的不是某一次故障，而是我开始逐渐失去对系统状态的确定性。

## 我是怎么把它一步步做复杂的
后续每一步在当时看都合理：

- 手动重连太频繁，加 `autossh`
- 想开机自动拉起，加 `launchd`
- 想处理唤醒后断连，加 `sleepwatcher`
- 想确认 1080 不是假活，加 health check
- 想在探测失败后自动修复，加 watchdog
- 甚至一度考虑/尝试过让 Entry Server 周期性重启 `sshd`

问题不是某一步“明显错误”，而是这些局部最优叠加后，系统里出现了多个同时有恢复权限的组件。

这些自动恢复器最危险的地方在于，它们在前期确实会提升体验。第一次自动重连成功时，我也会觉得系统“更高级”了。问题在于，当恢复逻辑互相叠加后，复杂度增长速度会快过人的理解速度。

## 故障不是断线，而是状态混乱
真正把我拖进故障现场的，不是一次“彻底断线”，而是一种很诡异的状态：看起来都活着，但就是不工作。

一次典型过程是这样的。

我先发现网页打不开，但 Shadowrocket 还显示 SOCKS 已连接。我第一反应是出口抖动，先等一会。几分钟后还是不通，于是去看本地端口：`lsof -i :1080` 还能看到 SSH 在 LISTEN。

这时候直觉会告诉你“进程在，端口在，应该只是慢”。但我跑 `curl --socks5-hostname 127.0.0.1:1080 ...`，请求直接超时。

接下来我开始手动 restart tunnel。第一次通常会短暂恢复，但很快又坏。然后状态变得越来越难理解：有时 `1080` 已经被旧 SSH 占着；有时 `autossh` 已经悄悄拉起新 SSH；有时 `launchd` KeepAlive 又在后台再起一个；有时 `sleepwatcher` 的唤醒动作又刚好撞上 health check 的 kill/restart。

最后我已经分不清一件最基本的事：现在到底是谁在控制 tunnel。

## 最严重的问题：控制面也失效了
最开始我还以为只是 SOCKS 不通，范围只在代理层。

后来我发现事情升级了：`ssh entry` 也开始失败，终端里直接出现 connection closed。不是偶发一次，而是连续几次都上不去。

那一刻压力很真实，因为控制面也掉了。你不只是“代理坏了”，而是连用 SSH 进去修 SSH 的能力都不稳定。

最后我只能打开 Provider Console 手动重启 `sshd`。到这一步我才确认：故障源已经不是单点网络抖动，而是恢复系统本身在制造故障。

## 误判：我以为是服务器的 sshd 坏了
我当时的误判链也很典型。

第一步，我怀疑 Entry Server 的 `sshd` 不稳定。理由很“充分”：每次重启 `sshd` 后，问题经常会暂时恢复。

第二步，我顺着这个判断走，开始在服务端加 watchdog，反复清理/重启 SSH 服务，甚至认真考虑“定时重启 `sshd`”。

现在回看，关键误读在这里：我把“重启后短暂恢复”解释成“`sshd` 被修好了”。

实际上，重启动作很可能只是强制清掉了旧 session 和异常 TCP 状态。也就是说，我误把“清状态”理解成了“修服务”。

## 清空：先删掉所有恢复器
排查转折点是先清空本地自动化，再观察基线。

本机清理动作：

- unload tunnel launchd
- 删除 tunnel plist
- 删除 health check plist
- 停掉 `sleepwatcher`
- 删除 wakeup/sleep 脚本
- 删除 autossh 脚本
- 卸载 `autossh`

清理后确认项：

- `lsof -i :1080` 无旧监听
- `launchctl list` 中无 tunnel 项
- `pgrep -af autossh` 无输出
- 只剩系统 `ssh-agent`

## 重建：Entry Server 只做 SSH bastion
随后清理 Entry Server，让职责回到最小：

- 删除 SSH watchdog service
- 删除 SSH restart timer
- 删除 watchdog shell script
- 执行 `systemctl daemon-reload`
- `sshd_config` 回到极简
- 仅保留一个 SSH 监听端口
- firewall 只保留必要端口

做完后，Entry Server 回到“纯 SSH bastion”角色，不再承担自恢复编排。

## 关键发现：基础设施流量必须 DIRECT
这是本次复盘里最关键的发现。

Shadowrocket 应该代理的是应用流量，不是基础设施流量。Entry Server、Exit Server、Blog Server、Lab Server 都必须强制 `DIRECT`。

我后来才确认，在旧 VPN 和 Shadowrocket 规则残留同时存在时，SSH 控制连接自己也可能正在走代理。

也就是说，我以为自己在直连 `entry`，实际上 SSH 可能已经先进入 SOCKS。然后 tunnel 又在这个路径里再建 tunnel，形成嵌套。

常见异常就是：旧 `1080` 连接还被 Shadowrocket 持有，新 SSH 又试图占用同一个 `1080`。表面看像“偶发不稳定”，实际是路径已经不再线性。

把基础设施地址提到规则最前面的 `DIRECT` 之后，变化是立刻可见的：

- `ssh entry` 延迟明显下降
- tunnel 重建速度明显变快
- 之前很多“玄学不稳定”直接消失

到这一步我才第一次认真怀疑：前面不少问题并不是 SSH 本身，而是路径嵌套。

## 验证：双跳链路本身是健康的
清空和规则修正后，我做了连续验证：

- 普通 `ssh entry` 可稳定登录
- 普通 `ssh exit` 可经由 Entry Server 登录
- 手动启动 `ssh -N -D 127.0.0.1:1080 exit`
- `curl --socks5-hostname 127.0.0.1:1080 https://api.ip.sb` 返回 Exit Server 出口
- `70MB` 文件完整下载
- `100MB` 文件完整下载

验证重点不是峰值速度，而是连续传输过程中没有断流、没有 reset、没有再次触发 `sshd` 失联。

这组证据说明：双跳路径本身可用，问题主要出在后面叠加的恢复层。

## 最终方案：半自动恢复
最终方案不是纯手动，而是低复杂度半自动：

- 平时用普通 SSH 在后台运行 tunnel
- 不使用 `autossh`
- 不使用 `launchd` 自愈
- 不使用 watchdog
- 不使用 `sleepwatcher`
- 只保留一个 `tunnel` alias

后台启动命令：

```bash
nohup ssh -o ExitOnForwardFailure=yes -N -D 127.0.0.1:1080 exit >/tmp/tunnel.log 2>&1 &
```

alias（先清旧进程，再起新连接）：

```bash
alias tunnel='pkill -f "127.0.0.1:1080" 2>/dev/null; sleep 1; nohup ssh -o ExitOnForwardFailure=yes -N -D 127.0.0.1:1080 exit >/tmp/tunnel.log 2>&1 &'
```

我最后接受了“恢复需要人工参与”。但这个人工流程必须满足四个条件：快、固定、可重复、不需要猜。

现在断线后的动作固定为：

1. 关 Shadowrocket
2. 执行 `tunnel`
3. 开 Shadowrocket

它不再需要我去猜谁在重连，也不再需要等 watchdog、看 launchd、进 Provider Console、重启 `sshd`。

删掉这层自动化之后，系统重新变得线性：断线就是断线，重连就是重连。我可以明确知道哪个进程负责 tunnel，哪个端口负责 SOCKS，哪个动作会触发恢复，哪一步失败了。系统重新回到了人的理解范围。

## 我最后删掉了什么
我最后删掉的是“多恢复器并发决策机制”，包括：

- 自动重连协调（`autossh` + `launchd` + watchdog）
- 唤醒触发恢复（`sleepwatcher`）
- 服务端周期性重启 SSH 的兜底思路

我保留的是最小恢复动作：一个明确的端口、一个明确的命令、一个明确的重建入口。

## 和《简单的事》的关系
《简单的事》讲的是原则。

这篇文章的目标不是介绍 SSH 双跳，而是用 SSH 双跳这个具体事故证明《简单的事》那篇文章的观点。

## 结论：删除机制也是工程能力
“真正危险的不是断线，而是不知道系统正在做什么。”

在这个场景里，我最后接受了一个更朴素的判断：能在 30 秒内被人稳定恢复、并且恢复过程完全可解释的系统，比一个看似无人值守但内部状态不可见的系统更可靠。
