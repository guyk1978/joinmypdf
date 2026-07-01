"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { clsx } from "clsx";
import {
  findTimezoneCity,
  formatClock,
  getUserTimeZone,
  TIMEZONE_CITY_OPTIONS,
  type TimezoneCity,
} from "@/lib/timezone-converter";

export type TimezoneConverterLabels = {
  localTitle: string;
  citiesTitle: string;
  addCityLabel: string;
  addCityButton: string;
  removeCity: string;
  resetButton: string;
  localZoneFallback: string;
} & Record<(typeof TIMEZONE_CITY_OPTIONS)[number]["labelKey"], string>;

type TimezoneConverterProps = {
  labels: TimezoneConverterLabels;
  className?: string;
};

type CityClockProps = {
  title: string;
  timeZone: string;
  locale: string;
  now: Date;
  onRemove?: () => void;
  removeLabel?: string;
};

function CityClock({ title, timeZone, locale, now, onRemove, removeLabel }: CityClockProps) {
  const clock = formatClock(timeZone, locale, now);

  return (
    <article className="timezone-tool__clock-card">
      <div className="timezone-tool__clock-header">
        <div>
          <h3 className="timezone-tool__clock-title">{title}</h3>
          <p className="timezone-tool__clock-zone">{timeZone}</p>
        </div>
        {onRemove ? (
          <button type="button" className="productivity-tool__reset-btn" onClick={onRemove} aria-label={removeLabel}>
            ×
          </button>
        ) : null}
      </div>
      <p className="timezone-tool__clock-time">{clock.time}</p>
      <p className="timezone-tool__clock-date">{clock.date}</p>
      <p className="timezone-tool__clock-offset">{clock.offset}</p>
    </article>
  );
}

const DEFAULT_CITY_IDS = ["new-york", "london", "tokyo"];

export function TimezoneConverter({ labels, className }: TimezoneConverterProps) {
  const locale = useLocale();
  const [now, setNow] = useState(() => new Date());
  const [selectedCityIds, setSelectedCityIds] = useState<string[]>(DEFAULT_CITY_IDS);
  const [cityToAdd, setCityToAdd] = useState(TIMEZONE_CITY_OPTIONS[0]?.id ?? "utc");

  const userTimeZone = getUserTimeZone();

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const selectedCities = useMemo(
    () =>
      selectedCityIds
        .map((id) => findTimezoneCity(id))
        .filter((city): city is TimezoneCity => Boolean(city)),
    [selectedCityIds],
  );

  const availableCities = TIMEZONE_CITY_OPTIONS.filter((city) => !selectedCityIds.includes(city.id));

  useEffect(() => {
    if (!availableCities.some((city) => city.id === cityToAdd) && availableCities[0]) {
      setCityToAdd(availableCities[0].id);
    }
  }, [availableCities, cityToAdd]);

  const onAddCity = () => {
    if (!cityToAdd || selectedCityIds.includes(cityToAdd)) return;
    setSelectedCityIds((current) => [...current, cityToAdd]);
  };

  const onReset = () => {
    setSelectedCityIds(DEFAULT_CITY_IDS);
    setCityToAdd(TIMEZONE_CITY_OPTIONS[0]?.id ?? "utc");
  };

  return (
    <div className={clsx("timezone-tool", className)}>
      <section className="productivity-tool__pane tool-workspace-panel">
        <div className="productivity-tool__pane-header">
          <h2 className="productivity-tool__section-title">{labels.localTitle}</h2>
          <button type="button" className="productivity-tool__reset-btn" onClick={onReset}>
            {labels.resetButton}
          </button>
        </div>

        <CityClock
          title={labels.localTitle}
          timeZone={userTimeZone}
          locale={locale}
          now={now}
        />
      </section>

      <section className="productivity-tool__pane tool-workspace-panel">
        <h2 className="productivity-tool__section-title">{labels.citiesTitle}</h2>

        <div className="timezone-tool__add-row">
          <label className="productivity-tool__label" htmlFor="timezone-add-city">
            {labels.addCityLabel}
          </label>
          <div className="timezone-tool__add-controls">
            <select
              id="timezone-add-city"
              className="productivity-tool__select"
              value={cityToAdd}
              onChange={(event) => setCityToAdd(event.target.value)}
              disabled={!availableCities.length}
            >
              {availableCities.map((city) => (
                <option key={city.id} value={city.id}>
                  {labels[city.labelKey]}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="productivity-tool__action-btn"
              onClick={onAddCity}
              disabled={!availableCities.length}
            >
              {labels.addCityButton}
            </button>
          </div>
        </div>

        <div className="timezone-tool__grid">
          {selectedCities.map((city) => (
            <CityClock
              key={city.id}
              title={labels[city.labelKey]}
              timeZone={city.timeZone}
              locale={locale}
              now={now}
              onRemove={() => setSelectedCityIds((current) => current.filter((id) => id !== city.id))}
              removeLabel={labels.removeCity}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
