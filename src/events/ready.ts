import amqp from 'amqplib'
import { Client, Guild, MessageEmbed, TextChannel } from 'discord.js'
import { operation } from 'retry'
import twilio from 'twilio'

import { initializeMageHandClient, updateSession } from '../api/magehand'
import { buildSessionEmbed } from '../helpers/embeds'
import { logger } from '../logger'
import { Session } from '../types'

export default async function ready(client: Client) {
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
    logger.info('Bot Online')
}

async function startQueue(client: Client) {
    const op = operation()

    op.attempt(async (currentAttempt: number) => {
        try {
            logger.debug('Connecting to message queue')
            const conn = await amqp.connect(process.env.QUEUE_CONNECTION)

            logger.debug('Creating channel')
            const channel = await conn.createConfirmChannel()

            logger.debug('Creating queue')
            await channel.assertQueue(process.env.SESSION_QUEUE_NAME, {
                durable: true
            })

            channel.on('close', () => {
                channel.removeAllListeners()
                logger.warn(`Channel closed`)
            })
            channel.on('error', (err) => {
                channel.removeAllListeners()
                logger.error(`Channel Error\n${err}`)
            })

            channel.consume(process.env.SESSION_QUEUE_NAME, async msg => {
                try {
                    const session: Session = JSON.parse(msg.content.toString())
                    const guild: Guild = await client.guilds.fetch(session.guild)
                    if (guild) {
                        const reminderChannel: TextChannel = await guild.channels.fetch(session.channel) as TextChannel
                        if (reminderChannel) {
                            const embed: MessageEmbed = buildSessionEmbed(session)

                            if (!session.messageId) {
                                const message = await reminderChannel.send({
                                    content: 'Session Scheduled, react if you can make it!',
                                    embeds: [embed]
                                })
                                await updateSession({
                                    _id: session._id,
                                    messageId: message.id
                                })
                                await message.react('✅')
                                await message.react('❌')
                            } else {
                                reminderChannel.send({
                                    content: 'Session Reminder',
                                    embeds: [embed]
                                })
                            }
                        }
                    }
                    channel.ack(msg)
                } catch (err) {
                    logger.error(`Error processing message\n${err}`)
                }
            })

            conn.on('close', () => {
                logger.warn(`Connection closed`)
                conn.removeAllListeners()
                setTimeout(() => startQueue(client), 1000)
            })
            conn.on('error', (err) => {
                logger.error(`Connection error\n${err}`)
                conn.removeAllListeners()
                setTimeout(() => startQueue(client), 1000)
            })
            conn.on('blocked', (reason) => { logger.error(`Connection blocked, reason:\n${reason}`) })
            conn.on('unblocked', () => { logger.error(`Connection unblocked`) })

            logger.info('Message queue connection sucessful')
        } catch (error) {
            logger.warn(`Error connecting to queue, retrying`)
            if (!op.retry(error)) {
                logger.error('Max queue connection attempts reached, sending alert')
                const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
                twilioClient.messages.create({
                    body: 'Magehand queue connection failed',
                    from: process.env.TWILIO_FROM_NUMBER,
                    to: process.env.TWILIO_TO_NUMBER
                })
            }
        }
    })
}