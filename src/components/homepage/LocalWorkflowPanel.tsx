import { getTranslations } from "next-intl/server";
import { ShieldCheck, Cpu, HardDrive, ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { HomeReveal } from "@/components/homepage/HomeReveal";
import { HomeStaticPanel } from "@/components/homepage/HomeStaticPanel";

const STEPS = [
  {
    titleKey: "landing.localWorkflowStep1Title",
    bodyKey: "landing.localWorkflowStep1Body",
    icon: HardDrive,
  },
  {
    titleKey: "landing.localWorkflowStep2Title",
    bodyKey: "landing.localWorkflowStep2Body",
    icon: Cpu,
  },
  {
    titleKey: "landing.localWorkflowStep3Title",
    bodyKey: "landing.localWorkflowStep3Body",
    icon: ShieldCheck,
  },
] as const;

/**
 * Right-column Industrial Matte panel: local browser processing / zero-server privacy.
 */
export async function LocalWorkflowPanel() {
  const t = await getTranslations("Home");

  return (
    <HomeReveal className="w-full h-full">
      <HomeStaticPanel
        id="local-workflow-title"
        title={t("landing.localWorkflowTitle")}
        icon={<ShieldCheck size={26} strokeWidth={1.75} />}
        className="home-static-panel--workflow"
        bodyClassName="home-local-workflow"
      >
        <p className="home-local-workflow__lead">{t("landing.localWorkflowLead")}</p>

        <ol className="home-local-workflow__steps">
          {STEPS.map(({ titleKey, bodyKey, icon: Icon }) => (
            <li key={titleKey} className="home-local-workflow__step">
              <span className="home-local-workflow__step-icon" aria-hidden>
                <Icon size={20} strokeWidth={1.75} />
              </span>
              <div className="home-local-workflow__step-copy">
                <h3 className="home-local-workflow__step-title">{t(titleKey)}</h3>
                <p className="home-local-workflow__step-body">{t(bodyKey)}</p>
              </div>
            </li>
          ))}
        </ol>

        <Link href="/guide/" className="home-local-workflow__cta" prefetch={false}>
          <span>{t("landing.localWorkflowCta")}</span>
          <ArrowRight size={16} strokeWidth={2} aria-hidden />
        </Link>
      </HomeStaticPanel>
    </HomeReveal>
  );
}
