import Link from "next/link";
import EligibilityWizard from "@/components/EligibilityWizard";

export default function HomePage() {
  return (
    <div className="site">
      <header className="hero">
        <div className="hero-media" aria-hidden="true" />
        <div className="hero-inner">
          <p className="brand">Warmer Kiwi Homes</p>
          <h1>Check if your home may qualify for a government insulation grant.</h1>
          <p className="hero-sub">
            Answer a few questions. We’ll check your address, funding zone, and whether there’s an
            existing EECA claim.
          </p>
          <a className="hero-cta" href="#check">
            Start eligibility check
          </a>
        </div>
      </header>

      <main>
        <section id="check" className="form-section" aria-label="Eligibility form">
          <div className="form-shell">
            <EligibilityWizard />
          </div>
        </section>

        <section className="about" aria-label="About the grant">
          <div className="about-grid">
            <div>
              <h2>Warm, dry homes for New Zealand families</h2>
              <p>
                Warmer Kiwi Homes can cover a large share of approved ceiling and underfloor
                insulation. Funding depends on whether you hold a Community Services Card, or live in
                a higher deprivation area (NZDep zones 5–10).
              </p>
              <p>
                This tool is an independent helper for homeowners. Final eligibility is always
                confirmed by EECA and an approved service provider.
              </p>
            </div>
            <div className="about-visuals" aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/insulation-detail.png" alt="" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/brand-atmosphere.png" alt="" />
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <p>
          Not affiliated with EECA.{" "}
          <Link href="/terms">Terms &amp; privacy</Link>
          {" · "}
          <a
            href="https://www.eeca.govt.nz/co-funding-and-support/products/warmer-kiwi-homes-programme/"
            target="_blank"
            rel="noreferrer"
          >
            Official EECA programme
          </a>
        </p>
      </footer>
    </div>
  );
}
