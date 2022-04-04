import amqp from 'amqplib'
import { Client, Guild, MessageEmbed, TextChannel } from 'discord.js'

import { initializeMageHandClient } from '../api/magehand'
import { Session } from '../types/session'

export async function ready(client: Client) {
    await initializeMageHandClient()
    client.user.setPresence({
        status: 'online',
        activities: [
            {
                name: 'Dungeons and Dragons',
                type: 'PLAYING'
            }
        ]
    })
    startQueue(client)
    console.log('Bot Online')
}

async function startQueue(client: Client) {
    try {
        const conn = await amqp.connect(process.env.QUEUE_CONNECTION)

        const channel = await conn.createConfirmChannel()

        await channel.assertQueue(process.env.SESSION_QUEUE_NAME, {
            durable: true
        })

        channel.consume(process.env.SESSION_QUEUE_NAME, async msg => {
            const session: Session = JSON.parse(msg.content.toString())
            const guild: Guild = await client.guilds.fetch(session.guild)
            if (guild) {
                const reminderChannel: TextChannel = await guild.channels.fetch(session.channel) as TextChannel
                if (reminderChannel) {
                    const mentions: string = session.participants.reduce((x, y,) => {
                        return x + `<@${y}> `
                    }, '')

                    const embed: MessageEmbed = new MessageEmbed()
                        .setColor(3447003)
                        .setAuthor({
                            name: `${session.name}`
                        })
                        .setDescription(session.description)
                        .addFields(
                            { name: 'Players Signed Up', value: mentions ? mentions : 'No players signed up' },
                            { name: 'Location', value: session.location, inline: true },
                            { name: 'Time', value: `<t:${+new Date(session.date) / 1000}:f>`, inline: true }
                        )
                        .setFooter({ text: `Session id | ${session._id}` })

                    reminderChannel.send({
                        content: 'Session Reminder',
                        embeds: [embed]
                    })
                }
            }
            channel.ack(msg)
        })

        conn.on('close', () => setTimeout(() => startQueue(client), 1000))
    } catch (e) {
        console.log(e)
    }
}