export const getTimestampOfDate = (date: Date) => {
    const newDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    return newDate.valueOf() / 1000
}

export const getTimestampOfTime = (date: Date) => {
    const newDate = new Date(1970, 0, 1, date.getHours(), date.getMinutes(), date.getSeconds())
    return newDate.valueOf() / 1000
}

export const getDateString = (moment: any) => {
    return moment.format('MM/DD/YYYY HH:mm:ss')
}