import { SlashCommandBuilder } from '@discordjs/builders'
import { CommandInteraction, Message } from 'discord.js'

import { randomInteger } from '../helpers/numbers'
import { logger } from '../logger'
import { Command } from '../types'

const regex: RegExp = /((\d*)?d(\d+)([+-/*]\d+)?){1}/g
const allowedDie: string[] = ['2', '4', '6', '8', '10', '12', '20', '100']

const slashCommand = new SlashCommandBuilder()
    .setName('roll')
    .setDescription('Roll some dice')
    .addIntegerOption(o =>
        o.setName('dicetoroll')
            .setDescription('The dice to roll')
            .addChoices([
                ['d2', 2],
                ['d4', 4],
                ['d6', 6],
                ['d8', 8],
                ['d10', 10],
                ['d12', 12],
                ['d20', 20],
                ['d100', 100]
            ])
            .setRequired(true))
    .addIntegerOption(o =>
        o.setName('numberofdice')
            .setDescription('The number of dice to roll')
            .setMinValue(1)
            .setMaxValue(100)
            .setRequired(false))

async function executeInteraction(interaction: CommandInteraction) {
    try {
        const numberToRoll: number = interaction.options.getInteger('numberofdice') ?? 1
        const dieToRoll: number = interaction.options.getInteger('dicetoroll')

        let rolls: number[] = []
        for (let i = 0; i < numberToRoll; i++) {
            const roll: number = randomInteger(1, dieToRoll)
            rolls.push(roll)
        }

        const result: string = rolls.join(',')
        return await interaction.reply(`[${result}] = ${rolls.reduce((x, y) => x + y)}`)
    } catch (ex) {
        logger.error(ex)
        return await interaction.reply(`Exception thrown, check logs`)
    }
}

async function execute(args: string[], message: Message) {
    try {
        if (!args[0]) return await message.channel.send('Invalid input, must be in the format {X}d{Y}')
        const input: RegExpMatchArray = args[0].match(regex)
        if (!input) return await message.channel.send('Invalid input, must be in the format {X}d{Y}')

        const split: string[] = input[0].split('d')
        const numberToRoll: number = !split[0] ? 1 : parseInt(split[0])
        const dieToRoll: number = parseInt(split[1])

        if (!allowedDie.includes(dieToRoll.toString())) return await message.channel.send(`Invalid die, please choose one of ${allowedDie}`)
        if (numberToRoll > 100 || numberToRoll < 1) return await message.channel.send(`Invalid number of die to roll, please choose 1-100`)

        let rolls: number[] = []
        for (let i = 0; i < numberToRoll; i++) {
            const roll: number = randomInteger(1, dieToRoll)
            rolls.push(roll)
        }

        const result: string = rolls.join(',')
        return await message.channel.send(`[${result}] = ${rolls.reduce((x, y) => x + y)}`)
    } catch (ex) {
        logger.error(ex)
        return await message.channel.send(`Exception thrown, check logs`)
    }
}

module.exports = {
    name: 'roll',
    execute,
    executeInteraction,
    slashCommand
} as Command