import { Alert, Button, Dropdown, Input, Layout, Menu, Modal } from "antd"
import { CSSProperties, FC, useEffect, useState } from "react"
import { useHistory } from "react-router"
import checkIsValidAddress from "../../common/utils/checkIsValidAddress"
import { DownOutlined } from '@ant-design/icons';
import local from '../../assets/local.png'
import crystal from '../../assets/crystal.png'
import ruby from '../../assets/ruby.png'
import clientController, { NetworksType, NetworksUrlType } from "../../common/utils/tonClient";
import { getNetworkUrl } from "../../common/utils/checkIsValidNetwork";
import dEngine from "../../DEngine";
import { ThemeType } from "../../common/types/commonTypes";
import { useAppDispatch, useAppSelector } from "../../common/hooks/hooks";
import { NetType, setCurrentNetwork } from "../../store/appReducer";

type PropsType = {
    isModalVisible: boolean
    setIsModalVisible: (flag: boolean) => void
    theme: ThemeType | null
}

const InitializationModal: FC<PropsType> = ({ isModalVisible, setIsModalVisible, theme }) => {
    const [inputValue, setInputValue] = useState('')
    const [error, setError] = useState('')
    const history = useHistory()
    const [network, setNetwork] = useState<NetworksUrlType>('https://main.ton.dev')
    const currentNetwork = useAppSelector(state => state.app.currentNetwork)
    const dispatch = useAppDispatch()
    const availableNetworks = useAppSelector(state => state.app.availableNetworks)
    const query = useAppSelector(state => state.interfaceParams.query)

    const [modalMaskVar, setModalMaskVar] = useState('');

    const networkNameSwitcher = () => {
        const network1 = availableNetworks.find(el => el.url === network)
        return network1?.name as NetworksType
    }

    useEffect(() => {
        const bodyElement = document.querySelector('#root>div')
        if (bodyElement) {
            const value = getComputedStyle(bodyElement).getPropertyValue('--modal-bg-color');
            setModalMaskVar(value);
        }
    }, [theme]);

    const validateAddress = async () => {
        try {
            const isValidAddress = await checkIsValidAddress(inputValue)
            if (!isValidAddress) {
                setError("invalid address format, please re-enter")
            }
            return isValidAddress
        } catch (error) {
            console.error(error)
            return false
        }
    }

    const onSubmite = async () => {
        const isValid = await validateAddress()
        if (isValid) {
            let debotAddr = inputValue
            if (debotAddr.length === 64) {
                debotAddr = `0:${debotAddr}`
            }
            clientController.setSelectedNetwork(network)
            const initDebotParams = await dEngine.initDebot(debotAddr)
            if (initDebotParams) {
                setIsModalVisible(false)
                dispatch(setCurrentNetwork(network))
                history.push(`/${debotAddr}/${networkNameSwitcher().toLowerCase()}${query ? query : ''}`)
            } else {
                clientController.setSelectedNetwork(currentNetwork)
            }
        } else {
            setError("invalid address format, please re-enter")
        }
    }

    const handleMenuClick = (e: any) => {
        const network1 = availableNetworks.find(el => el.name === e.key)
        if (network1) {
            setNetwork(network1?.url)
            clientController.setSelectedNetwork(network1?.url)
        }

    }

    const iconSwitcher = (name: string) => {
        if (name === 'MAINNET') {
            return <img src={crystal} alt="" />
        } else if (name === 'DEVNET') {
            return <img src={ruby} alt="" />
        } else {
            return <img src={local} alt="" />
        }
    }

    const menu = (
        <Menu onClick={handleMenuClick} defaultSelectedKeys={[network]} title={network}>
            {availableNetworks.map(el => (
                <Menu.Item key={el.name} icon={iconSwitcher(el.name)}>
                    {el.name}
                </Menu.Item>
            ))}
        </Menu>
    );
    return (
        <Layout>
            <Modal title="Select a DeBot" visible={isModalVisible} className={theme ? theme : ''}
                onOk={onSubmite} onCancel={() => setIsModalVisible(false)} footer={[
                    <Button onClick={onSubmite} key="btn" type='primary'>
                        Go to
                    </Button>,
                ]}
                maskStyle={{
                    '--modal-bg-color': modalMaskVar,
                } as CSSProperties}
            >
                <div className={'initialize-modal__addr'}>
                    <Input
                        className={'initialize-modal__addr_input'}
                        placeholder={'Enter DeBot address'}
                        onChange={(e) => setInputValue(e.target.value)}
                        onBlur={validateAddress}
                        onFocus={(e) => {
                            setError('')
                            e.target.select()
                        }}
                    />
                    <Alert
                        message={error}
                        type="error"
                        className={error ? 'initialize-modal__error-open' : 'initialize-modal__error-close'}
                        style={{ padding: '5px 15px' }} />
                </div>
                <Dropdown overlay={menu} className={'initialize-modal__network-dropdown'}>
                    <Button type='ghost'>
                        {networkNameSwitcher()} <DownOutlined />
                    </Button>
                </Dropdown>
            </Modal>
        </Layout>
    )
}

export default InitializationModal