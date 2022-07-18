import { ChatInputCommandInteraction, InteractionResponse, Message, SlashCommandBuilder } from 'discord.js'

export default interface Command {
    name: string
    execute: (args: string[], message: Message) => Promise<Message<any>> | Promise<void>
    executeInteraction?: (interaction: ChatInputCommandInteraction) => Promise<InteractionResponse<boolean>> | Promise<void>
    slashCommand?: SlashCommandBuilder
}