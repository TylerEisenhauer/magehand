import { SlashCommandBuilder } from '@discordjs/builders'
import { CommandInteraction, Message } from 'discord.js'

export interface Command {
    name: string
    execute: (args: string[], message: Message) => Promise<Message<any>> | Promise<void>
    executeInteraction?: (interaction: CommandInteraction) => Promise<Message<any>> | Promise<void>
    slashCommand?: SlashCommandBuilder
}