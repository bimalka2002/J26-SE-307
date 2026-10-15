"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    google?: { accounts: { id: {
      initialize: (options: { client_id: string; callback: (response: { credential: string }) => void; auto_select: boolean }) => void;
      renderButton: (element: HTMLElement, options: { type: string; theme: string; size: string; text: string; width: number }) => void;
      disableAutoSelect: () => void;
    } } };
  }
}

export function GoogleButton({ onCredential, disabled }: { onCredential: (credential: string) => void; disabled: boolean }) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const container = useRef<HTMLDivElement>(null);
  const callback = useRef(onCredential);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => { callback.current = onCredential; }, [onCredential]);
  useEffect(() => {
    if (!ready || !clientId || !container.current || !window.google) return;
    window.google.accounts.id.initialize({ client_id: clientId, auto_select: false, callback: (response) => callback.current(response.credential) });
    window.google.accounts.id.renderButton(container.current, { type: "standard", theme: "outline", size: "large", text: "signin_with", width: Math.min(400, container.current.clientWidth) });
  }, [ready, clientId]);

  return <div className="google-section">
    {clientId && <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onReady={() => setReady(true)} onError={() => setFailed(true)} />}
    {(!clientId || !ready || failed) && <button className="secondary-button" type="button" disabled>Sign in with Google</button>}
    <div ref={container} inert={disabled} className={disabled ? "google-button is-busy" : "google-button"} />
    {!clientId && <p className="field-hint">Google sign-in will be available once it is configured.</p>}
    {clientId && !ready && !failed && <p className="field-hint" role="status">Loading Google sign-in…</p>}
    {failed && <p className="field-hint" role="status">Google sign-in could not load. Use email or reload to try again.</p>}
  </div>;
}
