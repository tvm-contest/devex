import { Alert, DatePicker, Layout } from 'antd'
import moment from 'moment'
import { FC, useState } from 'react'
import { CurrentInput, SenderEnum } from '../../common/enums/enums'
import { useAppDispatch, useAppSelector } from '../../common/hooks/hooks'
import { DateTimeParams } from '../../common/types/commonTypes'
import { runDebotFunction } from '../../common/utils/callDebotFunction'
import { addMessage, setAnswerId, setDateTimeParams, setInput, setInterfaceId } from '../../store/appReducer'

const DateTimeInput: FC<{ dateTimeParams: DateTimeParams }> = ({ dateTimeParams }) => {

    const answerId = useAppSelector(state => state.app.currentAnswerId)
    const interfaceId = useAppSelector(state => state.app.currentInterfaceId)
    const dispatch = useAppDispatch()
    const [error, setError] = useState<"info" | "error" | "success" | "warning" | undefined>("info")

    const onSubmite = (moment: any) => {
        const timestamp = Math.floor(moment._d.valueOf() / 1000)
        if (timestamp >= dateTimeParams.minTime && timestamp <= dateTimeParams.maxTime) {
            const dateString = moment.format('MM/DD/YYYY HH:mm:ss')
            runDebotFunction(answerId, interfaceId,
                {
                    datetime: timestamp,
                    timeZoneOffset: new Date().getTimezoneOffset()
                }
            )
            dispatch(addMessage({ messageTitile: dateString, sender: SenderEnum.me }))
            dispatch(setInterfaceId(''))
            dispatch(setAnswerId(''))
            dispatch(setDateTimeParams())
            dispatch(setInput(CurrentInput.null))
        } else {
            setError(`error`)
        }

    }


    return (
        <Layout className={'date-time-input'}>
            <DatePicker
                format="YYYY-MM-DD HH:mm:ss"
                defaultValue={moment.unix(dateTimeParams.defaultTime)}
                showTime={{ defaultValue: moment.unix(dateTimeParams.defaultTime) }}
                onOk={onSubmite}
                onClick={() => setError('info')}
                allowClear={false}
            />
            <Alert className={'date-time-input__info'}
                message={`Select a date in the range from ${moment.unix(dateTimeParams.minTime).format('MM/DD/YYYY HH:mm:ss')} to ${moment.unix(dateTimeParams.maxTime).format('DD/MM/YYYY HH:mm:ss')}`} type={error} />
        </Layout>
    )
}

export default DateTimeInput