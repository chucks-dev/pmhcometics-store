"use client";
import { useState } from "react";
import { Alert, useToast } from "@/components/ui/feedback";
import { Button, Chip } from "@/components/ui/forms";
import { api, ApiError } from "@/lib/api";
import { GOAL_OPTIONS, INTEREST_OPTIONS, SKIN_TYPE_OPTIONS } from "@/lib/constants";

interface Prefs { skinType: string | null; interests: string[]; goals: string[] }
const toggle = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

/** wizard = onboarding (one question per screen). single = /account/preferences (all at once). */
export function PreferencesForm({ initial, wizard }: { initial?: Prefs | null; wizard?: boolean }) {
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [skin, setSkin] = useState(initial?.skinType ?? "");
  const [interests, setInterests] = useState(initial?.interests ?? []);
  const [goals, setGoals] = useState(initial?.goals ?? []);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");

  const save = async () => {
    setBusy(true); setErr("");
    try {
      const r = await api<{ redirect: string }>("/api/account/preferences", { method: "PUT", body: { skinType: skin || "not_sure", interests, goals } });
      if (wizard) window.location.href = r.redirect; else { toast("Preferences saved"); setBusy(false); }
    } catch (e) { setErr(e instanceof ApiError ? e.message : "Couldn't save. Try again."); setBusy(false); }
  };

  const q1 = (<fieldset><legend className="text-2xl font-display">What&apos;s your skin type?</legend>
    <div className="mt-4 flex flex-wrap gap-2.5">{SKIN_TYPE_OPTIONS.map((o) => <Chip key={o.value} selected={skin === o.value} onClick={() => setSkin(o.value)}>{o.label}</Chip>)}</div></fieldset>);
  const q2 = (<fieldset><legend className="text-2xl font-display">What are you into?</legend><p className="mt-1 text-sm text-muted">Pick as many as you like.</p>
    <div className="mt-4 flex flex-wrap gap-2.5">{INTEREST_OPTIONS.map((o) => <Chip key={o.value} selected={interests.includes(o.value)} onClick={() => setInterests(toggle(interests, o.value))}>{o.label}</Chip>)}</div></fieldset>);
  const q3 = (<fieldset><legend className="text-2xl font-display">What are your beauty goals?</legend><p className="mt-1 text-sm text-muted">Pick as many as you like.</p>
    <div className="mt-4 flex flex-wrap gap-2.5">{GOAL_OPTIONS.map((o) => <Chip key={o.value} selected={goals.includes(o.value)} onClick={() => setGoals(toggle(goals, o.value))}>{o.label}</Chip>)}</div></fieldset>);

  if (!wizard) return <div className="space-y-8">{q1}{q2}{q3}{err && <Alert>{err}</Alert>}<Button loading={busy} onClick={save}>Save preferences</Button></div>;
  const steps = [q1, q2, q3];
  return (
    <div>
      <p className="mb-4 text-sm text-muted">Step {step + 1} of 3</p>
      <div className="mb-6 h-1.5 rounded-full bg-line"><div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${((step + 1) / 3) * 100}%` }} /></div>
      {steps[step]}
      {err && <div className="mt-4"><Alert>{err}</Alert></div>}
      <div className="mt-8 flex gap-3">
        {step > 0 && <Button variant="outline" onClick={() => setStep(step - 1)}>Back</Button>}
        {step < 2 ? <Button className="flex-1" disabled={step === 0 && !skin} onClick={() => setStep(step + 1)}>Continue</Button> : <Button className="flex-1" loading={busy} onClick={save}>See my picks</Button>}
      </div>
    </div>
  );
}
