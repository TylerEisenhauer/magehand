import { Interaction } from 'discord.js'
import { logger } from '../logger'
import { ExtendedClient } from '../types'

export default async function interactionCreate(interaction: Interaction) {
    if (!interaction.isCommand()) return
    
    try {
        const client: ExtendedClient = interaction.client

        await client.commands.get(interaction.commandName)?.executeInteraction(interaction)
    } catch (e) {
        logger.error(e)
    }
}