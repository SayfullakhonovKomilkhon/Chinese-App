# 📧 Email Verification Test Guide

## After enabling email confirmation in Supabase dashboard:

### ✅ Test Steps:
1. Go to http://localhost:3000
2. Click "Регистрация" 
3. Enter a NEW email address (like: test123@gmail.com)
4. Fill password and submit
5. Check email inbox for verification email
6. Click verification link in email
7. Should redirect to app and allow login

### 🔍 Expected Behavior:
- ✅ User sees "Проверьте вашу почту" message after registration
- ✅ Verification email arrives in inbox
- ✅ Email contains "Подтвердить Email" button
- ✅ Clicking button confirms email and allows login
- ✅ Unverified users cannot login

### 🚨 If Still Not Working:
1. Check Supabase logs: https://supabase.com/dashboard/project/krebizyheqykuwgfwqeo/logs
2. Verify SMTP settings in Authentication → Settings
3. Check spam/junk folder
4. Try different email provider (Gmail, Yahoo, etc.)

### 🔧 Debug Commands:
```sql
-- Check if email confirmation is working
SELECT 
    email,
    email_confirmed_at,
    confirmation_sent_at,
    created_at
FROM auth.users 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

### 📝 Notes:
- Email confirmation MUST be enabled in Supabase dashboard
- Site URL must be set to http://localhost:3000
- Redirect URL must include /auth/callback
- Check email templates are configured correctly 