import { Button } from "@/components/ui/Button";

const avatars = ["AR", "NP", "IK", "SM"];

const cards = [
  {
    value: "80%",
    tone: "primary" as const,
    text: "Faster clarity: get structured oral insights from your scans — including early risk signals, clean summaries, and share-ready reports.",
  },
  {
    value: "40%",
    tone: "soft" as const,
    text: "Smarter follow-up: keep history organized and reduce back-and-forth when reviewing findings with a clinician or research team.",
  },
];

export function Membership() {
  return (
    <section id="membership" className="dv-membership">
      <div className="dv-membership-grid">
        <div className="dv-membership-copy">
          <h2>Your oral health matters: discover our free OralScan membership.</h2>
          <p>
            Unlock clearer wellness decisions for yourself and your family. Create an account for
            guided capture, AI-assisted analysis, and reports you can actually use.
          </p>

          <div className="dv-membership-proof">
            <div className="dv-avatars" aria-hidden>
              {avatars.map((initials) => (
                <span key={initials} className="dv-avatar">
                  {initials}
                </span>
              ))}
              <span className="dv-avatar dv-avatar-plus">+</span>
            </div>
            <p>Embark on a journey of clearer insights and brighter smiles</p>
            <svg className="dv-scribble" viewBox="0 0 120 40" aria-hidden>
              <path
                d="M4 28 C 30 4, 70 4, 96 22"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path d="M88 16 l12 8 -14 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <Button href="/register" className="dv-membership-cta">
              Join Membership
            </Button>
          </div>
        </div>

        <div id="services" className="dv-membership-cards">
          {cards.map((card) => (
            <article key={card.value} className={`dv-benefit-card dv-benefit-${card.tone}`}>
              <div className="dv-benefit-top">
                <strong>{card.value}</strong>
                <span className="dv-smile" aria-hidden>
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <circle cx="12" cy="12" r="9" />
                    <circle cx="9" cy="10" r="1" fill="currentColor" />
                    <circle cx="15" cy="10" r="1" fill="currentColor" />
                    <path d="M8.5 14.5c1.2 1.4 5.8 1.4 7 0" />
                  </svg>
                </span>
              </div>
              <p>{card.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
