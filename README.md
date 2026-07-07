# TrackPunch — HRMS App

A modern React Native (bare CLI + TypeScript) employee app for the TrackPunch / HRMS API.
Attendance punching with selfie + GPS, leaves, work reports, notifications, and company lookups.

- **API base URL:** `https://apps.deodap.info/hrms-app/api` (see [docs/HRMS_App_API.postman_collection.json](docs/HRMS_App_API.postman_collection.json))
- **Theme:** Blue corporate (see [src/theme/index.ts](src/theme/index.ts))
- **Auth:** Employee code + password, Bearer token persisted with AsyncStorage

## Features

| Area | Screen(s) |
|------|-----------|
| Auth | Login (`/login`), auto session restore, logout |
| Dashboard | Punch status, quick actions, profile summary |
| Punch | Punch in/out with front-camera selfie + location (`/punch`), live status |
| Attendance | Monthly punch history (`/punch/history`) |
| Leaves | List / apply / detail (`/leaves`) |
| Work Reports | List by date + create with hourly slot (`/work-reports`, `/work-report-times`) |
| Tracking | Start tracking by type (`/tracking-types`, `/tracking`) |
| Profile | View / edit (email, dob, gender), accept terms |
| Notifications | List + mark read (`/notifications`) |
| Lookups | Departments, designations, shifts, work locations, holidays, policies |

## Project structure

```
src/
  api/         axios client (Bearer interceptor + 401 handling), services, types, storage
  components/ui/ design system: Button, Card, Input, Select, DateField, Avatar, Badge, Row, …
  context/     AuthContext (session + token lifecycle)
  navigation/  RootNavigator (auth gate), AppTabs (Home/Attendance/Leaves/More)
  screens/     feature screens grouped by domain
  theme/       colors, spacing, radius, typography, shadows
  utils/       formatting, location (GPS), camera (selfie)
```

## Prerequisites

- Node ≥ 22, JDK 17, Android SDK (platform 35/36, build-tools 35+)
- An Android emulator or a USB-connected device

## Run

```bash
npm install

# Terminal 1 — Metro bundler
npm start

# Terminal 2 — build & install on a running emulator/device
npm run android
```

The debug APK is also produced at:
`android/app/build/outputs/apk/debug/app-debug.apk`

## Notes

- Native permissions for camera + location are declared in
  `android/app/src/main/AndroidManifest.xml` and requested at runtime before punching.
- Vector-icon fonts are linked via `fonts.gradle` in `android/app/build.gradle`.
- The API envelope (`{ status, message, data }`) is unwrapped centrally in
  [src/api/client.ts](src/api/client.ts); list endpoints tolerate multiple shapes.
- iOS isn't configured for builds on this (Windows) setup, but the JS layer is
  platform-agnostic; `pod install` + Xcode would be needed on macOS.
