export interface PublicSettings {
  telegramUrl: string;
  announcementText: string;
  isAnnouncementActive: boolean;
  minAccuracy: number;
  maxAccuracy: number;
  wingo30sUrl?: string;
  wingo1mUrl?: string;
  gameLinks: Record<string, string>;
}

export const DEFAULT_SETTINGS: PublicSettings = {
  telegramUrl: 'https://t.me/+iLrgv9u-WbBlMTM9',
  announcementText: '🔥 DRAGO 4.0 TURBO SERVER IS LIVE & 99.8% ACCURATE! JOIN OUR OFFICIAL TELEGRAM FOR VIP SIGNALS.',
  isAnnouncementActive: true,
  minAccuracy: 95.5,
  maxAccuracy: 99.2,
  wingo30sUrl: 'https://predictor-admin-turbo.xo.je/30secodindex.php?i=1',
  wingo1mUrl: 'https://predictor-admin-turbo.xo.je/1minuteindex.php?i=1',
  gameLinks: {
    sixclub: 'https://6club.com',
    veergame: 'https://veergame.com',
    dmfirst: 'https://dmfirst.com',
    sreewin: 'https://sreewin.com',
    bdgwin: 'https://bdgwin.com',
    ninetyoneclub: 'https://91club.com',
    goagame: 'https://goagame.com',
    jaiclub: 'https://jaiclub.com',
    jalwagame: 'https://jalwagame.com',
    eightytwolottery: 'https://82lottery.com',
    fiftyonegame: 'https://51game.com',
    tiranga: 'https://tiranga.com',
    yaarwin: 'https://yaarwin.com',
  },
};

const SETTINGS_KEY = 'drago_public_settings_v1';
let currentSettings: PublicSettings = { ...DEFAULT_SETTINGS };
const listeners: Array<(s: PublicSettings) => void> = [];

export function getPublicSettings(): PublicSettings {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migrate old default telegram link if present
      if (parsed.telegramUrl === 'https://t.me/+uu1UAjycgzNjNjZl' || !parsed.telegramUrl) {
        parsed.telegramUrl = DEFAULT_SETTINGS.telegramUrl;
      }
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        gameLinks: {
          ...DEFAULT_SETTINGS.gameLinks,
          ...(parsed.gameLinks || {}),
        },
      };
    }
  } catch (e) {
    // Ignore localStorage parse error
  }
  return currentSettings;
}

export function savePublicSettingsLocally(settings: Partial<PublicSettings>) {
  const updated = {
    ...getPublicSettings(),
    ...settings,
    gameLinks: {
      ...getPublicSettings().gameLinks,
      ...(settings.gameLinks || {}),
    },
  };
  currentSettings = updated;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  } catch (e) {
    // Ignore error
  }
  listeners.forEach((fn) => fn(updated));
  return updated;
}

export function subscribePublicSettings(listener: (s: PublicSettings) => void) {
  listeners.push(listener);
  return () => {
    const idx = listeners.indexOf(listener);
    if (idx !== -1) listeners.splice(idx, 1);
  };
}

export async function fetchRemoteSettings(): Promise<PublicSettings> {
  try {
    const res = await fetch('/api/public-settings');
    if (res.ok) {
      const data = await res.json();
      if (data && data.telegramUrl) {
        return savePublicSettingsLocally(data);
      }
    }
  } catch (err) {
    console.log('[Settings] Remote fetch offline, using local cache');
  }
  return getPublicSettings();
}
