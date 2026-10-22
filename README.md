# Portexa website + backend starter

This project preserves the supplied Portexa storefront HTML and adds serverless API routes for Supabase, Paystack, Resend email, customer accounts, an admin area, and customer support chat.

## Important before uploading

- The storefront `index.html` was copied from the Portexa file already shared in ChatGPT. Existing image paths in that file have not been rewritten.
- Place your actual image files in this project root if the HTML references them by filename (for example `white-day-pad.jpg`), or keep their current paths exactly as they are.
- Do not put any secret keys in HTML, JavaScript running in the browser, or GitHub.
- The project is a starter that must have its Vercel environment variables set before API features can work.
- The existing Supabase tables are expected to be `profiles`, `orders`, `chat_conversations`, and `chat_messages`.

## 1. Supabase SQL

In Supabase > SQL Editor, run `supabase-migration.sql`. It adds payment tracking columns to `orders` and enables the server-side order/payment flow. It is safe to run more than once.

## 2. Vercel environment variables

In Vercel > your existing Portexa project > Settings > Environment Variables, add the variables shown in `.env.example`.

- `SUPABASE_URL`: your Supabase project URL.
- `SUPABASE_ANON_KEY`: your Supabase publishable/anon key (public key).
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase secret/service-role key. **Private**; never put it in HTML or GitHub.
- `PAYSTACK_SECRET_KEY`: your `sk_test_...` key for testing.
- `PAYSTACK_PUBLIC_KEY`: your `pk_test_...` key. Safe to expose, but this starter uses the server for transaction creation.
- `RESEND_API_KEY`: your Resend API key.
- `RESEND_FROM_EMAIL`: must use a sender/domain verified in Resend.
- `PORTEXA_RECEIVING_EMAIL`: `Portexa09@gmail.com`.
- `ADMIN_SETUP_TOKEN`: a long random secret used only to create the first admin role.

After changing environment variables, redeploy the Vercel project.

## 3. Create your customer account and make it an admin

1. Open `/account.html` on the deployed website and create your own account.
2. If email confirmation is enabled in Supabase, confirm your email and sign in.
3. In Vercel environment variables, set `ADMIN_SETUP_TOKEN` to a long random value and redeploy.
4. Open `/admin-setup.html`, sign in with the account you want to make admin, enter the temporary token, and assign the admin role.
5. Remove `ADMIN_SETUP_TOKEN` from Vercel and redeploy after success.
6. Open `/admin.html` to use the dashboard.

Keep the temporary token private. Do not leave it configured longer than needed.

## 4. Payment flow

The backend calculates product prices from its own catalog, creates the order in Supabase, initializes Paystack using the secret key, and redirects the customer to Paystack. The callback verifies transaction status, reference, currency, and amount before setting the order's payment status to paid. This follows Paystack's recommended server-side flow.

This starter currently permits online payment only for products with fixed prices. Products marked “Request a quote” should be confirmed with Portexa before payment.

## 5. Chat and email

The chat widget sends customer messages to `/api/chat`. New messages trigger an email notification if Resend is configured. The admin page can view orders and support conversations after admin role setup.

## 6. Deployment

Upload the contents of this ZIP to the existing private GitHub repository, then let the already-connected Vercel project deploy. If the repository has any old code, replace its contents only after keeping a backup. Check the deployment logs if the build does not succeed.

## Current scope and honest limitations

This is an integration-ready starter, not a claim that live services are already connected. Environment variables, the SQL migration, Resend sender verification, the first admin role, and test transactions still need configuration and testing. Do not switch to Paystack live keys until test payments and order verification work correctly.
