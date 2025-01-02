---
layout: post
title: "2D Fan-Beam Tomography"
date: 2024-10-17 16:36:16
description: Notes on backprojection algorithm of fan-beam CT
tags: inverse
categories: lecture-notes
giscus_comments: true
toc:
  sidebar: left
---

## Fan-parallel rebinning methods 

to be finished..

## The filter-backproject (FBP) approach for tomographic scan

The fan-beam FBP method uses the following three steps.
1. Compute *weighted* projections for each $\beta$.
\begin{equation}
\tilde{p} (s, \beta) \triangleq p(s, \beta) \frac{w_{2\pi} (s, \beta) J(s)}{W_1 ^2 (s)}.
\end{equation}
2. Filter those weighted projections (along $s$) for each $\beta$ using the modified ramp filter
\begin{equation}
\check{p} (s, \beta) \triangleq \tilde{p} (s, \beta) * g_{*} (s),\ \forall \beta.
\end{equation}
3. Perform a weighted backprojection of those filtered projections:
\begin{equation}
f(x, y) = \int_0 ^{2\pi} \frac{1}{W_2^2 (x, y, \beta) L_{\beta} ^2 (x, y)} \check{p} (s_{\beta} (x, y), \beta) \mathrm{d} \beta.
\end{equation}