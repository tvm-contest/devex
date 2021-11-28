// routes
import Router from './routes';
// theme
import ThemeConfig from './theme';
import GlobalStyles from './theme/globalStyles';
// components
import ScrollToTop from './components/ScrollToTop';
import { BaseOptionChartStyle } from './components/charts/BaseOptionChart';

import CreateReducer from './store/CreateReducer';
import StoreContext from './store/StoreContext';

// ----------------------------------------------------------------------

export default function App() {
  const [state, dispatch] = CreateReducer();
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
