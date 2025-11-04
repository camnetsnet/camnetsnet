---
title: "Silly beans"
date: 2025-11-30
time: ["17:00", "18:00"]
link: "http://localhost:1313/events/"
location: ["Trinity College Cambridge", "Ordinary Combination Room"]
speaker: "Joe Bacchus George"
affiliation: ["Trinity College Cambridge","Probabilistic Systems, Information and Inference Group"]
---

Combinatorial optimization problems remain ubiquitous in industry and science. Recently, deep
learning approaches have been motivated as heuristics for such problems. Although promising results
appear in restricted settings, most still struggle to overcome classical algorithms in both quality and
time taken to produce solutions. Likewise, loopy belief propagation has been used as a heuristic
for optimization, but tends to remain uncompetitive in solution quality against other strategies
like Monte Carlo on general graphs. In this work, we combine a graph neural network acting on
the non-backtracking matrix with the sum-product algorithm, as a means to approximately solve
quadratic unconstrained binary optimization problems. This fully unsupervised model is trained on
distributions of smaller graphs, and learns to improve the sum-product message passing equations
under a particular optimization problem on unseen larger graph instances. We find that the method
offers improvements surpassing the quality of hand-crafted approaches to refining belief propagation.