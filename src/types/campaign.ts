export default interface Campaign {
    _id?: string
    channel: string
    description: string
    ended?: boolean
    initialSessionNumber?: number
    occurs: {
        daysOfWeek?: number[]
        frequency: 'advanced' | 'weekly'
        time: string,
        timezone: string
        weekNumbers?: number[]
        weeksBetween?: number
    }
    guild: string
    location: string
    name: string
    nextSessionNumber?: number
    owner: string
    scheduledThrough?: Date
    startDate: Date
}