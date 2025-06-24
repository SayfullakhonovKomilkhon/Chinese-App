# 🧪 FLASHCARD BUTTONS DEBUG TEST

## 📍 **Current Live URL**
**https://chinese-k0mq7ba8n-komilkhons-projects.vercel.app**

---

## 🔧 **DEBUGGING STEPS**

### 1. **Test Environment Variables**
✅ Environment variables are set in Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`: https://krebizyheqykuwgfwqeo.supabase.co
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: [JWT token]
- `NEXT_PUBLIC_SITE_URL`: https://chinese-k0mq7ba8n-komilkhons-projects.vercel.app

### 2. **Test Supabase Connection**
1. Visit the app and register/login as a student
2. Open browser DevTools (F12) → Console tab
3. Look for any connection errors

### 3. **Test RLS Policies**
✅ RLS Policy verified:
```sql
CREATE POLICY user_word_progress_policy ON user_word_progress 
FOR ALL USING (auth.uid() = user_uuid);
```

### 4. **Test Flashcard Buttons**
1. **Navigate to Study:**
   - Visit: https://chinese-k0mq7ba8n-komilkhons-projects.vercel.app
   - Login as student
   - Click on a category (e.g., "HSK 1 - Основы")
   
2. **Open DevTools Console:**
   - Press F12
   - Go to Console tab
   - Clear any existing logs
   
3. **Test Each Button:**
   - Click "Перевод" to show translation
   - Click "Легко" (Easy) and watch console logs
   - Check for these debug messages:
     ```
     🔥 BUTTON CLICKED: { difficulty: 'easy', ... }
     📤 Submitting word response...
     🔍 submitWordResponse API called:
     👤 Auth check result:
     📡 Calling Supabase RPC with params:
     📊 Supabase RPC response:
     ✅ Response submitted successfully:
     ```

4. **Check for Errors:**
   - Look for any ❌ error messages
   - Note the exact error details
   - Check if user authentication fails
   - Verify database function calls

### 5. **Test Database Updates**
After clicking buttons, verify in Supabase dashboard:
1. Go to: https://supabase.com/dashboard/project/krebizyheqykuwgfwqeo/editor
2. Check tables:
   - `user_word_progress`: Should have new/updated rows
   - `user_activity`: Should log button clicks
   - `user_sessions`: Should track study sessions

---

## 🔍 **DEBUGGING CHECKLIST**

### ✅ **Environment Setup**
- [x] Environment variables set in Vercel
- [x] Supabase client configured with fallbacks
- [x] Database functions deployed

### ✅ **Database Security**  
- [x] RLS policies enabled for `user_word_progress`
- [x] Policy allows `auth.uid() = user_uuid`
- [x] Functions use SECURITY DEFINER

### 🧪 **Button Test Results**
- [ ] "Легко" (Easy) button logs and works
- [ ] "Сложно" (Hard) button logs and works  
- [ ] "Забыл" (Forgot) button logs and works
- [ ] Database records are created/updated
- [ ] User progresses to next word

### 🔧 **Debug Logs Expected**
When clicking a button, you should see:
1. `🔥 BUTTON CLICKED:` - Button click registered
2. `📤 Submitting word response...` - Starting submission
3. `🔍 submitWordResponse API called:` - API function called
4. `👤 Auth check result:` - User authentication verified
5. `📡 Calling Supabase RPC:` - Database function called
6. `📊 Supabase RPC response:` - Database response received
7. `✅ Response submitted successfully:` - Success confirmation

### ❌ **Common Error Patterns**
- **Auth Error**: User not authenticated → Check login
- **RPC Error**: Function not found → Check database deployment
- **Permission Error**: RLS policy blocked → Check user_uuid matching
- **Network Error**: Connection failed → Check environment variables

---

## 🛠️ **TROUBLESHOOTING**

### If Buttons Don't Work:
1. **Check Console for Errors:**
   - Authentication failures
   - Network connection issues
   - Database permission errors

2. **Verify User Authentication:**
   ```javascript
   // Run in browser console:
   supabase.auth.getUser().then(console.log)
   ```

3. **Test Manual Database Call:**
   ```javascript
   // Run in browser console:
   supabase.rpc('submit_word_response', {
     p_user_uuid: 'your-user-id',
     p_word_id: 1,
     p_difficulty: 'easy',
     p_was_correct: true,
     p_session_id: null
   }).then(console.log)
   ```

### If Database Updates Fail:
1. Check RLS policies in Supabase dashboard
2. Verify user UUID matches authenticated user
3. Ensure database functions are deployed
4. Check function permissions (SECURITY DEFINER)

---

## 📞 **IMMEDIATE ACTION**

**TEST NOW:**
1. Visit: https://chinese-k0mq7ba8n-komilkhons-projects.vercel.app
2. Open DevTools Console (F12)
3. Register/Login as student
4. Go to any category and click flashcard buttons
5. Copy ALL console output and report findings

**Expected Result:** Detailed debug logs showing exactly where the process fails (if it fails) or confirmation that buttons work correctly. 