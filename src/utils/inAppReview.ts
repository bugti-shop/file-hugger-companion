/**
 * Google Play / App Store official in-app review.
 * We only decide *eligibility*; the store decides whether the dialog actually
 * appears (it enforces its own quota), so we never force timing or retry.
 *
 * Eligible when: installed >= 2 days, >= 2 sessions (first session finished),
 * >= 3 meaningful interactions, >= 60s into the current session, and
 * >= 90 days since our last request (max 3 requests ever).
 */
import { Capacitor } from '@capacitor/core';
import { getSetting, setSetting } from './settingsStorage';

const KEY = 'flowist_in_app_review_v1';
const DAY = 86_400_000;

interface ReviewState {
  installedAt: number;
  sessions: number;
  interactions: number;
  lastRequestAt: number | null;
  requestCount: number;
}

const sessionStartedAt = Date.now();
let cache: ReviewState | null = null;
let pending = false;

const load = async (): Promise<ReviewState> => {
  if (cache) return cache;
  cache = await getSetting<ReviewState>(KEY, {
    installedAt: Date.now(), sessions: 0, interactions: 0, lastRequestAt: null, requestCount: 0,
  });
  return cache;
};
const save = (s: ReviewState) => setSetting(KEY, s).catch(() => {});

/** Call once per app launch. */
export const recordAppSession = async () => {
  const s = await load();
  s.sessions += 1;
  await save(s);
};

const isEligible = (s: ReviewState) => {
  const now = Date.now();
  if (!Capacitor.isNativePlatform()) return false;
  if (document.visibilityState !== 'visible') return false;
  if (s.requestCount >= 3) return false;
  if (s.lastRequestAt && now - s.lastRequestAt < 90 * DAY) return false;
  if (now - s.installedAt < 2 * DAY) return false;
  if (s.sessions < 2 || s.interactions < 3) return false;
  if (now - sessionStartedAt < 60_000) return false;
  return true;
};

/** Call after a meaningful success (task completed, note saved, habit done). */
export const recordMeaningfulInteraction = async () => {
  try {
    const s = await load();
    s.interactions += 1;
    await save(s);
    if (pending || !isEligible(s)) return;
    pending = true;
    // Let the success feedback (toast/animation) finish first.
    setTimeout(async () => {
      try {
        if (!isEligible(s)) return;
        s.lastRequestAt = Date.now();
        s.requestCount += 1;
        await save(s);
        const { InAppReview } = await import('@capacitor-community/in-app-review');
        await InAppReview.requestReview();
      } catch (e) {
        console.warn('[InAppReview] request failed', e);
      } finally {
        pending = false;
      }
    }, 2500);
  } catch {
    /* never block the user */
  }
};
