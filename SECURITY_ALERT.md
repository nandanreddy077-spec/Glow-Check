# 🚨 CRITICAL SECURITY ALERT 🚨

## ⚠️ YOUR API KEYS HAVE BEEN EXPOSED

Your `.env` file contains **REAL API KEYS** that are now compromised. These keys **MUST** be rotated immediately.

---

## 🔴 IMMEDIATE ACTION REQUIRED

### 1. Rotate Google Cloud API Keys (5 minutes)
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Find your current API key
3. Click "Delete" to revoke it
4. Click "Create Credentials" → "API Key"
5. Copy the new key to your `.env` file
6. Restrict the key to only Vision API and Gemini API

### 2. Rotate OpenAI API Key (3 minutes)
1. Go to [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Find your current key
3. Click "Revoke" to disable it
4. Click "Create new secret key"
5. Copy the new key to your `.env` file

### 3. Rotate Supabase Keys (5 minutes)
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to Settings → API
4. Click "Reset" on the anon key
5. Copy the new URL and anon key to your `.env` file

### 4. Rotate RevenueCat Keys (5 minutes)
1. Go to [RevenueCat Dashboard](https://app.revenuecat.com)
2. Select your project
3. Go to Settings → API Keys
4. Revoke current keys
5. Generate new iOS and Android keys
6. Copy the new keys to your `.env` file

### 5. Update App Store Shared Secret (5 minutes)
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Go to My Apps → Your App → App Information
3. Scroll to "App-Specific Shared Secret"
4. Click "Generate" to create a new secret
5. Copy the new secret to your `.env` file

---

## 🛡️ PREVENT FUTURE EXPOSURE

### Add .env to .gitignore
```bash
# Add this to your .gitignore file
.env
.env.local
.env.production
.env.development
```

### Use Environment Variables Example File
1. Copy `.env.production.example` to `.env`
2. Replace all placeholder values with your actual keys
3. Never commit `.env` to git
4. Only commit `.env.example` files with placeholder values

### Verify .env is Not Tracked
```bash
git rm --cached .env
git commit -m "Remove .env from git tracking"
```

---

## 📋 SECURITY CHECKLIST

- [ ] Rotated Google Cloud API keys
- [ ] Rotated OpenAI API key
- [ ] Rotated Supabase keys
- [ ] Rotated RevenueCat keys
- [ ] Updated App Store shared secret
- [ ] Added .env to .gitignore
- [ ] Removed .env from git tracking
- [ ] Verified no keys in git history
- [ ] Updated .env with new keys
- [ ] Tested app with new keys

---

## 🔒 BEST PRACTICES

1. **Never commit API keys to git**
2. **Use environment variables for all secrets**
3. **Rotate keys regularly (every 90 days)**
4. **Use different keys for development and production**
5. **Restrict API keys to specific services**
6. **Monitor API usage for suspicious activity**
7. **Use secret management services (AWS Secrets Manager, etc.)**

---

## 📞 NEED HELP?

If you suspect your keys have been used maliciously:
1. Rotate all keys immediately
2. Check API usage logs for suspicious activity
3. Contact support for each service
4. Monitor your billing for unexpected charges

---

**Time to complete: ~30 minutes**
**Priority: CRITICAL - Do this NOW before launching**
