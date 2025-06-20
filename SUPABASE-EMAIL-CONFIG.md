# Supabase Email Confirmation Disable Configuration

## Step 1: Disable Email Confirmation in Supabase Dashboard

1. Go to your **Supabase Dashboard**
2. Navigate to **Authentication** → **Settings**
3. In the **Email** section, find these settings:
   - **"Enable email confirmations"** → **Disable this**
   - **"Secure email change"** → **Disable this** (optional, for email changes)
4. Click **Save**

## Step 2: Apply Database Trigger (Required)

Execute the SQL script `supabase-auto-confirm-email.sql` in your Supabase SQL Editor:

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Paste the contents of `supabase-auto-confirm-email.sql`
3. Click **Run**

This trigger will automatically set `email_confirmed_at` for all new user registrations.

## Step 3: Verify Configuration

After applying the changes:

1. Test user registration from your app
2. Check the `auth.users` table to confirm:
   - `email_confirmed_at` is automatically populated
   - `email_change_confirm_status` is set to 0 (confirmed)
3. Users should be able to login immediately after registration

## Alternative: Manual Configuration via Dashboard

If you prefer to configure via Supabase dashboard only:

1. **Authentication** → **Settings** → **Email**
2. Set **"Enable email confirmations"** to **OFF**
3. Set **"Email confirmation template"** to disabled
4. Apply the database trigger from Step 2 above

## Troubleshooting

- **Users still get confirmation emails**: Check that "Enable email confirmations" is actually disabled and saved
- **Users can't login after registration**: Verify the database trigger is installed and working
- **Email not marked as confirmed**: Check if the `auto_confirm_email()` function exists and the trigger is active

## Testing

To test the configuration:
1. Register a new user
2. Check `auth.users` table for the new user
3. Verify `email_confirmed_at` is set to a timestamp (not null)
4. Try logging in immediately - should work without email confirmation 