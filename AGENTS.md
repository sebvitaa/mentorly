# Mentorly Agent Notes

- App: Ionic + Angular 19 SPA using standalone components and SCSS.
- Package manager: npm. Use `npm start` for Angular, `npm run api` for the local mock API, and `npm run build` for verification.
- Keep domain models in `src/app/models`; API DTOs and mapping code live under `src/app/api`.
- Prefer small, focused changes. Do not remove the local mock fallback unless a real backend is available.
- The production build writes to `www/`; avoid treating generated build output as source.
