import { APIApplicationCommandOptionChoice } from "discord.js"

const frequencyList = [
    'advanced',
    'weekly'
]

export const frequencyOptions: APIApplicationCommandOptionChoice<string>[] = frequencyList.map(x => {
    return {
        name: x,
        value: x
    }
})
