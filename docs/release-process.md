# Release Process

Liquid Prnc Glass releases should be deliberate. A release is a public checkpoint, not a habit after every small edit.

## When To Ask About A Release

An agent should ask whether to prepare a release when work includes one of these:

- a visible optical behavior change;
- a new shader setting or changed preset contract;
- a new export, recording, or integration path;
- a meaningful documentation and presentation upgrade;
- a dependency/security update that affects public users;
- a completed milestone from the roadmap;
- an explicit user request for a release.

Do not ask for a release after tiny typo fixes, small copy edits, local-only scripts, or internal cleanup with no public meaning.

## Release Quality Bar

Before releasing:

1. Run `npm run test`.
2. Run `npm run build`.
3. Confirm GitHub Actions CI is green.
4. Confirm README still renders cleanly.
5. Confirm release notes explain what changed and why it matters.
6. Attach visual assets when the release includes visual or presentation changes.
7. Keep release assets rights-safe and lightweight.

## Release Style

Release notes should be concise and polished.

Use:

- one short ASCII mark;
- a clear `What This Release Is` section;
- highlights;
- visual proof assets;
- checks;
- honest known limits.

Avoid:

- hype without substance;
- claims like production-ready unless proven;
- long walls of text;
- release notes without screenshots for visual changes;
- releasing every small commit.

## Suggested Command Flow

```bash
npm run test
npm run build
gh run list --repo i4w7w4a/Liquid_Prnc_Glass --limit 3
gh release create vX.Y.Z --title "Liquid Prnc Glass vX.Y.Z" --notes-file release-notes.md
```

Attach assets:

```bash
gh release upload vX.Y.Z assets/readme/hero.gif assets/readme/hero-still.png assets/readme/compare-clean-vs-glass.png
```

## Versioning

Use simple semantic versioning:

- patch: docs polish, small fixes, minor preset/export corrections;
- minor: new controls, new export behavior, new integration path;
- major: breaking preset contract or renderer architecture change.

Current first release target:

```text
v0.2.0
```
