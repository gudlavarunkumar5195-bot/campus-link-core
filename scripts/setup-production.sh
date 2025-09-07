#!/bin/bash

# Production Setup Script for Campus Link
# This script helps set up the production environment

set -e

echo "🚀 Campus Link Production Setup"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if required commands exist
check_dependencies() {
    echo "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm"
        exit 1
    fi
    
    print_info "Dependencies check passed"
}

# Install project dependencies
install_dependencies() {
    echo "Installing project dependencies..."
    npm ci
    print_info "Dependencies installed"
}

# Setup environment variables
setup_environment() {
    echo "Setting up environment variables..."
    
    if [ ! -f .env.example ]; then
        print_error ".env.example file not found"
        exit 1
    fi
    
    if [ ! -f .env.production ]; then
        print_warning "Creating .env.production from .env.example"
        cp .env.example .env.production
        
        echo ""
        echo "📝 Please edit .env.production and update the following:"
        echo "   - VITE_SUPABASE_URL (your production Supabase URL)"
        echo "   - VITE_SUPABASE_ANON_KEY (your production anon key)"
        echo "   - SUPABASE_SERVICE_ROLE_KEY (your service role key)"
        echo "   - ASSIGN_TENANT_SECRET (generate a secure secret)"
        echo ""
        read -p "Press Enter after updating .env.production..."
    fi
    
    print_info "Environment setup complete"
}

# Generate secure secrets
generate_secrets() {
    echo "Generating secure secrets..."
    
    # Generate ASSIGN_TENANT_SECRET if not set
    if ! grep -q "ASSIGN_TENANT_SECRET=your-secure-random-secret-here" .env.production; then
        SECRET=$(openssl rand -base64 32)
        sed -i "s/ASSIGN_TENANT_SECRET=your-secure-random-secret-here/ASSIGN_TENANT_SECRET=$SECRET/" .env.production
        print_info "Generated ASSIGN_TENANT_SECRET"
    fi
}

# Build the application
build_application() {
    echo "Building application for production..."
    
    # Load environment variables
    if [ -f .env.production ]; then
        export $(grep -v '^#' .env.production | xargs)
    fi
    
    npm run build
    print_info "Application built successfully"
}

# Validate Supabase connection
validate_supabase() {
    echo "Validating Supabase connection..."
    
    # Check if Supabase CLI is installed
    if command -v supabase &> /dev/null; then
        print_info "Supabase CLI found"
        
        # Try to validate connection
        if [ ! -z "$SUPABASE_URL" ] && [ ! -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
            print_info "Supabase credentials found in environment"
        else
            print_warning "Supabase credentials not found in environment"
        fi
    else
        print_warning "Supabase CLI not installed. Run: npm install -g supabase"
    fi
}

# Setup Docker (optional)
setup_docker() {
    echo "Setting up Docker configuration..."
    
    if command -v docker &> /dev/null; then
        print_info "Docker found"
        
        echo "Building Docker image..."
        docker build -t campus-link:latest .
        print_info "Docker image built successfully"
        
        echo "Test Docker container (optional):"
        echo "  docker run -p 4173:4173 --env-file .env.production campus-link:latest"
    else
        print_warning "Docker not installed. Skipping Docker setup"
    fi
}

# Display deployment instructions
show_deployment_instructions() {
    echo ""
    echo "🎉 Production setup complete!"
    echo ""
    echo "📋 Next Steps:"
    echo "=============="
    echo ""
    echo "1. Supabase Project Setup:"
    echo "   - Create new project at https://supabase.com"
    echo "   - Run migrations: supabase db push"
    echo "   - Configure authentication providers"
    echo ""
    echo "2. Deploy to your preferred platform:"
    echo ""
    echo "   Vercel:"
    echo "   -------"
    echo "   vercel --prod"
    echo "   vercel env add VITE_SUPABASE_URL"
    echo "   vercel env add VITE_SUPABASE_ANON_KEY"
    echo "   vercel env add SUPABASE_SERVICE_ROLE_KEY"
    echo "   vercel env add ASSIGN_TENANT_SECRET"
    echo ""
    echo "   Railway:"
    echo "   --------"
    echo "   railway login"
    echo "   railway link"
    echo "   railway up"
    echo ""
    echo "   Render:"
    echo "   -------"
    echo "   git push origin main"
    echo "   (Configure environment variables in Render dashboard)"
    echo ""
    echo "3. Security Checklist:"
    echo "   - Verify RLS policies are enabled"
    echo "   - Test multi-tenant isolation"
    echo "   - Set up monitoring and alerts"
    echo "   - Configure backup strategy"
    echo ""
    echo "📖 For detailed instructions, see README-supabase.md"
    echo ""
}

# Main execution
main() {
    check_dependencies
    install_dependencies
    setup_environment
    generate_secrets
    build_application
    validate_supabase
    
    # Ask if user wants Docker setup
    echo ""
    read -p "Set up Docker? (y/N): " setup_docker_choice
    if [[ $setup_docker_choice =~ ^[Yy]$ ]]; then
        setup_docker
    fi
    
    show_deployment_instructions
}

# Run main function
main "$@"