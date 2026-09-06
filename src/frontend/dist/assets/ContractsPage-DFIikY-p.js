import { c as createLucideIcon, r as reactExports, u as useAuth, a as useContracts, b as useAddContract, d as useUpdateContract, j as jsxRuntimeExports, S as SkeletonCardList, F as FileText, e as useAddWorkColumn, f as useSetAttendance, g as useLabours, h as useGetActiveLabours, s as sortWorkColumns, i as getAttendanceDisplay } from "./index-B9IM4GPI.js";
import { AttendanceTable } from "./AttendancePage-UjXHbb16.js";
import { L as LayoutGrid, a as List } from "./list-C9qDqOry.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$1 = [
  ["path", { d: "M8 2v4", key: "1cmpym" }],
  ["path", { d: "M16 2v4", key: "4m81vk" }],
  ["rect", { width: "18", height: "18", x: "3", y: "4", rx: "2", key: "1hopcy" }],
  ["path", { d: "M3 10h18", key: "8toen8" }]
];
const Calendar = createLucideIcon("calendar", __iconNode$1);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  [
    "path",
    {
      d: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z",
      key: "cbrjhi"
    }
  ]
];
const Wrench = createLucideIcon("wrench", __iconNode);
function toDate(argument) {
  const argStr = Object.prototype.toString.call(argument);
  if (argument instanceof Date || typeof argument === "object" && argStr === "[object Date]") {
    return new argument.constructor(+argument);
  } else if (typeof argument === "number" || argStr === "[object Number]" || typeof argument === "string" || argStr === "[object String]") {
    return new Date(argument);
  } else {
    return /* @__PURE__ */ new Date(NaN);
  }
}
function constructFrom(date, value) {
  if (date instanceof Date) {
    return new date.constructor(value);
  } else {
    return new Date(value);
  }
}
const millisecondsInWeek = 6048e5;
const millisecondsInDay = 864e5;
let defaultOptions = {};
function getDefaultOptions() {
  return defaultOptions;
}
function startOfWeek(date, options) {
  var _a, _b, _c, _d;
  const defaultOptions2 = getDefaultOptions();
  const weekStartsOn = (options == null ? void 0 : options.weekStartsOn) ?? ((_b = (_a = options == null ? void 0 : options.locale) == null ? void 0 : _a.options) == null ? void 0 : _b.weekStartsOn) ?? defaultOptions2.weekStartsOn ?? ((_d = (_c = defaultOptions2.locale) == null ? void 0 : _c.options) == null ? void 0 : _d.weekStartsOn) ?? 0;
  const _date = toDate(date);
  const day = _date.getDay();
  const diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn;
  _date.setDate(_date.getDate() - diff);
  _date.setHours(0, 0, 0, 0);
  return _date;
}
function startOfISOWeek(date) {
  return startOfWeek(date, { weekStartsOn: 1 });
}
function getISOWeekYear(date) {
  const _date = toDate(date);
  const year = _date.getFullYear();
  const fourthOfJanuaryOfNextYear = constructFrom(date, 0);
  fourthOfJanuaryOfNextYear.setFullYear(year + 1, 0, 4);
  fourthOfJanuaryOfNextYear.setHours(0, 0, 0, 0);
  const startOfNextYear = startOfISOWeek(fourthOfJanuaryOfNextYear);
  const fourthOfJanuaryOfThisYear = constructFrom(date, 0);
  fourthOfJanuaryOfThisYear.setFullYear(year, 0, 4);
  fourthOfJanuaryOfThisYear.setHours(0, 0, 0, 0);
  const startOfThisYear = startOfISOWeek(fourthOfJanuaryOfThisYear);
  if (_date.getTime() >= startOfNextYear.getTime()) {
    return year + 1;
  } else if (_date.getTime() >= startOfThisYear.getTime()) {
    return year;
  } else {
    return year - 1;
  }
}
function startOfDay(date) {
  const _date = toDate(date);
  _date.setHours(0, 0, 0, 0);
  return _date;
}
function getTimezoneOffsetInMilliseconds(date) {
  const _date = toDate(date);
  const utcDate = new Date(
    Date.UTC(
      _date.getFullYear(),
      _date.getMonth(),
      _date.getDate(),
      _date.getHours(),
      _date.getMinutes(),
      _date.getSeconds(),
      _date.getMilliseconds()
    )
  );
  utcDate.setUTCFullYear(_date.getFullYear());
  return +date - +utcDate;
}
function differenceInCalendarDays(dateLeft, dateRight) {
  const startOfDayLeft = startOfDay(dateLeft);
  const startOfDayRight = startOfDay(dateRight);
  const timestampLeft = +startOfDayLeft - getTimezoneOffsetInMilliseconds(startOfDayLeft);
  const timestampRight = +startOfDayRight - getTimezoneOffsetInMilliseconds(startOfDayRight);
  return Math.round((timestampLeft - timestampRight) / millisecondsInDay);
}
function startOfISOWeekYear(date) {
  const year = getISOWeekYear(date);
  const fourthOfJanuary = constructFrom(date, 0);
  fourthOfJanuary.setFullYear(year, 0, 4);
  fourthOfJanuary.setHours(0, 0, 0, 0);
  return startOfISOWeek(fourthOfJanuary);
}
function isDate(value) {
  return value instanceof Date || typeof value === "object" && Object.prototype.toString.call(value) === "[object Date]";
}
function isValid(date) {
  if (!isDate(date) && typeof date !== "number") {
    return false;
  }
  const _date = toDate(date);
  return !isNaN(Number(_date));
}
function startOfYear(date) {
  const cleanDate = toDate(date);
  const _date = constructFrom(date, 0);
  _date.setFullYear(cleanDate.getFullYear(), 0, 1);
  _date.setHours(0, 0, 0, 0);
  return _date;
}
const formatDistanceLocale = {
  lessThanXSeconds: {
    one: "less than a second",
    other: "less than {{count}} seconds"
  },
  xSeconds: {
    one: "1 second",
    other: "{{count}} seconds"
  },
  halfAMinute: "half a minute",
  lessThanXMinutes: {
    one: "less than a minute",
    other: "less than {{count}} minutes"
  },
  xMinutes: {
    one: "1 minute",
    other: "{{count}} minutes"
  },
  aboutXHours: {
    one: "about 1 hour",
    other: "about {{count}} hours"
  },
  xHours: {
    one: "1 hour",
    other: "{{count}} hours"
  },
  xDays: {
    one: "1 day",
    other: "{{count}} days"
  },
  aboutXWeeks: {
    one: "about 1 week",
    other: "about {{count}} weeks"
  },
  xWeeks: {
    one: "1 week",
    other: "{{count}} weeks"
  },
  aboutXMonths: {
    one: "about 1 month",
    other: "about {{count}} months"
  },
  xMonths: {
    one: "1 month",
    other: "{{count}} months"
  },
  aboutXYears: {
    one: "about 1 year",
    other: "about {{count}} years"
  },
  xYears: {
    one: "1 year",
    other: "{{count}} years"
  },
  overXYears: {
    one: "over 1 year",
    other: "over {{count}} years"
  },
  almostXYears: {
    one: "almost 1 year",
    other: "almost {{count}} years"
  }
};
const formatDistance = (token, count, options) => {
  let result;
  const tokenValue = formatDistanceLocale[token];
  if (typeof tokenValue === "string") {
    result = tokenValue;
  } else if (count === 1) {
    result = tokenValue.one;
  } else {
    result = tokenValue.other.replace("{{count}}", count.toString());
  }
  if (options == null ? void 0 : options.addSuffix) {
    if (options.comparison && options.comparison > 0) {
      return "in " + result;
    } else {
      return result + " ago";
    }
  }
  return result;
};
function buildFormatLongFn(args) {
  return (options = {}) => {
    const width = options.width ? String(options.width) : args.defaultWidth;
    const format2 = args.formats[width] || args.formats[args.defaultWidth];
    return format2;
  };
}
const dateFormats = {
  full: "EEEE, MMMM do, y",
  long: "MMMM do, y",
  medium: "MMM d, y",
  short: "MM/dd/yyyy"
};
const timeFormats = {
  full: "h:mm:ss a zzzz",
  long: "h:mm:ss a z",
  medium: "h:mm:ss a",
  short: "h:mm a"
};
const dateTimeFormats = {
  full: "{{date}} 'at' {{time}}",
  long: "{{date}} 'at' {{time}}",
  medium: "{{date}}, {{time}}",
  short: "{{date}}, {{time}}"
};
const formatLong = {
  date: buildFormatLongFn({
    formats: dateFormats,
    defaultWidth: "full"
  }),
  time: buildFormatLongFn({
    formats: timeFormats,
    defaultWidth: "full"
  }),
  dateTime: buildFormatLongFn({
    formats: dateTimeFormats,
    defaultWidth: "full"
  })
};
const formatRelativeLocale = {
  lastWeek: "'last' eeee 'at' p",
  yesterday: "'yesterday at' p",
  today: "'today at' p",
  tomorrow: "'tomorrow at' p",
  nextWeek: "eeee 'at' p",
  other: "P"
};
const formatRelative = (token, _date, _baseDate, _options) => formatRelativeLocale[token];
function buildLocalizeFn(args) {
  return (value, options) => {
    const context = (options == null ? void 0 : options.context) ? String(options.context) : "standalone";
    let valuesArray;
    if (context === "formatting" && args.formattingValues) {
      const defaultWidth = args.defaultFormattingWidth || args.defaultWidth;
      const width = (options == null ? void 0 : options.width) ? String(options.width) : defaultWidth;
      valuesArray = args.formattingValues[width] || args.formattingValues[defaultWidth];
    } else {
      const defaultWidth = args.defaultWidth;
      const width = (options == null ? void 0 : options.width) ? String(options.width) : args.defaultWidth;
      valuesArray = args.values[width] || args.values[defaultWidth];
    }
    const index = args.argumentCallback ? args.argumentCallback(value) : value;
    return valuesArray[index];
  };
}
const eraValues = {
  narrow: ["B", "A"],
  abbreviated: ["BC", "AD"],
  wide: ["Before Christ", "Anno Domini"]
};
const quarterValues = {
  narrow: ["1", "2", "3", "4"],
  abbreviated: ["Q1", "Q2", "Q3", "Q4"],
  wide: ["1st quarter", "2nd quarter", "3rd quarter", "4th quarter"]
};
const monthValues = {
  narrow: ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"],
  abbreviated: [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
  ],
  wide: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ]
};
const dayValues = {
  narrow: ["S", "M", "T", "W", "T", "F", "S"],
  short: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
  abbreviated: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  wide: [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
  ]
};
const dayPeriodValues = {
  narrow: {
    am: "a",
    pm: "p",
    midnight: "mi",
    noon: "n",
    morning: "morning",
    afternoon: "afternoon",
    evening: "evening",
    night: "night"
  },
  abbreviated: {
    am: "AM",
    pm: "PM",
    midnight: "midnight",
    noon: "noon",
    morning: "morning",
    afternoon: "afternoon",
    evening: "evening",
    night: "night"
  },
  wide: {
    am: "a.m.",
    pm: "p.m.",
    midnight: "midnight",
    noon: "noon",
    morning: "morning",
    afternoon: "afternoon",
    evening: "evening",
    night: "night"
  }
};
const formattingDayPeriodValues = {
  narrow: {
    am: "a",
    pm: "p",
    midnight: "mi",
    noon: "n",
    morning: "in the morning",
    afternoon: "in the afternoon",
    evening: "in the evening",
    night: "at night"
  },
  abbreviated: {
    am: "AM",
    pm: "PM",
    midnight: "midnight",
    noon: "noon",
    morning: "in the morning",
    afternoon: "in the afternoon",
    evening: "in the evening",
    night: "at night"
  },
  wide: {
    am: "a.m.",
    pm: "p.m.",
    midnight: "midnight",
    noon: "noon",
    morning: "in the morning",
    afternoon: "in the afternoon",
    evening: "in the evening",
    night: "at night"
  }
};
const ordinalNumber = (dirtyNumber, _options) => {
  const number = Number(dirtyNumber);
  const rem100 = number % 100;
  if (rem100 > 20 || rem100 < 10) {
    switch (rem100 % 10) {
      case 1:
        return number + "st";
      case 2:
        return number + "nd";
      case 3:
        return number + "rd";
    }
  }
  return number + "th";
};
const localize = {
  ordinalNumber,
  era: buildLocalizeFn({
    values: eraValues,
    defaultWidth: "wide"
  }),
  quarter: buildLocalizeFn({
    values: quarterValues,
    defaultWidth: "wide",
    argumentCallback: (quarter) => quarter - 1
  }),
  month: buildLocalizeFn({
    values: monthValues,
    defaultWidth: "wide"
  }),
  day: buildLocalizeFn({
    values: dayValues,
    defaultWidth: "wide"
  }),
  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues,
    defaultWidth: "wide",
    formattingValues: formattingDayPeriodValues,
    defaultFormattingWidth: "wide"
  })
};
function buildMatchFn(args) {
  return (string, options = {}) => {
    const width = options.width;
    const matchPattern = width && args.matchPatterns[width] || args.matchPatterns[args.defaultMatchWidth];
    const matchResult = string.match(matchPattern);
    if (!matchResult) {
      return null;
    }
    const matchedString = matchResult[0];
    const parsePatterns = width && args.parsePatterns[width] || args.parsePatterns[args.defaultParseWidth];
    const key = Array.isArray(parsePatterns) ? findIndex(parsePatterns, (pattern) => pattern.test(matchedString)) : (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- I challange you to fix the type
      findKey(parsePatterns, (pattern) => pattern.test(matchedString))
    );
    let value;
    value = args.valueCallback ? args.valueCallback(key) : key;
    value = options.valueCallback ? (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- I challange you to fix the type
      options.valueCallback(value)
    ) : value;
    const rest = string.slice(matchedString.length);
    return { value, rest };
  };
}
function findKey(object, predicate) {
  for (const key in object) {
    if (Object.prototype.hasOwnProperty.call(object, key) && predicate(object[key])) {
      return key;
    }
  }
  return void 0;
}
function findIndex(array, predicate) {
  for (let key = 0; key < array.length; key++) {
    if (predicate(array[key])) {
      return key;
    }
  }
  return void 0;
}
function buildMatchPatternFn(args) {
  return (string, options = {}) => {
    const matchResult = string.match(args.matchPattern);
    if (!matchResult) return null;
    const matchedString = matchResult[0];
    const parseResult = string.match(args.parsePattern);
    if (!parseResult) return null;
    let value = args.valueCallback ? args.valueCallback(parseResult[0]) : parseResult[0];
    value = options.valueCallback ? options.valueCallback(value) : value;
    const rest = string.slice(matchedString.length);
    return { value, rest };
  };
}
const matchOrdinalNumberPattern = /^(\d+)(th|st|nd|rd)?/i;
const parseOrdinalNumberPattern = /\d+/i;
const matchEraPatterns = {
  narrow: /^(b|a)/i,
  abbreviated: /^(b\.?\s?c\.?|b\.?\s?c\.?\s?e\.?|a\.?\s?d\.?|c\.?\s?e\.?)/i,
  wide: /^(before christ|before common era|anno domini|common era)/i
};
const parseEraPatterns = {
  any: [/^b/i, /^(a|c)/i]
};
const matchQuarterPatterns = {
  narrow: /^[1234]/i,
  abbreviated: /^q[1234]/i,
  wide: /^[1234](th|st|nd|rd)? quarter/i
};
const parseQuarterPatterns = {
  any: [/1/i, /2/i, /3/i, /4/i]
};
const matchMonthPatterns = {
  narrow: /^[jfmasond]/i,
  abbreviated: /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i,
  wide: /^(january|february|march|april|may|june|july|august|september|october|november|december)/i
};
const parseMonthPatterns = {
  narrow: [
    /^j/i,
    /^f/i,
    /^m/i,
    /^a/i,
    /^m/i,
    /^j/i,
    /^j/i,
    /^a/i,
    /^s/i,
    /^o/i,
    /^n/i,
    /^d/i
  ],
  any: [
    /^ja/i,
    /^f/i,
    /^mar/i,
    /^ap/i,
    /^may/i,
    /^jun/i,
    /^jul/i,
    /^au/i,
    /^s/i,
    /^o/i,
    /^n/i,
    /^d/i
  ]
};
const matchDayPatterns = {
  narrow: /^[smtwf]/i,
  short: /^(su|mo|tu|we|th|fr|sa)/i,
  abbreviated: /^(sun|mon|tue|wed|thu|fri|sat)/i,
  wide: /^(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/i
};
const parseDayPatterns = {
  narrow: [/^s/i, /^m/i, /^t/i, /^w/i, /^t/i, /^f/i, /^s/i],
  any: [/^su/i, /^m/i, /^tu/i, /^w/i, /^th/i, /^f/i, /^sa/i]
};
const matchDayPeriodPatterns = {
  narrow: /^(a|p|mi|n|(in the|at) (morning|afternoon|evening|night))/i,
  any: /^([ap]\.?\s?m\.?|midnight|noon|(in the|at) (morning|afternoon|evening|night))/i
};
const parseDayPeriodPatterns = {
  any: {
    am: /^a/i,
    pm: /^p/i,
    midnight: /^mi/i,
    noon: /^no/i,
    morning: /morning/i,
    afternoon: /afternoon/i,
    evening: /evening/i,
    night: /night/i
  }
};
const match = {
  ordinalNumber: buildMatchPatternFn({
    matchPattern: matchOrdinalNumberPattern,
    parsePattern: parseOrdinalNumberPattern,
    valueCallback: (value) => parseInt(value, 10)
  }),
  era: buildMatchFn({
    matchPatterns: matchEraPatterns,
    defaultMatchWidth: "wide",
    parsePatterns: parseEraPatterns,
    defaultParseWidth: "any"
  }),
  quarter: buildMatchFn({
    matchPatterns: matchQuarterPatterns,
    defaultMatchWidth: "wide",
    parsePatterns: parseQuarterPatterns,
    defaultParseWidth: "any",
    valueCallback: (index) => index + 1
  }),
  month: buildMatchFn({
    matchPatterns: matchMonthPatterns,
    defaultMatchWidth: "wide",
    parsePatterns: parseMonthPatterns,
    defaultParseWidth: "any"
  }),
  day: buildMatchFn({
    matchPatterns: matchDayPatterns,
    defaultMatchWidth: "wide",
    parsePatterns: parseDayPatterns,
    defaultParseWidth: "any"
  }),
  dayPeriod: buildMatchFn({
    matchPatterns: matchDayPeriodPatterns,
    defaultMatchWidth: "any",
    parsePatterns: parseDayPeriodPatterns,
    defaultParseWidth: "any"
  })
};
const enUS = {
  code: "en-US",
  formatDistance,
  formatLong,
  formatRelative,
  localize,
  match,
  options: {
    weekStartsOn: 0,
    firstWeekContainsDate: 1
  }
};
function getDayOfYear(date) {
  const _date = toDate(date);
  const diff = differenceInCalendarDays(_date, startOfYear(_date));
  const dayOfYear = diff + 1;
  return dayOfYear;
}
function getISOWeek(date) {
  const _date = toDate(date);
  const diff = +startOfISOWeek(_date) - +startOfISOWeekYear(_date);
  return Math.round(diff / millisecondsInWeek) + 1;
}
function getWeekYear(date, options) {
  var _a, _b, _c, _d;
  const _date = toDate(date);
  const year = _date.getFullYear();
  const defaultOptions2 = getDefaultOptions();
  const firstWeekContainsDate = (options == null ? void 0 : options.firstWeekContainsDate) ?? ((_b = (_a = options == null ? void 0 : options.locale) == null ? void 0 : _a.options) == null ? void 0 : _b.firstWeekContainsDate) ?? defaultOptions2.firstWeekContainsDate ?? ((_d = (_c = defaultOptions2.locale) == null ? void 0 : _c.options) == null ? void 0 : _d.firstWeekContainsDate) ?? 1;
  const firstWeekOfNextYear = constructFrom(date, 0);
  firstWeekOfNextYear.setFullYear(year + 1, 0, firstWeekContainsDate);
  firstWeekOfNextYear.setHours(0, 0, 0, 0);
  const startOfNextYear = startOfWeek(firstWeekOfNextYear, options);
  const firstWeekOfThisYear = constructFrom(date, 0);
  firstWeekOfThisYear.setFullYear(year, 0, firstWeekContainsDate);
  firstWeekOfThisYear.setHours(0, 0, 0, 0);
  const startOfThisYear = startOfWeek(firstWeekOfThisYear, options);
  if (_date.getTime() >= startOfNextYear.getTime()) {
    return year + 1;
  } else if (_date.getTime() >= startOfThisYear.getTime()) {
    return year;
  } else {
    return year - 1;
  }
}
function startOfWeekYear(date, options) {
  var _a, _b, _c, _d;
  const defaultOptions2 = getDefaultOptions();
  const firstWeekContainsDate = (options == null ? void 0 : options.firstWeekContainsDate) ?? ((_b = (_a = options == null ? void 0 : options.locale) == null ? void 0 : _a.options) == null ? void 0 : _b.firstWeekContainsDate) ?? defaultOptions2.firstWeekContainsDate ?? ((_d = (_c = defaultOptions2.locale) == null ? void 0 : _c.options) == null ? void 0 : _d.firstWeekContainsDate) ?? 1;
  const year = getWeekYear(date, options);
  const firstWeek = constructFrom(date, 0);
  firstWeek.setFullYear(year, 0, firstWeekContainsDate);
  firstWeek.setHours(0, 0, 0, 0);
  const _date = startOfWeek(firstWeek, options);
  return _date;
}
function getWeek(date, options) {
  const _date = toDate(date);
  const diff = +startOfWeek(_date, options) - +startOfWeekYear(_date, options);
  return Math.round(diff / millisecondsInWeek) + 1;
}
function addLeadingZeros(number, targetLength) {
  const sign = number < 0 ? "-" : "";
  const output = Math.abs(number).toString().padStart(targetLength, "0");
  return sign + output;
}
const lightFormatters = {
  // Year
  y(date, token) {
    const signedYear = date.getFullYear();
    const year = signedYear > 0 ? signedYear : 1 - signedYear;
    return addLeadingZeros(token === "yy" ? year % 100 : year, token.length);
  },
  // Month
  M(date, token) {
    const month = date.getMonth();
    return token === "M" ? String(month + 1) : addLeadingZeros(month + 1, 2);
  },
  // Day of the month
  d(date, token) {
    return addLeadingZeros(date.getDate(), token.length);
  },
  // AM or PM
  a(date, token) {
    const dayPeriodEnumValue = date.getHours() / 12 >= 1 ? "pm" : "am";
    switch (token) {
      case "a":
      case "aa":
        return dayPeriodEnumValue.toUpperCase();
      case "aaa":
        return dayPeriodEnumValue;
      case "aaaaa":
        return dayPeriodEnumValue[0];
      case "aaaa":
      default:
        return dayPeriodEnumValue === "am" ? "a.m." : "p.m.";
    }
  },
  // Hour [1-12]
  h(date, token) {
    return addLeadingZeros(date.getHours() % 12 || 12, token.length);
  },
  // Hour [0-23]
  H(date, token) {
    return addLeadingZeros(date.getHours(), token.length);
  },
  // Minute
  m(date, token) {
    return addLeadingZeros(date.getMinutes(), token.length);
  },
  // Second
  s(date, token) {
    return addLeadingZeros(date.getSeconds(), token.length);
  },
  // Fraction of second
  S(date, token) {
    const numberOfDigits = token.length;
    const milliseconds = date.getMilliseconds();
    const fractionalSeconds = Math.trunc(
      milliseconds * Math.pow(10, numberOfDigits - 3)
    );
    return addLeadingZeros(fractionalSeconds, token.length);
  }
};
const dayPeriodEnum = {
  midnight: "midnight",
  noon: "noon",
  morning: "morning",
  afternoon: "afternoon",
  evening: "evening",
  night: "night"
};
const formatters = {
  // Era
  G: function(date, token, localize2) {
    const era = date.getFullYear() > 0 ? 1 : 0;
    switch (token) {
      case "G":
      case "GG":
      case "GGG":
        return localize2.era(era, { width: "abbreviated" });
      case "GGGGG":
        return localize2.era(era, { width: "narrow" });
      case "GGGG":
      default:
        return localize2.era(era, { width: "wide" });
    }
  },
  // Year
  y: function(date, token, localize2) {
    if (token === "yo") {
      const signedYear = date.getFullYear();
      const year = signedYear > 0 ? signedYear : 1 - signedYear;
      return localize2.ordinalNumber(year, { unit: "year" });
    }
    return lightFormatters.y(date, token);
  },
  // Local week-numbering year
  Y: function(date, token, localize2, options) {
    const signedWeekYear = getWeekYear(date, options);
    const weekYear = signedWeekYear > 0 ? signedWeekYear : 1 - signedWeekYear;
    if (token === "YY") {
      const twoDigitYear = weekYear % 100;
      return addLeadingZeros(twoDigitYear, 2);
    }
    if (token === "Yo") {
      return localize2.ordinalNumber(weekYear, { unit: "year" });
    }
    return addLeadingZeros(weekYear, token.length);
  },
  // ISO week-numbering year
  R: function(date, token) {
    const isoWeekYear = getISOWeekYear(date);
    return addLeadingZeros(isoWeekYear, token.length);
  },
  // Extended year. This is a single number designating the year of this calendar system.
  // The main difference between `y` and `u` localizers are B.C. years:
  // | Year | `y` | `u` |
  // |------|-----|-----|
  // | AC 1 |   1 |   1 |
  // | BC 1 |   1 |   0 |
  // | BC 2 |   2 |  -1 |
  // Also `yy` always returns the last two digits of a year,
  // while `uu` pads single digit years to 2 characters and returns other years unchanged.
  u: function(date, token) {
    const year = date.getFullYear();
    return addLeadingZeros(year, token.length);
  },
  // Quarter
  Q: function(date, token, localize2) {
    const quarter = Math.ceil((date.getMonth() + 1) / 3);
    switch (token) {
      case "Q":
        return String(quarter);
      case "QQ":
        return addLeadingZeros(quarter, 2);
      case "Qo":
        return localize2.ordinalNumber(quarter, { unit: "quarter" });
      case "QQQ":
        return localize2.quarter(quarter, {
          width: "abbreviated",
          context: "formatting"
        });
      case "QQQQQ":
        return localize2.quarter(quarter, {
          width: "narrow",
          context: "formatting"
        });
      case "QQQQ":
      default:
        return localize2.quarter(quarter, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  // Stand-alone quarter
  q: function(date, token, localize2) {
    const quarter = Math.ceil((date.getMonth() + 1) / 3);
    switch (token) {
      case "q":
        return String(quarter);
      case "qq":
        return addLeadingZeros(quarter, 2);
      case "qo":
        return localize2.ordinalNumber(quarter, { unit: "quarter" });
      case "qqq":
        return localize2.quarter(quarter, {
          width: "abbreviated",
          context: "standalone"
        });
      case "qqqqq":
        return localize2.quarter(quarter, {
          width: "narrow",
          context: "standalone"
        });
      case "qqqq":
      default:
        return localize2.quarter(quarter, {
          width: "wide",
          context: "standalone"
        });
    }
  },
  // Month
  M: function(date, token, localize2) {
    const month = date.getMonth();
    switch (token) {
      case "M":
      case "MM":
        return lightFormatters.M(date, token);
      case "Mo":
        return localize2.ordinalNumber(month + 1, { unit: "month" });
      case "MMM":
        return localize2.month(month, {
          width: "abbreviated",
          context: "formatting"
        });
      case "MMMMM":
        return localize2.month(month, {
          width: "narrow",
          context: "formatting"
        });
      case "MMMM":
      default:
        return localize2.month(month, { width: "wide", context: "formatting" });
    }
  },
  // Stand-alone month
  L: function(date, token, localize2) {
    const month = date.getMonth();
    switch (token) {
      case "L":
        return String(month + 1);
      case "LL":
        return addLeadingZeros(month + 1, 2);
      case "Lo":
        return localize2.ordinalNumber(month + 1, { unit: "month" });
      case "LLL":
        return localize2.month(month, {
          width: "abbreviated",
          context: "standalone"
        });
      case "LLLLL":
        return localize2.month(month, {
          width: "narrow",
          context: "standalone"
        });
      case "LLLL":
      default:
        return localize2.month(month, { width: "wide", context: "standalone" });
    }
  },
  // Local week of year
  w: function(date, token, localize2, options) {
    const week = getWeek(date, options);
    if (token === "wo") {
      return localize2.ordinalNumber(week, { unit: "week" });
    }
    return addLeadingZeros(week, token.length);
  },
  // ISO week of year
  I: function(date, token, localize2) {
    const isoWeek = getISOWeek(date);
    if (token === "Io") {
      return localize2.ordinalNumber(isoWeek, { unit: "week" });
    }
    return addLeadingZeros(isoWeek, token.length);
  },
  // Day of the month
  d: function(date, token, localize2) {
    if (token === "do") {
      return localize2.ordinalNumber(date.getDate(), { unit: "date" });
    }
    return lightFormatters.d(date, token);
  },
  // Day of year
  D: function(date, token, localize2) {
    const dayOfYear = getDayOfYear(date);
    if (token === "Do") {
      return localize2.ordinalNumber(dayOfYear, { unit: "dayOfYear" });
    }
    return addLeadingZeros(dayOfYear, token.length);
  },
  // Day of week
  E: function(date, token, localize2) {
    const dayOfWeek = date.getDay();
    switch (token) {
      case "E":
      case "EE":
      case "EEE":
        return localize2.day(dayOfWeek, {
          width: "abbreviated",
          context: "formatting"
        });
      case "EEEEE":
        return localize2.day(dayOfWeek, {
          width: "narrow",
          context: "formatting"
        });
      case "EEEEEE":
        return localize2.day(dayOfWeek, {
          width: "short",
          context: "formatting"
        });
      case "EEEE":
      default:
        return localize2.day(dayOfWeek, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  // Local day of week
  e: function(date, token, localize2, options) {
    const dayOfWeek = date.getDay();
    const localDayOfWeek = (dayOfWeek - options.weekStartsOn + 8) % 7 || 7;
    switch (token) {
      case "e":
        return String(localDayOfWeek);
      case "ee":
        return addLeadingZeros(localDayOfWeek, 2);
      case "eo":
        return localize2.ordinalNumber(localDayOfWeek, { unit: "day" });
      case "eee":
        return localize2.day(dayOfWeek, {
          width: "abbreviated",
          context: "formatting"
        });
      case "eeeee":
        return localize2.day(dayOfWeek, {
          width: "narrow",
          context: "formatting"
        });
      case "eeeeee":
        return localize2.day(dayOfWeek, {
          width: "short",
          context: "formatting"
        });
      case "eeee":
      default:
        return localize2.day(dayOfWeek, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  // Stand-alone local day of week
  c: function(date, token, localize2, options) {
    const dayOfWeek = date.getDay();
    const localDayOfWeek = (dayOfWeek - options.weekStartsOn + 8) % 7 || 7;
    switch (token) {
      case "c":
        return String(localDayOfWeek);
      case "cc":
        return addLeadingZeros(localDayOfWeek, token.length);
      case "co":
        return localize2.ordinalNumber(localDayOfWeek, { unit: "day" });
      case "ccc":
        return localize2.day(dayOfWeek, {
          width: "abbreviated",
          context: "standalone"
        });
      case "ccccc":
        return localize2.day(dayOfWeek, {
          width: "narrow",
          context: "standalone"
        });
      case "cccccc":
        return localize2.day(dayOfWeek, {
          width: "short",
          context: "standalone"
        });
      case "cccc":
      default:
        return localize2.day(dayOfWeek, {
          width: "wide",
          context: "standalone"
        });
    }
  },
  // ISO day of week
  i: function(date, token, localize2) {
    const dayOfWeek = date.getDay();
    const isoDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;
    switch (token) {
      case "i":
        return String(isoDayOfWeek);
      case "ii":
        return addLeadingZeros(isoDayOfWeek, token.length);
      case "io":
        return localize2.ordinalNumber(isoDayOfWeek, { unit: "day" });
      case "iii":
        return localize2.day(dayOfWeek, {
          width: "abbreviated",
          context: "formatting"
        });
      case "iiiii":
        return localize2.day(dayOfWeek, {
          width: "narrow",
          context: "formatting"
        });
      case "iiiiii":
        return localize2.day(dayOfWeek, {
          width: "short",
          context: "formatting"
        });
      case "iiii":
      default:
        return localize2.day(dayOfWeek, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  // AM or PM
  a: function(date, token, localize2) {
    const hours = date.getHours();
    const dayPeriodEnumValue = hours / 12 >= 1 ? "pm" : "am";
    switch (token) {
      case "a":
      case "aa":
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "abbreviated",
          context: "formatting"
        });
      case "aaa":
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "abbreviated",
          context: "formatting"
        }).toLowerCase();
      case "aaaaa":
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "narrow",
          context: "formatting"
        });
      case "aaaa":
      default:
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  // AM, PM, midnight, noon
  b: function(date, token, localize2) {
    const hours = date.getHours();
    let dayPeriodEnumValue;
    if (hours === 12) {
      dayPeriodEnumValue = dayPeriodEnum.noon;
    } else if (hours === 0) {
      dayPeriodEnumValue = dayPeriodEnum.midnight;
    } else {
      dayPeriodEnumValue = hours / 12 >= 1 ? "pm" : "am";
    }
    switch (token) {
      case "b":
      case "bb":
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "abbreviated",
          context: "formatting"
        });
      case "bbb":
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "abbreviated",
          context: "formatting"
        }).toLowerCase();
      case "bbbbb":
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "narrow",
          context: "formatting"
        });
      case "bbbb":
      default:
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  // in the morning, in the afternoon, in the evening, at night
  B: function(date, token, localize2) {
    const hours = date.getHours();
    let dayPeriodEnumValue;
    if (hours >= 17) {
      dayPeriodEnumValue = dayPeriodEnum.evening;
    } else if (hours >= 12) {
      dayPeriodEnumValue = dayPeriodEnum.afternoon;
    } else if (hours >= 4) {
      dayPeriodEnumValue = dayPeriodEnum.morning;
    } else {
      dayPeriodEnumValue = dayPeriodEnum.night;
    }
    switch (token) {
      case "B":
      case "BB":
      case "BBB":
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "abbreviated",
          context: "formatting"
        });
      case "BBBBB":
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "narrow",
          context: "formatting"
        });
      case "BBBB":
      default:
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  // Hour [1-12]
  h: function(date, token, localize2) {
    if (token === "ho") {
      let hours = date.getHours() % 12;
      if (hours === 0) hours = 12;
      return localize2.ordinalNumber(hours, { unit: "hour" });
    }
    return lightFormatters.h(date, token);
  },
  // Hour [0-23]
  H: function(date, token, localize2) {
    if (token === "Ho") {
      return localize2.ordinalNumber(date.getHours(), { unit: "hour" });
    }
    return lightFormatters.H(date, token);
  },
  // Hour [0-11]
  K: function(date, token, localize2) {
    const hours = date.getHours() % 12;
    if (token === "Ko") {
      return localize2.ordinalNumber(hours, { unit: "hour" });
    }
    return addLeadingZeros(hours, token.length);
  },
  // Hour [1-24]
  k: function(date, token, localize2) {
    let hours = date.getHours();
    if (hours === 0) hours = 24;
    if (token === "ko") {
      return localize2.ordinalNumber(hours, { unit: "hour" });
    }
    return addLeadingZeros(hours, token.length);
  },
  // Minute
  m: function(date, token, localize2) {
    if (token === "mo") {
      return localize2.ordinalNumber(date.getMinutes(), { unit: "minute" });
    }
    return lightFormatters.m(date, token);
  },
  // Second
  s: function(date, token, localize2) {
    if (token === "so") {
      return localize2.ordinalNumber(date.getSeconds(), { unit: "second" });
    }
    return lightFormatters.s(date, token);
  },
  // Fraction of second
  S: function(date, token) {
    return lightFormatters.S(date, token);
  },
  // Timezone (ISO-8601. If offset is 0, output is always `'Z'`)
  X: function(date, token, _localize) {
    const timezoneOffset = date.getTimezoneOffset();
    if (timezoneOffset === 0) {
      return "Z";
    }
    switch (token) {
      case "X":
        return formatTimezoneWithOptionalMinutes(timezoneOffset);
      case "XXXX":
      case "XX":
        return formatTimezone(timezoneOffset);
      case "XXXXX":
      case "XXX":
      default:
        return formatTimezone(timezoneOffset, ":");
    }
  },
  // Timezone (ISO-8601. If offset is 0, output is `'+00:00'` or equivalent)
  x: function(date, token, _localize) {
    const timezoneOffset = date.getTimezoneOffset();
    switch (token) {
      case "x":
        return formatTimezoneWithOptionalMinutes(timezoneOffset);
      case "xxxx":
      case "xx":
        return formatTimezone(timezoneOffset);
      case "xxxxx":
      case "xxx":
      default:
        return formatTimezone(timezoneOffset, ":");
    }
  },
  // Timezone (GMT)
  O: function(date, token, _localize) {
    const timezoneOffset = date.getTimezoneOffset();
    switch (token) {
      case "O":
      case "OO":
      case "OOO":
        return "GMT" + formatTimezoneShort(timezoneOffset, ":");
      case "OOOO":
      default:
        return "GMT" + formatTimezone(timezoneOffset, ":");
    }
  },
  // Timezone (specific non-location)
  z: function(date, token, _localize) {
    const timezoneOffset = date.getTimezoneOffset();
    switch (token) {
      case "z":
      case "zz":
      case "zzz":
        return "GMT" + formatTimezoneShort(timezoneOffset, ":");
      case "zzzz":
      default:
        return "GMT" + formatTimezone(timezoneOffset, ":");
    }
  },
  // Seconds timestamp
  t: function(date, token, _localize) {
    const timestamp = Math.trunc(date.getTime() / 1e3);
    return addLeadingZeros(timestamp, token.length);
  },
  // Milliseconds timestamp
  T: function(date, token, _localize) {
    const timestamp = date.getTime();
    return addLeadingZeros(timestamp, token.length);
  }
};
function formatTimezoneShort(offset, delimiter = "") {
  const sign = offset > 0 ? "-" : "+";
  const absOffset = Math.abs(offset);
  const hours = Math.trunc(absOffset / 60);
  const minutes = absOffset % 60;
  if (minutes === 0) {
    return sign + String(hours);
  }
  return sign + String(hours) + delimiter + addLeadingZeros(minutes, 2);
}
function formatTimezoneWithOptionalMinutes(offset, delimiter) {
  if (offset % 60 === 0) {
    const sign = offset > 0 ? "-" : "+";
    return sign + addLeadingZeros(Math.abs(offset) / 60, 2);
  }
  return formatTimezone(offset, delimiter);
}
function formatTimezone(offset, delimiter = "") {
  const sign = offset > 0 ? "-" : "+";
  const absOffset = Math.abs(offset);
  const hours = addLeadingZeros(Math.trunc(absOffset / 60), 2);
  const minutes = addLeadingZeros(absOffset % 60, 2);
  return sign + hours + delimiter + minutes;
}
const dateLongFormatter = (pattern, formatLong2) => {
  switch (pattern) {
    case "P":
      return formatLong2.date({ width: "short" });
    case "PP":
      return formatLong2.date({ width: "medium" });
    case "PPP":
      return formatLong2.date({ width: "long" });
    case "PPPP":
    default:
      return formatLong2.date({ width: "full" });
  }
};
const timeLongFormatter = (pattern, formatLong2) => {
  switch (pattern) {
    case "p":
      return formatLong2.time({ width: "short" });
    case "pp":
      return formatLong2.time({ width: "medium" });
    case "ppp":
      return formatLong2.time({ width: "long" });
    case "pppp":
    default:
      return formatLong2.time({ width: "full" });
  }
};
const dateTimeLongFormatter = (pattern, formatLong2) => {
  const matchResult = pattern.match(/(P+)(p+)?/) || [];
  const datePattern = matchResult[1];
  const timePattern = matchResult[2];
  if (!timePattern) {
    return dateLongFormatter(pattern, formatLong2);
  }
  let dateTimeFormat;
  switch (datePattern) {
    case "P":
      dateTimeFormat = formatLong2.dateTime({ width: "short" });
      break;
    case "PP":
      dateTimeFormat = formatLong2.dateTime({ width: "medium" });
      break;
    case "PPP":
      dateTimeFormat = formatLong2.dateTime({ width: "long" });
      break;
    case "PPPP":
    default:
      dateTimeFormat = formatLong2.dateTime({ width: "full" });
      break;
  }
  return dateTimeFormat.replace("{{date}}", dateLongFormatter(datePattern, formatLong2)).replace("{{time}}", timeLongFormatter(timePattern, formatLong2));
};
const longFormatters = {
  p: timeLongFormatter,
  P: dateTimeLongFormatter
};
const dayOfYearTokenRE = /^D+$/;
const weekYearTokenRE = /^Y+$/;
const throwTokens = ["D", "DD", "YY", "YYYY"];
function isProtectedDayOfYearToken(token) {
  return dayOfYearTokenRE.test(token);
}
function isProtectedWeekYearToken(token) {
  return weekYearTokenRE.test(token);
}
function warnOrThrowProtectedError(token, format2, input) {
  const _message = message(token, format2, input);
  console.warn(_message);
  if (throwTokens.includes(token)) throw new RangeError(_message);
}
function message(token, format2, input) {
  const subject = token[0] === "Y" ? "years" : "days of the month";
  return `Use \`${token.toLowerCase()}\` instead of \`${token}\` (in \`${format2}\`) for formatting ${subject} to the input \`${input}\`; see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md`;
}
const formattingTokensRegExp = /[yYQqMLwIdDecihHKkms]o|(\w)\1*|''|'(''|[^'])+('|$)|./g;
const longFormattingTokensRegExp = /P+p+|P+|p+|''|'(''|[^'])+('|$)|./g;
const escapedStringRegExp = /^'([^]*?)'?$/;
const doubleQuoteRegExp = /''/g;
const unescapedLatinCharacterRegExp = /[a-zA-Z]/;
function format(date, formatStr, options) {
  var _a, _b, _c, _d;
  const defaultOptions2 = getDefaultOptions();
  const locale = defaultOptions2.locale ?? enUS;
  const firstWeekContainsDate = defaultOptions2.firstWeekContainsDate ?? ((_b = (_a = defaultOptions2.locale) == null ? void 0 : _a.options) == null ? void 0 : _b.firstWeekContainsDate) ?? 1;
  const weekStartsOn = defaultOptions2.weekStartsOn ?? ((_d = (_c = defaultOptions2.locale) == null ? void 0 : _c.options) == null ? void 0 : _d.weekStartsOn) ?? 0;
  const originalDate = toDate(date);
  if (!isValid(originalDate)) {
    throw new RangeError("Invalid time value");
  }
  let parts = formatStr.match(longFormattingTokensRegExp).map((substring) => {
    const firstCharacter = substring[0];
    if (firstCharacter === "p" || firstCharacter === "P") {
      const longFormatter = longFormatters[firstCharacter];
      return longFormatter(substring, locale.formatLong);
    }
    return substring;
  }).join("").match(formattingTokensRegExp).map((substring) => {
    if (substring === "''") {
      return { isToken: false, value: "'" };
    }
    const firstCharacter = substring[0];
    if (firstCharacter === "'") {
      return { isToken: false, value: cleanEscapedString(substring) };
    }
    if (formatters[firstCharacter]) {
      return { isToken: true, value: substring };
    }
    if (firstCharacter.match(unescapedLatinCharacterRegExp)) {
      throw new RangeError(
        "Format string contains an unescaped latin alphabet character `" + firstCharacter + "`"
      );
    }
    return { isToken: false, value: substring };
  });
  if (locale.localize.preprocessor) {
    parts = locale.localize.preprocessor(originalDate, parts);
  }
  const formatterOptions = {
    firstWeekContainsDate,
    weekStartsOn,
    locale
  };
  return parts.map((part) => {
    if (!part.isToken) return part.value;
    const token = part.value;
    if (isProtectedWeekYearToken(token) || isProtectedDayOfYearToken(token)) {
      warnOrThrowProtectedError(token, formatStr, String(date));
    }
    const formatter = formatters[token[0]];
    return formatter(originalDate, token, locale.localize, formatterOptions);
  }).join("");
}
function cleanEscapedString(input) {
  const matched = input.match(escapedStringRegExp);
  if (!matched) {
    return input;
  }
  return matched[1].replace(doubleQuoteRegExp, "'");
}
function ContractsPage({
  onViewAttendance
}) {
  const { canEdit, isAdmin } = useAuth();
  const { data: contracts = [], isLoading } = useContracts();
  const addContract = useAddContract();
  const updateContract = useUpdateContract();
  const [selectedContract, setSelectedContract] = reactExports.useState(null);
  const [showForm, setShowForm] = reactExports.useState(false);
  const [showCombinedFlow, setShowCombinedFlow] = reactExports.useState(false);
  const [isEditing, setIsEditing] = reactExports.useState(false);
  const [expandedContractId, setExpandedContractId] = reactExports.useState(
    null
  );
  const [searchQuery, setSearchQuery] = reactExports.useState("");
  const [viewMode, setViewMode] = reactExports.useState("list");
  const getBedBase = () => Number(localStorage.getItem("rossie_bed_base") || "11000") || 11e3;
  const getPaperBase = () => Number(localStorage.getItem("rossie_paper_base") || "7000") || 7e3;
  const [form, setForm] = reactExports.useState({
    name: "",
    multiplier: "1",
    contractAmount: "0",
    machineExpenses: "0",
    bedAmount: getBedBase().toString(),
    paperAmount: getPaperBase().toString(),
    meshAmount: "0"
  });
  const nameRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    if (showForm) {
      const t = setTimeout(() => {
        var _a;
        return (_a = nameRef.current) == null ? void 0 : _a.focus();
      }, 50);
      return () => clearTimeout(t);
    }
  }, [showForm]);
  const updateMultiplier = (val) => {
    const m = Number.parseFloat(val) || 1;
    const bed = getBedBase() * m;
    const paper = getPaperBase() * m;
    const contractAmount = Number.parseFloat(form.contractAmount) || 0;
    const machineExpenses = Number.parseFloat(form.machineExpenses) || 0;
    const mesh = contractAmount - (bed + paper + machineExpenses);
    setForm((prev) => ({
      ...prev,
      multiplier: val,
      bedAmount: bed.toString(),
      paperAmount: paper.toString(),
      meshAmount: mesh.toString()
    }));
  };
  const closeForm = reactExports.useCallback(() => {
    setShowForm(false);
  }, []);
  const openEdit = reactExports.useCallback((c) => {
    setForm({
      name: c.name,
      multiplier: c.multiplier.toString(),
      contractAmount: c.contractAmount.toString(),
      machineExpenses: c.machineExpenses.toString(),
      bedAmount: c.bedAmount.toString(),
      paperAmount: c.paperAmount.toString(),
      meshAmount: (c.meshAmount ?? 0).toString()
    });
    setIsEditing(true);
    setSelectedContract(c);
    setShowForm(true);
  }, []);
  const isSaving = addContract.isPending || updateContract.isPending;
  const handleSave = reactExports.useCallback(() => {
    if (isEditing && selectedContract) {
      updateContract.mutate({
        id: selectedContract.id,
        name: form.name.trim(),
        multiplier: Number.parseFloat(form.multiplier),
        contractAmount: Number.parseFloat(form.contractAmount),
        machineExpenses: Number.parseFloat(form.machineExpenses),
        bedAmount: Number.parseFloat(form.bedAmount),
        paperAmount: Number.parseFloat(form.paperAmount),
        meshAmount: Number.parseFloat(form.meshAmount)
      });
      setShowForm(false);
    } else {
      addContract.mutate({
        name: form.name.trim(),
        multiplier: Number.parseFloat(form.multiplier),
        contractAmount: Number.parseFloat(form.contractAmount),
        machineExpenses: Number.parseFloat(form.machineExpenses),
        bedAmount: Number.parseFloat(form.bedAmount),
        paperAmount: Number.parseFloat(form.paperAmount),
        meshAmount: Number.parseFloat(form.meshAmount)
      });
      setShowForm(false);
    }
  }, [isEditing, selectedContract, form, updateContract, addContract]);
  const fmt = reactExports.useCallback(
    (n) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
    []
  );
  const fmtDate = (d) => {
    if (d === void 0 || d === null) return "—";
    const ms = typeof d === "bigint" ? Number(d) / 1e6 : Number(d);
    if (!ms || Number.isNaN(ms)) return "—";
    return format(new Date(ms), "MMM d, yyyy");
  };
  const activeContracts = reactExports.useMemo(
    () => contracts.filter((c) => !c.settled),
    [contracts]
  );
  const filteredContracts = reactExports.useMemo(
    () => activeContracts.slice().sort((a, b) => b.id > a.id ? 1 : b.id < a.id ? -1 : 0).filter((c) => {
      if (!searchQuery.trim()) return true;
      return c.name.toLowerCase().includes(searchQuery.toLowerCase());
    }),
    [activeContracts, searchQuery]
  );
  if (isLoading)
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "flex flex-col h-full px-4 pt-4",
        "data-ocid": "contracts.loading_state",
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonCardList, { count: 4 })
      }
    );
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col h-full bg-[#0a0f1e] text-white font-['Figtree',sans-serif]", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "shrink-0 space-y-3 px-4 pt-4 pb-3 bg-[#0a0f1e] sticky top-0 z-10", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between px-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "text-xl font-bold text-white flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "w-5 h-5 text-orange-400" }),
          "Contracts"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-2" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "svg",
            {
              className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none",
              fill: "none",
              stroke: "currentColor",
              viewBox: "0 0 24 24",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("title", { children: "Search" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "path",
                  {
                    strokeLinecap: "round",
                    strokeLinejoin: "round",
                    strokeWidth: 2,
                    d: "M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
                  }
                )
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "text",
              placeholder: "Search contracts...",
              value: searchQuery,
              onChange: (e) => setSearchQuery(e.target.value),
              className: "w-full rounded-full bg-[#1a2035] border border-white/15 px-4 py-2 pl-10 text-white/80 placeholder-white/30 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30 transition-all text-sm",
              "data-ocid": "contracts.search_input"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: () => setViewMode(viewMode === "list" ? "card" : "list"),
            className: "p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors shrink-0",
            "aria-label": viewMode === "list" ? "Switch to card view" : "Switch to list view",
            "data-ocid": "contracts.view_toggle",
            children: viewMode === "list" ? /* @__PURE__ */ jsxRuntimeExports.jsx(LayoutGrid, { className: "w-4 h-4 text-white/60" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(List, { className: "w-4 h-4 text-white/60" })
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "flex-1 overflow-y-auto px-4 pb-24",
        style: {
          height: "calc(100vh - 200px)",
          maxHeight: "calc(100vh - 200px)"
        },
        children: !isLoading && filteredContracts.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-card rounded-2xl p-8 text-center text-gray-400 mt-2", children: [
          "No active contracts. ",
          canEdit && 'Tap "+" to add a contract.'
        ] }) : viewMode === "card" ? (
          /* CARD VIEW — vertical cards */
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3 mt-1", children: filteredContracts.map((c) => {
            var _a;
            const isExpanded = expandedContractId === c.id.toString();
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                type: "button",
                className: "glass-card rounded-2xl p-4 cursor-pointer transition-smooth w-full text-left border border-orange-500/20 hover:border-orange-500/60 active:scale-[0.98]",
                onClick: () => setExpandedContractId(isExpanded ? null : c.id.toString()),
                "aria-label": "Toggle contract details",
                "data-ocid": "contract.card",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 flex-1 min-w-0", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "w-4 h-4 text-orange-400 shrink-0" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-white font-semibold text-base truncate", children: c.name })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "svg",
                      {
                        className: `w-4 h-4 text-gray-400 transition-transform duration-200 shrink-0 ml-2 ${isExpanded ? "rotate-180" : ""}`,
                        fill: "none",
                        stroke: "currentColor",
                        viewBox: "0 0 24 24",
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("title", { children: "Expand" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "path",
                            {
                              strokeLinecap: "round",
                              strokeLinejoin: "round",
                              strokeWidth: 2,
                              d: "M19 9l-7 7-7-7"
                            }
                          )
                        ]
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mt-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-orange-400 font-bold text-lg", children: fmt(c.contractAmount) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-gray-400 text-xs flex items-center gap-1", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "w-3 h-3" }),
                      fmtDate(c.createdAt)
                    ] })
                  ] }),
                  isExpanded && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "div",
                    {
                      className: "mt-3 pt-3 border-t border-white/10 space-y-3",
                      onClick: (e) => e.stopPropagation(),
                      onKeyDown: (e) => e.stopPropagation(),
                      role: "presentation",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-x-4 gap-y-2 text-sm", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-400 text-xs", children: "Multiplier" }),
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-orange-400 font-medium", children: [
                              c.multiplier,
                              "x"
                            ] })
                          ] }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-400 text-xs", children: "Bed Amount" }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-white font-medium", children: fmt(c.bedAmount) })
                          ] }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-400 text-xs", children: "Paper Amount" }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-white font-medium", children: fmt(c.paperAmount) })
                          ] }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-400 text-xs", children: "Mesh Amount" }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-white font-medium", children: fmt(c.meshAmount ?? 0) })
                          ] }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-gray-400 text-xs flex items-center gap-1", children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx(Wrench, { className: "w-3 h-3" }),
                              "Machine Expenses"
                            ] }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-white font-medium", children: fmt(c.machineExpenses) })
                          ] }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-400 text-xs", children: "Columns" }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-white font-medium", children: ((_a = c.workColumns) == null ? void 0 : _a.length) ?? 0 })
                          ] })
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2 pt-1", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "button",
                            {
                              type: "button",
                              onClick: (e) => {
                                e.stopPropagation();
                                onViewAttendance == null ? void 0 : onViewAttendance(c.id);
                              },
                              className: "btn-orange text-sm px-3 py-1.5 rounded-lg",
                              "data-ocid": "contract.view_attendance_button",
                              children: "View Attendance →"
                            }
                          ),
                          canEdit && /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "button",
                            {
                              type: "button",
                              onClick: (e) => {
                                e.stopPropagation();
                                openEdit(c);
                              },
                              className: "bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 text-sm px-3 py-1.5 rounded-lg transition-colors",
                              "data-ocid": "contract.edit_button",
                              children: "Edit"
                            }
                          )
                        ] })
                      ]
                    }
                  )
                ]
              },
              c.id.toString()
            );
          }) })
        ) : (
          /* LIST VIEW — true single-line compact rows */
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 rounded-xl overflow-hidden border border-white/10", children: filteredContracts.map((c, idx) => {
            const isExpanded = expandedContractId === c.id.toString();
            return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  type: "button",
                  className: `w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/[0.05] active:bg-white/[0.08] transition-colors cursor-pointer ${idx > 0 ? "border-t border-white/10" : ""}`,
                  onClick: () => setExpandedContractId(isExpanded ? null : c.id.toString()),
                  "aria-label": "Toggle contract details",
                  "data-ocid": `contract.item.${idx + 1}`,
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "w-3.5 h-3.5 text-orange-400 shrink-0" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex-1 min-w-0 text-sm font-medium text-white truncate text-left", children: c.name }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-orange-400 font-semibold text-sm shrink-0", children: fmt(c.contractAmount) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "svg",
                      {
                        className: `w-4 h-4 text-white/30 shrink-0 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`,
                        fill: "none",
                        stroke: "currentColor",
                        viewBox: "0 0 24 24",
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("title", { children: isExpanded ? "Collapse" : "Expand" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "path",
                            {
                              strokeLinecap: "round",
                              strokeLinejoin: "round",
                              strokeWidth: 2,
                              d: "M9 5l7 7-7 7"
                            }
                          )
                        ]
                      }
                    )
                  ]
                }
              ),
              isExpanded && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white/[0.03] border-t border-white/10 px-4 py-3 space-y-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-x-4 gap-y-2 text-sm", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-white/40 text-xs", children: "Multiplier" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-orange-400 font-medium", children: [
                      c.multiplier,
                      "x"
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-white/40 text-xs", children: "Created" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-white/80 font-medium", children: fmtDate(c.createdAt) })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-white/40 text-xs", children: "Bed Amount" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-white font-medium", children: fmt(c.bedAmount) })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-white/40 text-xs", children: "Paper Amount" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-white font-medium", children: fmt(c.paperAmount) })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-white/40 text-xs", children: "Mesh Amount" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-white font-medium", children: fmt(c.meshAmount ?? 0) })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-white/40 text-xs flex items-center gap-1", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Wrench, { className: "w-3 h-3" }),
                      " Machine Exp."
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-white font-medium", children: fmt(c.machineExpenses) })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2 pt-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      type: "button",
                      onClick: (e) => {
                        e.stopPropagation();
                        onViewAttendance == null ? void 0 : onViewAttendance(c.id);
                      },
                      className: "btn-orange text-xs px-3 py-1.5 rounded-lg",
                      "data-ocid": "contract.view_attendance_button",
                      children: "View Attendance →"
                    }
                  ),
                  canEdit && /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      type: "button",
                      onClick: (e) => {
                        e.stopPropagation();
                        openEdit(c);
                      },
                      className: "bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 text-xs px-3 py-1.5 rounded-lg transition-colors",
                      "data-ocid": "contract.edit_button",
                      children: "Edit"
                    }
                  )
                ] })
              ] })
            ] }, c.id.toString());
          }) })
        )
      }
    ),
    isAdmin && /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        type: "button",
        onClick: () => setShowCombinedFlow(true),
        className: "fixed bottom-24 right-4 w-14 h-14 rounded-full flex items-center justify-center shadow-lg z-30 bg-gradient-to-br from-orange-500 to-orange-600 text-white",
        "aria-label": "Add Contract",
        "data-ocid": "contract.add_button",
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "svg",
          {
            xmlns: "http://www.w3.org/2000/svg",
            fill: "none",
            viewBox: "0 0 24 24",
            strokeWidth: 2.5,
            stroke: "currentColor",
            className: "w-6 h-6",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("title", { children: "Add Contract" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "path",
                {
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  d: "M12 4.5v15m7.5-7.5h-15"
                }
              )
            ]
          }
        )
      }
    ),
    showCombinedFlow && /* @__PURE__ */ jsxRuntimeExports.jsx(CombinedFlow, { onClose: () => setShowCombinedFlow(false) }),
    showForm && /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4",
        onClick: (e) => {
          if (e.target === e.currentTarget) closeForm();
        },
        onKeyDown: (e) => {
          if (e.key === "Escape") closeForm();
        },
        role: "presentation",
        tabIndex: -1,
        children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "glass-dialog rounded-2xl w-full max-w-md max-h-[82vh] flex flex-col", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 pb-3 flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-bold text-white", children: isEditing ? "Edit Contract" : "Add Contract" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: closeForm,
                className: "text-gray-400 hover:text-white p-1",
                "aria-label": "Close",
                "data-ocid": "contract.close_button",
                children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "svg",
                  {
                    className: "w-5 h-5",
                    fill: "none",
                    stroke: "currentColor",
                    viewBox: "0 0 24 24",
                    role: "img",
                    "aria-label": "Close dialog",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("title", { children: "Close dialog" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "path",
                        {
                          strokeLinecap: "round",
                          strokeLinejoin: "round",
                          strokeWidth: 2,
                          d: "M6 18L18 6M6 6l12 12"
                        }
                      )
                    ]
                  }
                )
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 overflow-y-auto px-4 pb-2 space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "label",
                {
                  htmlFor: "contract-name",
                  className: "text-gray-400 text-xs mb-1 block",
                  children: "Contract Name"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  ref: nameRef,
                  id: "contract-name",
                  type: "text",
                  value: form.name,
                  onChange: (e) => setForm((prev) => ({ ...prev, name: e.target.value })),
                  className: "w-full bg-white/5 border border-orange-500/30 focus:border-orange-500 rounded-lg px-3 py-2 text-white outline-none",
                  placeholder: "Contract name"
                }
              )
            ] }),
            [
              {
                label: "Multiplier",
                key: "multiplier",
                type: "number",
                step: "0.1"
              },
              {
                label: "Contract Amount (₹)",
                key: "contractAmount",
                type: "number"
              },
              {
                label: "Machine Expenses (₹)",
                key: "machineExpenses",
                type: "number"
              }
            ].map(({ label, key, type, step }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "label",
                {
                  htmlFor: `contract-${key}`,
                  className: "text-gray-400 text-xs mb-1 block",
                  children: label
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  id: `contract-${key}`,
                  type,
                  step,
                  value: form[key],
                  onChange: (e) => {
                    if (key === "multiplier") {
                      updateMultiplier(e.target.value);
                    } else {
                      setForm((prev) => {
                        const next = { ...prev, [key]: e.target.value };
                        if (key === "contractAmount" || key === "machineExpenses") {
                          const contractAmount = Number.parseFloat(
                            key === "contractAmount" ? e.target.value : next.contractAmount
                          ) || 0;
                          const bedAmount = Number.parseFloat(next.bedAmount) || 0;
                          const paperAmount = Number.parseFloat(next.paperAmount) || 0;
                          const machineExpenses = Number.parseFloat(
                            key === "machineExpenses" ? e.target.value : next.machineExpenses
                          ) || 0;
                          next.meshAmount = (contractAmount - (bedAmount + paperAmount + machineExpenses)).toString();
                        }
                        return next;
                      });
                    }
                  },
                  className: "w-full bg-white/5 border border-orange-500/30 focus:border-orange-500 rounded-lg px-3 py-2 text-white outline-none"
                }
              )
            ] }, key)),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "label",
                  {
                    htmlFor: "contract-bedAmount",
                    className: "text-gray-400 text-xs mb-1 block",
                    children: "Bed Amount (₹)"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    id: "contract-bedAmount",
                    type: "number",
                    value: form.bedAmount,
                    onChange: (e) => setForm((prev) => {
                      const next = { ...prev, bedAmount: e.target.value };
                      const ca = Number.parseFloat(next.contractAmount) || 0;
                      const ba = Number.parseFloat(e.target.value) || 0;
                      const pa = Number.parseFloat(next.paperAmount) || 0;
                      const me = Number.parseFloat(next.machineExpenses) || 0;
                      next.meshAmount = (ca - (ba + pa + me)).toString();
                      return next;
                    }),
                    className: "w-full bg-white/5 border border-orange-500/30 focus:border-orange-500 rounded-lg px-3 py-2 text-white outline-none"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "label",
                  {
                    htmlFor: "contract-paperAmount",
                    className: "text-gray-400 text-xs mb-1 block",
                    children: "Paper Amount (₹)"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    id: "contract-paperAmount",
                    type: "number",
                    value: form.paperAmount,
                    onChange: (e) => setForm((prev) => {
                      const next = {
                        ...prev,
                        paperAmount: e.target.value
                      };
                      const ca = Number.parseFloat(next.contractAmount) || 0;
                      const ba = Number.parseFloat(next.bedAmount) || 0;
                      const pa = Number.parseFloat(e.target.value) || 0;
                      const me = Number.parseFloat(next.machineExpenses) || 0;
                      next.meshAmount = (ca - (ba + pa + me)).toString();
                      return next;
                    }),
                    className: "w-full bg-white/5 border border-orange-500/30 focus:border-orange-500 rounded-lg px-3 py-2 text-white outline-none"
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "label",
                {
                  htmlFor: "contract-meshAmount",
                  className: "text-gray-400 text-xs mb-1 block",
                  children: "Mesh Amount (₹)"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  id: "contract-meshAmount",
                  type: "number",
                  value: form.meshAmount,
                  onChange: (e) => setForm((prev) => ({
                    ...prev,
                    meshAmount: e.target.value
                  })),
                  className: "w-full bg-white/5 border border-orange-500/30 focus:border-orange-500 rounded-lg px-3 py-2 text-white outline-none"
                }
              )
            ] }),
            isSaving && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-orange-400 text-xs flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "svg",
                {
                  className: "animate-spin w-3.5 h-3.5",
                  fill: "none",
                  viewBox: "0 0 24 24",
                  "aria-hidden": "true",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "circle",
                      {
                        className: "opacity-25",
                        cx: "12",
                        cy: "12",
                        r: "10",
                        stroke: "currentColor",
                        strokeWidth: "4"
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "path",
                      {
                        className: "opacity-75",
                        fill: "currentColor",
                        d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      }
                    )
                  ]
                }
              ),
              "Saving contract..."
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 pt-3 border-t border-white/10 flex gap-3 pb-safe", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: closeForm,
                className: "flex-1 py-2.5 rounded-xl font-semibold border border-white/20 text-gray-300 hover:text-white hover:border-white/40 transition-colors",
                "data-ocid": "contract.cancel_button",
                children: "Cancel"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                type: "button",
                onClick: handleSave,
                disabled: isSaving || !form.name.trim(),
                className: "btn-orange flex-1 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed",
                "data-ocid": "contract.save_button",
                children: [
                  isSaving && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "svg",
                    {
                      className: "animate-spin w-4 h-4",
                      fill: "none",
                      viewBox: "0 0 24 24",
                      "aria-hidden": "true",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "circle",
                          {
                            className: "opacity-25",
                            cx: "12",
                            cy: "12",
                            r: "10",
                            stroke: "currentColor",
                            strokeWidth: "4"
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "path",
                          {
                            className: "opacity-75",
                            fill: "currentColor",
                            d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          }
                        )
                      ]
                    }
                  ),
                  isSaving ? "Saving..." : "Save"
                ]
              }
            )
          ] })
        ] }) })
      }
    )
  ] });
}
function CombinedFlow({ onClose }) {
  const { canEdit } = useAuth();
  const addContract = useAddContract();
  const addWorkColumn = useAddWorkColumn();
  const setAttendance = useSetAttendance();
  const { data: allLabours = [] } = useLabours();
  const { data: activeLabours = [] } = useGetActiveLabours();
  const getBedBase = () => Number(localStorage.getItem("rossie_bed_base") || "11000") || 11e3;
  const getPaperBase = () => Number(localStorage.getItem("rossie_paper_base") || "7000") || 7e3;
  const blankForm = () => ({
    name: "",
    multiplier: "1",
    contractAmount: "0",
    machineExpenses: "0",
    bedAmount: getBedBase().toString(),
    paperAmount: getPaperBase().toString(),
    meshAmount: "0"
  });
  const [step, setStep] = reactExports.useState(1);
  const [form, setForm] = reactExports.useState(blankForm);
  const [createdContract, setCreatedContract] = reactExports.useState(null);
  const [creating, setCreating] = reactExports.useState(false);
  const [instantAddLoading, setInstantAddLoading] = reactExports.useState(
    null
  );
  const [attendanceOverrides, setAttendanceOverrides] = reactExports.useState({});
  const [saving, setSaving] = reactExports.useState(false);
  const updateMultiplier = (val) => {
    const m = Number.parseFloat(val) || 1;
    const bed = getBedBase() * m;
    const paper = getPaperBase() * m;
    const contractAmount = Number.parseFloat(form.contractAmount) || 0;
    const machineExpenses = Number.parseFloat(form.machineExpenses) || 0;
    const mesh = contractAmount - (bed + paper + machineExpenses);
    setForm((prev) => ({
      ...prev,
      multiplier: val,
      bedAmount: bed.toString(),
      paperAmount: paper.toString(),
      meshAmount: mesh.toString()
    }));
  };
  const handleCreateContract = () => {
    if (!form.name.trim() || creating) return;
    setCreating(true);
    addContract.mutate(
      {
        name: form.name.trim(),
        multiplier: Number.parseFloat(form.multiplier),
        contractAmount: Number.parseFloat(form.contractAmount),
        machineExpenses: Number.parseFloat(form.machineExpenses),
        bedAmount: Number.parseFloat(form.bedAmount),
        paperAmount: Number.parseFloat(form.paperAmount),
        meshAmount: Number.parseFloat(form.meshAmount)
      },
      {
        onSuccess: (created) => {
          setCreatedContract(created);
          setCreating(false);
        },
        onError: () => setCreating(false)
      }
    );
  };
  const handleAddColumn = (workType) => {
    if (!createdContract) return;
    setInstantAddLoading(workType);
    addWorkColumn.mutate(
      { contractId: createdContract.id, name: "", workType },
      {
        // The mutation returns the full updated contract (with the new work
        // column appended). Replace the local createdContract snapshot with it
        // so sortedWorkColumns re-derives and step 2's AttendanceTable shows
        // the newly added columns. The react-query cache is updated separately
        // inside useAddWorkColumn; this keeps the local snapshot in sync.
        onSuccess: (updatedContract) => {
          if (updatedContract) {
            setCreatedContract(updatedContract);
          }
        },
        onSettled: () => setInstantAddLoading(null),
        onError: () => setInstantAddLoading(null)
      }
    );
  };
  const handleAttendanceChange = (labourId, columnId, value) => {
    setAttendanceOverrides((prev) => ({
      ...prev,
      [`${String(labourId)}|${columnId}`]: value
    }));
  };
  const sortedWorkColumns = reactExports.useMemo(
    () => createdContract ? sortWorkColumns(createdContract.workColumns) : [],
    [createdContract]
  );
  const labours = reactExports.useMemo(() => {
    const activeIds = new Set(activeLabours.map((l) => String(l.id)));
    return allLabours.filter((l) => activeIds.has(String(l.id)));
  }, [allLabours, activeLabours]);
  const attendanceRecords = reactExports.useMemo(() => {
    if (!createdContract) return [];
    return Object.entries(attendanceOverrides).map(([key, value]) => {
      const [labourIdStr, columnId] = key.split("|");
      return {
        contractId: createdContract.id,
        labourId: BigInt(labourIdStr),
        columnId,
        value
      };
    });
  }, [attendanceOverrides, createdContract]);
  const presentCount = reactExports.useMemo(
    () => attendanceRecords.filter((r) => getAttendanceDisplay(r.value) > 0).length,
    [attendanceRecords]
  );
  const handleSave = () => {
    if (!createdContract || saving) return;
    setSaving(true);
    for (const record of attendanceRecords) {
      setAttendance.mutate({
        contractId: createdContract.id,
        labourId: record.labourId,
        columnId: record.columnId,
        value: record.value
      });
    }
    setTimeout(() => {
      setSaving(false);
      onClose();
    }, 400);
  };
  const stepLabels = ["Contract", "Attendance", "Confirm"];
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      className: "fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4",
      onClick: (e) => {
        if (e.target === e.currentTarget) onClose();
      },
      onKeyDown: (e) => {
        if (e.key === "Escape") onClose();
      },
      role: "presentation",
      tabIndex: -1,
      "data-ocid": "combined_flow.dialog",
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-dialog rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 pb-3 flex items-center justify-between border-b border-white/10", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-bold text-white", children: "New Contract + Attendance" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: onClose,
              className: "text-gray-400 hover:text-white p-1",
              "aria-label": "Close",
              "data-ocid": "combined_flow.close_button",
              children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "svg",
                {
                  className: "w-5 h-5",
                  fill: "none",
                  stroke: "currentColor",
                  viewBox: "0 0 24 24",
                  role: "img",
                  "aria-label": "Close dialog",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("title", { children: "Close dialog" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "path",
                      {
                        strokeLinecap: "round",
                        strokeLinejoin: "round",
                        strokeWidth: 2,
                        d: "M6 18L18 6M6 6l12 12"
                      }
                    )
                  ]
                }
              )
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 pt-4 flex items-center", children: stepLabels.map((label, i) => {
          const stepNum = i + 1;
          const isActive = step === stepNum;
          const isDone = step > stepNum;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              className: "flex items-center flex-1 last:flex-none",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "div",
                  {
                    className: `flow-step ${isActive ? "flow-step-active" : ""} ${isDone ? "flow-step-done" : ""}`,
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flow-step-dot", children: isDone ? "✓" : stepNum }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flow-step-label", children: label })
                    ]
                  }
                ),
                stepNum < stepLabels.length && /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "div",
                  {
                    className: `flow-connector ${step > stepNum ? "flow-connector-done" : ""}`
                  }
                )
              ]
            },
            label
          );
        }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 overflow-y-auto px-4 py-4 space-y-3", children: [
          step === 1 && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "label",
                {
                  htmlFor: "combined-name",
                  className: "text-gray-400 text-xs mb-1 block",
                  children: "Contract Name"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  id: "combined-name",
                  type: "text",
                  value: form.name,
                  onChange: (e) => setForm((prev) => ({ ...prev, name: e.target.value })),
                  className: "w-full bg-white/5 border border-orange-500/30 focus:border-orange-500 rounded-lg px-3 py-2 text-white outline-none",
                  placeholder: "Contract name",
                  "data-ocid": "combined_flow.name_input"
                }
              )
            ] }),
            [
              {
                label: "Multiplier",
                key: "multiplier",
                type: "number",
                step: "0.1"
              },
              {
                label: "Contract Amount (₹)",
                key: "contractAmount",
                type: "number"
              },
              {
                label: "Machine Expenses (₹)",
                key: "machineExpenses",
                type: "number"
              }
            ].map(({ label, key, type, step: step2 }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "label",
                {
                  htmlFor: `combined-${key}`,
                  className: "text-gray-400 text-xs mb-1 block",
                  children: label
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  id: `combined-${key}`,
                  type,
                  step: step2,
                  value: form[key],
                  onChange: (e) => {
                    if (key === "multiplier") {
                      updateMultiplier(e.target.value);
                    } else {
                      setForm((prev) => {
                        const next = { ...prev, [key]: e.target.value };
                        if (key === "contractAmount" || key === "machineExpenses") {
                          const contractAmount = Number.parseFloat(
                            key === "contractAmount" ? e.target.value : next.contractAmount
                          ) || 0;
                          const bedAmount = Number.parseFloat(next.bedAmount) || 0;
                          const paperAmount = Number.parseFloat(next.paperAmount) || 0;
                          const machineExpenses = Number.parseFloat(
                            key === "machineExpenses" ? e.target.value : next.machineExpenses
                          ) || 0;
                          next.meshAmount = (contractAmount - (bedAmount + paperAmount + machineExpenses)).toString();
                        }
                        return next;
                      });
                    }
                  },
                  className: "w-full bg-white/5 border border-orange-500/30 focus:border-orange-500 rounded-lg px-3 py-2 text-white outline-none"
                }
              )
            ] }, key)),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "label",
                  {
                    htmlFor: "combined-bedAmount",
                    className: "text-gray-400 text-xs mb-1 block",
                    children: "Bed Amount (₹)"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    id: "combined-bedAmount",
                    type: "number",
                    value: form.bedAmount,
                    onChange: (e) => setForm((prev) => {
                      const next = { ...prev, bedAmount: e.target.value };
                      const ca = Number.parseFloat(next.contractAmount) || 0;
                      const ba = Number.parseFloat(e.target.value) || 0;
                      const pa = Number.parseFloat(next.paperAmount) || 0;
                      const me = Number.parseFloat(next.machineExpenses) || 0;
                      next.meshAmount = (ca - (ba + pa + me)).toString();
                      return next;
                    }),
                    className: "w-full bg-white/5 border border-orange-500/30 focus:border-orange-500 rounded-lg px-3 py-2 text-white outline-none"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "label",
                  {
                    htmlFor: "combined-paperAmount",
                    className: "text-gray-400 text-xs mb-1 block",
                    children: "Paper Amount (₹)"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    id: "combined-paperAmount",
                    type: "number",
                    value: form.paperAmount,
                    onChange: (e) => setForm((prev) => {
                      const next = { ...prev, paperAmount: e.target.value };
                      const ca = Number.parseFloat(next.contractAmount) || 0;
                      const ba = Number.parseFloat(next.bedAmount) || 0;
                      const pa = Number.parseFloat(e.target.value) || 0;
                      const me = Number.parseFloat(next.machineExpenses) || 0;
                      next.meshAmount = (ca - (ba + pa + me)).toString();
                      return next;
                    }),
                    className: "w-full bg-white/5 border border-orange-500/30 focus:border-orange-500 rounded-lg px-3 py-2 text-white outline-none"
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "label",
                {
                  htmlFor: "combined-meshAmount",
                  className: "text-gray-400 text-xs mb-1 block",
                  children: "Mesh Amount (₹)"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  id: "combined-meshAmount",
                  type: "number",
                  value: form.meshAmount,
                  onChange: (e) => setForm((prev) => ({
                    ...prev,
                    meshAmount: e.target.value
                  })),
                  className: "w-full bg-white/5 border border-orange-500/30 focus:border-orange-500 rounded-lg px-3 py-2 text-white outline-none"
                }
              )
            ] }),
            !createdContract ? /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: handleCreateContract,
                disabled: !form.name.trim() || creating,
                className: "w-full py-2.5 rounded-xl btn-orange font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed",
                "data-ocid": "combined_flow.create_contract_button",
                children: creating ? "Creating..." : "Create Contract"
              }
            ) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-white/10 bg-white/[0.03] p-3 space-y-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-white", children: createdContract.name }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-green-400", children: "✓ Created" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-400 font-medium uppercase tracking-wider mb-2", children: "Work Columns" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2 mb-2", children: [
                  sortedWorkColumns.map((col) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "span",
                    {
                      className: "inline-flex items-center gap-1 text-xs font-medium text-orange-300 bg-orange-500/10 border border-orange-500/20 rounded-md px-2 py-1",
                      children: col.name
                    },
                    col.id
                  )),
                  sortedWorkColumns.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-white/40", children: "No columns yet — add one below" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      type: "button",
                      onClick: () => handleAddColumn("bed"),
                      disabled: instantAddLoading === "bed",
                      className: "py-2 rounded-lg border border-orange-500/40 bg-orange-500/10 text-orange-300 text-xs font-semibold hover:bg-orange-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                      "data-ocid": "combined_flow.add_bed_button",
                      children: instantAddLoading === "bed" ? "…" : "+ Bed"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      type: "button",
                      onClick: () => handleAddColumn("paper"),
                      disabled: instantAddLoading === "paper",
                      className: "py-2 rounded-lg border border-purple-500/40 bg-purple-500/10 text-purple-300 text-xs font-semibold hover:bg-purple-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                      "data-ocid": "combined_flow.add_paper_button",
                      children: instantAddLoading === "paper" ? "…" : "+ Paper"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      type: "button",
                      onClick: () => handleAddColumn("mesh"),
                      disabled: instantAddLoading === "mesh",
                      className: "py-2 rounded-lg border border-teal-500/40 bg-teal-500/10 text-teal-300 text-xs font-semibold hover:bg-teal-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                      "data-ocid": "combined_flow.add_mesh_button",
                      children: instantAddLoading === "mesh" ? "…" : "+ Mesh"
                    }
                  )
                ] })
              ] })
            ] })
          ] }),
          step === 2 && createdContract && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-white/60", children: [
              "Mark attendance for",
              " ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-orange-400 font-semibold", children: createdContract.name })
            ] }),
            labours.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                className: "glass-card rounded-xl p-8 text-center text-gray-400",
                "data-ocid": "combined_flow.attendance_empty_state",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm", children: "No active labours to mark attendance for." })
              }
            ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
              AttendanceTable,
              {
                contract: createdContract,
                workColumns: sortedWorkColumns,
                labours,
                attendance: attendanceRecords,
                canEdit,
                onChange: handleAttendanceChange
              }
            )
          ] }),
          step === 3 && createdContract && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-white", children: createdContract.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-x-4 gap-y-2 text-sm", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-400 text-xs", children: "Contract Amount" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-orange-400 font-medium", children: [
                    "₹",
                    createdContract.contractAmount.toLocaleString("en-IN", {
                      maximumFractionDigits: 0
                    })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-400 text-xs", children: "Work Columns" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-white font-medium", children: sortedWorkColumns.length })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-400 text-xs", children: "Labours Marked" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-white font-medium", children: attendanceRecords.length })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-400 text-xs", children: "Present" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-green-400 font-medium", children: presentCount })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-white/40", children: "Review the details above. Saving will create the contract and record the attendance you marked." })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 pt-3 border-t border-white/10 flex gap-3 pb-safe", children: [
          step > 1 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: () => setStep((s) => s - 1),
              disabled: saving,
              className: "flex-1 py-2.5 rounded-xl font-semibold border border-white/20 text-gray-300 hover:text-white hover:border-white/40 transition-colors disabled:opacity-50",
              "data-ocid": "combined_flow.back_button",
              children: "Back"
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: onClose,
              className: "flex-1 py-2.5 rounded-xl font-semibold border border-white/20 text-gray-300 hover:text-white hover:border-white/40 transition-colors",
              "data-ocid": "combined_flow.cancel_button",
              children: "Cancel"
            }
          ),
          step < 3 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: () => setStep((s) => s + 1),
              disabled: step === 1 && !createdContract,
              className: "btn-orange flex-1 py-2.5 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed",
              "data-ocid": "combined_flow.next_button",
              children: "Next →"
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: handleSave,
              disabled: saving,
              className: "btn-orange flex-1 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed",
              "data-ocid": "combined_flow.save_button",
              children: saving ? "Saving..." : "Save & Finish"
            }
          )
        ] })
      ] })
    }
  );
}
const ContractsPage_default = reactExports.memo(ContractsPage);
export {
  ContractsPage_default as default
};
