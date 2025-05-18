# Testing Guide for Life Dashboard

This document provides instructions on how to run the automated tests for the Life Dashboard application.

## Overview

The Life Dashboard application includes several types of tests:

1. **Frontend Unit Tests**: Tests for React components and utility functions using Jest and React Testing Library.
2. **Backend Unit Tests**: Tests for FastAPI endpoints and services using pytest.
3. **End-to-End Tests**: Tests for complete user flows using Playwright.

## Running Frontend Tests

### Prerequisites

Make sure you have all dependencies installed:

```bash
npm install
```

### Running Unit Tests

To run all frontend tests:

```bash
npm test
```

To run tests in watch mode (tests will re-run when files change):

```bash
npm run test:watch
```

To run a specific test file:

```bash
npm test -- src/__tests__/auth/login.test.tsx
```

## Running Backend Tests

### Prerequisites

Make sure you have activated the virtual environment and installed the required packages:

```bash
cd backend
source venv/bin/activate
pip install pytest pytest-cov httpx
```

### Running Unit Tests

To run all backend tests:

```bash
cd backend
python -m pytest
```

To run tests with coverage report:

```bash
cd backend
pytest --cov=app
```

To run a specific test file:

```bash
cd backend
pytest tests/api/test_auth.py
```

## Running End-to-End Tests

### Prerequisites

Make sure you have installed Playwright:

```bash
npx playwright install
```

### Running E2E Tests

To run all E2E tests:

```bash
npm run test:e2e
```

To run a specific E2E test file:

```bash
npx playwright test e2e/registration.spec.ts
```

To run E2E tests with UI mode (interactive):

```bash
npx playwright test --ui
```

## Continuous Integration

The tests are configured to run automatically in the CI/CD pipeline before deployment. The workflow is as follows:

1. When code is pushed to the repository, the CI/CD pipeline is triggered.
2. Frontend and backend tests are run in parallel.
3. If all tests pass, the deployment process continues.
4. If any tests fail, the deployment is halted, and the team is notified.

## Test Coverage

To generate a test coverage report:

- Frontend: `npm test -- --coverage`
- Backend: `cd backend && pytest --cov=app --cov-report=html`

The coverage reports will show which parts of the codebase are covered by tests and which parts need more testing.

## Adding New Tests

When adding new features or fixing bugs, it's recommended to add corresponding tests:

1. For new React components, add unit tests in the `src/__tests__` directory.
2. For new API endpoints, add tests in the `backend/tests/api` directory.
3. For critical user flows, add E2E tests in the `e2e` directory.

## Troubleshooting

If you encounter issues running the tests:

1. Make sure all dependencies are installed.
2. Check that the virtual environment is activated for backend tests.
3. Ensure the test database configuration is correct.
4. For E2E tests, make sure the application is not already running on the test ports.
