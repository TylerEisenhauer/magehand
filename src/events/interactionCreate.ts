import { Interaction } from 'discord.js'
import { ExtendedClient } from '../types/extendedClient'

export async function interactionCreate(interaction: Interaction) {
    if (!interaction.isCommand()) return
    const client: ExtendedClient = interaction.client

    await client.commands.get(interaction.commandName)?.executeInteraction(interaction)
}