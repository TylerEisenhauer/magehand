export interface Session {
    _id: string
    cancelled: boolean
    channel: string
    date: Date
    description: string
    guild: string
    location: string
    name: string
    participants: string[]
    reminderSent: boolean
}