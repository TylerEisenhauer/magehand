import {Message} from 'discord.js'

export async function ping(message: Message) {
    return await message.channel.send('pong')
}