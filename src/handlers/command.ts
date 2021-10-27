import {Message} from 'discord.js'
import { newpc } from '../commands/newpc'

export async function commandHandler(command: string, args: string[], message: Message) {
    switch (command) {
        case 'newpc':
            return newpc(message)
        default:
            return
    }
}