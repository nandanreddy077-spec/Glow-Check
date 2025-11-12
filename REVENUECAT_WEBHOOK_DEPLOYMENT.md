# RevenueCat Webhook Deployment Guide

## Overview
This guide walks you through deploying the RevenueCat webhook to handle recurring referral commissions automatically.

---

## Prerequisites
✅ Supabase account with project created
✅ Supabase CLI installed
✅ RevenueCat account configured
✅ Database setup completed (referral tables and functions)

---

## Step 1: Install Supabase CLI

### On Mac:
```bash
brew install supabase/tap/supabase
```

### On Windows:
```bash
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### On Linux:
```bash
brew install supabase/tap/supabase
```

---

## Step 2: Login to Supabase

```bash
supabase login
```

This will open a browser to authenticate. Follow the prompts.

---

## Step 3: Link Your Project

```bash
supabase link --project-ref jsvzqgtqkanscjoafyoi
```

When prompted for the database password, use your Supabase database password.

---

## Step 4: Create Function Directory Structure

```bash
mkdir -p supabase/functions/revenuecat-webhook
```

---

## Step 5: Create the Webhook Function

Create file: `supabase/functions/revenuecat-webhook/index.ts`

Copy the content from your `revenuecat-webhook-handler.ts` file into it.

I'll create this for you:
