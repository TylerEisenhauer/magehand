import { Client, Collection } from 'discord.js'
import { Command } from '.'

export default interface ExtendedClient extends Client {
    commands?: Collection<string, Command>
}