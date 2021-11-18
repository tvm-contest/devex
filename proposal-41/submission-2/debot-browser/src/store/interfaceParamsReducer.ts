import { ThemeType } from './../common/types/commonTypes';
import { createSlice, PayloadAction } from "@reduxjs/toolkit";


export interface interfaceParams {
    query: string
    debotIcon: string,
    header: {
        show: boolean,
        search: boolean,
        reload: boolean,
        themeToggle: {
            show: boolean,
            default: ThemeType
        }
    },
    styleProps: any,
}

let initialState: interfaceParams = {
    query: '',
    debotIcon: '',
    header: {
        show: true,
        search: true,
        reload: true,
        themeToggle: {
            show: true,
            default: 'LIGHT'
        }
    },
    styleProps: false,
};

export const interfaceParamsSlice = createSlice({
    name: 'app',
    initialState,
    reducers: {
        setTheme: (state, action: PayloadAction<ThemeType>) => {
            state.header.themeToggle.default = action.payload
        },
        setParams: (state, action: PayloadAction<interfaceParams>) => {
            return action.payload
        },
    }
});

export const { setParams, setTheme } = interfaceParamsSlice.actions

export default interfaceParamsSlice.reducer

