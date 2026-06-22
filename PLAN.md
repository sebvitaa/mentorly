# Fix — "No se pudo guardar tu perfil tutor"

## Symptom
Publishing a tutor profile (Profile → "Guardar y publicar") failed with the toast
**"No se pudo guardar tu perfil tutor"**.

## Root cause
The save calls the Supabase RPC `save_tutor_profile`, which returned **404 /
`PGRST202`**:

```
Could not find the function public.save_tutor_profile(...) in the schema cache
```

The `docs/sql/fase-5-tutor-publishing.sql` migration (which creates
`save_tutor_profile`, `get_my_tutor_profile`, `expand_tutor_availability`, and the
`teachers.weekly_availability` column) **had not been applied** to the Supabase
project. The app code was correct; the editor just **swallowed the real error**
and showed a generic message, which hid the 404.

## Fix
1. **Apply the migration** `docs/sql/fase-5-tutor-publishing.sql` in the Supabase
   SQL Editor (idempotent: `create or replace`, `add column if not exists`). The
   RPCs then exist and the call no longer 404s.
   - If a save 404s right after applying, reload PostgREST's cache:
     `notify pgrst, 'reload schema';` (Supabase usually reloads on its own).
2. **Surfaced the real error** so this can't hide again:
   `src/app/components/tutor-editor/tutor-editor.component.ts` now
   `console.error(...)`s the underlying error on both the load and save paths,
   and appends the error message to the failure toast.

## Verification
- API probe changes from `404 PGRST202` to an auth-level rejection:
  ```bash
  curl -s -w "\n%{http_code}\n" -X POST \
    "https://jrhzzawcjvsxxfnikkkv.supabase.co/rest/v1/rpc/save_tutor_profile" \
    -H "apikey: sb_publishable_W_MjmjbcNSDpsQqV3HILPQ_D3GlSMYC" \
    -H "Authorization: Bearer sb_publishable_W_MjmjbcNSDpsQqV3HILPQ_D3GlSMYC" \
    -H "Content-Type: application/json" -d '{}'
  ```
- Manual: log in → Profile → fill price/subjects/contact/availability →
  "Guardar y publicar" → toast "publicado", badge → "Tutor activo", tutor appears
  on Home and in subject search.
- `npm test` (unit) and `npm run test:int` (real APIs) stay green; `ng build`
  clean.
