import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// Deterministic-ish mock data based on id:
function hashNumber(str) {
  let h = 0;
  const s = String(str || "");
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function makeMockPatient(id) {
  const h = hashNumber(id);
  const firstNames = [
    "Ali",
    "Sara",
    "Omar",
    "Mona",
    "Youssef",
    "Nour",
    "Hana",
    "Karim",
  ];
  const lastNames = [
    "Hassan",
    "Ibrahim",
    "Saleh",
    "Farouk",
    "Khaled",
    "Mostafa",
    "Samir",
    "Nasser",
  ];
  const cities = [
    "Cairo",
    "Alexandria",
    "Giza",
    "Riyadh",
    "Jeddah",
    "Dubai",
    "Amman",
    "Doha",
  ];

  const first = firstNames[h % firstNames.length];
  const last = lastNames[(h >>> 3) % lastNames.length];
  const city = cities[(h >>> 7) % cities.length];

  return {
    fullName: `${first} ${last}`,
    nationalNumber: String(1000000000 + (h % 9000000000)), // 10 digits-ish
    phone: `+20 1${String(100000000 + (h % 900000000)).slice(0, 9)}`,
    city,
  };
}

function makeMockMedicines(id) {
  const h = hashNumber(id);
  const meds = [
    { title: "Amoxicillin", dose: "500mg" },
    { title: "Ibuprofen", dose: "200mg" },
    { title: "Paracetamol", dose: "1g" },
    { title: "Metformin", dose: "850mg" },
    { title: "Atorvastatin", dose: "20mg" },
    { title: "Omeprazole", dose: "20mg" },
  ];

  // pick 2..4 medicines
  const count = 2 + (h % 3);
  const out = [];
  for (let i = 0; i < count; i++) {
    out.push(meds[(h + i * 13) % meds.length]);
  }
  return out;
}

async function mockFetchReceiptByIdApi(id) {
  await sleep(2000);

  const receiptId = String(id);
  const followUpUrl = `https://example.com/followup/${receiptId}`;

  return {
    receiptId,
    followUpUrl,
    patient: makeMockPatient(receiptId),
    medicines: makeMockMedicines(receiptId),
  };
}

export default function ReceiptPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setErr(null);
      try {
        const res = await mockFetchReceiptByIdApi(id);
        if (cancelled) return;

        // If followUpUrl was passed via navigation state, you can prefer it:
        const passedFollowUpUrl = location.state && location.state.followUpUrl;
        setData({
          ...res,
          followUpUrl: passedFollowUpUrl || res.followUpUrl,
        });
      } catch (e) {
        console.error(e);
        if (cancelled) return;
        setErr("Failed to load receipt.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [id, location.state]);

  return (
    <div
      style={{
        maxWidth: 980,
        margin: "40px auto",
        padding: 16,
        fontFamily: "system-ui",
      }}
    >
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <h1 style={{ margin: 0 }}>Receipt</h1>
        <div style={{ marginLeft: "auto" }}>
          <button
            onClick={() => nav("/hard")}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #111",
              background: "#fff",
            }}
          >
            Back to form
          </button>
        </div>
      </div>

      {loading && (
        <div
          style={{
            marginTop: 16,
            padding: 12,
            borderRadius: 10,
            background: "#f3f3f3",
          }}
        >
          Loading receipt <b>{id}</b> (2s mock)...
        </div>
      )}

      {err && (
        <div
          style={{
            marginTop: 16,
            padding: 12,
            borderRadius: 10,
            background: "#ffecec",
            color: "#8a1f1f",
          }}
        >
          {err}
        </div>
      )}

      {!loading && data && (
        <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
          {/* 1) the given id */}
          <div
            style={{ padding: 12, borderRadius: 12, border: "1px solid #ddd" }}
          >
            <div style={{ opacity: 0.7 }}>1) Receipt ID</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>
              {data.receiptId}
            </div>
          </div>

          {/* 2) followup url */}
          <div
            style={{ padding: 12, borderRadius: 12, border: "1px solid #ddd" }}
          >
            <div style={{ opacity: 0.7 }}>2) Follow-up URL</div>
            <a href={data.followUpUrl} target="_blank" rel="noreferrer">
              {data.followUpUrl}
            </a>
          </div>

          {/* 3) mock patient info */}
          <div
            style={{ padding: 12, borderRadius: 12, border: "1px solid #ddd" }}
          >
            <div style={{ opacity: 0.7, marginBottom: 8 }}>
              3) Patient Info (mock)
            </div>
            <div>
              <b>Name:</b> {data.patient.fullName}
            </div>
            <div>
              <b>National #:</b> {data.patient.nationalNumber}
            </div>
            <div>
              <b>Phone:</b> {data.patient.phone}
            </div>
            <div>
              <b>City:</b> {data.patient.city}
            </div>
          </div>

          {/* 4) mock patient medicines */}
          <div
            style={{ padding: 12, borderRadius: 12, border: "1px solid #ddd" }}
          >
            <div style={{ opacity: 0.7, marginBottom: 8 }}>
              4) Medicines (mock)
            </div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {data.medicines.map((m, i) => (
                <li key={i}>
                  <b>{m.title}</b> — {m.dose}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
