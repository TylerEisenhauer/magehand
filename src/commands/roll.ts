import { Message } from 'discord.js'
import { randomInteger } from '../helpers/numbers'

const regex: RegExp = /((\d*)?d(\d+)([+-/*]\d+)?){1}/g
const allowedDie: string[] =  ['2', '4', '6', '8', '10', '12', '20', '100']

export async function roll(message: Message, args: string[]) {
    try {
        if (!args[0]) return await message.channel.send('Invalid input, must be in the format {X}d{Y}')
        const input: RegExpMatchArray = args[0].match(regex)
        if (!input) return await message.channel.send('Invalid input, must be in the format {X}d{Y}')

        const split: string[] = input[0].split('d')
        const numberToRoll: number = !split[0] ? 1 : parseInt(split[0])
        const dieToRoll: number = parseInt(split[1])

        if (!allowedDie.includes(dieToRoll.toString())) return await message.channel.send(`Invalid die, please choose one of ${allowedDie}`)

        let rolls: number[] = []
        for (let i = 0; i < numberToRoll; i++) {
            const roll: number = randomInteger(1, dieToRoll)
            rolls.push(roll)
        }

        const result: string = rolls.join(',')
        return await message.channel.send(`[${result}] = ${rolls.reduce((x, y) => x + y)}`)
    } catch (ex) {
        console.log(ex)
        return await message.channel.send(`Exception thrown, check logs`)
    }
}