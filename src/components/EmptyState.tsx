import type { ReactNode } from "react";

type EmptyStateProps = {
  icon: ReactNode;
  title: string;
  description: string;
  children?: ReactNode;
};

/** Centered empty list state — Industrial Matte typography. */
export function EmptyState({ icon, title, description, children }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon-wrap" aria-hidden>
        {icon}
      </div>
      <h2 className="empty-state__title">{title}</h2>
      <p className="empty-state__body">{description}</p>
      {children ? <div className="empty-state__actions">{children}</div> : null}
    </div>
  );
}
