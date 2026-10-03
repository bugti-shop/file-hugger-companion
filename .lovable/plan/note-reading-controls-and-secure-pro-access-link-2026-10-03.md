# Note reading controls and secure Pro access link

## What will change
- Increase the three bottom action icons to match the Notes header export icon visually.
- Make the left and right bottom capsules shorter and move them slightly closer to the bottom edge while respecting phone safe areas.
- Increase checklist text only slightly, targeting the reference wrap where “core” starts the next line on the shown phone width.
- Support a private Pro URL using the provided token. A signed-in user opening that URL receives a real Pro entitlement; signed-out visitors see a sign-in-required message.

## Security
- Store the token only as an encrypted backend secret; never place it in app source or the downloadable app bundle.
- Send the URL token directly to the backend for constant-time comparison, then immediately remove it from the visible browser URL/history.
- Keep entitlement creation server-validated and tied to the authenticated user; a client-side flag alone will not grant access.
- Keep the existing manual unlock form available when no URL token is present.

## Technical details
- Use `/premium-unlock?token=<private-token>` as the private link format.
- Update the existing premium unlock function to accept the token field with strict input validation and authenticated-user verification.
- Refresh the local subscription state only after the backend confirms entitlement creation.
- Validate the note layout, focused tests, preview build, and backend function response paths.
