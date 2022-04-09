import { SlashCommandBuilder } from '@discordjs/builders'
import { ChannelType } from 'discord-api-types/v9'
import { CommandInteraction, Message, MessageEmbed, TextChannel } from 'discord.js'
import { DateTime } from 'luxon'
import { createSession, updateSession } from '../api/magehand'

import { timezoneOptions } from '../helpers/timezones'
import { Command, Session } from '../types'

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
            .addStringOption(option =>
                option
                    .setName('description')
                    .setDescription('The description for the session')
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
    .addSubcommand(subcommand =>
        subcommand
            .setName('cancel')
            .setDescription('Cancel a session')
            .addStringOption(option =>
                option
                    .setName('id')
                    .setDescription('The id for the session to cancel (find this on the scheduled post)')
                    .setRequired(true))
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
    if (!parsedDate.isValid) return await interaction.reply({content: 'Invalid date or time provided', ephemeral: true})

    const session: Session = await createSession({
        channel,
        date: parsedDate.toJSDate(),
        description,
        guild: interaction.guild.id,
        location,
        name
    })

    await interaction.reply({ content: 'Session Scheduled!', ephemeral: true })

    const embed: MessageEmbed = new MessageEmbed()
        .setColor('#00FF00')
        .setAuthor({
            name: `${session.name}`
        })
        .setDescription(session.description)
        .addFields(
            { name: 'Location', value: session.location, inline: true },
            { name: 'Time', value: `<t:${+new Date(session.date) / 1000}:f>`, inline: true }
        )
        .setFooter({ text: `Session id | ${session._id}` })

    const alertChannel = await interaction.guild.channels.fetch(channel) as TextChannel
    const message = await alertChannel.send({ content: 'New session scheduled! React if you can make it', embeds: [embed] })

    await updateSession({
        _id: session._id,
        messageId: message.id
    })
    
    await message.react('✅')
    await message.react('❌')

}

async function cancelSession(interaction: CommandInteraction) {
    const id = interaction.options.getString('id')
    const session = await updateSession({
        _id: id,
        cancelled: true
    })

    if (session) {
        const messageChannel = await interaction.client.channels.fetch(session.channel) as TextChannel
        const message = await messageChannel.messages.fetch(session.messageId)
        if (message.editable) {
            const embed = message.embeds[0]
            embed.setColor('#FF0000')
            await message.edit({ content: 'This session has been cancelled', embeds: [embed] })
        }
        return await interaction.reply({content: 'Session canceled', ephemeral: true})
    }
    await interaction.reply({content: 'Could not find session, check your session id', ephemeral: true})
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