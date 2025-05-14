# Deployment Scripts

This directory contains scripts that are used during deployment to set up and configure the application in production.

## Available Scripts

### `setup_demo_user.py`

This script sets up the demo user and its data in the production database. It:

1. Checks if the demo user exists, creates it if not
2. Adds sample transactions and subscriptions for the demo user
3. Uses direct SQL queries to avoid issues with Enum types

#### Usage

```bash
# From the backend directory
python -m scripts.deployment.setup_demo_user
```

#### When to Run

This script should be run:

- After a fresh deployment to ensure the demo user has data
- When you want to refresh the demo user's data
- When you've made changes to the demo user data structure

#### Implementation Notes

The script uses direct SQL queries instead of SQLAlchemy models to avoid issues with Enum types. This is because the database schema might have VARCHAR columns where the SQLAlchemy models use Enum types.

## Deployment Process

1. Deploy the application to production
2. Run database migrations if needed
3. Run the setup_demo_user.py script to ensure the demo user has data

```bash
# Example deployment commands
git push railway main  # Deploy to Railway
python -m scripts.deployment.setup_demo_user  # Set up demo user
```

## Troubleshooting

### Enum Type Issues

If you encounter errors related to Enum types (e.g., "type 'billingfrequency' does not exist"), it means there's a mismatch between the SQLAlchemy model definitions and the actual database schema. The scripts in this directory use direct SQL queries to avoid these issues.

### Database Connection Issues

If you encounter database connection issues, make sure:

1. The DATABASE_URL environment variable is correctly set
2. The database is accessible from the deployment environment
3. The user has the necessary permissions to create and modify data

## Adding New Scripts

When adding new deployment scripts:

1. Place them in this directory
2. Use the same pattern of direct SQL queries to avoid Enum type issues
3. Update this README with information about the new script
4. Test the script in a staging environment before running it in production
