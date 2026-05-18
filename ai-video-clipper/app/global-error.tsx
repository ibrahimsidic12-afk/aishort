"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div
          style={{
            display: "flex",
            minHeight: "100vh",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            padding: "2rem",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          <h2 style={{ fontSize: "1.5rem", fontWeight: 600 }}>Something went wrong</h2>
          <p style={{ color: "#666", maxWidth: "400px", textAlign: "center" }}>
            {error.message || "A critical error occurred. Please try refreshing the page."}
          </p>
          {error.digest && (
            <p style={{ color: "#999", fontSize: "0.75rem" }}>Error ID: {error.digest}</p>
          )}
          <button
            onClick={reset}
            style={{
              padding: "0.5rem 1rem",
              background: "#0070f3",
              color: "#fff",
              border: "none",
              borderRadius: "0.375rem",
              cursor: "pointer",
              fontSize: "0.875rem",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
