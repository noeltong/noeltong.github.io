---
layout: post
title: "INR Architecture Notes: MLP, Fourier Features, NeRF, SIREN, and BACON"
date: 2026-04-15 11:32:40
description: A compact note on core implicit neural representation architectures and their forward equations
tags: inverse
categories: lecture-notes
toc:
  sidebar: left
---

## Why architecture matters for INR

For implicit neural representations (INRs), the main object is a continuous function
\begin{equation}
f_{\theta}: \mathbf{x} \in \mathbb{R}^{d} \rightarrow \mathbf{y} \in \mathbb{R}^{c},
\end{equation}
where $$\mathbf{x}$$ is a coordinate and $$\mathbf{y}$$ is the signal value at that coordinate, such as intensity, RGB color, density, occupancy, or a signed distance.

Using the `brainstorming-research-ideas` lens, the cleanest way to organize INR architectures is to move up an abstraction ladder: start from the plain coordinate MLP, then ask how each later design changes the frequency handling of the network. The core question is always the same: **how does the architecture inject, preserve, or control high-frequency information?**

## 1. Vanilla coordinate MLP

The simplest INR uses the raw coordinate as input and applies a standard MLP.

### Essential elements

- Input coordinate $$\mathbf{x} \in \mathbb{R}^{d}$$.
- Learned affine layers $$\mathbf{W}_{\ell}, \mathbf{b}_{\ell}$$.
- Pointwise nonlinearity, usually ReLU or tanh.

### Closed form

Let $$\mathbf{h}_{0} = \mathbf{x}$$. For $$\ell = 1, \dots, L$$,
\begin{equation}
\mathbf{h}_{\ell} = \phi \left( \mathbf{W}_{\ell}\mathbf{h}_{\ell-1} + \mathbf{b}_{\ell} \right),
\end{equation}
and the final output is
\begin{equation}
f_{\theta}(\mathbf{x}) = \mathbf{W}_{L+1}\mathbf{h}_{L} + \mathbf{b}_{L+1}.
\end{equation}

### Forward process

The forward pass is simply coordinate $$\rightarrow$$ hidden features $$\rightarrow$$ output value. This baseline is easy to implement, but it is biased toward low-frequency functions, which is why images reconstructed by raw-coordinate ReLU MLPs are usually too smooth.

## 2. Fourier-feature MLP

The next step is to keep the MLP simple but lift the input into a richer sinusoidal feature space before the network sees it.

### Essential elements

- Raw coordinate $$\mathbf{x}$$.
- A fixed Fourier feature map $$\gamma(\mathbf{x})$$.
- A standard MLP operating on $$\gamma(\mathbf{x})$$.

### Closed form

In the most general form used in Fourier feature networks,
\begin{equation}
\gamma(\mathbf{x}) =
\left[
a_{1}\cos(2\pi \mathbf{b}_{1}^{\top}\mathbf{x}),
a_{1}\sin(2\pi \mathbf{b}_{1}^{\top}\mathbf{x}),
\dots,
a_{m}\cos(2\pi \mathbf{b}_{m}^{\top}\mathbf{x}),
a_{m}\sin(2\pi \mathbf{b}_{m}^{\top}\mathbf{x})
\right]^{\top}.
\end{equation}

A common Gaussian random feature version is
\begin{equation}
\gamma(\mathbf{x}) =
\left[
\cos(2\pi \mathbf{B}\mathbf{x}),
\sin(2\pi \mathbf{B}\mathbf{x})
\right],
\quad
\mathbf{B}_{ij} \sim \mathcal{N}(0,\sigma^{2}).
\end{equation}

Then the INR becomes
\begin{equation}
\mathbf{h}_{0} = \gamma(\mathbf{x}), \qquad
\mathbf{h}_{\ell} = \phi(\mathbf{W}_{\ell}\mathbf{h}_{\ell-1} + \mathbf{b}_{\ell}), \qquad
f_{\theta}(\mathbf{x}) = \mathbf{W}_{L+1}\mathbf{h}_{L} + \mathbf{b}_{L+1}.
\end{equation}

### Forward process

The forward pass is coordinate $$\rightarrow$$ sinusoidal embedding $$\rightarrow$$ ReLU MLP $$\rightarrow$$ output. The frequency content is injected at the input instead of being generated only by deep learned weights.

## 3. NeRF-style positional encoding MLP

NeRF uses the same general idea as Fourier features, but with a deterministic multiscale positional encoding and a radiance-field-specific output structure.

### Essential elements

- Spatial coordinate $$\mathbf{x}=(x,y,z)$$.
- Viewing direction $$\mathbf{d}$$.
- Deterministic positional encoding with dyadic frequencies.
- A density branch and a color branch.
- A skip-style reinjection of encoded position into the hidden trunk in the standard implementation.

### Closed form

For a scalar input $$p$$, NeRF uses
\begin{equation}
\gamma(p) =
\left(
\sin(2^{0}\pi p), \cos(2^{0}\pi p),
\dots,
\sin(2^{L-1}\pi p), \cos(2^{L-1}\pi p)
\right).
\end{equation}

Applying this componentwise to location and direction gives encoded inputs $$\gamma_{x}(\mathbf{x})$$ and $$\gamma_{d}(\mathbf{d})$$. The network represents
\begin{equation}
F_{\theta}(\mathbf{x}, \mathbf{d}) = \left( \sigma(\mathbf{x}), \mathbf{c}(\mathbf{x}, \mathbf{d}) \right),
\end{equation}
where $$\sigma$$ is density and $$\mathbf{c}$$ is view-dependent color.

One compact forward description is
\begin{align}
\mathbf{h} &= \mathrm{MLP}_{\theta_{x}} \left( \gamma_{x}(\mathbf{x}) \right), \\
\sigma(\mathbf{x}) &= g_{\sigma}(\mathbf{h}), \\
\mathbf{c}(\mathbf{x}, \mathbf{d}) &= g_{c}\left([\mathbf{h}, \gamma_{d}(\mathbf{d})]\right).
\end{align}

### Forward process

The forward pass is encoded 3D point $$\rightarrow$$ shared hidden trunk $$\rightarrow$$ density, then hidden feature plus encoded direction $$\rightarrow$$ RGB color. NeRF is therefore not just an INR for a scalar field; it is an INR coupled to volume rendering.

## 4. SIREN

SIREN changes the nonlinearity itself. Instead of using ReLU on top of sinusoidal inputs, it makes sinusoidal activations the core of every hidden layer.

### Essential elements

- Raw coordinate input.
- Sine activation in every hidden layer.
- Frequency scaling parameter $$\omega_{0}$$, especially important in the first layer.
- Special initialization so deep sine networks do not collapse.

### Closed form

Let $$\mathbf{h}_{0} = \mathbf{x}$$. A general SIREN can be written as
\begin{equation}
\mathbf{h}_{\ell} =
\sin \left( \omega_{\ell} \left( \mathbf{W}_{\ell}\mathbf{h}_{\ell-1} + \mathbf{b}_{\ell} \right) \right),
\qquad \ell = 1, \dots, L,
\end{equation}
with output
\begin{equation}
f_{\theta}(\mathbf{x}) = \mathbf{W}_{L+1}\mathbf{h}_{L} + \mathbf{b}_{L+1}.
\end{equation}

In practice, the first layer often uses a larger frequency factor, e.g. $$\omega_{1}=\omega_{0}$$ with $$\omega_{0}\approx 30$$, while later layers use smaller or fixed scaling.

### Forward process

The forward pass is coordinate $$\rightarrow$$ affine transform $$\rightarrow$$ sine $$\rightarrow$$ affine transform $$\rightarrow$$ sine repeatedly, ending in a linear readout. Unlike Fourier-feature MLPs, SIREN does not only inject periodic structure at the input; periodicity is preserved through the entire network.

## 5. BACON

BACON is best viewed as a structured multiplicative filter network. It uses sinusoidal filters of the input coordinate at every layer and mixes them through Hadamard products with learned linear transforms of the hidden state.

### Essential elements

- Fixed Fourier filter bank applied directly to the coordinate.
- Learned linear mixing between hidden states.
- Elementwise Hadamard multiplication between filter outputs and propagated hidden features.
- Band-limited, often quantized frequency design.
- Optional multiscale outputs from intermediate layers.

### Closed form

Define layer-wise coordinate filters
\begin{equation}
\mathbf{g}_{\ell}(\mathbf{x}) = \sin(\mathbf{B}_{\ell}\mathbf{x} + \boldsymbol{\beta}_{\ell}),
\end{equation}
where $$\mathbf{B}_{\ell}$$ contains fixed frequencies and $$\boldsymbol{\beta}_{\ell}$$ is a phase offset.

BACON then computes
\begin{align}
\mathbf{z}_{0}(\mathbf{x}) &= \mathbf{g}_{0}(\mathbf{x}), \\
\mathbf{z}_{\ell}(\mathbf{x}) &= \mathbf{g}_{\ell}(\mathbf{x}) \odot
\left( \mathbf{W}_{\ell}\mathbf{z}_{\ell-1}(\mathbf{x}) + \mathbf{b}_{\ell} \right),
\qquad \ell = 1, \dots, L, \\
f_{\theta}(\mathbf{x}) &= \mathbf{W}_{o}\mathbf{z}_{L}(\mathbf{x}) + \mathbf{b}_{o}.
\end{align}

For the multiscale version, one can attach outputs at several depths:
\begin{equation}
f_{\theta}^{(s)}(\mathbf{x}) = \mathbf{W}_{o}^{(s)} \mathbf{z}_{\ell_{s}}(\mathbf{x}) + \mathbf{b}_{o}^{(s)}.
\end{equation}

### Forward process

The forward pass is coordinate $$\rightarrow$$ sinusoidal filter $$\rightarrow$$ multiply with learned hidden projection $$\rightarrow$$ repeat. Relative to SIREN, BACON is more explicitly spectrum-aware because the coordinate filters are separated from the hidden linear transport and can be chosen to be band-limited from the start.

## A compact comparison

| Architecture | Where frequency enters | Nonlinearity | Forward summary |
| --- | --- | --- | --- |
| Vanilla MLP | Only through learned weights | ReLU/tanh | $$\mathbf{x} \rightarrow \mathrm{MLP} \rightarrow \mathbf{y}$$ |
| Fourier-feature MLP | Input embedding $$\gamma(\mathbf{x})$$ | ReLU/tanh | $$\mathbf{x} \rightarrow \gamma(\mathbf{x}) \rightarrow \mathrm{MLP} \rightarrow \mathbf{y}$$ |
| NeRF | Positional encoding of $$\mathbf{x}, \mathbf{d}$$ | ReLU | $$[\gamma(\mathbf{x}), \gamma(\mathbf{d})] \rightarrow (\sigma, \mathbf{c})$$ |
| SIREN | Every hidden layer | sine | repeated sine-activated affine maps |
| BACON | Layerwise sinusoidal filters | Hadamard-gated sine filters | filtered coordinate products across depth |

## My takeaway

If the task is a general continuous signal fit, the progression is usually:

- start from a plain coordinate MLP as the reference baseline,
- move to Fourier features or NeRF-style positional encoding when high-frequency detail is missing,
- move to SIREN when derivatives matter or periodic activations are more natural,
- move to BACON when explicit spectral control and multiscale behavior are important.

So the main architectural split in INR is not only "which MLP do we use", but rather **whether frequency is injected at the input, distributed across activations, or explicitly controlled by multiplicative filters.**

## References

- [SIREN: Implicit Neural Representations with Periodic Activation Functions](https://arxiv.org/abs/2006.09661)
- [Fourier Features Let Networks Learn High Frequency Functions in Low Dimensional Domains](https://arxiv.org/abs/2006.10739)
- [NeRF: Representing Scenes as Neural Radiance Fields for View Synthesis](https://arxiv.org/abs/2003.08934)
- [BACON: Band-limited Coordinate Networks for Multiscale Scene Representation](https://davidlindell.com/publications/bacon)
- [Multiplicative Filter Networks](https://openreview.net/forum?id=OmtmcPkkhT)
