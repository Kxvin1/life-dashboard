# Migration Instructions

This document provides instructions for applying the `is_demo_user` migration to the production database.

## Issue

The production database is missing the `is_demo_user` column in the `users` table, which is causing 500 errors when trying to use authentication features.

## Solution

We need to apply the migration that adds the `is_demo_user` column to the `users` table in the production database.

## Steps

### Option 1: Using Alembic (Recommended)

1. SSH into the Railway server or use the Railway CLI:

```bash
railway login
railway shell
```

2. Navigate to the backend directory:

```bash
cd backend
```

3. Run the Alembic migration:

```bash
alembic upgrade head
```

### Option 2: Using the Custom Migration Script

If Option 1 doesn't work, you can use the custom migration script:

1. SSH into the Railway server or use the Railway CLI:

```bash
railway login
railway shell
```

2. Navigate to the backend directory:

```bash
cd backend
```

3. Run the migration script:

```bash
python -m scripts.utils.apply_migration
```

### Option 3: Manual SQL (Last Resort)

If both Option 1 and Option 2 don't work, you can execute the SQL directly:

1. Connect to the Railway PostgreSQL database:

```bash
railway connect postgresql
```

2. Run the following SQL commands:

```sql
ALTER TABLE users ADD COLUMN is_demo_user BOOLEAN DEFAULT FALSE;
UPDATE users SET is_demo_user = FALSE;
ALTER TABLE users ALTER COLUMN is_demo_user SET NOT NULL;
DELETE FROM alembic_version;
INSERT INTO alembic_version (version_num) VALUES ('add_is_demo_user_field');
```

## Verification

After applying the migration, you can verify that it was successful by running:

```bash
python -m scripts.utils.check_migrations
```

This should show that the `is_demo_user` column exists in the `users` table and that the current migration version is `add_is_demo_user_field`.

## Troubleshooting

If you encounter any issues, check the Railway logs for error messages:

```bash
railway logs
```

If you see errors related to the migration, you may need to try a different approach or contact the database administrator for assistance.
