"use client";

// Catches failures in the root layout itself, so it must render its own
// html/body and cannot rely on any shared styling.
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="tr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
          color: "#0A0D18",
          background: "#FFFFFF",
        }}
      >
        <div style={{ maxWidth: 480 }}>
          <h1 style={{ fontSize: "1.75rem", lineHeight: 1.2, margin: 0, letterSpacing: "-0.03em" }}>
            Beklenmeyen bir hata oluştu.
          </h1>
          <p style={{ marginTop: "1rem", fontSize: "1rem", lineHeight: 1.6, color: "#5C6273" }}>
            Sayfayı yeniden yüklemeyi dene. Sorun devam ederse lütfen bize bildir.
          </p>
          {error.digest && (
            <p style={{ marginTop: "0.75rem", fontSize: "0.75rem", color: "#656B7A" }}>Hata kodu: {error.digest}</p>
          )}
          <button
            type="button"
            onClick={() => unstable_retry()}
            style={{
              marginTop: "2rem",
              height: 50,
              padding: "0 1.75rem",
              border: 0,
              borderRadius: 11,
              background: "#1C56F3",
              color: "#FFFFFF",
              fontSize: "1rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Tekrar dene
          </button>
        </div>
      </body>
    </html>
  );
}
