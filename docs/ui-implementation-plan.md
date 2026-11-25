# DIPLabs Figma UI Implementation Plan

## Scope

Implement the existing DIPLabs React Native routes to match the approved Figma file while preserving Firebase Auth, Firestore, attendance/location validation, AI classification, permission review, and the current Expo Router structure.

## Existing screens and routes

### Existing

- `/auth/login` — Firebase login form
- `/auth/register` — Firebase registration form
- `/praktikan` — practical schedule and quick actions
- `/praktikan/[sessionId]` — session detail, attendance entry point, permission form
- `/praktikan/presensi/[sessionId]` — location validation and attendance submission
- `/praktikan/riwayat` — attendance history
- `/praktikan/izin` — permission history
- `/maps` — laboratory map and session activity
- `/asisten` — assistant dashboard and session list
- `/asisten/[sessionId]` — session detail, open/close controls, attendance preview
- `/asisten/rekap/[sessionId]` — attendance recap
- `/asisten/praktikum` — sessions, classes, participants, and laboratories management
- `/asisten/izin` — permission review

### Missing or structurally incomplete

- Figma-specific dashboard composition and bottom navigation are not implemented consistently.
- Figma-specific shared states and component variants are mostly inline styles.
- The map screen needs visual alignment with the Figma map/activity composition.
- Authentication screens need logo/branding treatment from the Figma frames.
- Assistant management forms are currently combined in one large screen rather than matching the Figma management frames.

## Components to reuse

- `src/components/asisten/SessionCard.tsx`
- `src/components/asisten/StatusBadge.tsx`
- `src/components/asisten/ConfirmActionModal.tsx`
- `src/components/praktikan/PraktikanSessionCard.tsx`
- `useAuth()` from `src/context/AuthContext.tsx`
- `useAttendance()` from `src/context/AttendanceContext.tsx`
- `usePermissions()` from `src/context/PermissionContext.tsx`
- `src/services/location.ts`
- `src/services/firestore.ts`

## Components to modify or create

### Shared

- Create shared design tokens for colors, spacing, type scale, radii, and status colors.
- Create shared `FeedbackBanner`, `EmptyState`, and `LoadingState` variants.
- Create shared button, input, screen-header, and bottom-navigation primitives only where existing screens need the same treatment.

### Praktikan

- Modify `PraktikanSessionCard` to match the Figma session card variants.
- Create or extract location status and attendance result cards.
- Create laboratory/activity cards for the map information panel.
- Align attendance history and permission status cards with their Figma variants.

### Asisten

- Modify `SessionCard` and `StatusBadge` to match the Figma variants.
- Create/extract attendance summary and attendance record row components.
- Create laboratory card/form presentation without moving Firestore logic out of the existing context.
- Create permission request card and decision button variants.
- Align confirmation modal and feedback banner with Figma states.

## Planned implementation order

1. Shared tokens and primitives.
2. Auth branding and form styling.
3. Praktikan dashboard, schedule, detail, and location attendance.
4. Praktikan map, history, and permission screens.
5. Asisten dashboard, session detail, and recap.
6. Asisten management and permission review.
7. Route-by-route visual QA and validation.

## Integration conflicts and risks

- Existing working-tree changes are present in Agent 1-owned files. UI work should avoid those files unless required for visual-only shared components.
- `AttendanceContext` and `PermissionContext` are the source of truth; screens must not add Firestore listeners or replace data with static arrays.
- Native `expo-location` and `react-native-maps` are already dependencies, but map/location behavior still requires a development build or physical device validation.
- The existing logo asset is not present under `assets/`; the Figma logo should not be regenerated. The current text branding must be replaced only after locating or confirming the repository's approved logo source.
- Firebase-backed states must remain visible in loading, empty, error, and permission-denied variants.

## Validation plan

- Run `npx tsc --noEmit` after each implementation phase.
- Run the Expo app and capture screens at the Figma viewport where the environment supports it.
- Verify login, role routing, session opening/closing, attendance validation, map loading, permission submission, and assistant review after visual changes.
- Report any screen that cannot receive device-level visual QA separately.
