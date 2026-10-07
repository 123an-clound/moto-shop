# MotoShop Vietnam

`plan.md` is the product specification. Next.js App Router renders the public storefront on the server; small client components own filters, variants, cart and forms. The admin is a separate authenticated surface.

Shared DTOs live in `src/types/index.ts`. All persistence flows through server-only `src/lib/repository.ts`; Supabase uses normalized product/variant/spec tables with transactions. When Supabase is not configured, development uses `.local/store.json`, never a public browser database. Production writes require Supabase.

Public writes validate with Zod and rate limits. Prices and stock are read again on the server. Order lookup requires both unpredictable order code and phone and returns status only. Admin access uses Supabase `app_metadata.role = admin`, or a development-only signed session. Public clients never receive privileged keys.

Seed prices/images/specs are attributed to the exact source model/version and retrieval date. Missing specifications remain null. Bank details, storefront contact details and showrooms await the owner's real values. Installment results are estimates. Payment confirmation requires trusted provider evidence or a recorded admin confirmation.

No 3D or scroll hijacking: CSS state transitions suffice for commerce. Semantic controls, reduced motion, reserved image dimensions, local optimized images and route-level code splitting preserve usability.
