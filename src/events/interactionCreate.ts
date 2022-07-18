import { ChatInputCommandInteraction, InteractionType } from 'discord.js'
import { logger } from '../logger'
import { ExtendedClient } from '../types'

export default async function interactionCreate(interaction: ChatInputCommandInteraction) {
    if (interaction.type !== InteractionType.ApplicationCommand) return
    
    try {
        const client: ExtendedClient = interaction.client

        await client.commands.get(interaction.commandName)?.executeInteraction(interaction)
    } catch (e) {
        logger.error(e)
    }
}