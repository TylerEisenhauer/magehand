import './config'

import { REST } from '@discordjs/rest'
import { Client, Collection, GatewayIntentBits, Partials, Routes } from 'discord.js'
import fs from 'node:fs'
import path from 'node:path'

import { interactionCreate, messageCreate, messageReactionAdd, messageReactionRemove, ready } from './events'
import { logger } from './logger'
import { ExtendedClient, Command } from './types'

const client: ExtendedClient = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageReactions
    ],
    partials: [
        Partials.User, 
        Partials.Reaction, 
        Partials.Message
    ]
})
client.commands = new Collection()

const commands = []
const commandDirectory = path.join(__dirname, 'commands')
const commandFiles = fs.readdirSync(commandDirectory).filter(file => file.endsWith('.js'))

for (const file of commandFiles) {
    const command: Command = require(path.join(commandDirectory, file))
    if (command.slashCommand) commands.push(command.slashCommand.toJSON())

    client.commands.set(command.name, command)
}

client.on('ready', ready)
client.on('messageCreate', messageCreate)
client.on('messageReactionAdd', messageReactionAdd)
client.on('messageReactionRemove', messageReactionRemove)
client.on('interactionCreate', interactionCreate)

client.login(process.env.DISCORD_TOKEN).then(() => {
    logger.info('Discord Login Success')

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN)
    if (process.env.NODE_ENV === 'production') {
        rest.put(Routes.applicationCommands(client.user.id), { body: commands })
            .then(() => logger.info('Successfully registered global application commands.'))
            .catch(logger.error)
    } else {
        const guildId = process.env.DEV_GUILD_ID
        rest.put(Routes.applicationGuildCommands(client.user.id, guildId), { body: commands })
            .then(() => logger.info('Successfully registered application commands.'))
            .catch(logger.error)
    }
}).catch((e) => {
    logger.error(e)
})
