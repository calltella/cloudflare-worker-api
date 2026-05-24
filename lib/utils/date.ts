/**
 * データベースはUTC時間保存されているのが基本
 * NEXT側でUTCかJSTか判断するのは不可能
 * 
 */

// 現在時間をDate型で返します
export function getNow() {
  return new Date();  // 2026-03-19T03:14:37.605Z
}

// 10分後のDateを返します
export function getExpiresAt(minutes = 10) {
  const d = new Date();
  d.setMinutes(d.getMinutes() + minutes);
  return d;
}

// 20260524 → 2026-05-24に変換
export function toDateString(v: string): boolean | string {
  if (isValidYYYYMMDD(v)) {
    return false;
  }
  return `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}`;
}

function isValidYYYYMMDD(value: string | null): boolean {
  if (!value) return false;

  if (!/^\d{8}$/.test(value)) {
    return false;
  }

  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(4, 6));
  const day = Number(value.slice(6, 8));

  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};

/**
 * 
 * @param date 
 * @returns 
 */
export function utcFormatDateWithDay(
  date?: Date | string | null
): string | null {
  if (!date) return "";

  const d = typeof date === 'string' ? new Date(date) : date;

  return d.toLocaleString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  });
}
/**
 * 
 * @param date 
 * @returns 
 */
export function utcFormatDateTimeWithDay(
  date?: Date | string | null
): string | null {
  if (!date) return "";

  const d =
    typeof date === "number"
      ? new Date(date) // ← timestamp_ms対応
      : typeof date === "string"
        ? new Date(date)
        : date;

  return d.toLocaleString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function toDateTimeLocalString(
  value: Date | string | null | undefined
) {
  if (!value) return "";

  const date = typeof value === "string"
    ? new Date(value)
    : value;

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    date.getFullYear() +
    "-" +
    pad(date.getMonth() + 1) +
    "-" +
    pad(date.getDate()) +
    "T" +
    pad(date.getHours()) +
    ":" +
    pad(date.getMinutes())
  );
}

// format "2026-03-01T14:08" to "2026-03-01 14:08:00+09"
export function formatToDbDateTime(
  value?: string | null,
  timezoneOffset: string = "+09"
): string | null {
  if (!value) return null;

  // 2026-03-01T14:08
  const [datePart, timePart] = value.split("T");
  if (!datePart || !timePart) return null;

  // 秒が無いので付与
  const formattedTime = `${timePart}:00`;

  return `${datePart} ${formattedTime}${timezoneOffset}`;
}

type TimeOffset = {
  hours?: number;
  minutes?: number;
  seconds?: number;
};

// 現在のJST日時を "YYYY-MM-DD HH:mm:ss+09" 形式で取得（中身の時間は日本時間）
// getJstDateTimeString() で現在時間をStringで取り出せます
// TimeOffsetを渡すと、その分だけ未来の時間を取得できます（例: { minutes: 10 } なら10分後の時間）
export function getJstDateTimeString(offset: TimeOffset = {}): string {
  const now = new Date();

  // オフセット加算
  const offsetMs =
    (offset.hours ?? 0) * 60 * 60 * 1000 +
    (offset.minutes ?? 0) * 60 * 1000 +
    (offset.seconds ?? 0) * 1000;

  const target = new Date(now.getTime() + offsetMs);

  // JST = UTC+9
  const jst = new Date(target.getTime() + 9 * 60 * 60 * 1000);

  const yyyy = jst.getUTCFullYear();
  const mm = String(jst.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(jst.getUTCDate()).padStart(2, "0");
  const hh = String(jst.getUTCHours()).padStart(2, "0");
  const mi = String(jst.getUTCMinutes()).padStart(2, "0");
  const ss = String(jst.getUTCSeconds()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}+09`;
}

// "YYYY-MM-DD HH:mm:ss+09" 形式をDate型に直します
export function parseJstStringToDate(input: string): Date {
  // 例: "2026-03-18 12:34:56+09"
  const match = input.match(
    /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})\+09$/
  );

  if (!match) {
    throw new Error("Invalid date format. Expected YYYY-MM-DD HH:mm:ss+09");
  }

  const [, yyyy, mm, dd, hh, mi, ss] = match;

  // ISO形式に変換（+09:00 にする）
  const isoString = `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}+09:00`;

  const date = new Date(isoString);

  if (isNaN(date.getTime())) {
    throw new Error("Invalid date value");
  }

  return date;
}

/**
 * 2015-06-05T09:50:00.000000Z   ← UTC ISO
 * 2015-06-05 18:35:00+09        ← JST
 * @param dateStr 
 * @returns 
 */
export function convertToJstFormat(dateStr?: string): string | undefined {
  if (!dateStr) return undefined;

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return undefined;

  // JSTに変換（+9時間）
  const jst = new Date(date.getTime() + 9 * 60 * 60 * 1000);

  const yyyy = jst.getFullYear();
  const mm = String(jst.getMonth() + 1).padStart(2, "0");
  const dd = String(jst.getDate()).padStart(2, "0");
  const hh = String(jst.getHours()).padStart(2, "0");
  const mi = String(jst.getMinutes()).padStart(2, "0");
  const ss = String(jst.getSeconds()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}+09`;
}