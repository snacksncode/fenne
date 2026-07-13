export const getDeviceTimezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || null;

export const getTimezoneCity = (timezone: string) => {
  const city = timezone.split('/').at(-1) ?? timezone;
  return city.replaceAll('_', ' ');
};

export const getTimezoneDisplayName = (timezone: string) => `${getTimezoneCity(timezone)} time`;
