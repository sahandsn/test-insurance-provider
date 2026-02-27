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

function emptyMedicine() {
  return { title: "", dose: "" };
}

export default function ControlledComponents_Type2_Page() {
  const [medicines, setMedicines] = useState([emptyMedicine()]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const canRemove = useMemo(() => medicines.length > 1, [medicines.length]);

  function updateMedicine(index, patch) {
    setMedicines((prev) =>
      prev.map((m, i) => (i === index ? { ...m, ...patch } : m))
    );
  }

  function addItem() {
    setMedicines((prev) => [...prev, emptyMedicine()]);
  }

  function removeItem(index) {
    setMedicines((prev) => prev.filter((_, i) => i !== index));
  }

  async function submit() {
    setError(null);
    setResult(null);

    const cleaned = medicines.map((m) => ({
      title: String(m.title || "").trim(),
      dose: String(m.dose || "").trim() || null,
    }));

    if (cleaned.some((m) => !m.title)) {
      setError("Each medicine must have a title.");
      return;
    }

    setLoading(true);
    try {
      const res = await mockSubmitApi({ medicines: cleaned });
      setResult(res);
      setMedicines([emptyMedicine()]);
    } catch (e) {
      console.error(e);
      setError("Submission failed. Please retry.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "40px auto",
        padding: 16,
        fontFamily: "system-ui",
      }}
    >
      <h1 style={{ marginBottom: 6 }}>Type 2 — Controlled Components</h1>
      <p style={{ marginTop: 0, opacity: 0.8 }}>
        Dynamic list of medicines:{" "}
        <code>{"{ title: string; dose?: string | null }"}</code>
      </p>

      <div style={{ display: "grid", gap: 12 }}>
        {medicines.map((m, idx) => (
          <div
            key={idx}
            style={{
              display: "grid",
              gridTemplateColumns: "1.4fr 1fr auto",
              gap: 10,
              alignItems: "end",
              padding: 12,
              borderRadius: 12,
              border: "1px solid #ddd",
            }}
          >
            <label style={{ display: "grid", gap: 6 }}>
              <span>Title</span>
              <input
                value={m.title}
                onChange={(e) => updateMedicine(idx, { title: e.target.value })}
                placeholder="e.g. Amoxicillin"
                disabled={loading}
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid #ccc",
                }}
              />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span>Dose (optional)</span>
              <input
                value={m.dose || ""}
                onChange={(e) => updateMedicine(idx, { dose: e.target.value })}
                placeholder="e.g. 500mg"
                disabled={loading}
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid #ccc",
                }}
              />
            </label>

            <button
              type="button"
              disabled={loading || !canRemove}
              onClick={() => removeItem(idx)}
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #999",
                background: loading || !canRemove ? "#f5f5f5" : "#fff",
                cursor: loading || !canRemove ? "not-allowed" : "pointer",
              }}
              title={!canRemove ? "Keep at least one item" : "Remove item"}
            >
              Remove
            </button>
          </div>
        ))}

        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={addItem}
            disabled={loading}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #111",
              background: "#fff",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            + Add medicine
          </button>

          <button
            type="button"
            onClick={submit}
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
        </div>

        {error && (
          <div
            style={{
              padding: 12,
              borderRadius: 10,
              background: "#ffecec",
              color: "#8a1f1f",
            }}
          >
            {error}
          </div>
        )}

        {result && (
          <div style={{ padding: 12, borderRadius: 10, background: "#eefbf0" }}>
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
    </div>
  );
}
