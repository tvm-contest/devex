import { Layout } from 'antd'
import { FC } from 'react'
import { useAppSelector } from '../../common/hooks/hooks'
import { DateTimeParams } from '../../common/types/commonTypes'
import DateInput from './DateInput'
import DateTimeInput from './DateTimeInput'
import TimeInput from './TimeInput'

const DateTimeInputContainer: FC = () => {

    const dateTimeParams: DateTimeParams = useAppSelector(state => state.app.dateTimeParams)

    const componentSwitcher = () => {
        if (dateTimeParams.inputType === 'DATE') return <DateInput dateTimeParams={dateTimeParams} />
        else if (dateTimeParams.inputType === 'TIME') return <TimeInput dateTimeParams={dateTimeParams} />
        else if (dateTimeParams.inputType === 'DATE_TIME') return <DateTimeInput dateTimeParams={dateTimeParams} />
    }

    return (
        <Layout>
            {componentSwitcher()}
        </Layout>
    )
}

export default DateTimeInputContainer