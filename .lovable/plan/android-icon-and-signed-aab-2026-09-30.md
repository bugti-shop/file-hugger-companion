# Android icon and signed AAB

## Changes
- Regenerate Android launcher artwork with a smaller centered Flowist mark on an opaque white background.
- Use a new launcher resource name and app version so Android cannot reuse the old green cached icon.
- Keep push, reminder, focus, and alarm notifications on the dedicated monochrome Flowist notification icon.
- Add a Codemagic signed AAB workflow that reads the keystore and passwords only from Codemagic's secure storage.
- Make each Android build's version code increase automatically from Codemagic's build number.

## Secure setup required from you
- Upload the keystore directly in Codemagic and save its passwords/alias as protected variables.
- Do not send the keystore or passwords in chat.

## Verification
- Check every Android icon layer remains opaque white and mask-safe.
- Check the web build diagnostics and Android configuration references.
