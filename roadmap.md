# Roadmap

- [x] Whiten Notes group outer borders, reduce all strips by 9%, show only complete short previews, fix Task Detail dark surfaces and unify startup/system theme.
- [ ] Verify Task Detail and existing Notes visually with a signed-in account; requesting user's preview session unavailable.

- [x] Match Notes and Calendar lower-page backgrounds in light/Obsidian, sync active notes and deletion across both, add Calendar row dividers, vary short previews without ellipses, and follow phone dark mode with Obsidian.

- [x] Make Obsidian the free default dark palette and correct dark surfaces on task, notes, settings, habits, and matrix screens.
- [x] Fix Notes bottom icon sizing and fit approximately one more six-letter word per line.
- [x] Rotate native Focus fullscreen horizontally and stop ambient audio on Stop or exit.

- [x] Restore separate left checklist/pen and right edit controls, enlarge their icons, and make legacy note titles and checklist text consistent in reading mode.

- [x] Compact and lower Notes reading capsules, enlarge their icons and slightly enlarge checklist text; add backend-verified private Pro link redemption for signed-in users and guests without a login screen.

- [x] Match reference checklist alignment, circle/text density and bottom icon size; fix completion toggles in reading and editing modes.

- [x] Open every rich-text note in reading mode; add the reference bottom checklist/edit controls, editable checklist titles, red checked circles without strike-through, and restore the existing toolbar on edit.

- [x] Brighten the glass capsules with a faint shadow; compact the Notes editor header, move undo beside share/options, remove redo and the metadata row, and raise title/body.

- [x] Match the Notes editor header to the circular back/undo controls and borderless share/options capsule in the reference; make dashboard capsules smaller and remove their outlines.

- [x] Match the screenshot's native sans-serif type in the Notes editor without rewriting saved notes; use black glass-capsule icons in light mode and white in dark mode.

- [x] Put Notes and To-Do dashboard navigation and horizontal options dots in a matching right-aligned frosted glass capsule.

- [x] Match Notes section headings to the Flowist header typeface and sentence case; enlarge only note preview text within fixed-height strips and remove note-type icons.

- [x] Compact grouped Notes rows and headings, show a one-line content preview beside the date, tighten card typography, and preserve timestamps when a note is only opened.

- [x] Restyle all Notes cards as quiet white, rounded date-grouped rows with date and optional tags; use the reference's geometric font in cards and note content without changing surrounding controls.

- [x] Separate the To-Do Inbox chip from the search bar visibly and add the feature tutorial to Settings.

- [x] Remove the Notes selection-format strip and dashboard theme/help icons; tighten header and Inbox spacing, shrink the add glyph, and animate task entry.

- [x] Replace Notes, notebook, and task add bars with right-aligned red rounded-square buttons; relocate folder menus to the header, remove Folders labels, and tighten safe-area-aware top spacing.

- [x] Audit notification and launcher references; replace cached legacy web notification images with versioned white-background logo and monochrome badge.
- [x] Refresh Android notification resources and show the current white-background Flowist logo on reminder, focus, and alarm cards without changing launcher artwork.
- [x] Add a securely signed Codemagic AAB workflow with automatic increasing Android version codes.
- [x] Reduce the Android launcher mark further, move it to a fresh 2028 resource, and clean native builds to exclude stale icons.
- [x] Shrink the Android launcher mark again and use a fresh opaque-white resource name to defeat stale green icon caching.
- [x] Force Android push/reminder cards to refresh from the corrected white-background launcher icon and a fresh monochrome notification resource.
- [x] Make the Android launcher logo smaller again while keeping its white background and mask-safe fit.
- [x] Replace Android launcher green grid with white and use the original opaque logo at a smaller mask-safe fit.

- [x] Replace iOS App Store and Android launcher icons with the supplied white-background Flowist logo; keep native icon backgrounds opaque.
- [x] Enlarge the visible logo to a balanced fit inside the iOS and Android app icons without clipping it.
- [x] Smooth Home and Progress tab switches by removing duplicate chart work and rendering Timeline rows incrementally without changing task actions.
- [x] Make To-Do bottom navigation use Notes-style immediate pointer-down navigation, retaining keyboard activation and Profile origin.
- [x] Keep Progress statistics warm and live across tab switches while deferring secondary work to prevent scroll stalls.
- [x] Remove Progress's blocking loading screen and delay below-fold heavy cards until after the tab switch paints.
- [x] Keep iPhone alarms at Apple's maximum permitted behavior: Time Sensitive lock-screen alerts plus a looping full-screen card after opening.
- [x] Make To-Do Home → Progress → Profile navigation respond on one tap without blinking.
- [x] Show the Flowist logo instead of Android's generic info icon for all local reminders, push notifications, focus alerts, and alarm notifications.
- [x] Update iOS notification permission handling and add a Permissions screen for reminder/alarm status and device settings.
- [x] Address App Store review 3.1.2(c): make the actual recurring billed total dominant throughout the iOS purchase flow, with trial terms secondary and no unverified prices.
- [x] Complete Flowist red rebrand, logo replacement, and native splash refresh
- [x] Apply the latest Flowist logo to Android, enlarge the splash logo, and update the crowned paywall artwork
- [x] Make Timeline Board free and default, with a persistent light-red selected bottom tab
- [x] Refine active bottom-navigation icon fills and make the selected pill glide without bounce
- [x] Keep bottom navigation above Android gesture and three-button system controls using device-reported insets
- [x] Add device-local Android exact alarms with lock-screen alarm, ringtone, vibration, snooze, and reboot restoration
- [x] Add iOS Time Sensitive alarms with native scheduling, priority details, and Snooze/Dismiss actions that survive app termination
- [x] Remove email/password sign-in (sheet deleted; Google + Apple buttons remain on profile/onboarding)
- [x] CRON_SECRET saved by user via secure form
- [x] Android full-screen alarm: light stacked-card UI, swipe-up to dismiss, 10-min snooze, Android 14+ full-screen permission check + settings prompt, notification fallback when denied
- [ ] Verify alarms on real Android/iOS devices; Apple Critical Alerts entitlement must be approved before Silent/DND bypass can be signed and enabled
- [ ] Verify full-screen alarm on a real Android device after `npx cap sync` (grant full-screen permission when prompted)
- [x] Match the web Test Alarm screen to the light stacked-card Android alarm design
- [x] Remove Wake-up Challenge from Settings and Android alarm while retaining Test Alarm
- [x] Show the reminder title prominently and its exact scheduled date/time beneath it in the same light card on web and Android
- [x] Keep existing notifications while showing Android full-screen alarms for task, note, habit, and countdown reminders; animate the swipe-up cue
- [x] Use one Android alarm Activity for both locked and unlocked screens, launched by AlarmManager rather than relying on a background broadcast to open it
- [x] Fix the first-open crash caused by subscription legal links rendering before the app's navigation is available
- [x] Play real looping alarm audio with a sound-cycle progress bar on web and Android alarm cards; silence on Stop or swipe, including native Test Alarm
- [x] Give task, note, habit, countdown, extra, and focus reminders an iPhone Time Sensitive alert with bundled sound and show the light alarm card with looping audio when the app is foregrounded or opened from the alert

## Alarm UI ideas + web alarm testing (2026-09-29)
- [x] Generate 10 alarm screen concept images (logo + task, light neutral theme)
- [x] Web Test Alarm shows the in-app overlay; lock-screen testing requires a rebuilt Android app
