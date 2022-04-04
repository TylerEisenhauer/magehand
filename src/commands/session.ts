import { SlashCommandBuilder } from '@discordjs/builders'
import { ChannelType } from 'discord-api-types/v9'
import { CommandInteraction, Message, MessageEmbed, TextChannel } from 'discord.js'
import { DateTime } from 'luxon'
import { timezoneOptions } from '../helpers/timezones'

import { Command } from '../types/command'
import { Session } from '../types/session'

const slashCommand = new SlashCommandBuilder()
    .setName('session')
    .setDescription('Manage sessions')
    .addSubcommand(subcommand =>
        subcommand
            .setName('schedule')
            .setDescription('Schedule a session')
            .addStringOption(option =>
                option
                    .setName('name')
                    .setDescription('The name for the session')
                    .setRequired(true))
            .addChannelOption(option =>
                option
                    .setName('channel')
                    .setDescription('The channel to post reminders in')
                    .addChannelType(ChannelType.GuildText.valueOf())
                    .setRequired(true))
            .addStringOption(option =>
                option
                    .setName('date')
                    .setDescription('The date for the session (YYYY-MM-DD)')
                    .setRequired(true))
            .addStringOption(option =>
                option
                    .setName('time')
                    .setDescription('The time for the session (24 hour format HH:MM)')
                    .setRequired(true))
            .addStringOption(option =>
                option
                    .setName('description')
                    .setDescription('The description for the session')
                    .setRequired(true))
            .addStringOption(option =>
                option
                    .setName('location')
                    .setDescription('The location for the session')
                    .setRequired(true))
            .addStringOption(option =>
                option
                    .setName('timezone')
                    .addChoices(timezoneOptions)
                    .setDescription('The timezone the session is for, defaults to America/Chicago')
                    .setRequired(false))
    )

async function executeInteraction(interaction: CommandInteraction) {
    switch (interaction.options.getSubcommand()) {
        case 'schedule':
            return await scheduleSession(interaction)
        case 'cancel':
            return await cancelSession(interaction)
        default:
            return await interaction.reply('Invalid subcommand for session')
    }
}

async function scheduleSession(interaction: CommandInteraction) {
    const name = interaction.options.getString('name')
    const channel = interaction.options.getChannel('channel').id
    const date = interaction.options.getString('date')
    const time = interaction.options.getString('time')
    const description = interaction.options.getString('description')
    const location = interaction.options.getString('location')
    const timezone = interaction.options.getString('timezone')

    const parsedDate = DateTime.fromISO(`${date}T${time}`, { zone: timezone ?? 'America/Chicago' })
    if (!parsedDate.isValid) return await interaction.reply('Invalid date or time provided')

    console.log(parsedDate.toString())

    const session: Session = {
        channel,
        date: parsedDate.toJSDate(),
        description,
        guild: interaction.guild.id,
        location,
        name
    }

    console.log(session)

    //send to api

    await interaction.reply({ content: 'Session Scheduled!', ephemeral: true })

    const embed: MessageEmbed = new MessageEmbed()
        .setColor(3447003)
        .setAuthor({
            name: `${session.name}`
        })
        .setDescription(session.description)
        .addFields(
            { name: 'Location', value: session.location, inline: true },
            { name: 'Time', value: `<t:${+new Date(session.date) / 1000}:f>`, inline: true }
        )

    const alertChannel = await interaction.guild.channels.fetch(channel) as TextChannel
    const message = await alertChannel.send({content: 'New session scheduled! React if you can make it', embeds: [embed]})
    await message.react('✅')
    await message.react('❌')
}

async function cancelSession(interaction: CommandInteraction) {

}

async function execute(args: string[], message: Message) {
    return await message.reply('The session commands can only be used via slash command')
}

module.exports = {
    name: 'session',
    execute,
    executeInteraction,
    slashCommand
} as Command