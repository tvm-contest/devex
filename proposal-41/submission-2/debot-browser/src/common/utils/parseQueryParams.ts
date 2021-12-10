import { setAvailableNetworks } from "../../store/appReducer"
import { interfaceParams, setParams } from "../../store/interfaceParamsReducer"
import { store } from "../../store/store"

const strToBool = (str: string | null) => {
    if (str === '1') return true
    else return false
}

export const parseConfig = (config: any, query = '') => {
    const { debotIcon, header, styleProps, availableNetworks } = config

    const interfaceProps: interfaceParams = {
        query,
        debotIcon: '',
        header: {
            reload: true,
            search: true,
            show: true,
            themeToggle: {
                show: true,
                default: 'LIGHT'
            }
        },
        styleProps: false
    }

    if (availableNetworks.length) {
        store.dispatch(setAvailableNetworks(availableNetworks))
    }

    if (debotIcon) interfaceProps.debotIcon = debotIcon
    if (header) {
        if (header.show) interfaceProps.header.show = strToBool(header.show)
        if (header.search) interfaceProps.header.search = strToBool(header.search)
        if (header.reload) interfaceProps.header.reload = strToBool(header.reload)
        if (header.themeToggle.show) interfaceProps.header.themeToggle.show = strToBool(header.themeToggle.show)
        if (header.themeToggle.default) interfaceProps.header.themeToggle.default = header.themeToggle.default
    }
    if (styleProps) {
        const rules: any = [];
        for (var i in styleProps) {
            var rule = `.${i}{`;
            for (var j in styleProps[i]) {
                rule += `${j}:${styleProps[i][j]};`;
            }
            rule += '}';
            rules.push(rule);
        }

        const injectedStyles = document.createElement('style');
        injectedStyles.setAttribute('type', 'text/css');
        injectedStyles.innerHTML = rules.join('');

        document.head.appendChild(injectedStyles);
    }

    store.dispatch(setParams(interfaceProps))
}

export const parseQueryParams = (params: string) => {
    if (params) {
        const configJson = new URLSearchParams(params).get("params")
        if (configJson) {
            const config = JSON.parse(configJson)
            if (config) {
                parseConfig(config, params)
            } else {
                return false
            }
        } else {
            return false
        }
    } else {
        return false
    }
}