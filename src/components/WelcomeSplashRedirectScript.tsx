import {
  WELCOME_ENTERED_STORAGE_KEY,
  WELCOME_ENTERED_VALUE,
} from "@/lib/welcome-splash";

type Props = {
  /** Absolute path to the locale home, e.g. `/en/home`. */
  homePath: string;
};

/**
 * Runs before paint for returning visitors so they skip the splash without
 * waiting on React hydration (improves LCP for first-time / audit visits).
 */
export function WelcomeSplashRedirectScript({ homePath }: Props) {
  const safePath = homePath.replace(/[^a-zA-Z0-9/_-]/g, "");
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `try{if(localStorage.getItem(${JSON.stringify(WELCOME_ENTERED_STORAGE_KEY)})===${JSON.stringify(WELCOME_ENTERED_VALUE)}){location.replace(${JSON.stringify(safePath)})}}catch(e){}`,
      }}
    />
  );
}
