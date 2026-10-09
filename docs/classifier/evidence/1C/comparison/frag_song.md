Spearman rho of each method's value with the mean listener rating, per group (measured / stimuli in group). All stimuli: label 'heard syncopation' (mean rating >= 1.0) on 92 of 111.

| method | all 111 | monorhythms, 4/4 + 6/8 (63) | 4/4 mono (27) | 6/8 mono (36) | 4/4 polyrhythm (48) |
| --- | --- | --- | --- | --- | --- |
| current detector (all kinds) | -0.07 (111/111) | 0.67 (63/63) | 0.81 (27/27) | 0.64 (36/36) | 0.41 (48/48) |
| current detector (held kinds) | -0.07 (111/111) | 0.67 (63/63) | 0.81 (27/27) | 0.64 (36/36) | 0.41 (48/48) |
| SynPy LHL | 0.71 (63/111) | 0.71 (63/63) | 0.92 (27/27) | 0.68 (36/36) | - (0/48) |
| SynPy PRS | 0.78 (63/111) | 0.78 (63/63) | 0.95 (27/27) | 0.75 (36/36) | - (0/48) |
| SynPy TMC | 0.69 (61/111) | 0.69 (61/63) | 0.92 (27/27) | 0.68 (34/36) | - (0/48) |
| SynPy SG | 0.79 (61/111) | 0.79 (61/63) | 0.90 (27/27) | 0.77 (34/36) | - (0/48) |
| SynPy KTH | 0.44 (75/111) | 0.79 (27/63) | 0.79 (27/27) | - (0/36) | -0.23 (48/48) |
| SynPy TOB | -0.43 (111/111) | 0.17 (63/63) | 0.36 (27/27) | 0.17 (36/36) | -0.09 (48/48) |
| SynPy WNBD | 0.07 (111/111) | 0.41 (63/63) | 0.41 (27/27) | 0.07 (36/36) | -0.04 (48/48) |
| AMADS WNBD (vector) | 0.31 (111/111) | 0.66 (63/63) | 0.54 (27/27) | 0.60 (36/36) | 0.27 (48/48) |
| AMADS WNBD (score file) | 0.64 (111/111) | 0.05 (63/63) | 0.52 (27/27) | nan (36/36) | 0.29 (48/48) |
| AMADS span | 0.67 (63/111) | 0.67 (63/63) | 0.85 (27/27) | 0.67 (36/36) | - (0/48) |
| Beatsearch L-H&L (hierarchical) | 0.51 (63/111) | 0.51 (63/63) | 0.76 (27/27) | 0.48 (36/36) | - (0/48) |
| Beatsearch L-H&L (equal_upbeats) | 0.47 (63/111) | 0.47 (63/63) | 0.74 (27/27) | 0.49 (36/36) | - (0/48) |

Presence against the label on the 63 monorhythms (all stimuli the method measured there): precision, recall, AUC of the value against the label, Pearson r. The label is 'heard syncopation' on those stimuli: 44 of 63.

| method | measured | precision | recall | AUC | Pearson r |
| --- | --- | --- | --- | --- | --- |
| current detector (all kinds) | 63/63 | 0.82 | 0.82 | 0.76 | 0.63 |
| current detector (held kinds) | 63/63 | 0.82 | 0.82 | 0.76 | 0.63 |
| SynPy LHL | 63/63 | 0.83 | 0.86 | 0.84 | 0.70 |
| SynPy PRS | 63/63 | 0.76 | 1.00 | 0.89 | 0.77 |
| SynPy TMC | 61/63 | 0.84 | 0.86 | 0.81 | 0.63 |
| SynPy SG | 61/63 | 0.83 | 1.00 | 0.87 | 0.74 |
| SynPy KTH | 27/63 | 0.74 | 1.00 | 0.86 | 0.72 |
| SynPy TOB | 63/63 | 0.75 | 0.07 | 0.54 | 0.13 |
| SynPy WNBD | 63/63 | 0.79 | 0.86 | 0.70 | 0.43 |
| AMADS WNBD (vector) | 63/63 | 0.79 | 0.86 | 0.79 | 0.68 |
| AMADS WNBD (score file) | 63/63 | 0.67 | 0.18 | 0.50 | 0.15 |
| AMADS span | 63/63 | 0.82 | 0.82 | 0.78 | 0.58 |
| Beatsearch L-H&L (hierarchical) | 63/63 | 0.77 | 0.61 | 0.65 | 0.48 |
| Beatsearch L-H&L (equal_upbeats) | 63/63 | 0.83 | 0.45 | 0.63 | 0.39 |

Same, all 111 stimuli (polyrhythms included where the method measured them).

| method | measured | precision | recall | AUC | Pearson r |
| --- | --- | --- | --- | --- | --- |
| current detector (all kinds) | 111/111 | 0.85 | 0.49 | 0.56 | -0.01 |
| current detector (held kinds) | 111/111 | 0.85 | 0.49 | 0.56 | -0.01 |
| SynPy LHL | 63/111 | 0.83 | 0.86 | 0.84 | 0.70 |
| SynPy PRS | 63/111 | 0.76 | 1.00 | 0.89 | 0.77 |
| SynPy TMC | 61/111 | 0.84 | 0.86 | 0.81 | 0.63 |
| SynPy SG | 61/111 | 0.83 | 1.00 | 0.87 | 0.74 |
| SynPy KTH | 75/111 | 0.93 | 1.00 | 0.91 | 0.54 |
| SynPy TOB | 111/111 | 0.75 | 0.03 | 0.35 | -0.39 |
| SynPy WNBD | 111/111 | 0.90 | 0.93 | 0.66 | 0.13 |
| AMADS WNBD (vector) | 111/111 | 0.90 | 0.93 | 0.77 | 0.34 |
| AMADS WNBD (score file) | 111/111 | 0.93 | 0.61 | 0.75 | 0.57 |
| AMADS span | 63/111 | 0.82 | 0.82 | 0.78 | 0.58 |
| Beatsearch L-H&L (hierarchical) | 63/111 | 0.77 | 0.61 | 0.65 | 0.48 |
| Beatsearch L-H&L (equal_upbeats) | 63/111 | 0.83 | 0.45 | 0.63 | 0.39 |
