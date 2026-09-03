export interface BrowserDbClient {
  from: () => never;
  auth: {
    getUser: () => Promise<{ data: { user: null }; error: null }>;
    getSession: () => Promise<{ data: { session: null }; error: null }>;
    signOut: () => Promise<{ error: null }>;
  };
}

/**
 * Browser-safe stub client — ensures Node.js postgres driver is never bundled into client JS.
 */
export function createBrowserClient(): BrowserDbClient {
  return {
    from: () => {
      throw new Error(
        "Direct database queries are not supported in the browser. Use Server Actions or API routes."
      );
    },
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      signOut: async () => ({ error: null }),
    },
  };
}
