import { ArrowRight, Code2, FileText, ImagePlay, ShieldCheck, type LucideIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

type WorkflowCard = {
  key: "documents" | "media" | "developer" | "privacy";
  href: string;
  Icon: LucideIcon;
};

const WORKFLOWS: WorkflowCard[] = [
  { key: "documents", href: "/tools/", Icon: FileText },
  { key: "media", href: "/image-tools/", Icon: ImagePlay },
  { key: "developer", href: "/developer-tools/", Icon: Code2 },
  { key: "privacy", href: "/security-tools/", Icon: ShieldCheck },
];

export async function HomeWorkflows() {
  const t = await getTranslations("Home");

  return (
    <section className="home-workflows" aria-labelledby="home-workflows-title">
      <div className="home-section-head">
        <p className="home-section-head__eyebrow">{t("landing.workflowsEyebrow")}</p>
        <h2 id="home-workflows-title" className="home-section-head__title">
          {t("landing.workflowsTitle")}
        </h2>
        <p className="home-section-head__subtitle">{t("landing.workflowsSubtitle")}</p>
      </div>

      <div className="home-workflows__grid">
        {WORKFLOWS.map(({ key, href, Icon }) => (
          <Link key={key} href={href} className="home-workflow-card" prefetch={false}>
            <span className="home-workflow-card__icon" aria-hidden>
              <Icon strokeWidth={1.5} />
            </span>
            <span className="home-workflow-card__body">
              <span className="home-workflow-card__title">
                {t(`landing.workflows.${key}.title`)}
              </span>
              <span className="home-workflow-card__desc">
                {t(`landing.workflows.${key}.description`)}
              </span>
            </span>
            <span className="home-workflow-card__cta">
              {t(`landing.workflows.${key}.cta`)}
              <ArrowRight className="home-workflow-card__cta-icon" aria-hidden />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
