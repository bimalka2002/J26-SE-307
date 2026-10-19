type Variant = "good" | "blurry" | "dark" | "far";

const examples: { variant: Variant; ok: boolean; caption: string }[] = [
  { variant: "good", ok: true, caption: "Bright, sharp and close up" },
  { variant: "blurry", ok: false, caption: "Blurry or shaky" },
  { variant: "dark", ok: false, caption: "Too dark or shadowed" },
  { variant: "far", ok: false, caption: "Too far away" },
];

const TEETH_X = [27, 38, 49, 60, 71, 82];

function Illustration({ variant }: { variant: Variant }) {
  const id = `tip-${variant}`;
  const mouth = (
    <g>
      <ellipse cx="60" cy="46" rx="38" ry="21" fill="#7a2f3b" />
      <g clipPath={`url(#${id}-clip)`}>
        <g fill="#fff" stroke="#dfe3e8" strokeWidth="0.8">
          {TEETH_X.map((x) => (
            <rect key={`t${x}`} x={x} y="26" width="10" height="15" rx="3" />
          ))}
          {TEETH_X.map((x) => (
            <rect key={`b${x}`} x={x} y="52" width="10" height="14" rx="3" />
          ))}
        </g>
      </g>
      <ellipse cx="60" cy="46" rx="38" ry="21" fill="none" stroke="#c2575f" strokeWidth="4" />
    </g>
  );

  return (
    <svg viewBox="0 0 120 90" role="img" aria-hidden className="app-tip-art">
      <defs>
        <clipPath id={`${id}-clip`}>
          <ellipse cx="60" cy="46" rx="38" ry="21" />
        </clipPath>
        <filter id={`${id}-blur`}>
          <feGaussianBlur stdDeviation="2.6" />
        </filter>
      </defs>
      <rect width="120" height="90" rx="10" fill="#f1d3c8" />
      {variant === "far" ? (
        <g>
          <ellipse cx="60" cy="46" rx="44" ry="42" fill="#ecc3b4" />
          <circle cx="55" cy="38" r="1.6" fill="#b88574" />
          <circle cx="65" cy="38" r="1.6" fill="#b88574" />
          <g transform="translate(60 56) scale(0.32) translate(-60 -46)">{mouth}</g>
        </g>
      ) : variant === "blurry" ? (
        <g filter={`url(#${id}-blur)`}>{mouth}</g>
      ) : (
        mouth
      )}
      {variant === "dark" ? <rect width="120" height="90" rx="10" fill="#0b0f1a" opacity="0.66" /> : null}
      {variant === "good" ? <circle cx="96" cy="16" r="5" fill="#fff" opacity="0.55" /> : null}
    </svg>
  );
}

export function PhotoTips() {
  return (
    <details className="app-tips" open>
      <summary>
        <span>Tips for a good photo</span>
        <svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden>
          <path d="M3 6l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>

      <ul className="app-tip-grid">
        {examples.map((example) => (
          <li key={example.variant} className={example.ok ? "is-good" : "is-bad"}>
            <Illustration variant={example.variant} />
            <p>
              <span className="app-tip-mark" aria-hidden>
                {example.ok ? "✓" : "✕"}
              </span>
              <span className="sr-only">{example.ok ? "Good: " : "Avoid: "}</span>
              {example.caption}
            </p>
          </li>
        ))}
      </ul>

      <ul className="app-tip-list">
        <li>Use bright, even light, such as daylight or a lamp. Turn off filters.</li>
        <li>Open wide and show the area you are worried about. Keep lips and fingers out of the way.</li>
        <li>Hold the phone steady and tap to focus before you take the photo.</li>
        <li>For an X-ray, upload the original image file rather than a photo of a screen or print.</li>
      </ul>
      <p className="app-tip-note">The illustrations above are simple drawings, not real patients.</p>
    </details>
  );
}
