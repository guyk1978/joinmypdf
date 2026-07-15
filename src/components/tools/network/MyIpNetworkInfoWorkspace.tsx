"use client";



import { useEffect, useMemo } from "react";

import { useTranslations } from "next-intl";

import { capture, EVENTS } from "@/components/AnalyticsClient";

import { UtilityWorkspaceShell } from "@/components/utility/UtilityWorkspaceShell";

import {

  MyIpNetworkInfo,

  type MyIpNetworkInfoLabels,

} from "@/components/tools/network/MyIpNetworkInfo";

import type { ToolDefinition } from "@/lib/types";



type MyIpNetworkInfoWorkspaceProps = {

  tool: ToolDefinition;

  slug: string;

};



export function MyIpNetworkInfoWorkspace({ tool, slug }: MyIpNetworkInfoWorkspaceProps) {

  const t = useTranslations("MyIpNetworkInfo");



  useEffect(() => {

    capture(EVENTS.tool_view, { slug, operation: tool.operation });

  }, [slug, tool.operation]);



  const labels = useMemo<MyIpNetworkInfoLabels>(

    () => ({

      privacyNotice: t("privacyNotice"),

      loading: t("loading"),

      refresh: t("refresh"),

      errorTitle: t("errorTitle"),

      retry: t("retry"),

      myIpTitle: t("myIpTitle"),

      publicIp: t("publicIp"),

      ipv4Label: t("ipv4Label"),

      ipv6Label: t("ipv6Label"),

      ipVersion: t("ipVersion"),

      connectionDetails: t("connectionDetails"),

      isp: t("isp"),

      org: t("org"),

      location: t("location"),

      country: t("country"),

      timezone: t("timezone"),

      connectionType: t("connectionType"),

      proxyStatus: t("proxyStatus"),

      proxyVpn: t("proxyVpn"),

      proxyProxy: t("proxyProxy"),

      proxyHosting: t("proxyHosting"),

      proxyTor: t("proxyTor"),

      proxyClear: t("proxyClear"),

      proxyUnknown: t("proxyUnknown"),

      coordinates: t("coordinates"),

      asn: t("asn"),

      source: t("source"),

      lookupTitle: t("lookupTitle"),

      lookupHint: t("lookupHint"),

      lookupPlaceholder: t("lookupPlaceholder"),

      lookupButton: t("lookupButton"),

      lookupInvalid: t("lookupInvalid"),

      lookupMine: t("lookupMine"),

      systemStatus: t("systemStatus"),

      browser: t("browser"),

      os: t("os"),

      device: t("device"),

      language: t("language"),

      platform: t("platform"),

      userAgent: t("userAgent"),

      online: t("online"),

      offline: t("offline"),

      copyIp: t("copyIp"),

      copy: t("copy"),

      copied: t("copied"),

    }),

    [t],

  );



  return (

    <UtilityWorkspaceShell pageClassName="my-ip-tool-page">

      <MyIpNetworkInfo labels={labels} />

    </UtilityWorkspaceShell>

  );

}


