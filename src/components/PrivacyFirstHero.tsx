const PRIVACY_FIRST_HERO_EN = "/heder-privacy-first-EN.png";
const PRIVACY_FIRST_HERO_HE = "/heder-privacy-first-HE.png";

type PrivacyFirstHeroProps = {
  locale: string;
  alt: string;
};

export function PrivacyFirstHero({ locale, alt }: PrivacyFirstHeroProps) {
  const src = locale === "he" ? PRIVACY_FIRST_HERO_HE : PRIVACY_FIRST_HERO_EN;

  return (
    <header className="home-hero privacy-first-hero">
      <h1 className="home-hero__title">
        <img
          src={src}
          alt={alt}
          className="home-hero__title-image h-auto w-full"
          width={1920}
          height={400}
        />
      </h1>
    </header>
  );
}
