import { ChannelType } from 'discord-api-types/v9'
import { ChatInputCommandInteraction, Message, SlashCommandBuilder } from 'discord.js'
import { DateTime } from 'luxon'

import { addCampaign, updateCampaign } from '../api/magehand'
import { frequencyOptions } from '../helpers/frequency'
import { timezoneOptions } from '../helpers/timezones'
import { Campaign, Command } from '../types'

const slashCommand = new SlashCommandBuilder()
    .setName('campaign')
    .setDescription('Manage campaigns')
    .addSubcommand(subcommand =>
        subcommand
            .setName('create')
            .setDescription('Create a campaign')
            .addStringOption(option =>
                option
                    .setName('name')
                    .setDescription('The name for the campaign')
                    .setRequired(true))
            .addStringOption(option =>
                option
                    .setName('description')
                    .setDescription('The description for the campaign')
                    .setRequired(true))
            .addChannelOption(option =>
                option
                    .setName('channel')
                    .setDescription('The channel to post session reminders in')
                    .addChannelTypes(ChannelType.GuildText)
                    .setRequired(true))
            .addStringOption(option =>
                option
                    .setName('location')
                    .setDescription('The location for the session')
                    .setRequired(true))
            .addStringOption(option =>
                option
                    .setName('startdate')
                    .setDescription('The date to begin scheduling sessions. (YYYY-MM-DD)')
                    .setRequired(true))
            .addStringOption(option =>
                option
                    .setName('time')
                    .setDescription('The time for the session (24 hour format HH:MM)')
                    .setRequired(true))
            .addStringOption(option =>
                option
                    .setName('frequency')
                    .addChoices(...frequencyOptions)
                    .setDescription('The session frequency')
                    .setRequired(true))
            .addIntegerOption(option =>
                option
                    .setName('initialsessionnumber')
                    .setDescription('The session number to start with, 0 is default')
                    .setRequired(false))
            .addStringOption(option =>
                option
                    .setName('daysofweek')
                    .setDescription('Comma delimited day numbers to schedule sessions on Monday = 1, Sunday = 7. Example \'1,4,6\', 1')
                    .setRequired(false))
            .addStringOption(option =>
                option
                    .setName('weeknumbers')
                    .setDescription('Comma delimited week numbers to schedule sessions on, 1-5 are valid. Example \'1,2,3\', 4, \'1,3,5\'')
                    .setRequired(false))
            .addIntegerOption(option =>
                option
                    .setName('weeksbetween')
                    .setDescription('Number of weeks between sessions.')
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
            .setName('end')
            .setDescription('End a campaign')
            .addStringOption(option =>
                option
                    .setName('id')
                    .setDescription('The id for the campaign to end')
                    .setRequired(true))
    )

async function executeInteraction(interaction: ChatInputCommandInteraction) {
    switch (interaction.options.getSubcommand()) {
        case 'create':
            return await createCampaign(interaction)
        case 'end':
            return await endCampaign(interaction)
        default:
            return await interaction.reply('Invalid subcommand for campaign')
    }
}

async function createCampaign(interaction: ChatInputCommandInteraction) {
    const name = interaction.options.getString('name')
    const description = interaction.options.getString('description')
    const channel = interaction.options.getChannel('channel').id
    const location = interaction.options.getString('location')
    const startdate = interaction.options.getString('startdate')
    const time = interaction.options.getString('time')
    const frequency = interaction.options.getString('frequency')
    const initialsessionnumber = interaction.options.getInteger('initialsessionnumber')
    const daysofweek = interaction.options.getString('daysofweek')
    const weeknumbers = interaction.options.getString('weeknumbers')
    const weeksbetween = interaction.options.getInteger('weeksbetween')
    const timezone = interaction.options.getString('timezone')

    const parsedDate = DateTime.fromISO(`${startdate}T${time}`, { zone: timezone ?? 'America/Chicago' })
    if (!parsedDate.isValid) return await interaction.reply({ content: 'Invalid start date or time provided', ephemeral: true })

    let campaign: Campaign
    if (frequency === 'advanced') {
        if (!daysofweek || !weeknumbers) return await interaction.reply({ content: 'daysofweek and weeknumbers are requred to use advanced scheduling', ephemeral: true })

        //days of week validation
        const days = daysofweek.split(',')

        if (days.length > 7) return await interaction.reply({ content: 'Too many days provided for daysofweek, provide 7 or less days', ephemeral: true })

        const uniqueDays = Array.from(new Set(days)).sort()

        if (uniqueDays.some(x => {
            if (isNaN(Number(x))) return true

            const parsed = parseInt(x)
            if (parsed < 1 || parsed > 7) return true

            return false
        })) {
            return await interaction.reply({ content: 'Invalid days provided for daysofweek', ephemeral: true })
        }

        //week number validation
        const weekNums = weeknumbers.split(',')

        if (weekNums.length > 5) return await interaction.reply({ content: 'Too many weeks provided for weeknumbers, provide 5 or less weeks', ephemeral: true })

        const uniqueWeekNums = Array.from(new Set(weekNums))

        if (uniqueWeekNums.some(x => {
            if (isNaN(Number(x))) return true

            const parsed = parseInt(x)
            if (parsed < 1 || parsed > 5) return true

            return false
        })) {
            return await interaction.reply({ content: 'Invalid week numbers provided for weeknumbers', ephemeral: true })
        }

        campaign = await addCampaign({
            channel,
            description,
            startDate: parsedDate.toJSDate(),
            initialSessionNumber: initialsessionnumber || 0,
            occurs: {
                daysOfWeek: uniqueDays.map(x => {
                    return parseInt(x)
                }),
                frequency,
                time,
                timezone: timezone || 'America/Chicago',
                weekNumbers: uniqueWeekNums.map(x => {
                    return parseInt(x)
                })
            },
            guild: interaction.guild.id,
            location,
            name,
            owner: interaction.user.id,
        })
    } else if (frequency === 'weekly') {
        campaign = await addCampaign({
            channel,
            description,
            startDate: parsedDate.toJSDate(),
            initialSessionNumber: initialsessionnumber || 0,
            occurs: {
                frequency,
                time,
                timezone: timezone || 'America/Chicago',
                weeksBetween: weeksbetween || 0
            },
            guild: interaction.guild.id,
            location,
            name,
            owner: interaction.user.id,
        })
    }

    await interaction.reply({ content: `Campaign Created! Reference Id: ${campaign._id}`, ephemeral: true })
}

async function endCampaign(interaction: ChatInputCommandInteraction) {
    const id = interaction.options.getString('id')
    const campaign = await updateCampaign({
        _id: id,
        ended: true
    })

    if (campaign) {
        return await interaction.reply({ content: 'Campaign ended', ephemeral: true })
    }
    await interaction.reply({ content: 'Campaign not found.', ephemeral: true })
}

async function execute(args: string[], message: Message) {
    return await message.reply('The campaign commands can only be used via slash command')
}

module.exports = {
    name: 'campaign',
    execute,
    executeInteraction,
    slashCommand
} as Command