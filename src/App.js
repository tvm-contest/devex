import { useReducer } from 'react';
// routes
import Router from './routes';
// theme
import ThemeConfig from './theme';
import GlobalStyles from './theme/globalStyles';
// components
import ScrollToTop from './components/ScrollToTop';
import { BaseOptionChartStyle } from './components/charts/BaseOptionChart';
import StoreContext from './store/StoreContext';
import reducer from './store/reducer';
// ----------------------------------------------------------------------

export default function App() {
  const [state, dispatch] = useReducer(reducer, {
    account: {
      displayName: 'Jaydon Frankie',
      email: 'demo@minimals.cc',
      photoURL: '/static/mock-images/avatars/avatar_default.jpg'
    }
  });
  return (
    <StoreContext.Provider value={{ state, dispatch }}>
      <ThemeConfig>
        <ScrollToTop />
        <GlobalStyles />
        <BaseOptionChartStyle />
        <Router />
      </ThemeConfig>
    </StoreContext.Provider>
  );
}
