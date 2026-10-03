# Architecture rules

- Reuse the shared floating add control and header-action portal on Notes/Tasks/Notebooks so web and native WebViews retain identical layouts and safe-area spacing.

- Keep Android launcher layers opaque white and the original logo within the adaptive mask to avoid green backgrounds and clipping.
- Both Notes and To-Do bottom tabs navigate on pointer-down (keyboard via click) with a pending-path guard, so both dashboards feel equally instant.
- Source native subscription totals from the matching store product or offering and disable purchase until a localized price arrives; never substitute a USD estimate in the iOS paywall.
- Use Capacitor SystemBars' measured Android bottom inset together with WebView safe-area inset for `--safe-bottom`; different navigation modes and WebView versions need device-reported spacing rather than fixed heights.
- Use native Android AlarmClock intents and a device-local reboot-restorable registry alongside existing local notifications; JS timers cannot wake a killed app or locked device.
- Keep the web alarm preview and native Android alarm on the same light stacked-card design; each has a different rendering path but users should see the same alarm.
- Carry the scheduled occurrence into Android alarm intents and web alarm events; the screen must show the user's chosen date/time, not the device's current clock when it rings.
- Run Android alarm audio and vibration independently; denied full-screen access falls back to a notification, not a background launch.
- Use white-backed large and monochrome small Flowist notification icons on Android; small icons cannot show full color.
- iOS has no alarm code (no alarm plugin, extension, sound, or alarm permissions); reminders use plain local notifications — user removed alarms from iOS.
- Use Android JDK 21; sign AABs via Codemagic's `flowist_keystore`, derive versions from `CM_BUILD_NUMBER`, and never commit secrets.
- Android alarms fire via AlarmManager.setAlarmClock into FlowistAlarmReceiver, which starts the ringing service whose full-screen notification opens the alarm screen; direct Activity PendingIntents are silently blocked on Android 14+.
