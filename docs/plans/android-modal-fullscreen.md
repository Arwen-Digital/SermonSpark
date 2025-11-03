## Goal

On Android the modal used by various research pages (topic explorer, historical context, language study, illustration finder, outline generator, etc.) currently opens only to ~50% height. The modal should present a near full-screen sheet (similar space available on iOS) so users have more space for reading and interacting with generated text.

## Quick summary of proposed approach

- Verify and reproduce the issue on an Android emulator/device; capture screenshots and logs.
- Inspect modal implementations and styles (there are repeated styles: `resultOverlay`, `resultModalContent`, `resultModalContentSheet`, etc.).
- Apply a minimal, low-risk fix: adjust modal sheet style to allow greater height on Android (platform-specific `maxHeight`/`height` or `alignSelf: 'stretch'`) and ensure the overlay / container `justifyContent` doesn't limit the sheet placement. Prefer a shared style helper so fixes are consistent across pages.
- Test on Android and iOS; add a short QA checklist and optional e2e or snapshot test.

## Contract (inputs / outputs / success criteria)

- Inputs: Android device/emulator, the app running locally, one of the research pages that triggers the modal.
- Outputs: Modal opens to at least ~90% of screen height on Android, leaving only the status bar and a small safe area visible. Behavior on iOS remains unchanged.
- Success criteria: On Android the sheet displays nearly full-screen, text area is comfortably large, no layout regressions (keyboard, safe area, or status bar overlap). Existing flows that rely on current modal behavior continue working.

## Likely root causes (hypotheses)

1. Styles include `maxHeight: '85%'` (or similar) in `resultModalContent` which artificially caps the height.
2. The overlay container uses `justifyContent: 'flex-end'`, which positions a sheet at the bottom; combined with `maxHeight`, results in ~50% visual height.
3. iOS-only `presentationStyle` (e.g., `pageSheet`) or platform-specific modal behaviors result in different default heights.
4. Wrapping `KeyboardAvoidingView`, `SafeAreaView`, or parent containers with fixed heights may be constraining layout on Android.

## Files likely impacted / to inspect

- app/research/topic-explorer.tsx
- app/research/historical-context.tsx
- app/research/original-language-study.tsx
- app/research/illustration-finder.tsx
- app/research/outline-generator.tsx
- app/research/blog-post-ideas.tsx (and other research pages using same pattern)

These files include duplicate modal styles (see `resultOverlay`, `resultModalContent`, `resultModalContentSheet`, `resultModalHeader`, `resultScroll`, etc.).

## Proposed minimal code changes (examples)

1) Create a small shared style helper (recommended):

   - File: `app/research/modal-styles.ts` (or `components/ResultModalStyles.ts`)
   - Export platform-aware styles:

```ts
// pseudocode outline (actual patch to be implemented in code)
const modalMaxHeightAndroid = isAndroid ? '95%' : '85%';

resultModalContent: {
  ...baseSheetStyles,
  maxHeight: modalMaxHeightAndroid,
  alignSelf: 'stretch',
},

resultOverlay: {
  flex: 1,
  justifyContent: 'flex-start', // or 'center' depending on UX — 'flex-start' lets sheet grow from top
  backgroundColor: 'rgba(0,0,0,0.45)'
}

```

2) If a shared file is not desirable, make a smaller per-file patch by changing `maxHeight: '85%'` to `maxHeight: Platform.OS === 'android' ? '95%' : '85%'` on the `resultModalContent` / `resultModalContentSheet` style and set `alignSelf: 'stretch'`.

3) Confirm `presentationStyle` usage: where `presentationStyle` is set to `'pageSheet'` for iOS, ensure Android uses `'overFullScreen'` or similar. The code already uses a ternary in many pages; make sure Android path results in a full overlay.

4) Check for `justifyContent: 'flex-end'` in `resultOverlay`. If the overlay uses `flex-end` and the sheet has a maxHeight smaller than expected, consider switching to `flex-start` or to centering and letting the sheet itself be full-height.

5) Consider Keyboard behavior: If modals are wrapped in a `KeyboardAvoidingView`, ensure it's configured for Android (behavior: 'height' or 'padding') to avoid further shrinking of the sheet when keyboard is present.

## Tests & QA

- Manual QA steps (fast):
  1. Build/run app on Android emulator (API 29+) and iOS simulator.
  2. Open one of the research tools and trigger the modal. Observe height.
  3. Verify text area is significantly larger and usable.
  4. Test with soft keyboard open to ensure content is still visible (no clipping).
  5. Test on a small phone (e.g., 360 wide) and a large tablet.

- Automated: If the project has e2e tests (Detox or Playwright), add a simple test that opens the page, triggers modal and takes a screenshot — assert the modal occupies >80% of screen height. If not feasible, add a visual snapshot/storybook story to prevent regressions.

## Rollback plan

- If regressions occur, revert to previous styles and open a follow-up to try an alternate approach (e.g., adopting a community BottomSheet component such as `@gorhom/bottom-sheet`). Keep changes small and isolated to a single file to make rollback simple.

## Follow-ups / Improvements

- Consolidate repeated modal styles across research pages to a single shared module.
- Replace ad-hoc modal code with a maintained bottom-sheet library to get consistent platform behavior and accessibility features.

## Timeline estimate

- Investigation & reproduction: 1–2 hours
- Implement minimal fix & quick local tests: 1–2 hours
- Cross-device QA and minor tweaks: 1–2 hours
- Add tests & PR: 1–3 hours

Total: 4–9 hours depending on thoroughness and whether a shared refactor is chosen.

## Notes / assumptions

- Assumed modal implementations follow the same style patterns (based on attached research pages). If there are custom wrappers, adjust plan accordingly.
- Assumed access to an Android emulator or device. If you prefer, I can implement the code changes and run a basic validation locally in this environment if you want me to follow up with code edits.

---

Prepared by: automated plan generator
Date: 2025-11-02

## Planned tasks / Checklist

- [ ] Analyze modal implementations
  - Search and inspect modal/result sheet implementations used by the research pages (e.g., `topic-explorer.tsx`, `historical-context.tsx`, `original-language-study.tsx`, `illustration-finder.tsx`, `outline-generator.tsx`, etc.). Identify style patterns (e.g., `resultOverlay`, `resultModalContent`, `resultModalContentSheet`) and where Platform-specific `presentationStyle` is used.
- [ ] Reproduce issue on Android
  - Run the app on an Android emulator/device, open one of the research pages that displays a modal and confirm the modal stops at ~50% height. Capture screenshot and record logs if needed.
- [ ] Identify root cause
  - Check whether the modal height is constrained by style (e.g., `maxHeight: '85%'`), container `justifyContent` (`flex-end`), `presentationStyle` differences, or a wrapping `SafeAreaView`/`KeyboardAvoidingView` behavior on Android.
- [ ] Plan minimal fix
  - Decide on a minimal, low-risk fix: either (A) make modal sheet height larger on Android by adjusting `maxHeight` / `alignSelf` / `height` or (B) centralize modal styles into a shared component and ensure Android gets a full-height variant. Prepare proposed code changes and small diffs for review.
- [ ] Implement changes
  - Implement the chosen fix in the codebase. Prefer a single shared style file (e.g., `components/ResultModalStyles.ts`) or small platform-guards in existing styles. Update all affected files to import the shared styles and remove duplicated style blocks where practical.
- [ ] Test on Android and iOS
  - Run the app on Android emulator and iOS simulator, verify modal expands to near full-screen on Android and unchanged on iOS. Capture screenshots and ensure no visual regressions (keyboard, status bar, safe area).
- [ ] Add regression tests / CI checks
  - Add minimal automated checks if possible (e.g., storybook snapshot or an e2e test that asserts modal height or screenshot). Document manual QA steps otherwise.
- [ ] Create PR with description & rollback plan
  - Open a branch, commit changes, run lint/tests, and create a PR describing the root cause, fix, files changed, and rollback steps in case of regressions.
