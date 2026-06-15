---
title: "Fedora 44 Lost Wi-Fi After Installing the NVIDIA Proprietary Driver: A Troubleshooting Record Caused by an Incomplete Kernel Installation"
summary: "A Fedora 44 troubleshooting record in which Wi-Fi disappeared after installing the NVIDIA proprietary driver. The real root cause was neither RTL8852CE support nor Linux 7.0 compatibility, but an incomplete kernel package installation."
tags: [Fedora, Linux, NVIDIA, Wi-Fi, Troubleshooting]
date: "2026-06-15"
featured: true
---

## Preface

Recently, while installing the NVIDIA proprietary driver on a Lenovo Legion Y7000P 2024 running Fedora 44, I ran into a surprisingly strange problem.

After the installation finished and the system rebooted, Wi-Fi disappeared completely.

What made it worse was that I did not even realize the system had already switched to a new Linux 7.0.11 kernel. In my mind, I had only installed the NVIDIA driver.

The entire troubleshooting process lasted for several hours. Along the way, I suspected the NVIDIA driver, the RTL8852CE Wi-Fi card, and even Linux 7.0 compatibility itself. At one point, I almost gave up on the proprietary driver entirely.

In the end, the real problem was neither the GPU driver nor the Wi-Fi driver. It was an incomplete Linux kernel installation.

## Environment

Hardware:

- Lenovo Legion Y7000P 2024
- NVIDIA RTX 4060 Laptop
- Realtek RTL8852CE Wi-Fi

Software:

- Fedora Workstation 44
- GNOME Wayland

## How the Problem Appeared

My goal was very simple:

Install the NVIDIA proprietary driver.

I followed the usual RPM Fusion process, rebooted, and immediately noticed something was wrong once the desktop loaded:

- The Wi-Fi icon was gone
- No wireless networks could be searched
- The system could not detect any wireless device

Because the problem appeared right after installing the NVIDIA driver, my first reaction was naturally:

> Something went wrong during the NVIDIA driver installation.

At that moment, I still had no idea that the system had also upgraded to a new kernel.

## An Unexpected Discovery

During the later troubleshooting process, I found that the currently running kernel was no longer the version I had been using before.

The system had moved from:

```text
Linux 6.19.x
```

to:

```text
Linux 7.0.11
```

Only then did I realize what had happened:

When I installed the NVIDIA driver, `dnf` had not only installed driver-related packages, but also pulled in and installed a new kernel.

The problem chain now looked like this:

```text
Install NVIDIA driver
↓
System upgrades to Linux 7.0.11
↓
Wi-Fi disappears
```

I still did not know the exact cause, but at least there was now a clear point of change.

## Going Back to 6.19

To verify whether the problem was related to the new kernel, I switched back to the old 6.19 kernel from the GRUB boot menu.

The result was immediate:

Wi-Fi came back.

Wireless networks were visible again.

That strengthened my suspicion:

```text
6.19 works
7.0.11 fails
```

If you only looked at this part, almost anyone would suspect Linux 7.0.

I was no exception.

## Things Started to Get More Complicated

However, a new problem appeared almost immediately.

After switching back to 6.19, Wi-Fi was restored, but the desktop environment began behaving abnormally.

Applications could launch.

The taskbar showed that the programs were running.

But the windows themselves never appeared.

This affected most applications, including:

- Settings
- Common GNOME apps

As the session went on, even the mouse started to freeze occasionally.

Eventually I had to switch to a TTY just to keep operating the machine.

The whole system was in a very strange state:

```text
Applications are running
↓
The system is responsive
↓
But no windows appear
```

The only exception that seemed somewhat special at the time was Firefox.

It still appeared able to open a normal window.

But by then the situation was already chaotic enough that I did not spend time testing more software in detail.

## Trying to Stay on 6.19

At that point, my thinking was straightforward:

If Wi-Fi worked under 6.19, then maybe I should simply remove 7.0.

Then I could reconfigure the NVIDIA driver again under 6.19.

So I started removing the new kernel.

I reinstalled the relevant driver packages.

I tried to make NVIDIA work again in the 6.19 environment.

Then another problem showed up.

Every time I installed NVIDIA-related packages, `dnf` would pull the new 7.0 kernel back in again.

The whole process turned into this:

```text
Remove 7.0
↓
Go back to 6.19
↓
Install NVIDIA driver
↓
dnf pulls in 7.0
↓
The system ends up with 7.0 again
```

At that point I realized:

Keeping myself stuck in the 6.19 loop was not a long-term solution.

Sooner or later, I still had to deal with 7.0.

## I Started Suspecting Linux 7.0

Because the pattern looked so obvious:

```text
6.19
Wi-Fi works

7.0
Wi-Fi disappears
```

And since the machine used a Realtek RTL8852CE card, I gradually formed what seemed like a reasonable conclusion:

> Linux 7.0 might be missing support for RTL8852CE, or its driver might have a compatibility problem.

Looking back now, that conclusion was wrong.

But with the information I had at the time, it was almost the most natural thing to believe.

## Why I Kept Digging

By this point, I already had a barely acceptable fallback plan.

Uninstall the NVIDIA driver.

Go back to:

```text
Linux 6.19
```

In that state:

- Wi-Fi worked
- The desktop environment worked
- Everyday use was mostly fine

For a while, I was ready to stop there.

But later, while reading more about the issue, I realized something important.

The fact that the system could detect the RTX 4060:

```text
lspci
↓
The device is visible
```

did not mean the GPU was actually usable.

Without the NVIDIA proprietary driver, the dedicated GPU was more like this:

```text
Detected by the system
↓
But not truly available for real use
```

For a laptop with an RTX 4060, that effectively meant:

```text
Visible
↓
But unusable
```

which was not meaningfully different from not having it at all.

I did not want the discrete GPU I paid for to end up as a dead component.

So I decided to keep pushing through the investigation.

## The Turning Point: Kernel Packages Did Not Match

Because I had been switching back and forth between:

```text
6.19
↕
7.0.11
```

checking, installing, and removing kernels had already become routine.

That also meant I got used to looking at the installed kernel-related packages.

The real turning point appeared during one of those checks.

At some point, I suddenly noticed:

the package sets did not match.

The old kernel had a complete set of packages:

```text
kernel-core
kernel-modules
kernel-modules-extra
```

But the package set corresponding to 7.0.11 was clearly incomplete.

This was not because I had deliberately started auditing drivers.

I only stumbled onto it while repeatedly installing and removing kernels.

When I saw that, I formed a new suspicion for the first time:

> What if the problem is not that Linux 7.0 lacks RTL8852CE support, but that my 7.0.11 kernel was never installed completely in the first place?

That idea completely changed the direction of the investigation.

Because if the kernel itself was incomplete, then many things that looked like driver compatibility problems could actually just be chain reactions caused by a broken installation state.

## Reinstalling a Complete Kernel

Once I started suspecting that the kernel installation state itself was broken, I decided to stop focusing on the Wi-Fi driver alone.

Instead, I directly installed a new, complete kernel.

After the installation finished, I rebooted.

I entered Linux 7.0 again.

The result was immediate:

- Wi-Fi came back
- RTL8852CE worked normally
- The NVIDIA driver worked normally
- The graphical environment returned to normal

All the previously unrelated-looking problems disappeared at the same time.

## Root Cause

Looking back at the whole process, the problem was not:

```text
Missing RTL8852CE driver support
```

and it was not:

```text
Linux 7.0 incompatibility
```

The real issue was:

> The Linux 7.0.11 kernel installed on the system was incomplete.

Because some kernel-related packages were missing, the required driver modules were not available as expected.

The Wi-Fi card was simply the first piece of hardware to expose the problem.

Later, the NVIDIA driver and the graphical environment were affected as well.

## Conclusion

The biggest takeaway from this troubleshooting session was not just that I fixed Wi-Fi.

It was that this experience confirmed a practical rule once again:

> When multiple pieces of hardware that seem unrelated start failing at the same time, do not rush to suspect each driver one by one.

What is often more important to check first is whether the shared lower-level dependencies are intact:

```text
Kernel
Driver modules
System packages
```

Looking back, I successively suspected:

```text
NVIDIA driver
RTL8852CE
Linux 7.0
```

But in the end, the real problem was simply:

```text
An incompletely installed Linux kernel
```

A system being able to boot does not necessarily mean the kernel environment is complete, and a driver failing to work does not necessarily mean the driver is missing.

Sometimes the real issue is just that one critical package was never installed correctly.
