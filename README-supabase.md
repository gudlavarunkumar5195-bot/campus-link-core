# Supabase Production Setup Guide

This guide provides complete instructions for setting up this multi-tenant ERP system with Supabase in production.

## Table of Contents

1. [Environment Setup](#environment-setup)
2. [Supabase Project Creation](#supabase-project-creation)
3. [Database Migration](#database-migration)
4. [Authentication Configuration](#authentication-configuration)
5. [Environment Variables](#environment-variables)
6. [Deployment](#deployment)
7. [Production Considerations](#production-considerations)
8. [Security](#security)
9. [Monitoring](#monitoring)
10. [Troubleshooting](#troubleshooting)

## Environment Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Git
- Supabase CLI (optional but recommended)

### Install Supabase CLI (Recommended)

```bash
npm install -g supabase
```

## Supabase Project Creation

### 1. Create New Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Create new organization (if needed)
4. Click "New Project"
5. Fill in project details:
   - **Name**: Your project name (e.g., "campus-link-prod")
   - **Database Password**: Strong password (save this!)
   - **Region**: Choose closest to your users
6. Click "Create new project"

### 2. Get Project Credentials

Once created, go to Project Settings → API:

- **Project URL**: `https://your-ref.supabase.co`
- **Anon/Public Key**: `eyJ...` (starts with eyJ)
- **Service Role Key**: `eyJ...` (different from anon key)

⚠️ **IMPORTANT**: Never commit the Service Role key to your repository!

## Database Migration

### Option 1: Using Supabase CLI (Recommended)

1. **Initialize Supabase in your project**:
   ```bash
   supabase init
   ```

2. **Link to your remote project**:
   ```bash
   supabase link --project-ref your-project-ref
   ```

3. **Run migrations**:
   ```bash
   supabase db push
   ```

### Option 2: Manual SQL Execution

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Run the migration files in order:
   - `supabase/migrations/20250907100000_production_schema_setup.sql`
   - `supabase/migrations/20250907110000_rls_policies_setup.sql`
   - `supabase/migrations/20250907120000_default_data_setup.sql`

### 3. Verify Migration

Check that these tables exist:
- `schools`
- `profiles` 
- `organization_members`
- `students`, `teachers`, `staff`
- `subscriptions`, `plans`, `invoices`
- `usage_records`

## Authentication Configuration

### 1. Configure Auth Settings

In Supabase Dashboard → Authentication → Settings:

- **Site URL**: `https://yourdomain.com` (production domain)
- **Redirect URLs**: Add your production domain
- **Email Templates**: Customize as needed
- **Enable Email Confirmations**: Recommended for production

### 2. Configure Providers

Enable desired authentication providers:
- Email/Password (enabled by default)
- Google, GitHub, etc. (optional)

## Environment Variables

### 1. Create Production Environment File

Create `.env.production` (DO NOT commit):

```bash
# Frontend Variables (will be bundled)
VITE_SUPABASE_URL=https://your-ref.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Backend Variables (server-side only)
SUPABASE_URL=https://your-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
ASSIGN_TENANT_SECRET=your-secure-random-secret-here

# Optional: Connection Pooling
DATABASE_URL=postgresql://postgres:[password]@[host]:[port]/[database]?pgbouncer=true

NODE_ENV=production
```

### 2. Development Environment

Create `.env.local` for development:

```bash
VITE_SUPABASE_URL=https://your-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ASSIGN_TENANT_SECRET=dev-secret-123
```

## Deployment

### Vercel Deployment

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel --prod
   ```

3. **Set Environment Variables**:
   ```bash
   vercel env add VITE_SUPABASE_URL
   vercel env add VITE_SUPABASE_ANON_KEY
   vercel env add SUPABASE_SERVICE_ROLE_KEY
   vercel env add ASSIGN_TENANT_SECRET
   ```

### Railway Deployment

1. **Create `railway.toml`**:
   ```toml
   [build]
   builder = "nixpacks"
   
   [deploy]
   startCommand = "npm run build && npm run preview"
   
   [[services]]
   name = "campus-link"
   ```

2. **Deploy**:
   ```bash
   railway login
   railway link
   railway up
   ```

### Render Deployment

1. **Create `render.yaml`**:
   ```yaml
   services:
     - type: web
       name: campus-link
       runtime: node
       buildCommand: npm install && npm run build
       startCommand: npm run preview
       envVars:
         - key: NODE_ENV
           value: production
         - key: VITE_SUPABASE_URL
           sync: false
         - key: VITE_SUPABASE_ANON_KEY
           sync: false
         - key: SUPABASE_SERVICE_ROLE_KEY
           sync: false
         - key: ASSIGN_TENANT_SECRET
           sync: false
   ```

### Docker Deployment

1. **Create `Dockerfile`**:
   ```dockerfile
   FROM node:18-alpine
   
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   
   COPY . .
   RUN npm run build
   
   EXPOSE 4173
   CMD ["npm", "run", "preview"]
   ```

2. **Build and run**:
   ```bash
   docker build -t campus-link .
   docker run -p 4173:4173 --env-file .env.production campus-link
   ```

## Production Considerations

### Database Optimization

1. **Connection Pooling**:
   - Enable PgBouncer in Supabase Dashboard → Settings → Database
   - Use connection pooling URL for high-traffic applications

2. **Indexes**:
   - All critical indexes are included in migrations
   - Monitor slow queries in Supabase Dashboard → Logs

3. **Backup Strategy**:
   - Supabase handles daily backups automatically
   - Consider additional backup strategy for critical data

### Performance Optimization

1. **CDN Setup**:
   - Use Vercel, Cloudflare, or similar CDN
   - Enable gzip compression
   - Optimize asset loading

2. **Database Queries**:
   - Use RLS policies efficiently
   - Implement pagination for large datasets
   - Cache frequently accessed data

### Scalability

1. **Horizontal Scaling**:
   - Supabase handles database scaling
   - Use multiple serverless function deployments

2. **Monitoring**:
   - Set up alerts for API usage limits
   - Monitor database performance
   - Track user growth vs. plan limits

## Security

### Row Level Security (RLS)

✅ **Enabled on all tables** - All data is tenant-isolated

Key policies implemented:
- Users can only access data from their school/tenant
- Role-based access control (admin, teacher, student, staff)
- Secure functions prevent policy recursion

### API Security

1. **Service Role Key Protection**:
   ```bash
   # ✅ Good - Server environment only
   SUPABASE_SERVICE_ROLE_KEY=secret_key
   
   # ❌ Bad - Never in frontend
   VITE_SUPABASE_SERVICE_ROLE_KEY=secret_key
   ```

2. **Tenant Assignment Security**:
   - Uses secret header authentication
   - Validates all inputs
   - Logs all operations
   - Rate limiting recommended

### Key Rotation

**When to rotate keys**:
- Suspected security breach
- Key accidentally committed to repository
- Regular security maintenance (every 90 days)

**How to rotate Service Role Key**:

1. **Generate new key in Supabase Dashboard**:
   - Go to Settings → API
   - Click "Reset" next to Service Role Key
   - Copy new key

2. **Update environment variables**:
   ```bash
   # Update in your deployment platform
   vercel env rm SUPABASE_SERVICE_ROLE_KEY
   vercel env add SUPABASE_SERVICE_ROLE_KEY
   ```

3. **Deploy with new key**:
   ```bash
   vercel --prod
   ```

**Rotate Tenant Assignment Secret**:
```bash
# Generate new secret
openssl rand -base64 32

# Update environment
vercel env rm ASSIGN_TENANT_SECRET
vercel env add ASSIGN_TENANT_SECRET
```

## Monitoring

### Supabase Dashboard

Monitor these metrics:
- **API Requests**: Track usage vs. plan limits
- **Database Size**: Monitor storage usage
- **Active Users**: Track authentication events
- **Logs**: Check for errors and performance issues

### Application Monitoring

Recommended tools:
- **Sentry**: Error tracking
- **LogRocket**: User session recording
- **Plausible**: Privacy-friendly analytics

### Alerts Setup

Set up alerts for:
- API rate limit approaching
- Database storage > 80% full
- Authentication errors spike
- Payment failures (when billing enabled)

## Troubleshooting

### Common Issues

**1. RLS Policy Errors**
```
Error: new row violates row-level security policy
```
**Solution**: Ensure user has proper tenant_id and role in user_metadata

**2. Infinite Recursion in RLS**
```
Error: infinite recursion detected in policy
```
**Solution**: Use security definer functions (already implemented in migrations)

**3. Environment Variable Issues**
```
Error: VITE_SUPABASE_URL is not defined
```
**Solution**: Check environment variable configuration in deployment platform

**4. Serverless Function Timeouts**
```
Error: Function timeout
```
**Solution**: Optimize database queries and add proper indexes

### Debug Commands

**Check Supabase connection**:
```bash
supabase status
```

**Test migrations locally**:
```bash
supabase db reset
supabase db push
```

**View logs**:
```bash
supabase functions logs assignTenant
```

### Support

- **Supabase Support**: [supabase.com/support](https://supabase.com/support)
- **Community**: [supabase.com/discord](https://supabase.com/discord)
- **Documentation**: [supabase.com/docs](https://supabase.com/docs)

---

## Migration Log

| Date | Migration | Description |
|------|-----------|-------------|
| 2025-01-07 | `20250907100000` | Production schema setup with all tables |
| 2025-01-07 | `20250907110000` | RLS policies and security functions |
| 2025-01-07 | `20250907120000` | Default data and utility functions |

---

**Last Updated**: January 7, 2025
**Version**: 1.0.0