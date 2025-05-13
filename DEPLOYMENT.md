# Deployment Guide

This guide provides instructions for deploying the application to Railway.

## Backend Deployment

### Prerequisites

- A Railway account
- Git repository connected to Railway

### Deployment Steps

1. Push your code to your Git repository
2. Connect your repository to Railway
3. Configure the environment variables in Railway:
   - `DATABASE_URL`: Your PostgreSQL database URL
   - `SECRET_KEY`: Your JWT secret key
   - `OPENAI_API_KEY`: Your OpenAI API key
   - Other environment variables as needed

### Handling Migration Issues

If you encounter migration issues during deployment, follow these steps:

1. SSH into your Railway instance or use the Railway CLI
2. Navigate to the backend directory
3. Run the fix_migrations.py script:

```bash
cd backend
python fix_migrations.py
```

This script will:

- Wait for the database to be available
- Try multiple approaches to fix the migration issues
- Show the final migration state

The script tries the following approaches in order:

1. Upgrade to heads directly
2. Upgrade to the final merge head
3. Stamp the database with the final merge head
4. Stamp with the latest revision
5. Create a new merge migration and upgrade

If the script doesn't resolve the issue, you can try these manual steps:

1. Check the current migration state:

```bash
cd backend
source venv/bin/activate
alembic current
```

2. Check all migration heads:

```bash
alembic heads
```

3. Merge all heads:

```bash
alembic merge heads -m "merge_all_heads"
```

4. Upgrade to the merged head:

```bash
alembic upgrade heads
```

5. If all else fails, you can use the emergency fix script:

```bash
python emergency_fix.py
```

This emergency script directly manipulates the alembic_version table in the database to set the current version to the latest revision. Only use this as a last resort if all other approaches fail.

## Frontend Deployment

1. Push your code to your Git repository
2. Connect your repository to Railway or Vercel
3. Configure the environment variables:
   - `NEXT_PUBLIC_API_URL`: URL of your backend API

## Troubleshooting

### Database Migration Errors

If you see errors like:

```
KeyError: 'add_ai_insights_tables'
```

This indicates that there's a missing migration file or a reference to a migration that doesn't exist. Use the fix_migrations.py script to resolve this issue.

### OpenAI API Errors

If you encounter OpenAI API errors, check:

1. Your OpenAI API key is correctly set in the environment variables
2. Your OpenAI account has sufficient credits
3. The API version in your code matches the one you're subscribed to

### Other Issues

For other deployment issues, check the Railway logs for more details.
