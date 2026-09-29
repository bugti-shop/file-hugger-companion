# Roadmap

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
- [x] Android full-screen alarm: light stacked-card UI, swipe-up to dismiss, 10-min snooze, Android 14+ full-screen permission check + settings prompt, direct-activity fallback
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
