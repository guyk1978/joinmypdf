"use client";



import { clsx } from "clsx";

import { Check, Copy, Loader2, RefreshCw, Search } from "lucide-react";

import { useCallback, useEffect, useId, useState } from "react";

import { PostSuccessUpsell } from "@/components/PostSuccessUpsell";

import {

  fetchNetworkIpInfo,

  formatLocation,

  isValidIpAddress,

  proxyStatusLabel,

  readSystemStatus,

  type NetworkIpInfo,

  type SystemStatusInfo,

} from "@/lib/network-ip-info";

import { toolOutlineBtn, toolPrimaryBtn } from "@/lib/tool-ui";



export type MyIpNetworkInfoLabels = {

  privacyNotice: string;

  loading: string;

  refresh: string;

  errorTitle: string;

  retry: string;

  myIpTitle: string;

  publicIp: string;

  ipv4Label: string;

  ipv6Label: string;

  ipVersion: string;

  connectionDetails: string;

  isp: string;

  org: string;

  location: string;

  country: string;

  timezone: string;

  connectionType: string;

  proxyStatus: string;

  proxyVpn: string;

  proxyProxy: string;

  proxyHosting: string;

  proxyTor: string;

  proxyClear: string;

  proxyUnknown: string;

  coordinates: string;

  asn: string;

  source: string;

  lookupTitle: string;

  lookupHint: string;

  lookupPlaceholder: string;

  lookupButton: string;

  lookupInvalid: string;

  lookupMine: string;

  systemStatus: string;

  browser: string;

  os: string;

  device: string;

  language: string;

  platform: string;

  userAgent: string;

  online: string;

  offline: string;

  copyIp: string;

  copy: string;

  copied: string;

};



type MyIpNetworkInfoProps = {

  labels: MyIpNetworkInfoLabels;

};



function DetailRow({ label, value }: { label: string; value: string }) {

  return (

    <div className="flex flex-col gap-1 border-b border-neutral-800/80 py-2.5 last:border-b-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">

      <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</dt>

      <dd className="break-words font-mono text-sm text-neutral-100 sm:text-right">{value || "—"}</dd>

    </div>

  );

}



function CompactCopyField({

  label,

  value,

  copyLabel,

  copiedLabel,

}: {

  label: string;

  value: string;

  copyLabel: string;

  copiedLabel: string;

}) {

  const [copied, setCopied] = useState(false);



  const onCopy = useCallback(async () => {

    if (!value || value === "—") return;

    try {

      await navigator.clipboard.writeText(value);

      setCopied(true);

      window.setTimeout(() => setCopied(false), 1600);

    } catch {

      setCopied(false);

    }

  }, [value]);



  return (

    <div className="space-y-1.5 border border-neutral-800 bg-neutral-950/80 p-3">

      <div className="flex items-center justify-between gap-2">

        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</p>

        <button

          type="button"

          className={clsx(toolOutlineBtn, "min-h-0 px-2 py-1 text-xs")}

          onClick={() => void onCopy()}

          disabled={!value || value === "—"}

          aria-label={`${copyLabel}: ${label}`}

        >

          {copied ? (

            <>

              <Check className="mr-1 inline h-3.5 w-3.5" aria-hidden />

              {copiedLabel}

            </>

          ) : (

            <>

              <Copy className="mr-1 inline h-3.5 w-3.5" aria-hidden />

              {copyLabel}

            </>

          )}

        </button>

      </div>

      <p className="break-all font-mono text-sm text-neutral-100">{value || "—"}</p>

    </div>

  );

}



export function MyIpNetworkInfo({ labels }: MyIpNetworkInfoProps) {

  const lookupId = useId();

  const [info, setInfo] = useState<NetworkIpInfo | null>(null);

  const [system, setSystem] = useState<SystemStatusInfo | null>(null);

  const [loading, setLoading] = useState(true);

  const [lookupLoading, setLookupLoading] = useState(false);

  const [error, setError] = useState("");

  const [lookupQuery, setLookupQuery] = useState("");

  const [copiedIp, setCopiedIp] = useState(false);



  const loadMine = useCallback(async () => {

    setLoading(true);

    setError("");

    setLookupQuery("");

    setSystem(readSystemStatus());

    try {

      const next = await fetchNetworkIpInfo();

      setInfo(next);

    } catch (cause) {

      setInfo(null);

      setError(cause instanceof Error ? cause.message : labels.errorTitle);

    } finally {

      setLoading(false);

    }

  }, [labels.errorTitle]);



  const runLookup = useCallback(async () => {

    const trimmed = lookupQuery.trim();

    if (!trimmed) {

      setError(labels.lookupInvalid);

      return;

    }

    if (!isValidIpAddress(trimmed)) {

      setError(labels.lookupInvalid);

      return;

    }



    setLookupLoading(true);

    setError("");

    setSystem(readSystemStatus());

    try {

      const next = await fetchNetworkIpInfo(trimmed);

      setInfo(next);

    } catch (cause) {

      if (cause instanceof Error && cause.message === "invalid_ip") {

        setError(labels.lookupInvalid);

      } else {

        setError(cause instanceof Error ? cause.message : labels.errorTitle);

      }

    } finally {

      setLookupLoading(false);

    }

  }, [labels.errorTitle, labels.lookupInvalid, lookupQuery]);



  useEffect(() => {

    void loadMine();

  }, [loadMine]);



  const onCopyIp = useCallback(async () => {

    if (!info?.ip) return;

    try {

      await navigator.clipboard.writeText(info.ip);

      setCopiedIp(true);

      window.setTimeout(() => setCopiedIp(false), 1600);

    } catch {

      setCopiedIp(false);

    }

  }, [info?.ip]);



  const busy = loading || lookupLoading;

  const showingLookup = Boolean(info?.queriedIp);



  return (

    <div className="my-ip-tool space-y-4">

      <div

        className="rounded-none border border-emerald-900/50 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-200/90"

        role="note"

      >

        {labels.privacyNotice}

      </div>



      <div className="space-y-4 rounded-none border border-neutral-800 bg-[#1a1a1a]/90 p-4 backdrop-blur-sm">

        <div className="flex flex-wrap items-center justify-between gap-2">

          <div>

            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">

              {labels.myIpTitle}

            </p>

            {!busy && info ? (

              <p className="mt-1 text-xs text-neutral-600">

                {showingLookup ? labels.lookupTitle : info.source}

              </p>

            ) : null}

          </div>

          <div className="flex flex-wrap gap-2">

            <button

              type="button"

              className={clsx(toolOutlineBtn, copiedIp && "border-emerald-700 text-emerald-300")}

              disabled={!info?.ip || busy}

              onClick={() => void onCopyIp()}

            >

              {copiedIp ? (

                <>

                  <Check className="mr-2 inline h-4 w-4" aria-hidden />

                  {labels.copied}

                </>

              ) : (

                <>

                  <Copy className="mr-2 inline h-4 w-4" aria-hidden />

                  {labels.copyIp}

                </>

              )}

            </button>

            <button

              type="button"

              className={toolOutlineBtn}

              disabled={busy}

              onClick={() => void loadMine()}

            >

              {busy ? (

                <Loader2 className="mr-2 inline h-4 w-4 animate-spin" aria-hidden />

              ) : (

                <RefreshCw className="mr-2 inline h-4 w-4" aria-hidden />

              )}

              {showingLookup ? labels.lookupMine : labels.refresh}

            </button>

          </div>

        </div>



        {error ? (

          <div

            className="space-y-3 rounded-none border border-amber-700/50 bg-amber-950/40 px-3 py-3 text-sm text-amber-100"

            role="alert"

          >

            <p className="font-medium">{labels.errorTitle}</p>

            <p className="text-amber-200/90">{error}</p>

            <button type="button" className={toolPrimaryBtn} onClick={() => void loadMine()}>

              {labels.retry}

            </button>

          </div>

        ) : null}



        {loading && !info ? (

          <div className="flex items-center gap-2 border border-neutral-800 bg-neutral-950/60 p-8 text-sm text-neutral-400">

            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />

            {labels.loading}

          </div>

        ) : null}



        {info ? (

          <div className="space-y-6">

            <div className="border border-neutral-800 bg-neutral-950/70 px-4 py-6 text-center sm:px-6">

              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">

                {labels.publicIp}

                {info.version !== "Unknown" ? ` · ${info.version}` : ""}

              </p>

              <p className="mt-3 break-all font-mono text-3xl font-semibold tracking-tight text-neutral-50 sm:text-4xl md:text-5xl">

                {info.ip}

              </p>

              {(info.ipv4 && info.ipv4 !== info.ip) || (info.ipv6 && info.ipv6 !== info.ip) ? (

                <div className="mt-4 space-y-1 text-sm text-neutral-400">

                  {info.ipv4 && info.ipv4 !== info.ip ? (

                    <p>

                      <span className="text-neutral-500">{labels.ipv4Label}: </span>

                      <span className="font-mono text-neutral-200">{info.ipv4}</span>

                    </p>

                  ) : null}

                  {info.ipv6 && info.ipv6 !== info.ip ? (

                    <p>

                      <span className="text-neutral-500">{labels.ipv6Label}: </span>

                      <span className="font-mono text-neutral-200">{info.ipv6}</span>

                    </p>

                  ) : null}

                </div>

              ) : null}

            </div>



            <section

              className="border border-neutral-800 bg-neutral-950/70 p-4"

              aria-labelledby="my-ip-connection-details"

            >

              <h2

                id="my-ip-connection-details"

                className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500"

              >

                {labels.connectionDetails}

              </h2>

              <dl>

                <DetailRow label={labels.isp} value={info.isp ?? "—"} />

                <DetailRow label={labels.location} value={formatLocation(info)} />

                <DetailRow

                  label={labels.connectionType}

                  value={info.connectionType ?? info.version}

                />

                <DetailRow

                  label={labels.proxyStatus}

                  value={proxyStatusLabel(info.proxyStatus, {

                    vpn: labels.proxyVpn,

                    proxy: labels.proxyProxy,

                    hosting: labels.proxyHosting,

                    tor: labels.proxyTor,

                    clear: labels.proxyClear,

                    unknown: labels.proxyUnknown,

                  })}

                />

                <DetailRow label={labels.timezone} value={info.timezone ?? "—"} />

                <DetailRow label={labels.asn} value={info.asn ?? "—"} />

                <DetailRow

                  label={labels.coordinates}

                  value={

                    info.latitude != null && info.longitude != null

                      ? `${info.latitude.toFixed(4)}, ${info.longitude.toFixed(4)}`

                      : "—"

                  }

                />

              </dl>

            </section>

          </div>

        ) : null}

      </div>



      <div className="space-y-3 rounded-none border border-neutral-800 bg-[#1a1a1a]/90 p-4 backdrop-blur-sm">

        <div className="space-y-1">

          <label className="text-sm font-medium text-neutral-300" htmlFor={lookupId}>

            {labels.lookupTitle}

          </label>

          <p className="text-xs text-neutral-500">{labels.lookupHint}</p>

        </div>

        <div className="flex flex-col gap-2 sm:flex-row">

          <input

            id={lookupId}

            className="min-h-10 w-full border border-neutral-800 bg-neutral-950 px-3 py-2 font-mono text-sm text-neutral-100 outline-none focus-visible:border-neutral-500"

            value={lookupQuery}

            onChange={(event) => {

              setLookupQuery(event.target.value);

              setError("");

            }}

            onKeyDown={(event) => {

              if (event.key === "Enter") {

                event.preventDefault();

                void runLookup();

              }

            }}

            placeholder={labels.lookupPlaceholder}

            spellCheck={false}

            autoComplete="off"

            disabled={busy}

          />

          <button

            type="button"

            className={toolPrimaryBtn}

            disabled={busy || !lookupQuery.trim()}

            onClick={() => void runLookup()}

          >

            {lookupLoading ? (

              <Loader2 className="mr-2 inline h-4 w-4 animate-spin" aria-hidden />

            ) : (

              <Search className="mr-2 inline h-4 w-4" aria-hidden />

            )}

            {labels.lookupButton}

          </button>

        </div>

      </div>



      {info && system ? (

        <section

          className="space-y-3 rounded-none border border-neutral-800 bg-[#1a1a1a]/90 p-4 backdrop-blur-sm"

          aria-labelledby="my-ip-system-status"

        >

          <div className="flex flex-wrap items-center justify-between gap-2">

            <h2

              id="my-ip-system-status"

              className="text-xs font-semibold uppercase tracking-wide text-neutral-500"

            >

              {labels.systemStatus}

            </h2>

            <span

              className={clsx(

                "text-xs font-medium uppercase tracking-wide",

                system.online ? "text-emerald-400" : "text-amber-400",

              )}

            >

              {system.online ? labels.online : labels.offline}

            </span>

          </div>



          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">

            <CompactCopyField

              label={labels.browser}

              value={system.browser}

              copyLabel={labels.copy}

              copiedLabel={labels.copied}

            />

            <CompactCopyField

              label={labels.os}

              value={system.os}

              copyLabel={labels.copy}

              copiedLabel={labels.copied}

            />

            <CompactCopyField

              label={labels.device}

              value={system.device}

              copyLabel={labels.copy}

              copiedLabel={labels.copied}

            />

            <CompactCopyField

              label={labels.platform}

              value={system.platform}

              copyLabel={labels.copy}

              copiedLabel={labels.copied}

            />

            <CompactCopyField

              label={labels.language}

              value={system.languages || system.language}

              copyLabel={labels.copy}

              copiedLabel={labels.copied}

            />

          </div>



          <CompactCopyField

            label={labels.userAgent}

            value={system.userAgent}

            copyLabel={labels.copy}

            copiedLabel={labels.copied}

          />

        </section>

      ) : null}



      {info ? <PostSuccessUpsell operation="my-ip" fileContext={info.ip} /> : null}

    </div>

  );

}


