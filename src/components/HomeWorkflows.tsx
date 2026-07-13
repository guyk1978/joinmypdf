import { ArrowRight, Code2, FileText, ImagePlay, ShieldCheck, type LucideIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

type WorkflowItem = {
  key: "documents" | "media" | "developer" | "privacy";
  href: string;
  Icon: LucideIcon;
};

const WORKFLOWS: WorkflowItem[] = [
  { key: "documents", href: "/tools/pdf-tools/", Icon: FileText },
  { key: "media", href: "/tools/mp4-tools/", Icon: ImagePlay },
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

      <nav className="home-workflows__strip" aria-label={t("landing.workflowsTitle")}>
        {WORKFLOWS.map(({ key, href, Icon }) => (
          <Link key={key} href={href} className="home-workflow-strip-item" prefetch={false}>
            <Icon className="home-workflow-strip-item__icon" strokeWidth={1.5} aria-hidden />
            <span className="home-workflow-strip-item__label">
              {t(`landing.workflows.${key}.title`)}
            </span>
            <ArrowRight className="home-workflow-strip-item__arrow" aria-hidden />
          </Link>
        ))}
      </nav>
    </section>
  );
}
