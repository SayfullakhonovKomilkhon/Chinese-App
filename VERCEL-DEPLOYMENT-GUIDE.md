# Vercel Deployment Guide - Chinese-Russian Learning Platform

## 🚀 Quick Deployment Steps

### 1. Pre-deployment Preparation
✅ **Already Completed:**
- Updated `lib/supabaseClient.ts` to use environment variables
- Removed localhost restrictions in `next.config.js`
- Created `env.example` with required variables

### 2. Deploy to Vercel

#### Option A: Deploy via Vercel CLI
```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from project directory
vercel

# Follow the prompts:
# - Set up and deploy? [Y/n] Y
# - Which scope? Select your account
# - Link to existing project? [y/N] N
# - What's your project's name? chinese-learning-app
# - In which directory is your code located? ./
# - Want to modify settings? [y/N] N
```

#### Option B: Deploy via Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your Git repository
4. Configure project settings (see below)
5. Click "Deploy"

### 3. Configure Environment Variables in Vercel

**Required Environment Variables:**
```
NEXT_PUBLIC_SUPABASE_URL=https://krebizyheqykuwgfwqeo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyZWJpenloZXF5a3V3Z2Z3cWVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNzM2NzksImV4cCI6MjA2NTY0OTY3OX0.RXHetJXVUNKnVViaNq9OVYqmeEpv8yk56ugFzk-YGqg
NEXT_PUBLIC_SITE_URL=https://your-app-name.vercel.app
```

**How to add them:**
1. Go to your Vercel project dashboard
2. Click "Settings" tab
3. Click "Environment Variables" in sidebar
4. Add each variable:
   - Name: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: `https://krebizyheqykuwgfwqeo.supabase.co`
   - Environment: All (Production, Preview, Development)
5. Repeat for all variables
6. Click "Save"

### 4. Update Supabase Settings

#### Update Site URL in Supabase Dashboard:
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `krebizyheqykuwgfwqeo`
3. Go to "Authentication" → "URL Configuration"
4. Update **Site URL** to: `https://your-app-name.vercel.app`
5. Add **Redirect URLs**:
   - `https://your-app-name.vercel.app/auth/callback`
   - `https://your-app-name.vercel.app/**` (for all auth flows)

#### Update Email Templates (if using custom emails):
1. Go to "Authentication" → "Email Templates"
2. Update any template URLs from localhost to your Vercel domain

### 5. Test Deployment

After deployment, test these key features:
- [ ] **Homepage loads** (https://your-app.vercel.app)
- [ ] **User registration** works
- [ ] **User login** works  
- [ ] **Email verification** works
- [ ] **Student dashboard** loads and shows categories
- [ ] **Flashcard study** works with SM2 algorithm
- [ ] **Teacher panel** works (admin login)
- [ ] **Content management** (add/edit words and categories)
- [ ] **Mobile responsiveness** (test on phone)

### 6. Performance Optimization

**Vercel automatically provides:**
- ✅ CDN edge caching
- ✅ Automatic HTTPS
- ✅ Gzip compression
- ✅ Image optimization
- ✅ Static file optimization

**Additional optimizations already implemented:**
- ✅ Next.js App Router for optimal performance
- ✅ Tailwind CSS for minimal bundle size
- ✅ Framer Motion for smooth animations
- ✅ Mobile-optimized responsive design

## 🔧 Troubleshooting

### Common Issues:

#### 1. Build Errors
```bash
# Run build locally to check for errors
npm run build
```
Fix any TypeScript or build errors before deploying.

#### 2. Environment Variables Not Working
- Ensure all variables start with `NEXT_PUBLIC_`
- Check spelling and case sensitivity
- Redeploy after adding variables

#### 3. Supabase Connection Issues
- Verify Supabase URL and key are correct
- Check Supabase project is active
- Ensure RLS policies allow public access where needed

#### 4. Auth Redirect Issues
- Verify Site URL in Supabase matches your Vercel domain
- Check redirect URLs include `/auth/callback`
- Test email verification flow

### 5. Mobile Issues
- Test on actual mobile devices
- Check responsive breakpoints work
- Verify touch interactions work properly

## 📱 Mobile Testing Checklist

Test on mobile devices (320px-420px width):
- [ ] **Student Panel**: Cards display properly, navigation works
- [ ] **Flashcards**: Chinese characters readable, buttons accessible
- [ ] **Teacher Panel**: Content management works on mobile
- [ ] **Auth Flow**: Login/registration forms work
- [ ] **Navigation**: Menu and tabs work smoothly

## 🎯 Final Verification

Once deployed, your app should be accessible at:
`https://your-app-name.vercel.app`

**Key Features Working:**
- ✅ Chinese-Russian vocabulary learning
- ✅ SuperMemo 2 spaced repetition algorithm
- ✅ Student dashboard with progress tracking
- ✅ Teacher panel for content management
- ✅ User authentication and email verification
- ✅ Mobile-optimized responsive design
- ✅ Modern UI with smooth animations

## 🌟 Post-Deployment

### Optional Enhancements:
1. **Custom Domain**: Add your own domain in Vercel settings
2. **Analytics**: Add Vercel Analytics for usage insights
3. **Monitoring**: Set up error tracking (Sentry, etc.)
4. **SEO**: Add meta tags and sitemap
5. **PWA**: Consider adding service worker for offline support

---

🎉 **Your Chinese-Russian learning platform is now live and ready for users!** 