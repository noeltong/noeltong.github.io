---
layout: post
title: "Inverse Problems in Imaging: Forward Models, Regularization, and Tomographic Reconstruction"
date: 2026-08-29 09:00:00
description: A technical introduction to forward models, regularized estimation, resolution-noise trade-offs, and analytical tomography
tags: inverse
categories: lecture-notes
toc:
  sidebar: left
---

## Imaging starts with what was measured

An image reconstruction problem starts with an acquisition, not an image. A detector records data that have been transformed by a physical system and corrupted by uncertainty. Image reconstruction asks which object could have produced those data under a stated model. Fessler (2024) uses image restoration to introduce this viewpoint because the same ideas extend naturally to tomographic reconstruction.

A useful discrete model is

\begin{equation}
\mathbf{y} = \mathbf{A}\mathbf{x} + \boldsymbol{\varepsilon}.
\end{equation}

Here, \(\mathbf{x}\) is the unknown image, \(\mathbf{y}\) is the measured data, \(\mathbf{A}\) represents acquisition geometry and image formation, and \(\boldsymbol{\varepsilon}\) represents measurement error. The equation is deliberately compact. It makes the forward operator and the noise model visible as separate choices, so either one can be tested and revised.

This separation matters in practice. A method can have an excellent optimizer yet still reconstruct a biased image if \(\mathbf{A}\) omits a relevant detector, motion, propagation, or sampling effect. Likewise, a correct geometric model does not specify how strongly noisy data should be trusted. The reconstruction problem is therefore both physical and statistical (Fessler, 2024).

## Why the inverse is difficult

The forward map sends an image to data. The inverse problem asks for an image from those data. It becomes ill posed when a solution does not exist for the observed data, when more than one image explains the data, or when the solution is unstable. The last case has a particularly visible consequence: a small perturbation in the measurements can cause a large change in a naive inverse.

Discretization does not remove this difficulty. It usually exposes it through poorly constrained directions in the system matrix. Two candidate images may differ mostly along a direction that produces almost the same measurement vector. Noise then determines which candidate a direct inverse favors. Sparse sampling, incomplete angular coverage, detector blur, and bandwidth limits can all make this ambiguity more consequential.

That is why an inverse reconstruction should not be described simply as "undoing" the forward model. The measured data constrain the answer, but they may not constrain every image feature equally. A serious reconstruction method must say how it treats the weakly constrained features.

## Data fidelity and the MAP view

A likelihood model turns the forward model into a data-fidelity term whose form should match the assumed measurement statistics (Fessler, 2024). A standard penalized-likelihood estimator is

\begin{equation}
\hat{\mathbf{x}} \in
\underset{\mathbf{x}\in\mathcal{C}}{\operatorname*{arg\,min}}
\left\{
-\log p(\mathbf{y}\mid\mathbf{x}) + \beta R(\mathbf{x})
\right\},
\end{equation}

where \(\mathcal{C}\) collects any explicit constraints, \(R(\mathbf{x})\) is a regularizer, and \(\beta \geq 0\) sets its weight. The negative log-likelihood penalizes disagreement with the measurements. The regularizer expresses a structural preference among candidate images that fit the data to different degrees.

If

\begin{equation}
p(\mathbf{x}) \propto \exp\left[-\beta R(\mathbf{x})\right]
\end{equation}

defines a proper, normalizable prior, the estimator has a maximum-a-posteriori (MAP) interpretation, up to terms independent of \(\mathbf{x}\). This link is useful because it states the two sources of information directly: the likelihood comes from the acquisition model, while the prior encodes expectations about the image (Fessler, 2017; Fessler, 2024).

The same equation should not be used mechanically across modalities. Gaussian noise can motivate a weighted least-squares data term, whereas count data can motivate a Poisson likelihood. Fessler (2024) develops both examples. The practical lesson is simple: the data term is a modeling decision, not a default loss function chosen after the data have been collected.

## Regularization makes assumptions inspectable

Regularization does not create information from nowhere. It balances data fit with an explicit structural preference. That is a strength, not a defect, provided the preference is named and evaluated rather than hidden inside a reconstruction pipeline.

Quadratic roughness penalties favor smoothly varying images and are analytically convenient. Their weakness is equally clear: if the penalty is too strong, a sharp boundary can be smoothed because the estimator treats it as costly variation. Nonquadratic edge-preserving penalties and total-variation-style penalties can penalize large neighboring differences less severely than quadratic roughness penalties, helping retain edges when that assumption is appropriate (Fessler, 2017).

Fessler's regularization chapter also discusses sparsity-based and other structured penalties. These are not interchangeable stylistic choices. A roughness penalty is reasonable when the target is expected to vary smoothly away from boundaries. A sparsity penalty is reasonable only after specifying the domain in which the target should be sparse. A side-information or multichannel penalty requires an equally explicit account of how the auxiliary information relates to the target.

The right question is therefore not "Which regularizer is best?" It is "Which image properties are scientifically and physically defensible for this acquisition, and what bias will that choice introduce?" The regularizer, its parameters, and its failure cases belong in the method description (Fessler, 2017).

## Resolution, noise, and the role of \(\beta\)

The scalar \(\beta\) controls the balance between likelihood fit and regularization. Increasing it gives the regularizer more influence relative to the data. For many estimators, that makes the result visually quieter while also changing spatial resolution and feature contrast.

This is the resolution-noise trade-off. Suppressing high-frequency variation can reduce visible noise, but a quieter image alone does not establish that every visible feature is better supported by the data. The same setting can retain broad structures while attenuating small lesions, edges, or texture. Fessler (2024) treats resolution and noise properties as quantities to analyze, not merely as visual impressions.

Parameter selection is therefore part of the reconstruction problem. Fessler (2017) reviews discrepancy-based, predictive-risk, cross-validation, likelihood-based, and L-curve approaches. Such rules can organize a choice of \(\beta\), but none can repair a mismatched forward model or a prior that excludes relevant structure.

For a task-driven study, the evaluation should reflect the intended use. A denoising parameter selected for visual smoothness is not necessarily appropriate for detecting a small target, estimating an edge location, or measuring a kinetic feature. Reporting the data term, regularizer, parameter-selection rule, and relevant resolution-noise behavior together makes that decision auditable.

## Analytical tomography and filtered backprojection

Analytical tomography gives a useful reference point because its assumptions and consequences can be written explicitly. In ideal two-dimensional parallel-beam tomography, the Radon transform maps an object \(f\) to line-integral projections

\begin{equation}
p_{\phi}(r) = \int_{\mathbb{R}^{2}}
f(x,y)\,\delta\left(r-x\cos\phi-y\sin\phi\right)\,\mathrm{d}x\,\mathrm{d}y.
\end{equation}

For complete, ideally sampled parallel-beam data, filtered backprojection (FBP) first filters every projection with the ramp response

\begin{equation}
\check{p}_{\phi}(r) =
\mathcal{F}^{-1}\left\{
|\nu|\,\mathcal{F}\left[p_{\phi}\right](\nu)
\right\}(r),
\end{equation}

then backprojects the filtered projections,

\begin{equation}
\hat{f}_{\mathrm{FBP}}(x,y) =
C_{\mathcal{F}}
\int_{0}^{\pi}
\check{p}_{\phi}\left(x\cos\phi+y\sin\phi\right)
\,\mathrm{d}\phi.
\end{equation}

The constant \(C_{\mathcal{F}}\) depends on the Fourier-transform convention. The point of the equations is not the convention. It is the division of labor: the ramp filter corrects the smoothing implicit in ordinary backprojection, and the backprojection places the filtered values along their corresponding lines (Fessler, 2021).

The ramp response also emphasizes high-frequency noise. In a discrete implementation, sampling and filtering choices can introduce aliasing artifacts. Apodization can reduce that amplification, but it also changes the effective resolution. Fessler (2021) treats these effects as part of the reconstruction design rather than incidental implementation details.

FBP is exact only within its idealized model. Its importance extends beyond that special case. It gives a fast approximate reconstruction, exposes the effects of geometry and sampling, and can provide intuition or an initialization for later iterative reconstruction. These roles remain valuable even when the final imaging system requires a richer physical or statistical model (Fessler, 2021).

## Analytical and iterative methods answer different questions

Analytical and iterative reconstruction should not be treated as opposing ideologies. An analytical method can be the right answer when the acquisition geometry, sampling, and noise regime closely match the derivation. An iterative method can incorporate a more detailed forward model, a likelihood, constraints, and a regularizer, but it also inherits the risks of those additional assumptions.

A fair comparison asks several questions. Which structures are directly supported by the measurements? Which are stabilized by a prior? How do results change under altered noise, sampling, or geometry? Does a method's apparent gain remain when the forward model is perturbed in a realistic way? Those questions place the emphasis on reliability rather than on a single attractive image.

The central discipline for imaging researchers is to state the forward model, data fidelity, regularizer, parameter-selection rule, and task-relevant resolution-noise behavior together. Analytical tomography remains valuable as a benchmark and source of intuition. Regularized estimation supplies a general language for making assumptions visible, testable, and revisable.

## References

- Fessler, J. A. (2024). *Image Restoration*, Chapter 1 of *Image Reconstruction: Algorithms and Analysis*. [Source PDF](https://web.eecs.umich.edu/~fessler/book/c-restore.pdf). No DOI metadata is supplied by the source.
- Fessler, J. A. (2017). *Regularization*, Chapter 2 of *Image Reconstruction: Algorithms and Analysis*. [Source PDF](https://web.eecs.umich.edu/~fessler/book/c-reg.pdf). No DOI metadata is supplied by the source.
- Fessler, J. A. (2021). *Analytical Tomographic Image Reconstruction Methods*, Chapter 3 of *Image Reconstruction: Algorithms and Analysis*. [Source PDF](https://web.eecs.umich.edu/~fessler/book/c-tomo.pdf). No DOI metadata is supplied by the source.
