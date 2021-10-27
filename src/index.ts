import {Client, Intents, Message} from 'discord.js'
import {config} from 'dotenv-flow'
import { commandHandler } from './handlers/command'
import { parseArgs } from './helpers/parsing'

config()

const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS, 
        Intents.FLAGS.GUILD_MESSAGES, 
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS, 
        Intents.FLAGS.DIRECT_MESSAGES, 
        Intents.FLAGS.DIRECT_MESSAGE_REACTIONS
    ]
})

const prefix = '!'

client.on('ready', async () => {
    await client.user.setPresence({
        status: 'online',
        activities: [
            {
                name: 'Dungeons and Dragons',
                type: 'PLAYING'
            }
        ]
    })
    console.log('Bot Online')
})

client.on('messageCreate', async (message: Message) => {
    if (message.author.bot) return
    if (!message.content.startsWith(prefix)) return

    const args: string[] = parseArgs(prefix, message.content)
    const command: string = args.shift().toLowerCase()

    if (command.startsWith(prefix)) return

    await commandHandler(command, args, message)
})

client.login(process.env.DISCORD_TOKEN)