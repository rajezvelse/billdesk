
import { createTheme, responsiveFontSizes, ThemeOptions } from '@material-ui/core/styles';

let AppTheme = createTheme({
  viewport: {
    screenHeight: window.screen.height,
    screenWidth: window.screen.width,
    pageContainerHeight: (window.screen.height - 255),
    pageContainerWidth: (window.screen.width - 62)
  },
  palette: {
    primary: {
      main: '#4286F7',
      light: '#def1fb'
    },
    background: {
      paper: '#fff',
      dropdownHover: '#f1f1f1'
    }
  },
  font: {
    info: '5rem',
    small: '0.8rem',
    smaller: '0.7rem'
  }
} as ThemeOptions);
AppTheme = responsiveFontSizes(AppTheme);

export default AppTheme;