import {Message} from 'discord.js'
import { newpc } from '../commands/newpc'
import { roll } from '../commands/roll'

export async function commandHandler(command: string, args: string[], message: Message) {
    switch (command) {
        case 'newpc':
            return await newpc(message)
        case 'roll':
            return await roll(message, args)
        default:
            return
    }
}