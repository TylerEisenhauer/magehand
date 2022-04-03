import { SlashCommandBuilder } from '@discordjs/builders'
import { CommandInteraction, Message } from 'discord.js'

import { randomInteger } from '../helpers/numbers'
import { Command } from '../types/command'

const slashCommand = new SlashCommandBuilder()
    .setName('newpc')
    .setDescription('Roll stats for a new player character')

async function executeInteraction(interaction: CommandInteraction) {
    let rolls: number[][] = []
    for (let i = 0; i < 6; i++) {
        let set: number[] = []
        for (let x = 0; x < 4; x++) {
            set.push(randomInteger(1, 6))
        }
        rolls.push(set)
    }

    let retVal: string = ''
    rolls.forEach(x => {
        const sumOfHighest: number = x.sort((a,b) => b-a).slice(0,3).reduce((x,y) => x+y)
        retVal = retVal.concat(`[${x}]: ${sumOfHighest}\n`)
    })
    
    return await interaction.reply(retVal)
}

async function execute(args: string[], message: Message) {
    let rolls: number[][] = []
    for (let i = 0; i < 6; i++) {
        let set: number[] = []
        for (let x = 0; x < 4; x++) {
            set.push(randomInteger(1, 6))
        }
        rolls.push(set)
    }

    let retVal: string = ''
    rolls.forEach(x => {
        const sumOfHighest: number = x.sort((a,b) => b-a).slice(0,3).reduce((x,y) => x+y)
        retVal = retVal.concat(`[${x}]: ${sumOfHighest}\n`)
    })
    
    return await message.channel.send(retVal)
}

module.exports = {
    name: 'newpc',
    execute,
    executeInteraction,
    slashCommand
} as Command