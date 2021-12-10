import './index.sass'
import dEngine from '../DEngine'
import { FC, useEffect, useState } from 'react';
import BrowserWindow from '../components/browser/Browser';
import { useAppDispatch, useAppSelector } from '../common/hooks/hooks';
import { runDebot } from '../store/appReducer';
import { ThemeType, UrlParamsType } from '../common/types/commonTypes';
import { useHistory, useLocation, useParams } from "react-router-dom";
import checkIsValidAddress from '../common/utils/checkIsValidAddress';
import { Layout } from 'antd';
import { Content, Header } from 'antd/lib/layout/layout';
import checkIsValidNetwork from '../common/utils/checkIsValidNetwork';
import InitializationModal from '../components/initializationModal/InitializationModal';
import logoSwitcher from '../common/utils/logoSwitcher';
import classNames from 'classnames';
import SearchIcon from '../components/icons/Search';
import RefreshIcon from '../components/icons/Refresh';
import { setTheme } from '../store/interfaceParamsReducer';
import LightThemeIcon from '../components/icons/LightThemeIcon';
import DarkThemeIcon from '../components/icons/DarkThemeIcon';
import config from "../config.json"
import { parseConfig, parseQueryParams } from '../common/utils/parseQueryParams';

const Browser: FC<{ theme: ThemeType | null }> = ({ theme }) => {
  const debotInfo = useAppSelector(state => state.app.debotInfo)
  const initialData = useAppSelector(state => state.app.initialData)
  const availableNetworks = useAppSelector(state => state.app.availableNetworks)
  const { header, debotIcon } = useAppSelector(state => state.interfaceParams)
  const dispatch = useAppDispatch()
  const [isModalVisible, setIsModalVisible] = useState(false);

  const history = useHistory()
  const location = useLocation()
  const { addr, network } = useParams<UrlParamsType>()

  useEffect(() => {
    if (location.search || addr || network) {
      console.log('parseQueryParams')
      parseQueryParams(location.search)
    } else {
      console.log('parseConfig')
      parseConfig(config)
    }
  }, [location.search, config, addr, network])

  useEffect(() => {
    const debotAddr = addr || config.defaultDebotAddress
    //@ts-ignore
    const debotNetwork = network || config.defaultDebotNetwork.name
    if (debotNetwork && debotAddr && initialData.debotAddr !== debotAddr) {
      const validNetwork = availableNetworks.find(el => el.name === debotNetwork.toUpperCase())
      if (validNetwork) {
        checkIsValidAddress(debotAddr).then(isValidAddress => {
          if (isValidAddress) {
            dispatch(runDebot({ debotAddr, debotNetwork: validNetwork }))
            setIsModalVisible(false)
          } else {
            history.push('/')
            setIsModalVisible(true)
          }
        })
      } else {
        history.push('/')
        setIsModalVisible(true)
      }
    } else {
      history.push('/')
      setIsModalVisible(true)
    }
  }, [addr, network])

  const reloadDebot = () => {
    if (initialData.debotAddr) {
      dEngine.reloadDebot(initialData.debotAddr)
    } else {
      setIsModalVisible(true)
    }
  }

  const toggleTheme = () => {
    if (theme === 'DARK') {
      dispatch(setTheme('LIGHT'))
    } else if (theme === 'LIGHT') {
      dispatch(setTheme('DARK'))
    }
  }

  const themeIconSwitcher = () => {
    if (theme === 'DARK') {
      return <LightThemeIcon />
    } else if (theme === 'LIGHT') {
      return <DarkThemeIcon />
    }
  }

  return (
    <>
      <InitializationModal
        theme={theme}
        isModalVisible={isModalVisible}
        setIsModalVisible={setIsModalVisible} />
      <Layout className={classNames('app')}>
        {header.show &&
          <Header className={'header'}  >
            <div className={'debot-info'}>
              <img className={'debot-info__network-logo'} src={debotIcon || debotInfo?.icon || logoSwitcher(initialData.debotNetwork.name)} alt="" />
              <span className={'debot-info__debot-name'}>{debotInfo?.name}</span>
            </div>
            {(header.reload || header.search || header.themeToggle.show) &&
              <div className={'control-panel'}>
                {header.search &&
                  <div
                    className={classNames('control-panel__search-debot', 'control-panel__control-btn')}
                    onClick={() => setIsModalVisible(true)}
                  >
                    <SearchIcon />
                  </div>
                }
                {header.reload &&
                  <div
                    className={classNames('control-panel__reload-debot', 'control-panel__control-btn')}
                    onClick={reloadDebot}
                  >
                    <RefreshIcon />
                  </div>
                }
                {header.themeToggle.show &&
                  theme !== 'CUSTOM' && <div
                    className={classNames('control-panel__toggle-theme', 'control-panel__control-btn')}
                    onClick={toggleTheme}>
                    {themeIconSwitcher()}
                  </div>
                }
              </div>
            }
          </Header>
        }

        <Content>
          <BrowserWindow />
        </Content>
      </Layout>
    </>
  )
}

export default Browser