# Vercel Environment Variables Setup

## 🚀 Your app is deployed at:
**Production URL:** https://chinese-ehhf7r05i-komilkhons-projects.vercel.app

## 📋 Required Environment Variables

Add these to your Vercel project dashboard:

### 1. Go to Vercel Dashboard
- Visit: https://vercel.com/komilkhons-projects/chinese-app
- Click "Settings" tab
- Click "Environment Variables" in sidebar

### 2. Add these variables:

**Variable 1:**
- Name: `NEXT_PUBLIC_SUPABASE_URL`
- Value: `https://krebizyheqykuwgfwqeo.supabase.co`
- Environment: All (Production, Preview, Development)

**Variable 2:**
- Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyZWJpenloZXF5a3V3Z2Z3cWVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNzM2NzksImV4cCI6MjA2NTY0OTY3OX0.RXHetJXVUNKnVViaNq9OVYqmeEpv8yk56ugFzk-YGqg`
- Environment: All (Production, Preview, Development)

**Variable 3:**
- Name: `NEXT_PUBLIC_SITE_URL`
- Value: `https://chinese-ehhf7r05i-komilkhons-projects.vercel.app`
- Environment: All (Production, Preview, Development)

### 3. Click "Save" after adding each variable

## 🔧 Update Supabase Settings

### 1. Go to Supabase Dashboard
- Visit: https://supabase.com/dashboard
- Select project: `krebizyheqykuwgfwqeo`

### 2. Update Authentication Settings
- Go to "Authentication" → "URL Configuration"
- Update **Site URL** to: `https://chinese-ehhf7r05i-komilkhons-projects.vercel.app`
- Add **Redirect URLs**:
  - `https://chinese-ehhf7r05i-komilkhons-projects.vercel.app/auth/callback`
  - `https://chinese-ehhf7r05i-komilkhons-projects.vercel.app/**`

### 3. Save Settings

## 🔄 Redeploy
After adding environment variables, redeploy the project:
- Go back to Vercel dashboard
- Click "Deployments" tab
- Click "Redeploy" on the latest deployment

## ✅ Test the Deployment
1. Visit: https://chinese-ehhf7r05i-komilkhons-projects.vercel.app
2. Test user registration
3. Test email verification
4. Test login
5. Test student dashboard
6. Test teacher panel (admin login)
7. Test flashcard study with SM2 algorithm
8. Test mobile responsiveness 