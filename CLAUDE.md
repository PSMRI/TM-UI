# CLAUDE.md - TM-UI

## Project Overview

TM-UI is the Telemedicine frontend for the AMRIT healthcare platform. It supports remote consultations across multiple roles: registrar, nurse, doctor, lab technician, pharmacist, and TC specialists. It handles patient registration, clinical workflows (ANC, PNC, NCD screening, quick consult), lab tests, prescriptions, data sync, and teleconsultation specialist worklists.

## Tech Stack

- Angular 16 (NgModule-based, not standalone)
- TypeScript 5.1
- Angular Material 16
- RxJS, zone.js
- Karma + Jasmine (testing)
- ESLint + Prettier (linting)
- Husky + commitlint (conventional commits)
- Common-UI git submodule (shared registrar, feedback modules)

## Build & Run Commands

```bash
git submodule update --init    # Initialize Common-UI submodule (required)
npm install                    # Install dependencies
npm start                      # Dev server (port 4203)
npm run build-dev              # Development build
npm run build-prod             # Production build
npm run build-ci               # CI build (uses EJS template + env vars)
npm test                       # Run tests
npm run lint                   # Lint
npm run commit                 # Commitizen conventional commit
```

WAR packaging: `mvn -B package --file pom.xml -P <profile>`

Dev server port: **4203**

## Project Structure

```
src/app/
  app.module.ts                # Root module
  app-routing.module.ts        # Root routes (login, service, servicePoint, lazy modules)
  app-modules/
    login/                     # Login page
    reset-password/            # Password reset
    set-password/              # Initial password setup
    set-security-questions/    # Security question setup
    captcha/                   # CAPTCHA component
    service/                   # Service/role selection
    service-point/             # Service point selection
    tm-logout/                 # Telemedicine logout
    core/                      # Core module (shared services, Material barrel)
      core.module.ts
      material.module.ts
      services/
        auth.service.ts
        auth-guard.service.ts
        http-interceptor.service.ts
        confirmation.service.ts
        beneficiary-details.service.ts
        telemedicine.service.ts
        iot.service.ts         # IoT device integration
        inventory.service.ts
        spinner.service.ts
    registrar/                 # Patient registration (ABHA, biometrics, OTP)
      registration/
      biometric-authentication/
      generate-abha/
      quick-search/
    nurse-doctor/              # Clinical workflow (largest module)
      dashboard/
      visit-details/
      vitals/
      history/
      examination/
      case-record/
      case-sheet/
      refer/
      scheduler/
      anc/                     # Antenatal care
      pnc/                     # Postnatal care
      ncd-screening/           # Non-communicable disease screening
      idrs/                    # Indian Diabetes Risk Score
      quick-consult/
      nurse-worklist-wrapper/
      doctor-worklist/
      doctor-tm-worklist-wrapper/
      doctor-tm-future-worklist/
      tc-specialist-worklist/
      tc-specialist-worklist-wrapper/
      tc-specialist-future-worklist/
      oncologist-worklist/
      radiologist-worklist/
      print-page-select/
      shared/
      workarea/
    lab/                       # Lab technician workflow
      worklist/
      workarea/
      shared/
    pharmacist/                # Pharmacist workflow
      worklist/
      shared/
    data-sync/                 # Offline data synchronization
```

## Architecture Notes

- **Multi-role application**: Supports registrar, nurse, doctor, TC specialist, oncologist, radiologist, lab tech, pharmacist roles
- Lazy-loaded feature modules: `nurse-doctor`, `lab`, `pharmacist`, `datasync`
- `registrar` route loads from **Common-UI** submodule (`Common-UI/src/registrar/registration.module`)
- `feedback` route also loads from Common-UI submodule
- Uses hash-based routing (`useHash: true`)
- HTTP interceptor attaches `Authorization`/`ServerAuthorization` headers; session timeout at 27 min (status `5002` = expired)
- `ServicePointResolve` resolver pre-fetches service point data before navigation
- IoT service integration for connected medical devices
- Teleconsultation specialist worklists (current + future) for remote specialist consultations
- i18n via custom JSON files (`src/assets/English.json`, `src/assets/Hindi.json`)
- CI environment generated from `environment.ci.ts.template` via `scripts/ci-prebuild.js`
- Password encryption: AES + PBKDF2 via CryptoJS before sending to backend

## Key Patterns

- **Dialogs**: `ConfirmationService` wrapping `MatDialog`
- **Material imports**: Centralized `MaterialModule` barrel
- **Route guards**: `AuthGuard` on all protected routes, `CanDeactivateGuard` for unsaved changes
- **Bundle budgets**: 5MB warning / 6MB error

## Commit Conventions

Conventional Commits enforced. Allowed types: `feat`, `fix`, `build`, `chore`, `ci`, `docs`, `perf`, `refactor`, `revert`, `style`, `test`. Header max 100 chars.
