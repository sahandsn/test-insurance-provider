import React, { useMemo, useState } from "react";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function mockSubmitApi(payload) {
  await sleep(2000);
  const receiptId = String(Math.floor(100000 + Math.random() * 900000));
  const followUpUrl = `https://example.com/followup/${receiptId}`;
  console.log("Submitted payload:", payload);
  return { receiptId, followUpUrl };
}

export default function NativeHtmlForm_Type1_Page() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const formId = useMemo(() => "patient-national-number-form", []);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setResult(null);

    const fd = new FormData(e.currentTarget);
    const patientNationalNumber = String(
      fd.get("patientNationalNumber") || ""
    ).trim();

    if (!patientNationalNumber) {
      setError("Patient national number is required.");
      return;
    }

    setLoading(true);
    try {
      const res = await mockSubmitApi({ patientNationalNumber });
      setResult(res);
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        maxWidth: 720,
        margin: "40px auto",
        padding: 16,
        fontFamily: "system-ui",
      }}
    >
      <h1 style={{ marginBottom: 6 }}>Type 1 — Native HTML Form</h1>
      <p style={{ marginTop: 0, opacity: 0.8 }}>
        Single field: <b>patient national number</b>
      </p>

      <form
        id={formId}
        onSubmit={onSubmit}
        style={{ display: "grid", gap: 12 }}
      >
        <label style={{ display: "grid", gap: 6 }}>
          <span>Patient national number</span>
          <input
            name="patientNationalNumber"
            type="text"
            placeholder="e.g. 1234567890"
            autoComplete="off"
            disabled={loading}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #ccc",
              fontSize: 14,
            }}
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #111",
            background: loading ? "#f5f5f5" : "#111",
            color: loading ? "#111" : "#fff",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Submitting (2s mock)..." : "Submit"}
        </button>
      </form>

      {error && (
        <div
          style={{
            marginTop: 14,
            padding: 12,
            borderRadius: 10,
            background: "#ffecec",
            color: "#8a1f1f",
          }}
        >
          {error}
        </div>
      )}

      {result && !error && (
        <div
          style={{
            marginTop: 14,
            padding: 12,
            borderRadius: 10,
            background: "#eefbf0",
          }}
        >
          <div>
            <b>Receipt ID:</b> {result.receiptId}
          </div>
          <div>
            <b>Follow-up:</b>{" "}
            <a href={result.followUpUrl} target="_blank" rel="noreferrer">
              {result.followUpUrl}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
