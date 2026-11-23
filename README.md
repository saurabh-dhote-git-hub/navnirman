# Navnirman — Complete Project

A single project folder containing the customer web UI, Android customer app, PC admin dashboard, and Spring Boot backend.

## Folder structure

```text
Navnirman/
├── src/                 # Customer UI + Admin dashboard
├── public/              # Shared web assets
├── android/             # Capacitor Android Studio project (customer app)
├── backend/             # Spring Boot API
├── package.json         # React, Vite and Capacitor dependencies
├── capacitor.config.json
├── start-web-admin.bat  # Starts the customer web UI and admin dashboard
├── start-backend.bat    # Starts the Spring Boot backend
└── build-android.bat    # Builds web assets and syncs Android project
```

## Requirements

- Windows 10/11
- Node.js 22 or newer and npm
- Java 21
- Maven 3.9+
- Android Studio with an Android SDK
- MySQL matching the existing backend configuration (default: `localhost:3307`, database `navnirman`)

## First-time setup

1. Extract this ZIP to a clean folder, for example `C:\Navnirman`.
2. Start your existing MySQL service/container. The backend default DB settings are in `backend/src/main/resources/application.yml`.
3. Start the backend by double-clicking `start-backend.bat`. On first admin setup, enter an admin email and a unique password of at least 12 characters. The bootstrap creates the admin only if the account does not already exist; it does not reset an existing password.
4. Start the frontend by double-clicking `start-web-admin.bat`. It installs npm dependencies on first run and starts Vite.
5. Open:
   - Customer web UI: `http://localhost:5173/`
   - Admin dashboard: `http://localhost:5173/admin`
   - Backend health: `http://localhost:8080/api/health`

The customer web UI automatically uses `http://localhost:8080/api` in a PC browser. The admin dashboard also uses the PC backend at that address.

## Android customer app

1. Double-click `build-android.bat`. It runs the frontend production build and `npx cap sync android`.
2. Open the `android/` folder in Android Studio.
3. Let Gradle sync, select an emulator/device, and press Run.

The Android emulator uses `http://10.0.2.2:8080/api` to reach the backend on the host PC. For a physical Android phone, set `VITE_API_BASE_URL` to your PC's Wi-Fi IPv4 address before running `build-android.bat`, for example `http://192.168.1.10:8080/api`, and ensure the PC firewall allows port 8080.

## Important notes

- `/` is the customer web UI. `/admin` is the separate PC admin dashboard.
- The Android app is the customer app only; the admin dashboard is not included in the Android navigation.
- The web customer UI and admin dashboard share the Spring Boot backend.
- Keep database credentials, admin credentials, JWT secrets, and Razorpay secrets private. The defaults in `application.yml` are local-development defaults, not production secrets.
- Existing MySQL data is not included in this ZIP. The ZIP contains application source and Android project files, not your database contents or uploaded video files.
- A fresh end-to-end build could not be completed in the packaging environment. Run the setup steps above on your Windows PC and share any build/runtime error for diagnosis. Do not treat this package as production-deployed.
