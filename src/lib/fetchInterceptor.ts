import Cookies from "js-cookie";

/**
 * Intercepts fetch requests to handle authentication errors
 * If a 401 Unauthorized error is received, it will clear the token and redirect to login
 */
export const fetchWithAuth = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  // Get the token
  const token = Cookies.get("token");

  // Add the Authorization header if token exists
  const headers = {
    ...options.headers,
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  // Make the request
  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle 401 Unauthorized errors
  if (response.status === 401) {
    // Clear the token
    Cookies.remove("token");

    // Store a message in sessionStorage
    sessionStorage.setItem(
      "auth_message",
      "Your session has expired. Please log in again."
    );

    // Redirect to login page
    window.location.href = "/login";
  }

  return response;
};

/**
 * Global fetch interceptor that can be used to patch the global fetch function
 * This should be called once at the application startup
 */
export const setupFetchInterceptor = () => {
  // Check if we've already set up the interceptor to avoid double-patching
  if ((window as any).__fetchInterceptorInstalled) {
    return;
  }

  const originalFetch = window.fetch;

  // Track the last time we redirected to prevent multiple redirects
  let lastRedirectTime = 0;
  const REDIRECT_COOLDOWN = 2000; // 2 seconds cooldown between redirects

  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
    // First, handle the case where input might be undefined or null
    if (!input) {
      return originalFetch(input as any, init);
    }

    try {
      // Only intercept requests to our API
      const inputUrl =
        typeof input === "string" ? input : (input as Request).url;

      // Skip interception for Next.js internal requests and RSC
      if (
        !inputUrl ||
        inputUrl.includes("_next/") ||
        inputUrl.includes("?_rsc=") ||
        inputUrl.includes("/_next/")
      ) {
        return originalFetch(input, init);
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      // Only intercept API requests
      if (apiUrl && inputUrl.includes(apiUrl)) {
        const response = await originalFetch(input, init);

        // Handle 401 Unauthorized errors
        if (response.status === 401) {
          // Clear the token
          Cookies.remove("token");

          // Store a message in sessionStorage
          sessionStorage.setItem(
            "auth_message",
            "Your session has expired. Please log in again."
          );

          // Only redirect if we haven't redirected recently
          const now = Date.now();
          if (now - lastRedirectTime > REDIRECT_COOLDOWN) {
            lastRedirectTime = now;

            // Check if we're already on the login page to avoid redirect loops
            if (!window.location.pathname.includes("/login")) {
              // Use a timeout to allow current operations to complete
              setTimeout(() => {
                window.location.href = "/login";
              }, 100);
            }
          }

          // Create a cloned response to return
          return new Response(
            JSON.stringify({ error: "Authentication failed" }),
            {
              status: 401,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        return response;
      }
    } catch (error) {
      console.error("Fetch interceptor error:", error);
    }

    // For all other requests, use the original fetch
    return originalFetch(input, init);
  };

  // Mark that we've installed the interceptor
  (window as any).__fetchInterceptorInstalled = true;
};
