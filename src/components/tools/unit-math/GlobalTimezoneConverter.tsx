"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { clsx } from "clsx";
import { ToolSuccessEngagement } from "@/components/ToolSuccessEngagement";
import {
  buildMeetingLinkText,
  DEFAULT_TARGET_ZONE_IDS,
  findGlobalTimezoneZone,
  findZoneByIana,
  formatClockParts,
  formatDateTimeLocalValue,
  getUserTimeZone,
  GLOBAL_TIMEZONE_ZONES,
  loadFavoriteZoneIds,
  saveFavoriteZoneIds,
  wallTimeInZoneToDate,
  type GlobalTimezoneZone,
} from "@/lib/global-timezone-converter";

export type GlobalTimezoneConverterLabels = {
  sourceTitle: string;
  sourceTimeLabel: string;
  sourceZoneLabel: string;
  useLiveLabel: string;
  targetsTitle: string;
  addZoneLabel: string;
  addZoneButton: string;
  removeZone: string;
  resetButton: string;
  syncHint: string;
  meetingTitle: string;
  meetingHint: string;
  copyMeetingLink: string;
  copiedMeetingLink: string;
  copyFailed: string;
  favoritesTitle: string;
  saveFavorites: string;
  favoritesSaved: string;
  loadFavorites: string;
  privacyLabel: string;
  pageTitle: string;
  localZoneLabel: string;
} & Record<(typeof GLOBAL_TIMEZONE_ZONES)[number]["labelKey"], string>;

type GlobalTimezoneConverterProps = {
  labels: GlobalTimezoneConverterLabels;
  className?: string;
};

function zoneTitle(zone: GlobalTimezoneZone, labels: GlobalTimezoneConverterLabels): string {
  return labels[zone.labelKey];
}

export function GlobalTimezoneConverter({ labels, className }: GlobalTimezoneConverterProps) {
  const locale = useLocale();
  const sourceTimeId = useId();
  const sourceZoneId = useId();
  const addZoneId = useId();

  const userTimeZone = useMemo(() => getUserTimeZone(), []);
  const matchedLocal = findZoneByIana(userTimeZone);

  const [liveMode, setLiveMode] = useState(true);
  const [tick, setTick] = useState(() => new Date());
  const [sourceZoneIdState, setSourceZoneIdState] = useState(
    () => matchedLocal?.id ?? "utc",
  );
  const [sourceWall, setSourceWall] = useState(() =>
    formatDateTimeLocalValue(new Date(), matchedLocal?.timeZone ?? userTimeZone),
  );
  const [targetIds, setTargetIds] = useState<string[]>([...DEFAULT_TARGET_ZONE_IDS]);
  const [zoneToAdd, setZoneToAdd] = useState("paris");
  const [interacted, setInteracted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [favoritesNote, setFavoritesNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sourceZone =
    findGlobalTimezoneZone(sourceZoneIdState) ?? GLOBAL_TIMEZONE_ZONES[0]!;

  useEffect(() => {
    if (!liveMode) return;
    const sync = () => {
      const now = new Date();
      setTick(now);
      setSourceWall(formatDateTimeLocalValue(now, sourceZone.timeZone));
    };
    sync();
    const timer = window.setInterval(sync, 60_000);
    return () => window.clearInterval(timer);
  }, [liveMode, sourceZone.timeZone]);

  // Smooth second hand while live — light tick without re-parsing wall clocks.
  useEffect(() => {
    if (!liveMode) return;
    const timer = window.setInterval(() => setTick(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, [liveMode]);

  const instant = useMemo(() => {
    if (liveMode) return tick;
    return wallTimeInZoneToDate(sourceWall, sourceZone.timeZone) ?? tick;
  }, [liveMode, tick, sourceWall, sourceZone.timeZone]);

  const targets = useMemo(
    () =>
      targetIds
        .map((id) => findGlobalTimezoneZone(id))
        .filter((zone): zone is GlobalTimezoneZone => Boolean(zone)),
    [targetIds],
  );

  const availableToAdd = GLOBAL_TIMEZONE_ZONES.filter(
    (zone) => zone.id !== sourceZone.id && !targetIds.includes(zone.id),
  );

  useEffect(() => {
    if (!availableToAdd.some((z) => z.id === zoneToAdd) && availableToAdd[0]) {
      setZoneToAdd(availableToAdd[0].id);
    }
  }, [availableToAdd, zoneToAdd]);

  const markInteracted = () => setInteracted(true);

  const onAddZone = () => {
    if (!zoneToAdd || targetIds.includes(zoneToAdd)) return;
    setTargetIds((current) => [...current, zoneToAdd]);
    markInteracted();
  };

  const onReset = () => {
    setLiveMode(true);
    setSourceZoneIdState(matchedLocal?.id ?? "utc");
    setTargetIds([...DEFAULT_TARGET_ZONE_IDS]);
    setCopied(false);
    setError(null);
    setFavoritesNote(null);
    markInteracted();
  };

  const meetingPoints = [
    { cityLabel: zoneTitle(sourceZone, labels), timeZone: sourceZone.timeZone },
    ...targets.map((zone) => ({
      cityLabel: zoneTitle(zone, labels),
      timeZone: zone.timeZone,
    })),
  ].slice(0, 4);

  const meetingText = buildMeetingLinkText(instant, meetingPoints, locale);

  const onCopyMeeting = async () => {
    if (!meetingText) return;
    markInteracted();
    try {
      await navigator.clipboard.writeText(meetingText);
      setCopied(true);
      setError(null);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(labels.copyFailed);
    }
  };

  const onSaveFavorites = () => {
    saveFavoriteZoneIds([sourceZone.id, ...targetIds]);
    setFavoritesNote(labels.favoritesSaved);
    markInteracted();
  };

  const onLoadFavorites = () => {
    const saved = loadFavoriteZoneIds();
    if (!saved.length) return;
    const [first, ...rest] = saved;
    if (first && findGlobalTimezoneZone(first)) {
      setSourceZoneIdState(first);
    }
    setTargetIds(rest.filter((id) => findGlobalTimezoneZone(id)));
    markInteracted();
  };

  const sourceClock = formatClockParts(sourceZone.timeZone, locale, instant);

  return (
    <div className={clsx("global-tz-tool", className)}>
      <section className="productivity-tool__pane tool-workspace-panel global-tz-tool__source">
        <div className="productivity-tool__pane-header">
          <h2 className="productivity-tool__section-title">{labels.sourceTitle}</h2>
          <button type="button" className="productivity-tool__reset-btn" onClick={onReset}>
            {labels.resetButton}
          </button>
        </div>

        <label className="global-tz-tool__live-toggle">
          <input
            type="checkbox"
            checked={liveMode}
            onChange={(event) => {
              setLiveMode(event.target.checked);
              markInteracted();
              if (event.target.checked) {
                setSourceWall(formatDateTimeLocalValue(new Date(), sourceZone.timeZone));
              }
            }}
          />
          <span>{labels.useLiveLabel}</span>
        </label>

        <div className="global-tz-tool__source-row">
          <div className="global-tz-tool__field">
            <label className="productivity-tool__label" htmlFor={sourceTimeId}>
              {labels.sourceTimeLabel}
            </label>
            <input
              id={sourceTimeId}
              type="datetime-local"
              className="productivity-tool__input"
              value={sourceWall}
              disabled={liveMode}
              onChange={(event) => {
                setLiveMode(false);
                setSourceWall(event.target.value);
                markInteracted();
              }}
            />
          </div>

          <div className="global-tz-tool__field">
            <label className="productivity-tool__label" htmlFor={sourceZoneId}>
              {labels.sourceZoneLabel}
            </label>
            <select
              id={sourceZoneId}
              className="productivity-tool__select"
              value={sourceZone.id}
              onChange={(event) => {
                const next = findGlobalTimezoneZone(event.target.value);
                if (!next) return;
                setSourceZoneIdState(next.id);
                if (liveMode) {
                  setSourceWall(formatDateTimeLocalValue(new Date(), next.timeZone));
                }
                markInteracted();
              }}
            >
              {GLOBAL_TIMEZONE_ZONES.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zoneTitle(zone, labels)} ({zone.shortCode})
                </option>
              ))}
            </select>
          </div>
        </div>

        <article className="timezone-tool__clock-card global-tz-tool__hero-clock">
          <div className="timezone-tool__clock-header">
            <div>
              <h3 className="timezone-tool__clock-title">{zoneTitle(sourceZone, labels)}</h3>
              <p className="timezone-tool__clock-zone">{sourceZone.timeZone}</p>
            </div>
            <span className="global-tz-tool__badge">{sourceZone.shortCode}</span>
          </div>
          <p className="timezone-tool__clock-time">{sourceClock.time24}</p>
          <p className="timezone-tool__clock-date">
            {sourceClock.weekday} · {sourceClock.date}
          </p>
          <p className="timezone-tool__clock-offset">{sourceClock.offset}</p>
        </article>

        <p className="global-tz-tool__sync-hint">{labels.syncHint}</p>
      </section>

      <section className="productivity-tool__pane tool-workspace-panel">
        <h2 className="productivity-tool__section-title">{labels.targetsTitle}</h2>

        <div className="timezone-tool__add-row">
          <label className="productivity-tool__label" htmlFor={addZoneId}>
            {labels.addZoneLabel}
          </label>
          <div className="timezone-tool__add-controls">
            <select
              id={addZoneId}
              className="productivity-tool__select"
              value={zoneToAdd}
              onChange={(event) => {
                setZoneToAdd(event.target.value);
                markInteracted();
              }}
              disabled={!availableToAdd.length}
            >
              {availableToAdd.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zoneTitle(zone, labels)} ({zone.shortCode})
                </option>
              ))}
            </select>
            <button
              type="button"
              className="productivity-tool__action-btn"
              onClick={onAddZone}
              disabled={!availableToAdd.length}
            >
              {labels.addZoneButton}
            </button>
          </div>
        </div>

        <div className="timezone-tool__grid">
          {targets.map((zone) => {
            const clock = formatClockParts(zone.timeZone, locale, instant);
            return (
              <article key={zone.id} className="timezone-tool__clock-card">
                <div className="timezone-tool__clock-header">
                  <div>
                    <h3 className="timezone-tool__clock-title">{zoneTitle(zone, labels)}</h3>
                    <p className="timezone-tool__clock-zone">{zone.timeZone}</p>
                  </div>
                  <button
                    type="button"
                    className="productivity-tool__reset-btn"
                    onClick={() => {
                      setTargetIds((current) => current.filter((id) => id !== zone.id));
                      markInteracted();
                    }}
                    aria-label={labels.removeZone}
                  >
                    ×
                  </button>
                </div>
                <p className="timezone-tool__clock-time">{clock.time24}</p>
                <p className="timezone-tool__clock-date">
                  {clock.weekday} · {clock.date}
                </p>
                <p className="timezone-tool__clock-offset">
                  {clock.offset} · {zone.shortCode}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="productivity-tool__pane tool-workspace-panel global-tz-tool__meeting">
        <h2 className="productivity-tool__section-title">{labels.meetingTitle}</h2>
        <p className="global-tz-tool__meeting-hint">{labels.meetingHint}</p>
        {meetingText ? (
          <p className="global-tz-tool__meeting-preview" dir="auto">
            {meetingText}
          </p>
        ) : null}
        <div className="global-tz-tool__meeting-actions">
          <button
            type="button"
            className="productivity-tool__action-btn"
            onClick={onCopyMeeting}
            disabled={!meetingText}
          >
            {copied ? labels.copiedMeetingLink : labels.copyMeetingLink}
          </button>
        </div>
        {error ? <p className="global-tz-tool__error">{error}</p> : null}
      </section>

      <section className="productivity-tool__pane tool-workspace-panel">
        <h2 className="productivity-tool__section-title">{labels.favoritesTitle}</h2>
        <div className="global-tz-tool__favorites-actions">
          <button type="button" className="productivity-tool__action-btn" onClick={onSaveFavorites}>
            {labels.saveFavorites}
          </button>
          <button type="button" className="productivity-tool__reset-btn" onClick={onLoadFavorites}>
            {labels.loadFavorites}
          </button>
        </div>
        {favoritesNote ? <p className="global-tz-tool__favorites-note">{favoritesNote}</p> : null}
      </section>

      <p className="global-tz-tool__privacy">{labels.privacyLabel}</p>

      {interacted ? (
        <ToolSuccessEngagement pageTitle={labels.pageTitle} className="global-tz-tool__engagement" />
      ) : null}
    </div>
  );
}
