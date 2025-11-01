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

### 🔴 Sermon Editor Not Functional Offline

- **Platform:** iOS/Android
- **Description:** The sermon editor fails to load when the mobile app is offline because it depends on loading CKEditor from a CDN. Users cannot create or edit sermons without internet connectivity, breaking the app's offline-first design.
- **Reproduction:**
  1. Put device in airplane mode or disconnect from internet
  2. Open the app and navigate to create/edit a sermon
  3. Editor fails to load with "CKEditor failed to load" error
  4. Expected: Editor should work offline with full rich text editing capabilities
  5. Actual: Editor completely fails to initialize, preventing sermon editing
- **Status:** Not fixed
- **Priority:** High
- **Assigned:** TBD
- **Date Reported:** 2025-01-27
- **Additional Notes:**
  - Root cause: Both `CKEditorMobile.tsx` and `CKEditorWeb.tsx` load CKEditor from `https://cdn.ckeditor.com/ckeditor5/40.2.0/super-build/ckeditor.js`
  - The app has robust offline data storage (SQLite) but the editor component breaks offline functionality
  - Solution: Download and bundle CKEditor JavaScript file locally in assets
  - This affects core functionality and contradicts the app's offline-first architecture
  - High impact on user experience as sermon editing is a primary feature

---

## Medium Priority

---

## Low Priority

*No low priority bugs currently reported*

---

## Fixed Bugs

### 🟢 Android Landscape Mode Not Responsive

- **Platform:** Android
- **Description:** App layout doesn't adapt properly when device is rotated to landscape mode on Android. Layout remains in portrait orientation even when device is rotated.
- **Reproduction:**
  1. Open the app on Android device
  2. Rotate device to landscape mode
  3. Layout doesn't adapt - remains in portrait layout
  4. Expected: Layout should be responsive and adapt to landscape orientation
  5. Actual: Layout stays in portrait mode, not utilizing landscape screen space
- **Status:** Fixed
- **Priority:** Medium
- **Assigned:** TBD
- **Date Reported:** 2025-01-27
- **Date Fixed:** 2025-01-27
- **Solution:** Changed `"orientation": "portrait"` to `"orientation": "default"` in `app.json` to allow automatic rotation between portrait and landscape modes on all devices.

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
