import { getTranslations } from "next-intl/server";
import { ShieldCheck, Cpu, HardDrive, ArrowRight, Lock, WifiOff, Trash2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { HomeReveal } from "@/components/homepage/HomeReveal";
import { HomeStaticPanel } from "@/components/homepage/HomeStaticPanel";

const STEPS = [
  { key: "step1" as const, icon: HardDrive },
  { key: "step2" as const, icon: Cpu },
  { key: "step3" as const, icon: ShieldCheck },
];

const HIGHLIGHTS = [
  { key: "highlight1" as const, icon: Lock },
  { key: "highlight2" as const, icon: WifiOff },
  { key: "highlight3" as const, icon: Trash2 },
];

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
        icon={<ShieldCheck size={22} strokeWidth={1.75} />}
        className="home-static-panel--workflow"
        bodyClassName="home-local-workflow"
      >
        <p className="home-local-workflow__lead">{t("landing.localWorkflowLead")}</p>
        <p className="home-local-workflow__body">{t("landing.localWorkflowBody")}</p>

        <ul className="home-local-workflow__highlights">
          {HIGHLIGHTS.map(({ key, icon: Icon }) => (
            <li key={key} className="home-local-workflow__highlight">
              <span className="home-local-workflow__highlight-icon" aria-hidden>
                <Icon size={15} strokeWidth={1.75} />
              </span>
              <span>{t(`landing.localWorkflow.${key}`)}</span>
            </li>
          ))}
        </ul>

        <ol className="home-local-workflow__steps">
          {STEPS.map(({ key, icon: Icon }) => (
            <li key={key} className="home-local-workflow__step">
              <span className="home-local-workflow__step-icon" aria-hidden>
                <Icon size={18} strokeWidth={1.75} />
              </span>
              <div className="home-local-workflow__step-copy">
                <h3 className="home-local-workflow__step-title">
                  {t(`landing.localWorkflow.${key}Title`)}
                </h3>
                <p className="home-local-workflow__step-body">
                  {t(`landing.localWorkflow.${key}Body`)}
                </p>
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
