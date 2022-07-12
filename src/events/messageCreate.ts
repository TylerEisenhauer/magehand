import { Message } from 'discord.js'

import { parseArgs } from '../helpers/parsing'
import { logger } from '../logger'
import { ExtendedClient } from '../types'

const prefix = '!'

export default async function messageCreate(message: Message) {
    if (message.author.bot) return
    if (!message.content.startsWith(prefix)) return
    
    try {
        const client: ExtendedClient = message.client
    
        const args: string[] = parseArgs(prefix, message.content)
        const command: string = args.shift().toLowerCase()
        
        if (command.startsWith(prefix)) return
        await client.commands.get(command)?.execute(args, message)
    } catch (e) {
        logger.error(e)
    }
}