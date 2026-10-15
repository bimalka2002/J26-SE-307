import Link from "next/link";
import type { ReactNode } from "react";

type Variant = "solid" | "soft" | "ghost";

type CommonProps = {
  children: ReactNode;
  variant?: Variant;
  className?: string;
  arrow?: boolean;
};

type ButtonAsButton = CommonProps & {
  href?: undefined;
  type?: "button" | "submit";
  onClick?: () => void;
};

type ButtonAsLink = CommonProps & {
  href: string;
  onClick?: () => void;
};

const variantClass: Record<Variant, string> = {
  solid: "dv-btn dv-btn-solid",
  soft: "dv-btn dv-btn-soft",
  ghost: "dv-btn dv-btn-ghost",
};

export function Button(props: ButtonAsButton | ButtonAsLink) {
  const { children, variant = "solid", className = "", arrow = false } = props;
  const classes = `${variantClass[variant]} ${className}`.trim();
  const content = (
    <>
      <span>{children}</span>
      {arrow ? <span className="dv-btn-arrow" aria-hidden>→</span> : null}
    </>
  );

  if ("href" in props && props.href) {
    return (
      <Link href={props.href} className={classes} onClick={props.onClick}>
        {content}
      </Link>
    );
  }

  const buttonProps = props as ButtonAsButton;
  return (
    <button type={buttonProps.type ?? "button"} onClick={buttonProps.onClick} className={classes}>
      {content}
    </button>
  );
}
