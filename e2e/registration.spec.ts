import { test, expect } from "@playwright/test";

// This test verifies the registration form works correctly
test("registration form validation", async ({ page }) => {
  // Generate unique test user
  const testEmail = `test-user-${Date.now()}@example.com`;
  const testName = "Test User";
  const testPassword = "SecurePass123!";

  // Navigate to registration page
  await page.goto("/register");

  // Verify registration form is displayed
  await expect(page.locator("h2")).toContainText("Create your account");

  // Fill out registration form
  await page.fill('input[name="name"]', testName);
  await page.fill('input[name="email"]', testEmail);
  await page.fill('input[name="password"]', testPassword);

  // Verify form fields have correct values
  await expect(page.locator('input[name="name"]')).toHaveValue(testName);
  await expect(page.locator('input[name="email"]')).toHaveValue(testEmail);
  await expect(page.locator('input[name="password"]')).toHaveValue(
    testPassword
  );

  // Verify submit button is enabled
  await expect(page.locator('button[type="submit"]')).toBeEnabled();

  // Test form validation - empty name
  await page.fill('input[name="name"]', "");
  await page.click('button[type="submit"]');
  // Form should not submit with empty required fields
  await expect(page).toHaveURL("/register");

  // Restore valid name and test
  await page.fill('input[name="name"]', testName);

  // Note: In a real environment, we would complete the registration
  // But for testing purposes, we'll stop here to avoid creating real users
  console.log("Registration form validation test completed successfully");
});

// This test verifies the login link works
test("registration page has working login link", async ({ page }) => {
  // Navigate to registration page
  await page.goto("/register");

  // Verify "Already have an account? Sign in" link exists and works
  const loginLink = page.locator(
    'a:has-text("Already have an account? Sign in")'
  );
  await expect(loginLink).toBeVisible();

  // Click the login link
  await loginLink.click();

  // Verify we're redirected to the login page
  await expect(page).toHaveURL("/login");

  // Verify login form is displayed
  await expect(page.locator("body")).toContainText("Sign in to your account");
});
