# Known Bugs

This file tracks bugs that need to be addressed in future releases.

## High Priority

### 🔴 Sermon Editor Crashes on Android

- **Platform:** Android
- **Description:** The sermon editor crashes when opened on Android devices
- **Reproduction:**
  1. Open the app on Android
  2. Navigate to create/edit a sermon
  3. App crashes
- **Status:** Fixed
- **Priority:** High
- **Assigned:** TBD
- **Date Reported:** 2025-09-27

---

## Medium Priority

### 🟡 Android Landscape Mode Not Responsive

- **Platform:** Android
- **Description:** App layout doesn't adapt properly when device is rotated to landscape mode on Android. Layout remains in portrait orientation even when device is rotated.
- **Reproduction:**
  1. Open the app on Android device
  2. Rotate device to landscape mode
  3. Layout doesn't adapt - remains in portrait layout
  4. Expected: Layout should be responsive and adapt to landscape orientation
  5. Actual: Layout stays in portrait mode, not utilizing landscape screen space
- **Status:** Not fixed
- **Priority:** Medium
- **Assigned:** TBD
- **Date Reported:** 2025-01-27
- **Additional Notes:**
  - iOS landscape mode works correctly
  - Root cause: `app.json` has `"orientation": "portrait"` which locks orientation
  - Affects all screens but particularly noticeable in sermon editor and home screen
  - Requires updating orientation configuration and implementing responsive layouts
  - WebView-based components (CKEditor) may need special handling for orientation changes

---

## Low Priority

*No low priority bugs currently reported*

---

## Fixed Bugs

*No fixed bugs yet*

---

## Bug Report Template

When adding new bugs, please use this format:

```markdown
### 🔴/🟡/🟢 Bug Title
- **Platform:** iOS/Android/Web/All
- **Description:** Brief description of the issue
- **Reproduction:**
  1. Step 1
  2. Step 2
  3. Expected vs actual behavior
- **Status:** Not fixed/In progress/Fixed
- **Priority:** High/Medium/Low
- **Assigned:** Developer name or TBD
- **Date Reported:** YYYY-MM-DD
- **Additional Notes:** Any relevant details, error logs, etc.
```

**Priority Levels:**

- 🔴 **High:** Crashes, data loss, core functionality broken
- 🟡 **Medium:** Feature doesn't work as expected, workaround exists
- 🟢 **Low:** Minor UI issues, enhancement requests
