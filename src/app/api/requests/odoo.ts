import prisma from "@/lib/db";
import type { SessionPayload } from "@/lib/auth";

/**
 * Shared Odoo API helpers.
 * Centralises URL building, charity resolution, and fetch wrappers
 * so that individual route handlers stay short and readable.
 */

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface SyncCharity {
  id: string;
  name: string;
  token: string;
  domain: string | null;
  providerId: string | null;
  apiCode: string | null;
  [key: string]: unknown;
}

/* ------------------------------------------------------------------ */
/*  URL helpers                                                        */
/* ------------------------------------------------------------------ */

/**
 * Normalises a domain string into a base URL ending with `/`.
 * Handles missing protocol and trailing-slash inconsistencies.
 */
export function buildBaseUrl(domain: string): string {
  const trimmed = domain.trim();
  const prefix = /^https?:\/\//i.test(trimmed) ? "" : "http://";
  const base = `${prefix}${trimmed}`;
  return base.endsWith("/") ? base : `${base}/`;
}

/**
 * Build the full Odoo offers URL for either listing or a single offer.
 */
export function buildOffersUrl(domain: string, offerId?: number | string): string {
  const base = buildBaseUrl(domain);
  return offerId != null
    ? `${base}api/cerp/offers/${offerId}`
    : `${base}api/cerp/offers`;
}

/* ------------------------------------------------------------------ */
/*  Charity resolution                                                 */
/* ------------------------------------------------------------------ */

const DEFAULT_DOMAIN = "http://192.168.100.82:8021";

/**
 * Returns the list of connected charities the current session is
 * allowed to query, enriched with `apiCode` from the owning provider.
 */
export async function getCharitiesToSync(session: SessionPayload): Promise<SyncCharity[]> {
  const { role, charityId, providerId } = session;

  if (role === "SERVICE_PROVIDER" && providerId) {
    const provider = await prisma.serviceProvider.findUnique({
      where: { id: providerId },
      include: { charities: { where: { status: "CONNECTED" } } },
    });
    if (!provider) return [];
    return provider.charities.map((c) => ({
      ...c,
      apiCode: provider.apiCode,
    })) as unknown as SyncCharity[];
  }

  if (role === "CHARITY_STAFF" && charityId) {
    const charity = await prisma.charity.findUnique({
      where: { id: charityId },
      include: { provider: true },
    });
    if (!charity || charity.status !== "CONNECTED" || !charity.token) return [];
    return [{
      ...charity,
      apiCode: charity.provider?.apiCode || null,
    }] as unknown as SyncCharity[];
  }

  if (role === "SUPER_ADMIN") {
    const charities = await prisma.charity.findMany({
      where: { status: "CONNECTED" },
      include: { provider: true },
    });
    return charities.map((c) => ({
      ...c,
      apiCode: c.provider?.apiCode || null,
    })) as unknown as SyncCharity[];
  }

  return [];
}

/* ------------------------------------------------------------------ */
/*  Fetch wrappers                                                     */
/* ------------------------------------------------------------------ */

/**
 * GET a single offer detail from the Odoo API, iterating through the
 * given charities until a match is found.
 *
 * Returns `{ offer, agreedProducts, charity }` on success, or `null`.
 */
export async function fetchOfferDetail(
  offerId: number,
  charities: SyncCharity[],
): Promise<{ offer: any; agreedProducts: any[]; charity: SyncCharity } | null> {
  for (const charity of charities) {
    if (!charity.token) continue;
    const url = buildOffersUrl(charity.domain || DEFAULT_DOMAIN, offerId);

    try {
      const res = await fetch(url, {
        headers: {
          code: charity.apiCode || "",
          token: charity.token,
        },
        signal: AbortSignal.timeout(5000),
      });

      if (res.ok) {
        const body = await res.json();
        const offer = body?.data?.offer;
        if (offer) {
          return {
            offer,
            agreedProducts: body?.data?.agreed_products || [],
            charity,
          };
        }
      }
    } catch (err) {
      console.error(`Odoo API Error fetching offer ${offerId}:`, err);
    }
  }
  return null;
}

/**
 * POST to the Odoo offers API (submit / update an offer).
 */
export async function postOfferToOdoo(
  offerId: number,
  charity: SyncCharity,
  params: Record<string, unknown>,
): Promise<{ ok: boolean; error?: string }> {
  const url = buildOffersUrl(charity.domain || DEFAULT_DOMAIN, offerId);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        code: charity.apiCode || "",
        token: charity.token,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "call",
        params,
      }),
      signal: AbortSignal.timeout(5000),
    });

    const body = await res.json().catch(() => null);

    // Check HTTP status
    if (!res.ok) {
      const msg = body?.message || body?.error?.message || res.statusText;
      console.error("Odoo POST failed:", JSON.stringify(body));
      return { ok: false, error: msg || "فشل الاتصال بالنظام الخارجي" };
    }

    // Check JSON-RPC level error
    if (body?.error) {
      const msg = body.error?.data?.message || body.error?.message || "خطأ في النظام الخارجي";
      console.error("Odoo JSON-RPC error:", JSON.stringify(body.error));
      return { ok: false, error: msg };
    }

    // Check custom response format (success: false)
    const result = body?.result;
    if (result && result.success === false) {
      console.error("Odoo custom error:", JSON.stringify(result));
      return { ok: false, error: result.message || "خطأ في النظام الخارجي" };
    }

    return { ok: true };
  } catch (err) {
    console.error("Odoo connection error:", err);
    return { ok: false, error: "حدث خطأ في الاتصال بالنظام الخارجي" };
  }
}

/* ------------------------------------------------------------------ */
/*  Provider matching                                                  */
/* ------------------------------------------------------------------ */

/**
 * Try to resolve the local `ServiceProvider` record that corresponds
 * to an offer, using session, charity FK, or name matching as fallbacks.
 */
export async function resolveProvider(
  session: SessionPayload,
  charity: SyncCharity,
  offerPartnerName?: string,
) {
  const providers = await prisma.serviceProvider.findMany();

  if (session.role === "SERVICE_PROVIDER" && session.providerId) {
    return providers.find((p) => String(p.id) === String(session.providerId)) || null;
  }

  if (charity.providerId) {
    const match = providers.find((p) => String(p.id) === String(charity.providerId));
    if (match) return match;
  }

  if (offerPartnerName) {
    return providers.find((p) => p.name.trim() === offerPartnerName.trim()) || null;
  }

  return null;
}

/* ------------------------------------------------------------------ */
/*  High-level fetch: all RFQ offers                                   */
/* ------------------------------------------------------------------ */

/**
 * Fetches all RFQ-stage offers from Odoo for the given session.
 * Used by both the requests listing route and the stats route.
 */
export async function fetchRFQsFromOdoo(session: SessionPayload) {
  const charities = await getCharitiesToSync(session);
  const providers = await prisma.serviceProvider.findMany();
  const apiRequests: any[] = [];

  for (const charity of charities) {
    if (!charity.token) continue;
    const url = buildOffersUrl(charity.domain || DEFAULT_DOMAIN);

    try {
      const res = await fetch(url, {
        headers: { code: charity.apiCode || "", token: charity.token },
        signal: AbortSignal.timeout(5000),
      });

      if (!res.ok) {
        console.error(`Odoo API Error: ${url}: ${res.statusText}`);
        continue;
      }

      const body = await res.json();
      const offers = body?.data?.offers || [];

      const detailPromises = offers.map(async (offer: any) => {
        if (
          offer.offer_state === "approved" ||
          offer.offer_state === "cancel" ||
          offer.offer_state === "cancel_done"
        ) {
          return null;
        }

        let matchedProvider = null;
        if (session.role === "SERVICE_PROVIDER" && session.providerId) {
          matchedProvider = providers.find((p) => String(p.id) === String(session.providerId));
        } else if (charity.providerId) {
          matchedProvider = providers.find((p) => String(p.id) === String(charity.providerId));
        }
        if (!matchedProvider && offer.offer_partner_name) {
          matchedProvider = providers.find(
            (p) => p.name.trim() === offer.offer_partner_name.trim()
          );
        }

        let beneficiaryName = "مستفيد خارجي";
        let beneficiaryNationalId = "";
        try {
          const detailUrl = buildOffersUrl(charity.domain || DEFAULT_DOMAIN, offer.offer_id);
          const detailRes = await fetch(detailUrl, {
            headers: { code: charity.apiCode || "", token: charity.token },
            signal: AbortSignal.timeout(3000),
          });
          if (detailRes.ok) {
            const d = await detailRes.json();
            const off = d?.data?.offer;
            if (off) {
              beneficiaryName = off.beneficiary_name || beneficiaryName;
              beneficiaryNationalId = off.beneficiary_mobile || beneficiaryNationalId;
            }
          }
        } catch (err) {
          console.error(`Detail fetch error for offer ${offer.offer_id}:`, err);
        }

        return {
          id: offer.offer_id,
          name: offer.offer_name,
          beneficiaryName,
          beneficiaryNationalId,
          status: "RFQ",
          serviceCost: 0,
          charityContributionPercentage: 100,
          charityContributionValue: 0,
          beneficiaryContributionValue: 0,
          description: offer.sub_service_type || "",
          createdAt: offer.request_date
            ? new Date(offer.request_date).toISOString()
            : new Date().toISOString(),
          charity: { name: charity.name },
          serviceProvider: {
            name: offer.offer_partner_name || "مزود خدمة خارجي",
          },
          priceOffers: [],
        };
      });

      const resolved = await Promise.all(detailPromises);
      for (const r of resolved) {
        if (r) apiRequests.push(r);
      }
    } catch (err) {
      console.error(`Odoo connection error for charity ${charity.id}:`, err);
    }
  }

  apiRequests.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return apiRequests;
}
