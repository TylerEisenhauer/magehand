import amqp from 'amqplib'
import { Client, Guild, MessageEmbed, TextChannel } from 'discord.js'
import { operation } from 'retry'

import { initializeMageHandClient } from '../api/magehand'
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

                            reminderChannel.send({
                                content: 'Session Reminder',
                                embeds: [embed]
                            })
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
            if (op.retry(error)) {
                // max retires reach, alert somehow???
            }
        }
    })
}