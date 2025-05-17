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
  const originalFetch = window.fetch;

  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
    // Only intercept requests to our API
    const inputUrl = typeof input === "string" ? input : input.url;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    if (inputUrl.includes(apiUrl)) {
      try {
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

          // Redirect to login page
          window.location.href = "/login";

          // Create a cloned response to return
          // This prevents the original code from trying to process the response further
          return new Response(
            JSON.stringify({ error: "Authentication failed" }),
            {
              status: 401,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        return response;
      } catch (error) {
        // For network errors, just pass through
        throw error;
      }
    }

    // For non-API requests, use the original fetch
    return originalFetch(input, init);
  };
};
