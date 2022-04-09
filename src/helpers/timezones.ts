const timezoneList = [
    'America/Chicago',
    'America/New_York',
    'America/Los_Angeles',
    'America/Detroit',
    'America/Denver',
    'America/Phoenix',
    'America/Anchorage',
    'America/Adak',
    'Pacific/Honolulu'
  ]

  export const timezoneOptions: [name: string, value: string][] = timezoneList.map(x => {
      return [x, x]
  })