import {Message} from 'discord.js'
import { ping } from '../commands/ping'

export async function commandHandler(command: string, args: string[], message: Message) {
    switch (command) {
        case 'ping':
            return ping(message)
        default:
            return
    }
}