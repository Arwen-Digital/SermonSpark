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
- **Status:** Not fixed
- **Priority:** High
- **Assigned:** TBD
- **Date Reported:** 2025-09-27

---

## Medium Priority

### 🟡 Screen Turns Off in Tablet Pulpit Mode
- **Platform:** Tablet
- **Description:** When on tablet in pulpit mode, screen should be prevented from turning off
- **Reproduction:**
  1. Open app on tablet device
  2. Switch to pulpit mode
  3. Screen turns off after timeout period
  4. Expected: Screen should stay on during pulpit mode
- **Status:** Not fixed
- **Priority:** Medium
- **Assigned:** TBD
- **Date Reported:** 2025-01-27

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