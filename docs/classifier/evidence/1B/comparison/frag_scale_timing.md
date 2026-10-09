**Runtime per item, one process, 39 items spread over the catalogue (milliseconds: mean / median / max).** Measured on this machine, nothing else running from this script.

| step | ms per item |
| --- | --- |
| project score reader (partitura) | 166.8 / 102.7 / 784.7 |
| key detection (`H.analyse`, whole analysis) | 133.5 / 88.4 / 532.1 |
| current detector, naming only (`item_name`) | 0.1 / 0.1 / 0.1 |
| music21 `converter.parse` (to get the score's spelling) | 66.3 / 31.3 / 341.8 |
| music21 `deriveRanked`, 13 scale classes, 12 results each | 387.1 / 390.4 / 633.5 |