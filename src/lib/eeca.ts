import { chromium, type Browser } from "playwright";
import type { EecaResult } from "./types";

const EECA_URL =
  "https://www.eeca.govt.nz/co-funding-and-support/products/warmer-kiwi-homes-programme/check-eligibility/?bypassIntro=1";

let browserPromise: Promise<Browser> | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = chromium.launch({
      headless: true,
      args: ["--disable-blink-features=AutomationControlled"],
    });
  }
  return browserPromise;
}

/**
 * Checks EECA’s Warmer Kiwi Homes qualify API for an AddressRight address id.
 * Uses a headless browser to obtain a reCAPTCHA v3 token from EECA’s public page,
 * then calls /api/tools/wkh/qualify (same path the official tool uses).
 *
 * Critical flags: hasInsulationRequest / hasHeatingRequest → existing claim.
 */
export async function checkEecaEligibility(addressId: string): Promise<EecaResult> {
  const empty: EecaResult = {
    checked: false,
    hasExistingClaim: false,
    hasInsulationRequest: false,
    hasHeatingRequest: false,
    hasInsulation: false,
    hasHeating: false,
    addressInsulationValid: null,
    addressHeatingValid: null,
  };

  let context = null;
  try {
    const browser = await getBrowser();
    context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      locale: "en-NZ",
    });
    await context.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => undefined });
    });

    const page = await context.newPage();
    await page.goto(EECA_URL, { waitUntil: "domcontentloaded", timeout: 60000 });

    await page.waitForFunction(
      () =>
        Boolean(
          (window as unknown as { grecaptcha?: { execute?: unknown }; configuration?: unknown })
            .grecaptcha?.execute &&
            (window as unknown as { configuration?: { captchaSiteKey?: string } }).configuration
              ?.captchaSiteKey
        ),
      { timeout: 30000 }
    );

    const payload = await page.evaluate(async (id: string) => {
      const win = window as unknown as {
        configuration: { captchaSiteKey: string };
        grecaptcha: {
          ready: (cb: () => void) => void;
          execute: (siteKey: string, opts: { action: string }) => Promise<string>;
        };
      };

      const siteKey = win.configuration.captchaSiteKey;
      const token = await new Promise<string>((resolve, reject) => {
        win.grecaptcha.ready(() => {
          win.grecaptcha
            .execute(siteKey, { action: "Susbscribe" })
            .then(resolve)
            .catch(reject);
        });
      });

      const url = `/api/tools/wkh/qualify?addressId=${encodeURIComponent(id)}&recaptchaToken=${encodeURIComponent(token)}`;
      const res = await fetch(url);
      const json = await res.json();
      return { status: res.status, json };
    }, addressId);

    const data = (payload.json as { Success?: boolean; ErrorMsg?: string; Data?: Record<string, unknown> })
      ?.Data;

    if (!payload.json?.Success || !data) {
      return {
        ...empty,
        checked: false,
        error:
          (payload.json as { ErrorMsg?: string })?.ErrorMsg ||
          `EECA qualify failed (HTTP ${payload.status})`,
      };
    }

    const hasInsulationRequest = Boolean(data.hasInsulationRequest);
    const hasHeatingRequest = Boolean(data.hasHeatingRequest);

    return {
      checked: true,
      hasExistingClaim: hasInsulationRequest || hasHeatingRequest,
      hasInsulationRequest,
      hasHeatingRequest,
      hasInsulation: Boolean(data.hasInsulation),
      hasHeating: Boolean(data.hasHeating),
      addressInsulationValid:
        data.addressInsulationValid == null ? null : Boolean(data.addressInsulationValid),
      addressHeatingValid:
        data.addressHeatingValid == null ? null : Boolean(data.addressHeatingValid),
      raw: data,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "EECA check failed";
    return { ...empty, checked: false, error: message };
  } finally {
    if (context) await context.close().catch(() => undefined);
  }
}
