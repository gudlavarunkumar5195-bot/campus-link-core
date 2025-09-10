# Super Admin Setup Guide

## What is a Super Admin?

A Super Admin is a special administrator role that can manage multiple schools/organizations in the system. They have access to:

- **Super Admin Dashboard** - Manage all organizations
- **Create Organizations** - Add new schools to the system
- **Invite Users** - Send invitations to users across organizations
- **Manage Plans** - Handle subscription and licensing
- **System Analytics** - View system-wide analytics

## How to Create a Super Admin

### Method 1: SQL Update (Recommended)

1. **Find the user ID** you want to make a super admin:
   ```sql
   SELECT id, email, first_name, last_name, role, school_id 
   FROM profiles 
   WHERE email = 'admin@example.com';
   ```

2. **Update the user to be a super admin**:
   ```sql
   UPDATE profiles 
   SET role = 'admin', school_id = NULL 
   WHERE email = 'admin@example.com';
   ```

   **Note:** Super admins have `role = 'admin'` and `school_id = NULL`

### Method 2: Using Edge Function

You can also create a super admin through the system by calling the admin functions once you have at least one super admin set up.

## Accessing Super Admin Features

Once you have super admin privileges:

1. **Login** to the system with your super admin account
2. **Navigate** - You'll see "Super Admin" in the navigation menu
3. **Access Dashboard** - Click "Super Admin" to access the full dashboard

## Super Admin Features

### 1. Organization Management
- View all organizations/schools
- Create new organizations
- Suspend/activate organizations
- View organization details and subscriptions

### 2. User Management
- View all users across organizations
- Send invitations to new users
- Assign roles and permissions
- Manage user access

### 3. Billing & Plans
- Manage subscription plans
- View billing information
- Handle plan upgrades/downgrades

## Security Notes

- Super admins have elevated privileges - only assign to trusted personnel
- Super admins can access data across all organizations
- Always use strong passwords and enable 2FA when available
- Regularly audit super admin access

## Troubleshooting

### I don't see the Super Admin menu
- Verify your profile has `role = 'admin'` and `school_id = NULL`
- Log out and log back in to refresh permissions
- Check the browser console for any errors

### I can't create organizations
- Ensure you have proper super admin privileges
- Check that the required edge functions are deployed
- Verify database permissions are set correctly

## Contact

For technical support or questions about super admin setup, please refer to the system documentation or contact your technical administrator.