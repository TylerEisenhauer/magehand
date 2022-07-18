import { APIApplicationCommandOptionChoice } from "discord.js"

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

export const timezoneOptions: APIApplicationCommandOptionChoice<string>[] = timezoneList.map(x => {
    return {
        name: x,
        value: x
    }
})
