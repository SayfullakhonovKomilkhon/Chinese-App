# Supabase Email Verification Setup Guide

## 📧 Email Configuration Steps

### 1. Enable Email Confirmation in Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Settings**
3. Under **User Signups**, set:
   - ✅ **Enable email confirmations** = `ON`
   - ✅ **Enable phone confirmations** = `OFF` (unless needed)

### 2. Configure Email Templates

1. Go to **Authentication** → **Email Templates**
2. Select **Confirm signup** template
3. Replace the default template with our custom HTML:

#### Subject Line:
```
Подтвердите ваш email - Китайский язык 🇨🇳
```

#### HTML Template:
```html
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Подтверждение Email - Китайский язык</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #f8fafc;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 30px;
            text-align: center;
            color: white;
        }
        
        .header h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
        }
        
        .header p {
            font-size: 16px;
            opacity: 0.9;
        }
        
        .content {
            padding: 40px 30px;
        }
        
        .greeting {
            font-size: 18px;
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 20px;
        }
        
        .message {
            font-size: 16px;
            color: #4a5568;
            margin-bottom: 30px;
            line-height: 1.7;
        }
        
        .verify-button {
            display: inline-block;
            background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
            color: white;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            transition: all 0.3s ease;
            box-shadow: 0 4px 14px rgba(66, 153, 225, 0.3);
        }
        
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
        
        .alternative-link {
            margin-top: 25px;
            padding: 20px;
            background-color: #f7fafc;
            border-radius: 8px;
            border-left: 4px solid #4299e1;
        }
        
        .alternative-link p {
            font-size: 14px;
            color: #4a5568;
            margin-bottom: 10px;
        }
        
        .alternative-link a {
            color: #4299e1;
            word-break: break-all;
            text-decoration: none;
        }
        
        .footer {
            background-color: #f7fafc;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        
        .footer p {
            font-size: 14px;
            color: #718096;
            margin-bottom: 8px;
        }
        
        .security-notice {
            background-color: #fef5e7;
            border: 1px solid #f6ad55;
            border-radius: 8px;
            padding: 16px;
            margin: 25px 0;
        }
        
        .security-notice p {
            font-size: 14px;
            color: #744210;
            margin: 0;
        }
        
        .features {
            margin: 30px 0;
        }
        
        .feature-item {
            display: flex;
            align-items: center;
            margin-bottom: 12px;
        }
        
        .feature-icon {
            width: 20px;
            height: 20px;
            background-color: #4299e1;
            border-radius: 50%;
            margin-right: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 12px;
        }
        
        .feature-text {
            font-size: 14px;
            color: #4a5568;
        }
        
        @media (max-width: 600px) {
            .email-container {
                margin: 0;
                border-radius: 0;
            }
            
            .header, .content, .footer {
                padding: 20px;
            }
            
            .header h1 {
                font-size: 24px;
            }
            
            .verify-button {
                display: block;
                width: 100%;
                padding: 14px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>🇨🇳 Китайский язык</h1>
            <p>Добро пожаловать в мир китайского языка!</p>
        </div>
        
        <div class="content">
            <div class="greeting">
                Привет! 👋
            </div>
            
            <div class="message">
                Спасибо за регистрацию на нашей платформе для изучения китайского языка! 
                Для завершения регистрации и активации вашего аккаунта, пожалуйста, 
                подтвердите ваш email адрес, нажав на кнопку ниже.
            </div>
            
            <div class="button-container">
                <a href="{{ .ConfirmationURL }}" class="verify-button">
                    ✅ Подтвердить Email
                </a>
            </div>
            
            <div class="features">
                <div class="feature-item">
                    <div class="feature-icon">📚</div>
                    <div class="feature-text">Интерактивные карточки для изучения иероглифов</div>
                </div>
                <div class="feature-item">
                    <div class="feature-icon">🧠</div>
                    <div class="feature-text">Система интервального повторения</div>
                </div>
                <div class="feature-item">
                    <div class="feature-icon">📊</div>
                    <div class="feature-text">Отслеживание прогресса и статистика</div>
                </div>
                <div class="feature-item">
                    <div class="feature-icon">🎯</div>
                    <div class="feature-text">Персонализированные уроки</div>
                </div>
            </div>
            
            <div class="security-notice">
                <p>
                    <strong>🔒 Безопасность:</strong> Эта ссылка действительна в течение 24 часов. 
                    Если вы не регистрировались на нашем сайте, просто проигнорируйте это письмо.
                </p>
            </div>
            
            <div class="alternative-link">
                <p><strong>Не работает кнопка?</strong> Скопируйте и вставьте эту ссылку в браузер:</p>
                <a href="{{ .ConfirmationURL }}">{{ .ConfirmationURL }}</a>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>Chinese Learning Platform</strong></p>
            <p>Ваш путь к изучению китайского языка начинается здесь!</p>
            <p style="margin-top: 15px; font-size: 12px;">
                Если у вас есть вопросы, свяжитесь с нами: support@chineselearning.com
            </p>
        </div>
    </div>
</body>
</html>
```

### 3. Configure Site URL

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL** to your production domain (e.g., `https://yourdomain.com`)
3. Add **Redirect URLs**:
   - `https://yourdomain.com/auth/callback`
   - `http://localhost:3000/auth/callback` (for development)

### 4. Email Provider Configuration

#### Option A: Use Supabase Built-in SMTP (Recommended for development)
- No additional configuration needed
- Limited to 3 emails per hour in free tier

#### Option B: Configure Custom SMTP (Recommended for production)
1. Go to **Authentication** → **Settings** → **SMTP Settings**
2. Configure your email provider (Gmail, SendGrid, etc.):
   ```
   SMTP Host: smtp.gmail.com
   SMTP Port: 587
   SMTP User: your-email@gmail.com
   SMTP Pass: your-app-password
   SMTP Admin Email: your-email@gmail.com
   ```

### 5. Database Policies (RLS)

Ensure Row Level Security policies are set up correctly:

```sql
-- Allow users to read their own profile
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = uuid_id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = uuid_id);

-- Allow authenticated users to read categories
CREATE POLICY "Authenticated users can read categories" ON public.categories
    FOR SELECT TO authenticated USING (true);
```

### 6. Environment Variables

Add to your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 7. Testing the Flow

1. **Register a new user** with email verification
2. **Check email** for verification link
3. **Click verification link** → should redirect to `/auth/callback`
4. **Callback page** should show success and redirect to appropriate dashboard
5. **Try logging in** before verification → should show error

### 8. Custom Email Service (Optional)

For production, you might want to use a dedicated email service:

#### Using SendGrid:
```typescript
// lib/emailService.ts
import sgMail from '@sendgrid/mail'
import { generateVerificationEmailHTML } from './emailTemplates'

sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

export async function sendVerificationEmail(to: string, data: EmailTemplateData) {
  const msg = {
    to,
    from: 'noreply@yourdomain.com',
    subject: 'Подтвердите ваш email - Китайский язык 🇨🇳',
    html: generateVerificationEmailHTML(data),
  }

  try {
    await sgMail.send(msg)
    console.log('Verification email sent successfully')
  } catch (error) {
    console.error('Error sending email:', error)
    throw error
  }
}
```

### 9. Monitoring and Analytics

Track email verification success rates:

```sql
-- Query to check email verification rates
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_signups,
  COUNT(email_confirmed_at) as confirmed_emails,
  ROUND(COUNT(email_confirmed_at)::DECIMAL / COUNT(*) * 100, 2) as confirmation_rate
FROM auth.users 
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### 10. Troubleshooting

Common issues and solutions:

1. **Emails not sending**: Check SMTP configuration and rate limits
2. **Verification link not working**: Verify redirect URLs are correctly configured
3. **User stuck in unverified state**: Check if email confirmation is properly enabled
4. **Callback page errors**: Ensure authentication state is properly handled

### 11. Role Management System

**Automatic Role Assignment:**
- ✅ All new users are automatically registered as **Students**
- ✅ Users cannot choose their own role during registration
- ✅ Only existing admins can promote users to admin role

**Admin Functions (Database):**
```sql
-- Promote user to admin (admin only)
SELECT promote_user_to_admin('user@example.com');

-- Demote user to student (admin only) 
SELECT demote_user_to_student('user@example.com');

-- List all users with roles (admin only)
SELECT get_users_with_roles();
```

**Creating the First Admin:**
Since all users register as students, you'll need to manually create the first admin:

```sql
-- Update the first user to admin role (run this once in Supabase SQL editor)
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'your-admin-email@example.com';
```

### 12. Security Best Practices

- ✅ Always validate email confirmation before allowing login
- ✅ Set appropriate token expiration times (24 hours)
- ✅ Use HTTPS in production
- ✅ Implement rate limiting for registration
- ✅ Monitor for suspicious registration patterns
- ✅ Sanitize user input in email templates
- ✅ **Role Security**: Users cannot self-promote to admin
- ✅ **Admin Protection**: Admins cannot demote themselves

This setup provides a complete email verification system with beautiful HTML templates, proper error handling, and secure role management! 