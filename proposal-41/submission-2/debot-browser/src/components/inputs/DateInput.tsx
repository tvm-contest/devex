import { Alert, DatePicker, Layout } from "antd"
import moment from "moment"
import { FC, useState } from "react"
import { CurrentInput, SenderEnum } from "../../common/enums/enums"
import { useAppDispatch, useAppSelector } from "../../common/hooks/hooks"
import { DateTimeParams } from "../../common/types/commonTypes"
import { runDebotFunction } from "../../common/utils/callDebotFunction"
import { getTimestampOfDate } from "../../common/utils/dateTimeHelper"
import { addMessage, setAnswerId, setDateTimeParams, setInput, setInterfaceId } from "../../store/appReducer"

const DateInput: FC<{ dateTimeParams: DateTimeParams }> = ({ dateTimeParams }) => {
    const answerId = useAppSelector(state => state.app.currentAnswerId)
    const interfaceId = useAppSelector(state => state.app.currentInterfaceId)
    const [error, setError] = useState<"info" | "error" | "success" | "warning" | undefined>("info")

    const dispatch = useAppDispatch()

    const onSubmite = (moment: any) => {
        const timestamp = getTimestampOfDate(moment._d)
        if (timestamp >= dateTimeParams.minTime && timestamp <= dateTimeParams.maxTime) {
            runDebotFunction(answerId, interfaceId, { date: timestamp })
            dispatch(addMessage({ messageTitile: moment.format('DD/MM/YYYY'), sender: SenderEnum.me }))
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
                format="YYYY-MM-DD"
                defaultValue={moment.unix(dateTimeParams.defaultTime)}
                showTime={{}}
                onOk={onSubmite}
                onClick={() => setError('info')}
                allowClear={false}
            />
            <Alert className={'date-time-input__info'}
                message={`Select a date in the range from ${moment.unix(dateTimeParams.minTime).format('MM/DD/YYYY')} to ${moment.unix(dateTimeParams.maxTime).format('DD/MM/YYYY')}`} type={error} />
        </Layout>
    )
}

export default DateInput