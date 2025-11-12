#!/bin/bash

# 🚀 Glow Check - Recurring Referral System Setup Script
# This script helps you deploy the webhook and configure everything

set -e  # Exit on error

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🎯 Glow Check Recurring Referral Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Configuration
SUPABASE_PROJECT_REF="jsvzqgtqkanscjoafyoi"
SUPABASE_URL="https://jsvzqgtqkanscjoafyoi.supabase.co"
WEBHOOK_FUNCTION_NAME="revenuecat-webhook"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if Supabase CLI is installed
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 1: Checking Supabase CLI"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if ! command -v supabase &> /dev/null; then
    print_error "Supabase CLI not found"
    echo ""
    print_info "Installing Supabase CLI..."
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install supabase/tap/supabase
            print_success "Supabase CLI installed via Homebrew"
        else
            print_error "Homebrew not found. Please install from: https://brew.sh"
            exit 1
        fi
    else
        # Linux or Windows
        print_info "Please install Supabase CLI manually:"
        echo "  npm install -g supabase"
        echo "  or visit: https://supabase.com/docs/guides/cli"
        exit 1
    fi
else
    print_success "Supabase CLI found: $(supabase --version)"
fi
echo ""

# Login to Supabase
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 2: Login to Supabase"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_info "Checking if already logged in..."
if supabase projects list &> /dev/null; then
    print_success "Already logged in to Supabase"
else
    print_info "Please login to Supabase..."
    supabase login
    print_success "Logged in successfully"
fi
echo ""

# Link project
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 3: Link Supabase Project"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_info "Linking to project: $SUPABASE_PROJECT_REF"
echo "Database password: Autobio123!"
supabase link --project-ref $SUPABASE_PROJECT_REF
print_success "Project linked successfully"
echo ""

# Create webhook function directory
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 4: Prepare Webhook Function"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_info "Creating function directory..."
mkdir -p supabase/functions/$WEBHOOK_FUNCTION_NAME

if [ -f "revenuecat-webhook-handler.ts" ]; then
    cp revenuecat-webhook-handler.ts supabase/functions/$WEBHOOK_FUNCTION_NAME/index.ts
    print_success "Webhook function copied"
else
    print_error "revenuecat-webhook-handler.ts not found!"
    print_info "Please ensure the file exists in the project root"
    exit 1
fi
echo ""

# Deploy webhook function
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 5: Deploy Webhook Function"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_info "Deploying $WEBHOOK_FUNCTION_NAME..."
supabase functions deploy $WEBHOOK_FUNCTION_NAME --no-verify-jwt
print_success "Webhook deployed successfully!"
echo ""

# Display webhook URL
WEBHOOK_URL="${SUPABASE_URL}/functions/v1/${WEBHOOK_FUNCTION_NAME}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Deployment Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
print_success "Your webhook URL:"
echo -e "${GREEN}$WEBHOOK_URL${NC}"
echo ""

# Next steps
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Next Steps:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
print_warning "1. Get Supabase Service Role Key:"
echo "   → Open: https://supabase.com/dashboard/project/$SUPABASE_PROJECT_REF/settings/api"
echo "   → Copy the 'service_role' key"
echo ""
print_warning "2. Set Environment Variables:"
echo "   → Go to: https://supabase.com/dashboard/project/$SUPABASE_PROJECT_REF/functions/$WEBHOOK_FUNCTION_NAME/settings"
echo "   → Add environment variable:"
echo "     Key: SUPABASE_SERVICE_ROLE_KEY"
echo "     Value: [paste the service role key]"
echo ""
print_warning "3. Run Database Setup:"
echo "   → Open: https://supabase.com/dashboard/project/$SUPABASE_PROJECT_REF/sql/new"
echo "   → Copy contents of: recurring-referral-system-setup.sql"
echo "   → Paste and click RUN"
echo ""
print_warning "4. Configure RevenueCat Webhook:"
echo "   → Open RevenueCat Dashboard"
echo "   → Go to: Project Settings → Integrations → Webhooks"
echo "   → Click '+ Add Webhook'"
echo "   → URL: $WEBHOOK_URL"
echo "   → Enable events: INITIAL_PURCHASE, RENEWAL, CANCELLATION, EXPIRATION"
echo "   → Click Save"
echo ""
print_info "5. Test the System:"
echo "   → Create test user and get referral code"
echo "   → Create second user with that code"
echo "   → Subscribe as second user"
echo "   → Check database for commission records"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
print_success "Setup script completed! Follow the next steps above."
echo ""
echo "Need help? Check:"
echo "  • PRODUCTION_RECURRING_REFERRAL_SETUP.md"
echo "  • REFERRAL_QUICK_START.md"
echo "  • REFERRAL_VISUAL_FLOW.md"
echo ""
