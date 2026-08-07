import {
  FileText,
  Image as ImageIcon,
  Type,
  RefreshCw,
  Shield,
  Zap,
  Lock,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { FaqAccordion } from "@/components/FaqAccordion";
import { HomeReveal } from "@/components/homepage/HomeReveal";
import { getGlobalSeedReviews } from "@/data/community-reviews";
import "@/styles/home-marketing.css";

const BENEFITS = [
  {
    id: "security",
    icon: Shield,
    title: "Security without the server",
    body: "Your documents stay on your machine. No cloud inbox, no shared processor, no wondering who else can open the file after you close the tab.",
    visualLabel: "On-device only",
    visualDetail: "Browser sandbox · No remote copy",
  },
  {
    id: "speed",
    icon: Zap,
    title: "Speed you can feel",
    body: "Skip upload queues and download round-trips. Open a tool, drop a file, and get the result as fast as your device can work.",
    visualLabel: "Zero upload lag",
    visualDetail: "WASM · Web Workers · Instant export",
  },
  {
    id: "privacy",
    icon: Lock,
    title: "Privacy by default",
    body: "Local-first means confidential contracts, client photos, and drafts never hitch a ride to someone else’s infrastructure — not even briefly.",
    visualLabel: "Zero uploads",
    visualDetail: "No account · No tracking of file contents",
  },
] as const;

const CATEGORIES = [
  {
    id: "pdf",
    href: "/tools/pdf-tools/",
    icon: FileText,
    title: "PDFs",
    body: "Merge, split, compress, sign, and organize pages.",
  },
  {
    id: "image",
    href: "/tools/image-tools/",
    icon: ImageIcon,
    title: "Images",
    body: "Convert, crop, watermark, and clean metadata.",
  },
  {
    id: "text",
    href: "/tools/text-tools/",
    icon: Type,
    title: "Text",
    body: "Format, transform, and prep copy in the browser.",
  },
  {
    id: "convert",
    href: "/tools/convert-tools/",
    icon: RefreshCw,
    title: "Conversion",
    body: "Switch formats without shipping files to the cloud.",
  },
] as const;

const FAQ_ITEMS = [
  {
    q: "Is my data uploaded to servers?",
    a: "No. Standard JoinMyPDF workflows process files locally in your browser. Your documents are not uploaded to our servers for typical tool use.",
  },
  {
    q: "Is it free to use?",
    a: "Yes. The tools are free to use with no account wall and no watermarks on everyday workflows.",
  },
  {
    q: "Are these tools safe for professional work?",
    a: "Yes. Local processing keeps sensitive files on your device, which is why teams reach for JoinMyPDF for contracts, client assets, and deadline work.",
  },
  {
    q: "Do I need to install anything?",
    a: "No installs. Open a tool in a modern browser, drop your file, and download the result when you’re done.",
  },
  {
    q: "What does “local-first” actually mean?",
    a: "It means the heavy lifting runs on your device with browser APIs and WebAssembly — not on a remote converter that keeps a copy of your upload.",
  },
] as const;

const CREATOR_NOTE = [
  "I built JoinMyPDF because I kept running into the same frustration: I needed a fast, clean, reliable tool online, and almost every option was buried under ads, pop-ups, or unnecessary friction.",
  "I still develop this platform actively for my own work, and my family uses these tools regularly too — so every improvement has to hold up in real everyday use, not just look good on a landing page.",
] as const;

function StarRow({ rating }: { rating: number }) {
  const clamped = Math.max(1, Math.min(5, Math.round(rating)));
  return (
    <span className="hm-stars" aria-label={`${clamped} out of 5 stars`}>
      {"★".repeat(clamped)}
      <span className="hm-stars__empty" aria-hidden>
        {"★".repeat(5 - clamped)}
      </span>
    </span>
  );
}

/**
 * Long-form local-first marketing landing — replaces the homepage tool grids.
 */
export function HomeMarketingLanding() {
  const testimonials = getGlobalSeedReviews()
    .filter((review) => /fast|speed|ad|local|upload|queue/i.test(review.comment))
    .slice(0, 3);

  const fallbackTestimonials =
    testimonials.length >= 3
      ? testimonials
      : getGlobalSeedReviews().slice(0, 3);

  return (
    <div className="hm-landing">
      {/* —— Hero —— */}
      <section className="hm-hero" aria-labelledby="hm-hero-brand">
        <div className="hm-hero__glow" aria-hidden />
        <div className="hm-hero__inner">
          <p id="hm-hero-brand" className="hm-hero__brand">
            JoinMyPDF
          </p>
          <h1 className="hm-hero__title">
            Local-first tools.
            <span className="hm-hero__title-em"> Your files never leave this browser.</span>
          </h1>
          <p className="hm-hero__sub">
            A private toolkit for PDFs, images, text, and conversions — built for speed,
            security, and zero upload anxiety. Drag, drop, done.
          </p>
          <div className="hm-hero__actions">
            <Link href="/tools/" className="hm-btn hm-btn--primary">
              Explore Tools
              <ArrowRight className="hm-btn__icon" aria-hidden strokeWidth={2} />
            </Link>
            <Link href="/tools/pdf-tools/" className="hm-btn hm-btn--ghost">
              Get Started
            </Link>
          </div>
          <ul className="hm-hero__pills" aria-label="Core benefits">
            <li>100% local</li>
            <li>No uploads</li>
            <li>No ads in the workflow</li>
          </ul>
        </div>
      </section>

      {/* —— Why Local-First (zig-zag) —— */}
      <section className="hm-section" aria-labelledby="hm-why-title">
        <HomeReveal>
          <div className="hm-section__head hm-section__head--center">
            <p className="hm-eyebrow">Why local-first?</p>
            <h2 id="hm-why-title" className="hm-section__title">
              Security, speed, and privacy — without the cloud tradeoff
            </h2>
            <p className="hm-section__lead">
              JoinMyPDF runs on your device so confidential work stays confidential,
              and results show up as soon as your browser finishes the job.
            </p>
          </div>
        </HomeReveal>

        <div className="hm-zigzag">
          {BENEFITS.map((benefit, index) => {
            const Icon = benefit.icon;
            const reverse = index % 2 === 1;
            return (
              <HomeReveal key={benefit.id}>
                <article
                  className={`hm-zigzag__row${reverse ? " hm-zigzag__row--reverse" : ""}`}
                >
                  <div className="hm-zigzag__copy">
                    <span className="hm-zigzag__icon" aria-hidden>
                      <Icon strokeWidth={1.5} />
                    </span>
                    <h3 className="hm-zigzag__title">{benefit.title}</h3>
                    <p className="hm-zigzag__body">{benefit.body}</p>
                  </div>
                  <div className="hm-zigzag__visual" aria-hidden>
                    <div className="hm-visual-card">
                      <Sparkles className="hm-visual-card__spark" strokeWidth={1.5} />
                      <p className="hm-visual-card__label">{benefit.visualLabel}</p>
                      <p className="hm-visual-card__detail">{benefit.visualDetail}</p>
                      <div className="hm-visual-card__bars">
                        <span />
                        <span />
                        <span />
                      </div>
                    </div>
                  </div>
                </article>
              </HomeReveal>
            );
          })}
        </div>
      </section>

      {/* —— Feature showcase —— */}
      <section className="hm-section" aria-labelledby="hm-features-title">
        <HomeReveal>
          <div className="hm-section__head hm-section__head--center">
            <p className="hm-eyebrow">Drag, drop, done</p>
            <h2 id="hm-features-title" className="hm-section__title">
              Everything you need, organized by job
            </h2>
            <p className="hm-section__lead">
              Sleek category hubs instead of an endless grid — open a lane and start
              working in seconds.
            </p>
          </div>
        </HomeReveal>

        <HomeReveal>
          <ul className="hm-feature-grid">
            {CATEGORIES.map((category) => {
              const Icon = category.icon;
              return (
                <li key={category.id}>
                  <Link href={category.href} className="hm-feature-card">
                    <span className="hm-feature-card__icon" aria-hidden>
                      <Icon strokeWidth={1.5} />
                    </span>
                    <h3 className="hm-feature-card__title">{category.title}</h3>
                    <p className="hm-feature-card__body">{category.body}</p>
                    <span className="hm-feature-card__cta">
                      Open hub
                      <ArrowRight aria-hidden strokeWidth={2} />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </HomeReveal>
      </section>

      {/* —— Social proof + creator —— */}
      <section className="hm-section" aria-labelledby="hm-social-title">
        <HomeReveal>
          <div className="hm-section__head hm-section__head--center">
            <p className="hm-eyebrow">Social proof</p>
            <h2 id="hm-social-title" className="hm-section__title">
              Built for people who hate waiting — and hate ads
            </h2>
          </div>
        </HomeReveal>

        <HomeReveal>
          <ul className="hm-testimonial-grid">
            {fallbackTestimonials.map((review) => (
              <li key={review.id} className="hm-testimonial">
                <StarRow rating={review.rating} />
                <p className="hm-testimonial__quote">&ldquo;{review.comment}&rdquo;</p>
                <p className="hm-testimonial__author">{review.author}</p>
              </li>
            ))}
          </ul>
        </HomeReveal>

        <HomeReveal>
          <aside className="hm-creator" aria-labelledby="hm-creator-title">
            <p className="hm-eyebrow">A note from the creator</p>
            <h3 id="hm-creator-title" className="hm-creator__title">
              Why this exists
            </h3>
            {CREATOR_NOTE.map((paragraph) => (
              <p key={paragraph.slice(0, 48)} className="hm-creator__text">
                {paragraph}
              </p>
            ))}
          </aside>
        </HomeReveal>
      </section>

      {/* —— FAQ —— */}
      <section className="hm-section hm-section--narrow" aria-labelledby="hm-faq-title">
        <HomeReveal>
          <div className="hm-section__head hm-section__head--center">
            <p className="hm-eyebrow">FAQ</p>
            <h2 id="hm-faq-title" className="hm-section__title">
              Frequently asked questions
            </h2>
          </div>
          <div className="hm-faq-shell">
            <FaqAccordion items={FAQ_ITEMS} />
          </div>
        </HomeReveal>
      </section>

      {/* —— Final CTA —— */}
      <section className="hm-final" aria-labelledby="hm-final-title">
        <HomeReveal>
          <div className="hm-final__banner">
            <h2 id="hm-final-title" className="hm-final__title">
              Ready to work local-first?
            </h2>
            <p className="hm-final__sub">
              Open the toolkit, drop a file, and keep every byte on your device.
            </p>
            <div className="hm-hero__actions hm-final__actions">
              <Link href="/tools/" className="hm-btn hm-btn--primary hm-btn--on-banner">
                Explore Tools
                <ArrowRight className="hm-btn__icon" aria-hidden strokeWidth={2} />
              </Link>
              <Link href="/tools/pdf-tools/" className="hm-btn hm-btn--ghost hm-btn--on-banner">
                Get Started
              </Link>
            </div>
          </div>
        </HomeReveal>
      </section>
    </div>
  );
}
