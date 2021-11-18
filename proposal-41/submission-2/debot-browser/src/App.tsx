

import { FC } from 'react';
import { Route, Switch } from 'react-router-dom';
import Browser from './routes';
import { useAppSelector } from './common/hooks/hooks';
import { interfaceParams } from './store/interfaceParamsReducer';
import './index.sass';

interface IProps extends interfaceParams {
  defaultDebotAddress: string;
  defaultDebotNetwork: string;
  availableNetworks: string[];
  debotIcon: string;
}

const App: FC<Partial<IProps>> = (props) => {
  const theme = useAppSelector(state => state.interfaceParams.header.themeToggle.default)

  return (
    <>
      <div className={theme ? theme : ''}>
        <Switch>
          <Route path={'/:addr/:network'} children={<Browser theme={theme} />} />
          <Route path={'/'} children={<Browser theme={theme} />} />
        </Switch>
      </div>
    </>
  )
}

export default App