import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="terms-page">
      <p>
        <Link href="/">← Back to eligibility check</Link>
      </p>
      <h1>Terms of use & privacy</h1>
      <p>
        By using this Warmer Kiwi Homes eligibility tool (“the Tool”), you agree to the following
        terms. This Tool is provided as a convenience for homeowners and is not an official EECA
        service.
      </p>

      <h2>1. Consent to address checks</h2>
      <p>
        When you submit an address, you consent to us looking up that address against third-party
        data sources, including:
      </p>
      <ul>
        <li>
          AddressRight / Terranet address data (the same address service used by EECA’s public
          eligibility checker)
        </li>
        <li>
          The Energy Efficiency and Conservation Authority (EECA) Warmer Kiwi Homes qualify service,
          to identify whether an existing insulation or heating application may already exist for
          the property
        </li>
        <li>
          The NZDep2023 Index of Deprivation (University of Otago / EHINZ / Massey ArcGIS map), to
          determine the Statistical Area 1 (SA1) deprivation decile used for funding bands
        </li>
      </ul>

      <h2>2. What we collect</h2>
      <p>We may collect and store:</p>
      <ul>
        <li>The address you select and related identifiers</li>
        <li>Your answers about occupancy, home age, and Community Services Card status</li>
        <li>Eligibility outcomes, NZDep decile, and EECA claim indicators</li>
        <li>Optional contact details and messages you provide</li>
        <li>The date and time of your submission</li>
      </ul>
      <p>
        Submissions are saved locally (SQLite) for this sandbox deployment and emailed to a preset
        team inbox so we can follow up.
      </p>

      <h2>3. How results are used</h2>
      <p>
      Results are indicative only. EECA and approved providers make the final decision on grants.
      An “existing claim” flag means EECA’s system reported prior ceiling and underfloor insulation
      at the address (the same signal shown as “our records show your house already has ceiling and
      underfloor insulation”) and/or an open insulation or heating application. Claims from roughly
      the last 10–15 years are usually declined for second funding; please leave circumstances and
      how long since the last claim so we can advise.
      </p>

      <h2>4. Accuracy</h2>
      <p>
        Address, deprivation, and EECA data may be incomplete, delayed, or unavailable. Funding
        percentages shown (50% / 80% / 90%) follow the bands configured for this Tool and may change
        if official programme rules change.
      </p>

      <h2>5. Your responsibilities</h2>
      <p>
        Only submit addresses you are authorised to check. Do not use the Tool for unlawful
        purposes. If you are checking on behalf of someone else, you must have their permission.
      </p>

      <h2>6. Contact</h2>
      <p>
        Questions about this Tool can be sent to{" "}
        <a href="mailto:insulator.dan@gmail.com">insulator.dan@gmail.com</a>. For official programme
        help, contact EECA on 0800 749 782 or visit the{" "}
        <a
          href="https://www.eeca.govt.nz/co-funding-and-support/products/warmer-kiwi-homes-programme/"
          target="_blank"
          rel="noreferrer"
        >
          Warmer Kiwi Homes programme page
        </a>
        .
      </p>

      <h2>7. Changes</h2>
      <p>
        We may update these terms as the Tool evolves. Continued use after changes constitutes
        acceptance of the updated terms.
      </p>
    </main>
  );
}
