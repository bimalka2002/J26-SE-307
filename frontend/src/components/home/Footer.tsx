import Link from "next/link";

export function Footer() {
  return (
    <footer id="contact" className="dv-footer">
      <div className="dv-footer-inner">
        <div className="dv-footer-brand">
          <p className="dv-logo">
            <span className="dv-logo-mark" aria-hidden>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="9" cy="12" r="4" />
                <circle cx="15" cy="12" r="4" />
              </svg>
            </span>
            OralScan
          </p>
          <p>AI-assisted oral screening with clear reports and secure account access.</p>
        </div>
        <div>
          <h3>Explore</h3>
          <ul>
            <li>
              <a href="#home">Home</a>
            </li>
            <li>
              <a href="#services">Our Services</a>
            </li>
            <li>
              <a href="#membership">Membership</a>
            </li>
          </ul>
        </div>
        <div>
          <h3>Account</h3>
          <ul>
            <li>
              <Link href="/register">Sign up</Link>
            </li>
            <li>
              <Link href="/login">Sign in</Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="dv-footer-bottom">
        <p>© {new Date().getFullYear()} OralScan</p>
      </div>
    </footer>
  );
}
