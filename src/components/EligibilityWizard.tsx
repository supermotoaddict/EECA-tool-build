"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import type {
  AddressSuggestion,
  ClaimScenario,
  EligibilityResult,
  Occupancy,
} from "@/lib/types";

type Step = "address" | "occupancy" | "built" | "csc" | "checking" | "results";

const CLAIM_SCENARIOS: { value: ClaimScenario; label: string }[] = [
  { value: "still_cold", label: "The house still feels cold" },
  { value: "new_owner", label: "I’m a new owner (previous owner may have claimed)" },
  { value: "incomplete_install", label: "Insulation may be incomplete / a component was missed" },
  { value: "other", label: "Other" },
];

export default function EligibilityWizard() {
  const [step, setStep] = useState<Step>("address");
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [address, setAddress] = useState<AddressSuggestion | null>(null);
  const [occupancy, setOccupancy] = useState<Occupancy | null>(null);
  const [builtBefore2008, setBuiltBefore2008] = useState<boolean | null>(null);
  const [hasCsc, setHasCsc] = useState<boolean | null>(null);
  const [consent, setConsent] = useState(false);
  const [result, setResult] = useState<EligibilityResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [contactMessage, setContactMessage] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [yearsSinceClaim, setYearsSinceClaim] = useState("");
  const [claimScenario, setClaimScenario] = useState<ClaimScenario>("");
  const [submitStatus, setSubmitStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = query.trim();
    if (trimmed.length < 3 || address?.label === query) {
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/address?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setSuggestions(data.results ?? []);
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 280);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, address?.label]);

  function selectAddress(item: AddressSuggestion) {
    setAddress(item);
    setQuery(item.label);
    setSuggestions([]);
  }

  function onAddressInput(value: string) {
    setAddress(null);
    setQuery(value);
    if (value.trim().length < 3) setSuggestions([]);
  }

  function runCheck() {
    if (!address || occupancy == null || builtBefore2008 == null || hasCsc == null || !consent) {
      return;
    }
    setStep("checking");
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            address,
            occupancy,
            builtBefore2008,
            hasCommunityServicesCard: hasCsc,
            consent: true,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Check failed");
        setResult(data.result);
        setStep("results");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Check failed");
        setStep("csc");
      }
    });
  }

  async function submitResults() {
    if (!result) return;
    setSubmitStatus(null);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          result,
          contactMessage,
          contactName,
          contactEmail,
          contactPhone,
          yearsSinceClaim,
          claimScenario,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submit failed");
      setSubmitStatus(
        `Saved (#${data.submissionId}). ${data.email?.detail ?? "Notification queued."}`
      );
    } catch (err) {
      setSubmitStatus(err instanceof Error ? err.message : "Submit failed");
    }
  }

  function restart() {
    setStep("address");
    setQuery("");
    setAddress(null);
    setOccupancy(null);
    setBuiltBefore2008(null);
    setHasCsc(null);
    setConsent(false);
    setResult(null);
    setError(null);
    setContactMessage("");
    setContactName("");
    setContactEmail("");
    setContactPhone("");
    setYearsSinceClaim("");
    setClaimScenario("");
    setSubmitStatus(null);
  }

  const claimFormReady =
    !result?.eeca.hasExistingClaim ||
    (Boolean(contactMessage.trim()) &&
      Boolean(yearsSinceClaim.trim()) &&
      Boolean(claimScenario));

  const stepIndex =
    step === "address"
      ? 1
      : step === "occupancy"
        ? 2
        : step === "built"
          ? 3
          : step === "csc" || step === "checking"
            ? 4
            : 5;

  return (
    <div className="wizard">
      <div className="progress" aria-hidden="true">
        {[1, 2, 3, 4].map((n) => (
          <span key={n} className={n <= stepIndex ? "dot active" : "dot"} />
        ))}
      </div>

      {step === "address" && (
        <section className="panel">
          <h2>What is your address?</h2>
          <p className="lead">Start typing a New Zealand address and select it from the list.</p>
          <label className="field">
            <span className="sr-only">Address</span>
            <input
              type="text"
              value={query}
              onChange={(e) => onAddressInput(e.target.value)}
              placeholder="e.g. 10 Adelaide Street, Queenstown"
              autoComplete="off"
              aria-autocomplete="list"
            />
          </label>
          {searching && <p className="hint">Searching addresses…</p>}
          {suggestions.length > 0 && (
            <ul className="suggestions" role="listbox">
              {suggestions.map((s) => (
                <li key={s.id}>
                  <button type="button" onClick={() => selectAddress(s)}>
                    {s.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <label className="consent">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            <span>
              By using this tool, you consent to us checking your address against EECA and NZDep2023
              data sources.{" "}
              <Link href="/terms">Find out more</Link>
            </span>
          </label>
          <div className="actions">
            <button
              type="button"
              className="btn primary"
              disabled={!address || !consent}
              onClick={() => setStep("occupancy")}
            >
              Continue
            </button>
          </div>
        </section>
      )}

      {step === "occupancy" && (
        <section className="panel">
          <h2>Are you the homeowner, or is this a rental?</h2>
          <p className="lead">Warmer Kiwi Homes is only available for owner-occupied homes.</p>
          <div className="choices">
            <button
              type="button"
              className={occupancy === "owner" ? "choice selected" : "choice"}
              onClick={() => setOccupancy("owner")}
            >
              I am the owner-occupier
            </button>
            <button
              type="button"
              className={occupancy === "rental" ? "choice selected" : "choice"}
              onClick={() => setOccupancy("rental")}
            >
              This is a rental property
            </button>
          </div>
          {occupancy === "rental" && (
            <div className="alert warn">
              Rental properties are <strong>not eligible</strong> for the Warmer Kiwi Homes grant.
              You can still continue to see a full summary, but the result will be not eligible.
            </div>
          )}
          <div className="actions">
            <button type="button" className="btn ghost" onClick={() => setStep("address")}>
              Back
            </button>
            <button
              type="button"
              className="btn primary"
              disabled={!occupancy}
              onClick={() => setStep("built")}
            >
              Continue
            </button>
          </div>
        </section>
      )}

      {step === "built" && (
        <section className="panel">
          <h2>Was your home built before 2008?</h2>
          <p className="lead">Homes built in 2008 or later do not qualify for this grant.</p>
          <div className="choices">
            <button
              type="button"
              className={builtBefore2008 === true ? "choice selected" : "choice"}
              onClick={() => setBuiltBefore2008(true)}
            >
              Yes — built before 2008
            </button>
            <button
              type="button"
              className={builtBefore2008 === false ? "choice selected" : "choice"}
              onClick={() => setBuiltBefore2008(false)}
            >
              No — built in 2008 or later
            </button>
          </div>
          {builtBefore2008 === false && (
            <div className="alert warn">
              Homes built in 2008 or later are <strong>not eligible</strong>.
            </div>
          )}
          <div className="actions">
            <button type="button" className="btn ghost" onClick={() => setStep("occupancy")}>
              Back
            </button>
            <button
              type="button"
              className="btn primary"
              disabled={builtBefore2008 === null}
              onClick={() => setStep("csc")}
            >
              Continue
            </button>
          </div>
        </section>
      )}

      {step === "csc" && (
        <section className="panel">
          <h2>Do you have a Community Services Card?</h2>
          <p className="lead">
            A Community Services Card or SuperGold Combo Card qualifies you for the maximum 90%
            funding, regardless of deprivation zone.
          </p>
          <div className="choices">
            <button
              type="button"
              className={hasCsc === true ? "choice selected" : "choice"}
              onClick={() => setHasCsc(true)}
            >
              Yes
            </button>
            <button
              type="button"
              className={hasCsc === false ? "choice selected" : "choice"}
              onClick={() => setHasCsc(false)}
            >
              No
            </button>
          </div>
          {error && <div className="alert error">{error}</div>}
          <div className="actions">
            <button type="button" className="btn ghost" onClick={() => setStep("built")}>
              Back
            </button>
            <button
              type="button"
              className="btn primary"
              disabled={hasCsc === null || isPending}
              onClick={runCheck}
            >
              Check eligibility
            </button>
          </div>
        </section>
      )}

      {step === "checking" && (
        <section className="panel checking">
          <div className="spinner" aria-hidden="true" />
          <h2>Checking your address…</h2>
          <p className="lead">
            Looking up NZDep2023 funding zone and checking EECA for any existing claim. This can take
            a few seconds.
          </p>
        </section>
      )}

      {step === "results" && result && (
        <section className="panel results">
          <div
            className={
              result.eeca.hasExistingClaim
                ? "badge warn"
                : result.eligible
                  ? "badge ok"
                  : "badge no"
            }
          >
            {result.eeca.hasExistingClaim
              ? "Existing claim on record"
              : result.eligible
                ? "Likely eligible"
                : "Not eligible"}
          </div>
          <h2>{result.answers.addressLabel}</h2>

          <div className="result-grid">
            <div>
              <h3>Government funding</h3>
              <p className="big">
                {result.fundingPercent != null ? `${result.fundingPercent}%` : "—"}
              </p>
              <p className="muted">{result.fundingReason}</p>
            </div>
            <div>
              <h3>NZDep2023</h3>
              <p className="big">{result.nzDep?.decile ?? "—"}</p>
              <p className="muted">
                SA1 {result.nzDep?.sa1Code ?? "—"}
                {result.nzDep?.sa2Name ? ` · ${result.nzDep.sa2Name}` : ""}
              </p>
            </div>
            <div>
              <h3>Existing EECA claim</h3>
              <p className="big">{result.eeca.hasExistingClaim ? "Yes" : "No"}</p>
              <p className="muted">
                {result.eeca.checked
                  ? result.eeca.hasExistingClaim
                    ? "EECA’s records show prior insulation work and/or an open application for this address."
                    : "No prior insulation claim found on EECA’s system for this address."
                  : result.eeca.error
                    ? `EECA check incomplete: ${result.eeca.error}`
                    : "EECA check was skipped for this path."}
              </p>
            </div>
          </div>

          {result.ineligibleReason && (
            <div className="alert warn">{result.ineligibleReason}</div>
          )}

          {result.eeca.hasExistingClaim && (
            <div className="alert warn claim-alert">
              <p>
                <strong>Existing claim detected.</strong>
              </p>
              {result.eeca.claimSummary && (
                <p className="eeca-quote">“{result.eeca.claimSummary}”</p>
              )}
              <p>
                Claims completed in roughly the last 10–15 years are almost always rejected by EECA
                for a second grant — unless an installer missed a component, or another special
                circumstance applies. New owners of a previously claimed home usually do not qualify
                for second funding.
              </p>
              <p>
                Please tell us about your situation below so we can advise whether anything can still
                be done.
              </p>
            </div>
          )}

          <div className="contact-block">
            <h3>
              {result.eeca.hasExistingClaim
                ? "Tell us about your inquiry"
                : "Send results to our team"}
            </h3>
            <p className="muted">
              {result.eeca.hasExistingClaim
                ? "These details are required so we can review your circumstances and email our team."
                : "We’ll email a summary to our team. Add your details if you’d like a follow-up."}
            </p>
            <div className="fields-row">
              <label>
                Name
                <input value={contactName} onChange={(e) => setContactName(e.target.value)} />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                />
              </label>
              <label>
                Phone
                <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
              </label>
            </div>

            {result.eeca.hasExistingClaim && (
              <>
                <label className="field">
                  How long since the last claim / insulation work?
                  <input
                    type="text"
                    value={yearsSinceClaim}
                    onChange={(e) => setYearsSinceClaim(e.target.value)}
                    placeholder="e.g. about 8 years, or 2015, or unsure"
                    required
                  />
                </label>
                <fieldset className="scenario-set">
                  <legend>What best describes your situation?</legend>
                  <div className="choices">
                    {CLAIM_SCENARIOS.map((s) => (
                      <button
                        key={s.value}
                        type="button"
                        className={claimScenario === s.value ? "choice selected" : "choice"}
                        onClick={() => setClaimScenario(s.value)}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </fieldset>
              </>
            )}

            <label className="field">
              {result.eeca.hasExistingClaim
                ? "Circumstances (required)"
                : "Optional message"}
              <textarea
                rows={4}
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                placeholder={
                  result.eeca.hasExistingClaim
                    ? "e.g. The house still feels cold in winter; we bought the home last year and weren’t the ones who claimed…"
                    : "Anything else we should know?"
                }
                required={result.eeca.hasExistingClaim}
              />
            </label>
            <div className="actions">
              <button type="button" className="btn ghost" onClick={restart}>
                Start over
              </button>
              <button
                type="button"
                className="btn primary"
                disabled={!claimFormReady}
                onClick={submitResults}
              >
                Email results
              </button>
            </div>
            {submitStatus && <p className="hint">{submitStatus}</p>}
          </div>
        </section>
      )}
    </div>
  );
}
