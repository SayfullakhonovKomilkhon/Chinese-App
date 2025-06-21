# 🔧 Custom Email Verification Solution

If Supabase's built-in email confirmation continues to auto-confirm, we can implement a custom solution:

## Strategy:
1. Let Supabase create users normally (even if auto-confirmed)
2. Add our own `email_verified` field to the `public.users` table
3. Block access until our custom verification is complete
4. Send our own verification emails

## Implementation:

### 1. Add Email Verification Field
```sql
-- Add custom email verification field
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verification_token TEXT,
ADD COLUMN IF NOT EXISTS verification_sent_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON public.users(verification_token);
```

### 2. Update Registration Trigger
```sql
-- Update the user registration trigger to set email_verified = false
CREATE OR REPLACE FUNCTION handle_new_user_registration()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (uuid_id, email, full_name, role, email_verified, verification_token)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        'student',
        FALSE, -- Always start as unverified
        encode(gen_random_bytes(32), 'hex') -- Generate verification token
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 3. Custom Verification API
```typescript
// app/api/verify-email/route.ts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  
  if (!token) {
    return NextResponse.redirect('/auth/verification-failed')
  }
  
  // Verify token and update user
  const { data, error } = await supabase
    .from('users')
    .update({ 
      email_verified: true,
      verification_token: null 
    })
    .eq('verification_token', token)
    .select()
  
  if (error || !data.length) {
    return NextResponse.redirect('/auth/verification-failed')
  }
  
  return NextResponse.redirect('/auth/verification-success')
}
```

### 4. Block Unverified Users
```typescript
// In AuthProvider, check custom email_verified field
const checkEmailVerification = async (user: User) => {
  const { data } = await supabase
    .from('users')
    .select('email_verified')
    .eq('uuid_id', user.id)
    .single()
    
  return data?.email_verified || false
}
```

This gives us complete control over email verification, independent of Supabase's settings. 