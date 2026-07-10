import "./hero-animation.css";

/** Industrial placeholder stage for a future Lottie or motion asset. */
export function HeroAnimation() {
  return (
    <div className="hero-animation" aria-hidden>
      <div className="hero-animation__stage">
        <svg
          className="hero-animation__icon"
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            className="hero-animation__sheet hero-animation__sheet--back"
            x="12"
            y="18"
            width="28"
            height="36"
            stroke="currentColor"
            strokeWidth="2"
          />
          <rect
            className="hero-animation__sheet hero-animation__sheet--front"
            x="24"
            y="10"
            width="28"
            height="36"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      </div>
    </div>
  );
}
