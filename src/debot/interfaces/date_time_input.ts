import { DATE_TIME_INPUT_ABI } from '../ABIs';
import tonClientController from "../../common/utils/tonClient"
import decodeString from '../../common/utils/decodeString';
import { DateTimeParams, MessageType } from '../../common/types/commonTypes';
import { CurrentInput, SenderEnum } from '../../common/enums/enums';
import { store } from '../../store/store';
import { addMessage, setAnswerId, setDateTimeParams, setInput, setInterfaceId } from '../../store/appReducer';
import { runDebotFunction } from '../../common/utils/callDebotFunction';

const ID = '4e862a9df81183ab425bdf0fbd76bd0b558c7f44c24887b4354bf1c26c74a623';

class DateTimeInput {
	id: string
	abi: any
	constructor() {
		this.id = ID;
		this.abi = DATE_TIME_INPUT_ABI;
	}

	getTime(params: any) {
		const { answerId, prompt, defaultTime, minTime, maxTime, minuteInterval } = params.value;

		const decodedPrompt = decodeString(prompt);

		const debotMessage: MessageType = {
			messageTitile: decodedPrompt,
			sender: SenderEnum.debot
		};

		const dateTimeParams: DateTimeParams = {
			defaultTime,
			maxTime,
			minTime,
			minuteInterval,
			inputType: 'TIME'
		}

		store.dispatch(setAnswerId(answerId))
		store.dispatch(addMessage(debotMessage))
		store.dispatch(setInterfaceId(this.id))
		store.dispatch(setInput(CurrentInput.dateTimeInput))
		store.dispatch(setDateTimeParams(dateTimeParams))
	}

	getDate(params: any) {
		const { answerId, prompt, defaultDate, minDate, maxDate } = params.value;

		const decodedPrompt = decodeString(prompt);

		const debotMessage: MessageType = {
			messageTitile: decodedPrompt,
			sender: SenderEnum.debot
		};

		const dateTimeParams: DateTimeParams = {
			defaultTime: defaultDate,
			maxTime: maxDate,
			minTime: minDate,
			minuteInterval: 0,
			inputType: 'DATE'
		}

		store.dispatch(setDateTimeParams(dateTimeParams))
		store.dispatch(setAnswerId(answerId))
		store.dispatch(addMessage(debotMessage))
		store.dispatch(setInterfaceId(this.id))
		store.dispatch(setInput(CurrentInput.dateTimeInput))
	}

	getDateTime(params: any) {
		const { answerId, prompt, defaultDatetime, minDatetime, maxDatetime, minuteInterval, inTimeZoneOffset } = params.value;

		const decodedPrompt = decodeString(prompt);

		const debotMessage: MessageType = {
			messageTitile: decodedPrompt,
			sender: SenderEnum.debot
		};


		const dateTimeParams: DateTimeParams = {
			defaultTime: parseInt(defaultDatetime),
			maxTime: parseInt(maxDatetime),
			minTime: parseInt(minDatetime),
			minuteInterval: parseInt(minuteInterval),
			inTimeZoneOffset: parseInt(inTimeZoneOffset),
			inputType: 'DATE_TIME'
		}

		store.dispatch(setDateTimeParams(dateTimeParams))
		store.dispatch(setAnswerId(answerId))
		store.dispatch(addMessage(debotMessage))
		store.dispatch(setInput(CurrentInput.dateTimeInput))
		store.dispatch(setInterfaceId(this.id))
	}
	getTimeZoneOffset(params: any) {
		const { answerId } = params.value;
		runDebotFunction(answerId, this.id, { timeZoneOffset: new Date().getTimezoneOffset() })


	}

	async call(params: any) {
		try {
			const decodedMessage = await tonClientController.client.abi.decode_message({
				abi: {
					type: 'Contract',
					value: this.abi,
				},
				message: params.message,
			});

			const extendedParams = {
				...params,
				...decodedMessage,
			}

			switch (decodedMessage.name) {
				case 'getTime':
					return this.getTime(extendedParams);
				case 'getDate':
					return this.getDate(extendedParams);
				case 'getDateTime':
					return this.getDateTime(extendedParams);
				case 'getTimeZoneOffset':
					return this.getTimeZoneOffset(extendedParams);

				default:
					throw new Error(`Function does not exist on interface: ${this.constructor.name}`);
			}
		} catch (err) {
			console.error('Interface execution failed: ', err);
		}
	}
}

export default DateTimeInput;
