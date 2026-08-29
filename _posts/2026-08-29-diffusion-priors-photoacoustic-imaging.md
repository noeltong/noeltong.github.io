---
layout: post
title: "Diffusion Priors for Photoacoustic Imaging: Promise, Constraints, and Validation"
date: 2026-08-29 10:00:00
description: A source-bounded review of diffusion priors for constrained photoacoustic reconstruction and validation
tags: inverse
categories: paper-review
toc:
  sidebar: left
---

## A learned prior is not a measurement

Diffusion models are attractive for photoacoustic reconstruction because constrained measurements can leave many image features weakly determined. In photoacoustic tomography (PAT), sparse-view acquisition uses relatively few measurements, while limited-view acquisition omits part of the angular aperture. The problems can occur together, but they are not interchangeable. Both can introduce artifacts or leave structures poorly constrained by the recorded signal (Song et al., 2023; Dey et al., 2024).

This distinction is the starting point for a careful discussion of diffusion methods. A generative model can supply learned image structure. It cannot turn that learned structure into measured truth. A plausible vessel, boundary, or functional pattern still requires evidence from the acquisition and from validation matched to the scientific task.

The same caution applies across related modalities. Photoacoustic microscopy (PAM) often faces undersampling in raster-scanned acquisition. Photoacoustic computed tomography (PACT) can face channel-count and angular-coverage limits in larger systems. The data, forward model, and target quantity differ across these settings, so a result in one should not be presented as a universal solution for all photoacoustic imaging.

## A conceptual posterior, not a universal algorithm

A useful linearized and discretized form of the reconstruction problem is

\begin{equation}
\mathbf{y} = \mathbf{H}\mathbf{x} + \mathbf{n}.
\end{equation}

Here, \(\mathbf{x}\) denotes the target image or initial-pressure representation, \(\mathbf{y}\) denotes the acquired measurements, \(\mathbf{H}\) represents the stated forward operator, and \(\mathbf{n}\) represents measurement error. Depending on the system, \(\mathbf{H}\) can encode acquisition geometry, sampling, propagation assumptions, detector response, and discretization.

A posterior formulation is

\begin{equation}
p(\mathbf{x}\mid\mathbf{y},\mathbf{H})
\propto
p(\mathbf{y}\mid\mathbf{x},\mathbf{H})\,p_{\theta}(\mathbf{x}),
\end{equation}

where \(p_{\theta}(\mathbf{x})\) denotes a learned prior. An associated conceptual reconstruction form is

\begin{equation}
\hat{\mathbf{x}} \in
\underset{\mathbf{x}}{\operatorname*{arg\,min}}
\left\{
D\left(\mathbf{y},\mathbf{H}\mathbf{x}\right)
+ \lambda\Phi_{\theta}(\mathbf{x})
\right\}.
\end{equation}

These equations describe an inverse-problem viewpoint, not a universal diffusion algorithm. A score-based sampler may use reverse-time dynamics and data-consistency updates without evaluating a normalized density or minimizing one fixed explicit function \(\Phi_{\theta}\). The notation is still useful because it identifies the two requirements that every reconstruction must negotiate: agreement with the measurements and assumptions imported through the learned prior.

The formulation also reveals a frequent failure mode. If the operator, noise model, or conditioning data do not represent the actual acquisition, a sophisticated sampler can produce a reconstruction that is internally consistent with the wrong problem. The model may look stable because the prior fills gaps, while the image remains biased relative to the physical system.

## Measurement-aware conditioning is the central design choice

The practical question is not merely whether a diffusion model was trained on relevant images. It is how the model is conditioned on the actual acquisition. Dey et al. (2024) formulate PAT reconstruction with a general linear forward matrix and incorporate measurement conditioning into score-based sampling. Song et al. (2023) combine a diffusion model with model-based iteration for sparse-view PAT. Both examples make the measurement model part of reconstruction rather than treating the task as generic image-to-image enhancement.

Tong et al. (2024) report a score-based generative-model study for sparse PAT. Comparing these studies requires care because their forward models, conditioning mechanisms, training data, and validation regimes differ.

For a measurement-aware pipeline, the conditioning information should distinguish what was acquired from what is missing. Depending on the system, that may include the forward operator, sensor pattern, angular aperture, sampling mask, noise characteristics, or a model-based intermediate reconstruction. The exact representation is method-specific. What matters is that the system assumptions are named, rather than being hidden behind a visually convincing output.

Data consistency is therefore not a decorative post-processing step. It is the mechanism that prevents the prior from freely replacing a poorly constrained measurement with a preferred image pattern. A weak data-consistency formulation can be especially misleading in limited-view settings, where the missing information has a structured relationship to anatomy and acquisition geometry.

## What the current studies support

The cited PAT studies support a narrower and more useful claim than "diffusion solves sparse reconstruction." Song et al. (2023) evaluate a diffusion-assisted, model-based strategy for sparse-view PAT with simulated and in vivo data. Dey et al. (2024) show how a score-based prior can be conditioned on a PAT forward model and test varying transducer sparsity using a simulated vascular setting. These studies motivate diffusion priors as reconstruction components for defined data regimes.

They do not establish that a learned prior will recover every unmeasured structure. In fact, Dey et al. (2024) identify hallucination under severely limited measurements and discuss variation across conditional samples as a reliability signal. That limitation is central rather than peripheral. It states that conditioning may be insufficient even when the generated result is visually coherent.

For that reason, the most informative comparison is not just diffusion versus a single neural baseline. It is a comparison under matched acquisition assumptions. The forward operator, sensor pattern, sampling density, noise setting, training distribution, and target population should be clear enough for a reader to tell whether a reconstruction gain comes from better inference, a different data regime, or an unreported change in the task.

## PAM: acceleration must be demonstrated at acquisition level

PAM highlights why reconstruction quality and acquisition acceleration should be kept separate. Loc and Unlu (2024) study reconstruction of undersampled mouse-brain microvasculature using a diffusion model. Their work shows how computational recovery can be used after fewer scan samples have been acquired, but its evidence boundary is the evaluated undersampling setting and dataset, not a general guarantee that missing microscopic detail has been measured.

The distinction is practical. An algorithm may reduce the sampling density or improve an interpolated image, yet the term "accelerated PAM" is justified only when the acquisition benefit is measured as well. Scan time, spatial sampling, exposure or signal budget, reconstructed structure, and downstream biological reliability should be considered together. A method that improves visual continuity while changing a small vessel can still be unsuitable for a morphology or functional-analysis task.

This does not make learned reconstruction inappropriate for PAM. It changes the standard of evidence. A credible study should compare against a reference acquired under an appropriate fuller-sampling protocol, report the sampling pattern, and assess the structures or quantities that matter for the intended use. A visually pleasing output is useful, but it is not the whole validation target.

## Multiparametric PACT raises the validation bar

Jeong et al. (published online in 2025; issue 2026) report a hybrid diffusion model for dynamic multiparametric three-dimensional PACT. Their study makes the hardware constraint explicit by reporting reconstruction from 256 of 1024 elements in a hemispherical array, with additional transfer experiments at 128 elements. It also evaluates structural, functional, and contrast-enhanced applications (Jeong et al., 2025; 2026 issue).

That broader target is important. A method intended for multiparametric PACT should not be validated only as a single static-image denoiser. Functional maps, contrast kinetics, dynamic changes, or other derived quantities require direct evaluation because a small reconstruction bias can be amplified when images are transformed into physiological measurements.

The study also illustrates a productive way to frame hardware-aware reconstruction: state the array and channel constraint, identify the target readout, and then test whether the reconstructed result remains useful under that exact constraint. The correct generalization boundary includes the acquisition geometry, hardware, subject or phantom population, wavelengths, and training distribution. It should not be widened automatically because an image looks realistic.

## Hallucination is a quantitative problem

Hallucination in inverse imaging is not limited to obviously implausible images. It can appear as a smooth continuation of a vessel, a plausible edge, or a biologically reasonable pattern that is not sufficiently determined by the data. The risk grows when multiple images remain compatible with the measurements and the learned prior strongly favors one of them.

Visual similarity metrics can be helpful, but they cannot by themselves establish that a reconstructed feature was present in the measurement. The validation must interrogate the link between the image and the data. A practical evaluation should include the following elements:

- Data-domain consistency under a forward model that matches the stated acquisition.
- Tests across changed noise levels, sensor patterns, sampling densities, and limited-view geometries.
- Reference experiments using appropriate phantoms, fuller measurements, or other independently acquired standards.
- Task-specific measures such as localization, morphology, functional estimates, or temporal behavior when those quantities motivate the reconstruction.
- Repeatability or conditional-sample variation analyses when the method is stochastic or the data are weakly informative.

This list is an editorial synthesis of the limitations exposed by the cited studies. It is not a claim that any one paper satisfies every criterion. Its purpose is to turn a qualitative concern about realism into falsifiable checks tied to the acquisition and to the eventual scientific use of the image.

## A defensible role for diffusion priors

The strongest case for a diffusion prior is not that it makes a reconstruction look more realistic. It is that it contributes learned structure while the reconstruction remains answerable to the measured signal. That requires measurement-aware conditioning, transparent system assumptions, and validation that tests the quantities the method is intended to support.

Sparse PAT, undersampled PAM, and multiparametric PACT are promising settings precisely because acquisition constraints are real and consequential. They also demand restraint. The central question is whether the added structures and derived measurements remain reliable under the geometry, noise, and sampling limitations that motivated the method. Treating that question as a quantitative inverse-problem test is more useful than treating diffusion as a generic image enhancer.

## References

- Song, X., Wang, G., Zhong, W., et al. (2023). *Sparse-view reconstruction for photoacoustic tomography combining diffusion model with model-based iteration*. *Photoacoustics*, 33, 100558. [https://doi.org/10.1016/j.pacs.2023.100558](https://doi.org/10.1016/j.pacs.2023.100558)
- Dey, S., Saha, S., Feng, B. T., et al. (2024). *Score-based diffusion models for photoacoustic tomography image reconstruction*. *ICASSP 2024*, 2470-2474. [https://doi.org/10.1109/ICASSP48485.2024.10447579](https://doi.org/10.1109/ICASSP48485.2024.10447579)
- Tong, S., Lan, H., Jiang, D., et al. (2024). *Enhancing sparse photoacoustic tomography reconstruction with score-based generative models*. *ISBI 2024*, 1-4. [https://doi.org/10.1109/ISBI56570.2024.10635125](https://doi.org/10.1109/ISBI56570.2024.10635125)
- Loc, I., and Unlu, M. B. (2024). *Accelerating photoacoustic microscopy by reconstructing undersampled images using diffusion models*. *Scientific Reports*, 14, 16996. [https://doi.org/10.1038/s41598-024-67957-z](https://doi.org/10.1038/s41598-024-67957-z)
- Jeong, H., Oh, S., Choi, S., et al. (2025, online; 2026 issue). *A hybrid diffusion model enhances multiparametric 3D photoacoustic computed tomography*. *Advanced Science*, 13(1), e13624. [https://doi.org/10.1002/advs.202513624](https://doi.org/10.1002/advs.202513624)
