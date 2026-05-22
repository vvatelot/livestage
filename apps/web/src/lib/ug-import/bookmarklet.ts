/** Message types for bookmarklet ↔ LiveStage handshake */

export const UG_IMPORT_MESSAGE = {
  /** LiveStage import page is ready to receive data */
  READY: "livestage-import-ready",
  /** UG bookmarklet sends tab JSON */
  DATA: "livestage-ug-import",
} as const;

export function getAppOrigin(): string {
  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_APP_URL ?? "";
}

/**
 * Expression JS sans littéral "//" (sinon les favoris javascript: cassent le parseur).
 */
function originToBookmarkletExpr(origin: string): string {
  const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  if (origin.startsWith("https://")) {
    return `["https:",String.fromCharCode(47,47),"${esc(origin.slice(8))}"].join("")`;
  }
  if (origin.startsWith("http://")) {
    return `["http:",String.fromCharCode(47,47),"${esc(origin.slice(7))}"].join("")`;
  }
  return JSON.stringify(origin);
}

/**
 * Corps du bookmarklet — aucune séquence "//" dans le source (requis pour javascript:).
 */
function buildBookmarkletBody(appOrigin: string): string {
  const oExpr = originToBookmarkletExpr(appOrigin);

  return [
    "void((function(){",
    `var O=${oExpr};`,
    "window.__LIVESTAGE_ORIGIN__=O;",
    "var s=document.createElement(String.fromCharCode(115,99,114,105,112,116));",
    "s.src=O+String.fromCharCode(47)+'ug-import-bookmarklet.js?t='+Date.now();",
    's.onerror=function(){alert("LiveStage: script non charge. Verifiez l application sur "+O);};',
    "(document.head||document.documentElement).appendChild(s);",
    "})())",
  ].join("");
}

export function getBookmarkletCode(appOrigin: string): string {
  return `javascript:${encodeURIComponent(buildBookmarkletBody(appOrigin))}`;
}

export interface UgImportMessage {
  type: typeof UG_IMPORT_MESSAGE.DATA;
  data: string;
  sourceUrl?: string;
}

export function isUgImportMessage(data: unknown): data is UgImportMessage {
  return (
    typeof data === "object" &&
    data !== null &&
    (data as UgImportMessage).type === UG_IMPORT_MESSAGE.DATA &&
    typeof (data as UgImportMessage).data === "string"
  );
}
