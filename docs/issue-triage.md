# Issue Triage

Issues are for reproducible work. Discussions are for questions, tuning, early ideas, and open-ended integration help.

This split keeps the lab calm. A noisy issue tracker hides real defects.

## Reporter Rule

Open an issue when you can provide:

- exact steps to reproduce;
- source type and frame mode;
- preset JSON when optical settings matter;
- browser, browser version, OS, and GPU;
- screenshot, clip, or console error when relevant;
- expected result and actual result.

If you cannot provide those yet, start in Discussions.

If the reporter only knows that something is broken, they can use `Simple bug report`.
That template still marks the issue as `bug` and `needs-triage`, but asks in plain language.

## Maintainer Triage Flow

1. Confirm the issue uses the right template.
2. Check whether reproduction steps are complete.
3. Check whether preset JSON is present for optical problems.
4. Check whether browser/GPU context is present.
5. Label the issue by area and state.
6. Ask for missing evidence once.
7. Move broad questions to Discussions.
8. Close issues that cannot be reproduced after reasonable follow-up.

Simple bug reports should be treated gently. If the report has a real signal but lacks technical detail, add `needs-reproduction`, `needs-browser-info`, or `needs-preset` and ask one focused question.

## Labels

Area labels:

- `area:shader`
- `area:export`
- `area:integration`
- `area:settings`
- `area:source`
- `area:ui`
- `area:docs`
- `area:ci`

State labels:

- `needs-triage`
- `needs-reproduction`
- `needs-preset`
- `needs-browser-info`
- `confirmed`
- `planned`

Specific labels:

- `visual-artifact`
- `performance`
- `browser-specific`
- `gpu-specific`
- `regression`

## Severity

Use priority sparingly:

- `priority:critical`: build broken, CI broken, security issue, or release-blocking renderer failure.
- `priority:high`: major feature path broken, export path unusable, default demo broken.
- `priority:normal`: reproducible bug with workaround.
- `priority:low`: polish, edge case, documentation mismatch.

## Closing Rules

Close as not actionable when:

- there are no reproduction steps;
- no preset is provided for an optical artifact;
- the report is only a tuning preference;
- the report asks for a broad redesign without acceptance criteria;
- the issue is actually a support question.

When closing, leave a short path:

```text
This is not actionable as an issue yet. Please continue in Discussions with a screenshot, preset JSON, browser, and GPU.
```

## Release Connection

Ask about a release when a fixed issue changes public behavior:

- shader output;
- preset contract;
- export behavior;
- integration handoff;
- security/dependency posture;
- README/docs that affect public adoption.

Do not release for every triage edit.
