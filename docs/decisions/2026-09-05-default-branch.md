# Decision: default/deployment branch is `claude/piano-teaching-app-bo19td`, not `main`

`docs/01-architecture.md` §9 and `docs/06-build-plan.md` say workflows trigger "on push to
`main`". This repository has no `main` branch — GitHub's HEAD/default branch is
`claude/piano-teaching-app-bo19td` (confirmed via `git remote show origin`). `ci.yml` and
`pages.yml` therefore trigger on push to `claude/piano-teaching-app-bo19td` (and on PRs
targeting it) instead of `main`. If the owner later renames the default branch to `main`,
update the `on:` blocks in both workflow files accordingly — everything else is unaffected.
