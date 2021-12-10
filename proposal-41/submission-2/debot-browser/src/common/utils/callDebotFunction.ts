import dEngine from "../../DEngine";
import { store } from "../../store/store";

export const runDebotFunction = async (functionId: string, interfaceId: string, input: any) => {
    try {
        const debotAddr = store.getState().app.currentDebotAddr
        await dEngine.callDebotFunction(debotAddr, interfaceId, functionId, input)
    } catch (err) {
        console.error(err);
    }
};