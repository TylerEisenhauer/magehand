import { Client } from 'discord.js'
import { initializeMageHandClient } from '../api/magehand'

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
    console.log('Bot Online')
}