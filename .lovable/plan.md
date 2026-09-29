# Live Progress data and iPhone alarms

## Progress
- Keep a lightweight in-memory snapshot of Progress task statistics so returning to the tab paints immediately.
- Refresh that snapshot whenever tasks change or the app returns to the foreground, without repeatedly loading full task media.
- Move non-visible reward/certificate work out of the first screen paint and reduce chart rendering work while scrolling.
- Preserve the current Progress layout and values.

## iPhone alarms
- Keep every reminder as a Time Sensitive iPhone notification with Flowist’s bundled sound and Snooze/Dismiss actions.
- When the notification is opened, show the existing full-screen light alarm card and loop audio while the app is foregrounded; Stop/swipe ends audio.
- Keep permission status and Settings recovery available for alerts, sound, badge, and Time Sensitive access.
- Do not attempt a Clock-style lock-screen takeover or indefinite lock-screen loop: iOS only permits those capabilities to Apple’s Clock app. Silent/DND bypass remains dependent on Apple approving the restricted Critical Alerts entitlement.

## Verification
- Exercise repeated task changes and Progress tab switches in the preview, checking current values, scroll behavior, and runtime errors.
- Validate native iOS source wiring and build health; final lock-screen notification behavior requires a rebuilt app on a physical iPhone.
