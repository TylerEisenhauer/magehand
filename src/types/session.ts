export default interface Session {
    _id?: string
    cancelled?: boolean
    channel: string
    date: Date
    description: string
    guild: string
    location: string
    messageId?: string
    name: string
    owner: string
    participants?: string[]
    reminderSent?: boolean
}