import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDebouncedValue } from "@mantine/hooks";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { useNavigate } from "react-router-dom";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// Validate API: accepted only if trimmed length >= 10
async function mockValidateFieldApi(input) {
  await sleep(250);
  return { accepted: String(input || "").trim().length >= 10 };
}

// Submit API: 2s delay, returns receipt id + followup url
async function mockSubmitApi(payload) {
  await sleep(2000);
  const receiptId = String(Math.floor(100000 + Math.random() * 900000));
  const followUpUrl = `https://example.com/followup/${receiptId}`;
  console.log("Submitted payload:", payload);
  return { receiptId, followUpUrl };
}

function keyOf(index, field) {
  return `${index}:${field}`;
}

export default function HardFormPage() {
  const navigate = useNavigate();

  const { control, handleSubmit, reset } = useForm({
    defaultValues: { medicines: [{ title: "", dose: "" }] },
    mode: "onSubmit",
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "medicines",
  });

  const medicinesLive = useWatch({ control, name: "medicines" }) || [];
  const [medicinesDebounced] = useDebouncedValue(medicinesLive, 1000);

  const [statusMap, setStatusMap] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // prevent revalidating same text
  const lastValidatedRef = useRef({});

  const canRemove = useMemo(() => fields.length > 1, [fields.length]);
  const lastIndex = fields.length - 1;

  const lastTitleStatus = statusMap[keyOf(lastIndex, "title")] || "idle";
  const lastDoseStatus = statusMap[keyOf(lastIndex, "dose")] || "idle";
  const canAddNewItem =
    lastTitleStatus === "accepted" && lastDoseStatus === "accepted";

  const allAccepted = useMemo(() => {
    return fields.every((_, i) => {
      const t = statusMap[keyOf(i, "title")] || "idle";
      const d = statusMap[keyOf(i, "dose")] || "idle";
      return t === "accepted" && d === "accepted";
    });
  }, [fields, statusMap]);

  // Debounced validation: every change -> wait 1s -> validate each field
  useEffect(() => {
    let cancelled = false;

    async function run() {
      for (let i = 0; i < medicinesDebounced.length; i++) {
        const title =
          (medicinesDebounced[i] && medicinesDebounced[i].title) || "";
        const dose =
          (medicinesDebounced[i] && medicinesDebounced[i].dose) || "";

        const pairs = [
          { field: "title", value: title },
          { field: "dose", value: dose },
        ];

        for (const p of pairs) {
          const k = keyOf(i, p.field);
          const prevValue = lastValidatedRef.current[k];

          if (prevValue === p.value) continue;
          lastValidatedRef.current[k] = p.value;

          if (!String(p.value || "").trim()) {
            setStatusMap((s) => ({ ...s, [k]: "idle" }));
            continue;
          }

          setStatusMap((s) => ({ ...s, [k]: "pending" }));

          try {
            const res = await mockValidateFieldApi(p.value);
            if (cancelled) return;
            setStatusMap((s) => ({
              ...s,
              [k]: res.accepted ? "accepted" : "rejected",
            }));
          } catch (e) {
            console.error(e);
            if (cancelled) return;
            setStatusMap((s) => ({ ...s, [k]: "rejected" }));
          }
        }
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [medicinesDebounced]);

  function addItem() {
    if (!canAddNewItem) return;
    append({ title: "", dose: "" });
  }

  function removeItemAt(index) {
    remove(index);

    // rebuild statusMap and lastValidated to reindex items
    setStatusMap((prev) => {
      const next = {};
      for (let i = 0; i < fields.length; i++) {
        if (i === index) continue;
        const newIndex = i < index ? i : i - 1;

        next[keyOf(newIndex, "title")] = prev[keyOf(i, "title")] || "idle";
        next[keyOf(newIndex, "dose")] = prev[keyOf(i, "dose")] || "idle";
      }
      return next;
    });

    const prevValidated = lastValidatedRef.current;
    const nextValidated = {};
    for (let i = 0; i < fields.length; i++) {
      if (i === index) continue;
      const newIndex = i < index ? i : i - 1;

      nextValidated[keyOf(newIndex, "title")] =
        prevValidated[keyOf(i, "title")] || "";
      nextValidated[keyOf(newIndex, "dose")] =
        prevValidated[keyOf(i, "dose")] || "";
    }
    lastValidatedRef.current = nextValidated;
  }

  function badge(status) {
    const base = {
      fontSize: 12,
      padding: "2px 8px",
      borderRadius: 999,
      border: "1px solid #ddd",
      alignSelf: "center",
      whiteSpace: "nowrap",
    };
    const text =
      status === "idle"
        ? "idle"
        : status === "pending"
        ? "validating..."
        : status === "accepted"
        ? "accepted"
        : "rejected";
    const bg =
      status === "accepted"
        ? "#eaf8ee"
        : status === "rejected"
        ? "#ffecec"
        : status === "pending"
        ? "#f3f3f3"
        : "#fff";
    const color =
      status === "accepted"
        ? "#126b2f"
        : status === "rejected"
        ? "#8a1f1f"
        : "#333";
    return <span style={{ ...base, background: bg, color }}>{text}</span>;
  }

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);

    if (!allAccepted) {
      setSubmitError(
        "All fields must be accepted (>= 10 chars) before submitting."
      );
      return;
    }

    setSubmitLoading(true);
    try {
      const payload = {
        medicines: values.medicines.map((m) => ({
          title: String(m.title || "").trim(),
          dose: String(m.dose || "").trim(),
        })),
      };

      const res = await mockSubmitApi(payload);

      // reset form state (optional)
      reset({ medicines: [{ title: "", dose: "" }] });
      setStatusMap({});
      lastValidatedRef.current = {};

      // IMPORTANT: do not show result here -> route to /recept/:id
      navigate(`/recept/${res.receiptId}`, {
        replace: true,
        state: { followUpUrl: res.followUpUrl }, // optional: pass along
      });
    } catch (e) {
      console.error(e);
      setSubmitError("Submission failed. Please retry.");
    } finally {
      setSubmitLoading(false);
    }
  });

  return (
    <div
      style={{
        maxWidth: 980,
        margin: "40px auto",
        padding: 16,
        fontFamily: "system-ui",
      }}
    >
      <h1 style={{ marginBottom: 6 }}>Hard Form — RHF + Mantine debounce</h1>
      <p style={{ marginTop: 0, opacity: 0.8 }}>
        Accepted if <b>length ≥ 10</b>. You can add a new item only when the{" "}
        <b>last</b> title and dose are accepted.
      </p>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        {fields.map((f, idx) => {
          const titleStatus = statusMap[keyOf(idx, "title")] || "idle";
          const doseStatus = statusMap[keyOf(idx, "dose")] || "idle";

          return (
            <div
              key={f.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1.4fr auto 1fr auto",
                gap: 10,
                alignItems: "end",
                padding: 12,
                borderRadius: 12,
                border: "1px solid #ddd",
              }}
            >
              <div style={{ display: "grid", gap: 6 }}>
                <label
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                  }}
                >
                  <span>Title</span>
                  {badge(titleStatus)}
                </label>
                <Controller
                  control={control}
                  name={`medicines.${idx}.title`}
                  render={({ field }) => (
                    <input
                      {...field}
                      value={field.value || ""}
                      placeholder="min 10 chars"
                      disabled={submitLoading}
                      autoComplete="off"
                      style={{
                        padding: "10px 12px",
                        borderRadius: 10,
                        border: "1px solid #ccc",
                        width: "100%",
                      }}
                    />
                  )}
                />
              </div>

              <div style={{ opacity: 0.7, alignSelf: "center" }}>+</div>

              <div style={{ display: "grid", gap: 6 }}>
                <label
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                  }}
                >
                  <span>Dose</span>
                  {badge(doseStatus)}
                </label>
                <Controller
                  control={control}
                  name={`medicines.${idx}.dose`}
                  render={({ field }) => (
                    <input
                      {...field}
                      value={field.value || ""}
                      placeholder="min 10 chars"
                      disabled={submitLoading}
                      autoComplete="off"
                      style={{
                        padding: "10px 12px",
                        borderRadius: 10,
                        border: "1px solid #ccc",
                        width: "100%",
                      }}
                    />
                  )}
                />
              </div>

              <button
                type="button"
                onClick={() => removeItemAt(idx)}
                disabled={submitLoading || !canRemove}
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid #999",
                  background: submitLoading || !canRemove ? "#f5f5f5" : "#fff",
                  cursor:
                    submitLoading || !canRemove ? "not-allowed" : "pointer",
                }}
                title={!canRemove ? "Keep at least one item" : "Remove item"}
              >
                Remove
              </button>
            </div>
          );
        })}

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            type="button"
            onClick={addItem}
            disabled={submitLoading || !canAddNewItem}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #111",
              background: submitLoading || !canAddNewItem ? "#f5f5f5" : "#fff",
              cursor:
                submitLoading || !canAddNewItem ? "not-allowed" : "pointer",
            }}
            title={
              !canAddNewItem
                ? "Last item must be accepted (both fields) to add."
                : "Add medicine"
            }
          >
            + Add medicine
          </button>

          <button
            type="submit"
            disabled={submitLoading || !allAccepted}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #111",
              background: submitLoading ? "#f5f5f5" : "#111",
              color: submitLoading ? "#111" : "#fff",
              cursor: submitLoading || !allAccepted ? "not-allowed" : "pointer",
              opacity: !allAccepted ? 0.6 : 1,
            }}
            title={
              !allAccepted ? "All fields must be accepted to submit." : "Submit"
            }
          >
            {submitLoading ? "Submitting (2s mock)..." : "Submit"}
          </button>

          <div style={{ marginLeft: "auto", opacity: 0.8, fontSize: 13 }}>
            Items: <b>{fields.length}</b>
          </div>
        </div>

        {submitError && (
          <div
            style={{
              padding: 12,
              borderRadius: 10,
              background: "#ffecec",
              color: "#8a1f1f",
            }}
          >
            {submitError}
          </div>
        )}
      </form>
    </div>
  );
}
