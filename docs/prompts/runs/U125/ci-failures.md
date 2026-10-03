# The CI evidence, read from the runs' logs (`gh run view --job <id> --log`)

Every recorded failure of `engine.spec.ts:156` has the same shape: the first note (C, in the long task) is judged in its window and the **second** note (D, at 869 ms, no long task near it) matches nothing.

| run | job | tree | attempt | result |
| --- | --- | --- | --- | --- |
| 36908965995 | 110526554724 (single job) | db244ac6 (U119a merged, U118b not) | first | passed |
| 36914763204 | 110563650916 (single job) | fe53873c (U119a and U118b) | first | failed: `[62, 1, true]` received as `[62, null, false]`, line 215 |
| 36914763204 | 110563650916 | fe53873c | retry #1 | failed, the same diff |
| 36930562106 | 110608851463 (shard 2/8) | 90b19bee | first | failed, the same diff |
| 36930562106 | 110608851463 | 90b19bee | retry #1 | passed (flaky) |

The diff, identical in all three failures:

```
    @@ -4,9 +4,9 @@
          0,
          true,
        ],
        Array [
          62,
    -     1,
    -     true,
    +     null,
    +     false,
        ],
      ]
      > 215 |     expect(run.notes).toEqual([
```

The two preconditions above it (lines 213–214, the long task straddling the first window) passed every time: the test's own setup held, and the judgement failed.

The full logs were not kept (2.3 MB each); the job ids above fetch them.
