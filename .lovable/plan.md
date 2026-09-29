# Smooth To-Do navigation

## Goal
Make Home → Progress and Progress → Profile feel as immediate and stable as the Notes dashboard navigation.

## Changes
- Warm the next likely To-Do screen before the user taps it, especially the heavier Progress and Profile screens.
- Keep a normal tap/click as the reliable navigation action while using touch-down only to preload the destination.
- Initialize Profile directly in To-Do mode when opened from Progress, preventing the Notes navigation from briefly appearing and then switching.
- Avoid showing stale Progress content while Profile is loading, without changing either screen’s visual design.

## Verification
- Check Home → Progress → Profile repeatedly at mobile size for one-tap response, no Progress flash, and no temporary wrong navigation bar.
- Confirm back navigation and Notes dashboard navigation remain unchanged.
- Confirm the preview build has no errors.
