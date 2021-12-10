import { Alert, Layout, TimePicker } from 'antd'
import moment from 'moment'
import { FC, useState } from 'react'
import { CurrentInput, SenderEnum } from '../../common/enums/enums'
import { useAppDispatch, useAppSelector } from '../../common/hooks/hooks'
import { DateTimeParams } from '../../common/types/commonTypes'
import { runDebotFunction } from '../../common/utils/callDebotFunction'
import { getTimestampOfTime } from '../../common/utils/dateTimeHelper'
import { addMessage, setAnswerId, setDateTimeParams, setInput, setInterfaceId } from '../../store/appReducer'

const TimeInput: FC<{ dateTimeParams: DateTimeParams }> = ({ dateTimeParams }) => {
    const answerId = useAppSelector(state => state.app.currentAnswerId)
    const interfaceId = useAppSelector(state => state.app.currentInterfaceId)
    const [error, setError] = useState<"info" | "error" | "success" | "warning" | undefined>("info")
    const dispatch = useAppDispatch()

    const onSubmite = (moment: any) => {
        const timestamp = getTimestampOfTime(moment._d)
        if (timestamp >= dateTimeParams.minTime && timestamp <= dateTimeParams.maxTime) {
            runDebotFunction(answerId, interfaceId, { time: timestamp })
            dispatch(addMessage({ messageTitile: moment.format('HH:mm:ss'), sender: SenderEnum.me }))
            dispatch(setInterfaceId(''))
            dispatch(setAnswerId(''))
            dispatch(setDateTimeParams())
            dispatch(setInput(CurrentInput.null))
        } else {
            setError('error')
        }

    }

    return (
        <Layout className={'date-time-input'}>
            <TimePicker
                defaultValue={moment.unix(dateTimeParams.defaultTime)}
                onOk={onSubmite}
            />
            <Alert className={'date-time-input__info'}
                message={`Select a date in the range from ${moment.unix(dateTimeParams.minTime).format('MM/DD/YYYY HH:mm:ss')} to ${moment.unix(dateTimeParams.maxTime).format('DD/MM/YYYY HH:mm:ss')}`} type={error} />
        </Layout>
    )
}

export default TimeInput