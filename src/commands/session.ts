import { SlashCommandBuilder } from '@discordjs/builders'
import { ChannelType } from 'discord-api-types/v9'
import { ChatInputCommandInteraction, Message, EmbedBuilder, TextChannel } from 'discord.js'
import { DateTime } from 'luxon'

import { createSession, getSessionById, updateSession } from '../api/magehand'
import { buildSessionEmbed } from '../helpers/embeds'
import { timezoneOptions } from '../helpers/timezones'
import { logger } from '../logger'
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
                    .addChannelTypes(ChannelType.GuildText)
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
                    .addChoices(...timezoneOptions)
                    .setDescription('The timezone the session is for, defaults to America/Chicago')
                    .setRequired(false))
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('edit')
            .setDescription('Edit a session')
            .addStringOption(option =>
                option
                    .setName('id')
                    .setDescription('The id of the session to edit (can be found in the footer of the scheduled alert)')
                    .setRequired(true))
            .addStringOption(option =>
                option
                    .setName('name')
                    .setDescription('The name for the session')
                    .setRequired(false))
            .addStringOption(option =>
                option
                    .setName('description')
                    .setDescription('The description for the session')
                    .setRequired(false))
            .addChannelOption(option =>
                option
                    .setName('channel')
                    .setDescription('The channel to post reminders in')
                    .addChannelTypes(ChannelType.GuildText)
                    .setRequired(false))
            .addStringOption(option =>
                option
                    .setName('date')
                    .setDescription('The date for the session (YYYY-MM-DD)')
                    .setRequired(false))
            .addStringOption(option =>
                option
                    .setName('time')
                    .setDescription('The time for the session (24 hour format HH:MM)')
                    .setRequired(false))
            .addStringOption(option =>
                option
                    .setName('location')
                    .setDescription('The location for the session')
                    .setRequired(false))
            .addStringOption(option =>
                option
                    .setName('timezone')
                    .addChoices(...timezoneOptions)
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

async function executeInteraction(interaction: ChatInputCommandInteraction) {
    switch (interaction.options.getSubcommand()) {
        case 'schedule':
            return await scheduleSession(interaction)
        case 'cancel':
            return await cancelSession(interaction)
        case 'edit':
            return await editSession(interaction)
        default:
            return await interaction.reply('Invalid subcommand for session')
    }
}

async function scheduleSession(interaction: ChatInputCommandInteraction) {
    const name = interaction.options.getString('name')
    const channel = interaction.options.getChannel('channel').id
    const date = interaction.options.getString('date')
    const time = interaction.options.getString('time')
    const description = interaction.options.getString('description')
    const location = interaction.options.getString('location')
    const timezone = interaction.options.getString('timezone')

    const parsedDate = DateTime.fromISO(`${date}T${time}`, { zone: timezone ?? 'America/Chicago' })
    if (!parsedDate.isValid) return await interaction.reply({ content: 'Invalid date or time provided', ephemeral: true })

    const session: Session = await createSession({
        channel,
        date: parsedDate.toJSDate(),
        description,
        guild: interaction.guild.id,
        owner: interaction.user.id,
        location,
        name
    })

    await interaction.reply({ content: 'Session Scheduled!', ephemeral: true })

    const embed: EmbedBuilder = buildSessionEmbed(session)

    const alertChannel = await interaction.guild.channels.fetch(channel) as TextChannel
    const message = await alertChannel.send({ content: 'Session Updated! React if you can make it', embeds: [embed] })

    await updateSession({
        _id: session._id,
        messageId: message.id
    })

    await message.react('✅')
    await message.react('❌')
}

async function editSession(interaction: ChatInputCommandInteraction) {
    const id = interaction.options.getString('id')
    const name = interaction.options.getString('name')
    const channel = interaction.options.getChannel('channel')?.id
    const date = interaction.options.getString('date')
    const time = interaction.options.getString('time')
    const description = interaction.options.getString('description')
    const location = interaction.options.getString('location')
    const timezone = interaction.options.getString('timezone')

    const existingSession = await getSessionById(id)

    if (!existingSession) return await interaction.reply({ content: 'Session not found', ephemeral: true })

    if (existingSession.owner && existingSession.owner !== interaction.user.id) return await interaction.reply({ content: 'You are not the owner of that session.', ephemeral: true })
    if (existingSession.guild !== interaction.guild.id) return await interaction.reply({ content: 'That session was not created in this server. Please update it in the server it was created in.', ephemeral: true })

    let parsedDate
    if (date || time) {
        if (date && time) {
            parsedDate = DateTime.fromISO(`${date}T${time}`, { zone: timezone ?? 'America/Chicago' })
        } else if (date) {
            const dateString = `${date}T${DateTime.fromJSDate(existingSession.date).toFormat('HH:mm')}`
            parsedDate = DateTime.fromISO(dateString, { zone: timezone ?? 'America/Chicago' })
        } else {

            const dateString = `${DateTime.fromJSDate(existingSession.date).toFormat('yyyy-MM-dd')}T${time}`
            parsedDate = DateTime.fromISO(dateString, { zone: timezone ?? 'America/Chicago' })
        }
        if (!parsedDate.isValid) return await interaction.reply({ content: 'Invalid date or time provided', ephemeral: true })
    }

    const session: Session = Object.assign({ _id: existingSession._id },
        name === null ? null : { name },
        channel === null ? null : { channel },
        parsedDate === null ? null : { date: parsedDate },
        description === null ? null : { description },
        existingSession.owner === null ? { owner: interaction.user.id } : null,
        location === null ? null : { location },
        timezone === null ? null : { timezone }
    )

    const updatedSession = await updateSession(session)

    try {
        const originalMessage = await ((await interaction.guild.channels.fetch(existingSession.channel)) as TextChannel).messages.fetch(existingSession.messageId)

        if (originalMessage && originalMessage.deletable) {
            await originalMessage.delete()
        }
    } catch (e) {
        logger.error(e.message)
    }

    await interaction.reply({ content: 'Session Updated!', ephemeral: true })

    const embed: EmbedBuilder = buildSessionEmbed(updatedSession)

    const alertChannel = await interaction.guild.channels.fetch(updatedSession.channel) as TextChannel
    const message = await alertChannel.send({ content: 'Session Updated! React if you can make it', embeds: [embed] })

    await updateSession({
        _id: session._id,
        messageId: message.id
    })

    await message.react('✅')
    await message.react('❌')
}

async function cancelSession(interaction: ChatInputCommandInteraction) {
    const id = interaction.options.getString('id')
    const session = await updateSession({
        _id: id,
        cancelled: true
    })

    if (session) {
        const messageChannel = await interaction.client.channels.fetch(session.channel) as TextChannel
        const message = await messageChannel.messages.fetch(session.messageId)

        if (message.editable) {
            const embed = new EmbedBuilder(message.embeds[0].toJSON())
            embed.setColor('#FF0000')
            await message.edit({ content: 'This session has been cancelled', embeds: [embed] })
        }
        
        return await interaction.reply({ content: 'Session canceled', ephemeral: true })
    }
    await interaction.reply({ content: 'Could not find session, check your session id', ephemeral: true })
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