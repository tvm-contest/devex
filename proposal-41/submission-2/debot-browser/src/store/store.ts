

import { configureStore } from '@reduxjs/toolkit'
import appReducer from './appReducer'
import interfaceParamsReducer from './interfaceParamsReducer'
// ...

export const store = configureStore({
    reducer: {
        app: appReducer,
        interfaceParams: interfaceParamsReducer
    },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch