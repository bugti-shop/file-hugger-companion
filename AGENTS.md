# Architecture rules

- Both Notes and To-Do bottom tabs navigate on pointer-down (keyboard via click) with a pending-path guard, so both dashboards feel equally instant.
- Source native subscription totals from the matching store product or offering and disable purchase until a localized price arrives; never substitute a USD estimate in the iOS paywall.
- Use Capacitor SystemBars' measured Android bottom inset together with WebView safe-area inset for `--safe-bottom`; different navigation modes and WebView versions need device-reported spacing rather than fixed heights.
- Use native Android AlarmClock intents and a device-local reboot-restorable registry alongside existing local notifications; JS timers cannot wake a killed app or locked device.
- Keep the web alarm preview and native Android alarm on the same light stacked-card design; each has a different rendering path but users should see the same alarm.
- Carry the scheduled occurrence into Android alarm intents and web alarm events; the screen must show the user's chosen date/time, not the device's current clock when it rings.
- Let Android AlarmManager launch the same alarm Activity directly at fire time; background broadcasts cannot reliably open an Activity on modern Android, while the foreground alarm notification remains a fallback.
- Run Android alarm audio and vibration independently; denied full-screen access falls back to a notification, not a background launch.
- Use the same Flowist icon for Android local, push, focus, and alarm notifications; the local plugin otherwise falls back to a generic info icon.
- iOS has no alarm code (no alarm plugin, extension, sound, or alarm permissions); reminders use plain local notifications — user removed alarms from iOS.