import Link from "next/link";

const columns = [
  {
    title: "Product",
    links: [
      { href: "#how-it-works", label: "How it works" },
      { href: "#conditions", label: "Conditions we screen for" },
      { href: "#features", label: "Why OralScan" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/login", label: "Sign in" },
      { href: "/register", label: "Create account" },
    ],
  },
  {
    title: "Help",
    links: [
      { href: "#faq", label: "FAQ" },
      { href: "#faq-data", label: "Your images and data" },
      { href: "#faq-diagnosis", label: "Is this a diagnosis?" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="dv-footer">
      <div className="dv-footer-top">
        <div className="dv-footer-cta">
          <h2 className="dv-footer-headline">
            Screening starts with a photo.{" "}
            <span className="dv-footer-accent">Try it.</span>
          </h2>
          <div className="dv-footer-actions">
            <Link href="/register" className="dv-footer-btn dv-footer-btn-primary">
              Create account
            </Link>
            <Link href="/login" className="dv-footer-btn dv-footer-btn-secondary">
              Sign in
            </Link>
          </div>
        </div>

        <div className="dv-footer-cols">
          {columns.map((column) => (
            <div key={column.title} className="dv-footer-col">
              <h3>{column.title}</h3>
              <ul>
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="dv-footer-bottom">
        <p>© {new Date().getFullYear()} OralScan, SLIIT research project</p>
        <p>Screening support only. Not a clinical diagnosis.</p>
      </div>

      <p className="dv-footer-watermark" aria-hidden>
        OralScan
      </p>
    </footer>
  );
}
