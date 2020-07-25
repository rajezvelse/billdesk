
import { createMuiTheme, responsiveFontSizes } from '@material-ui/core/styles';
import { ThemeOptions } from '@material-ui/core/styles/createMuiTheme';

let AppTheme = createMuiTheme({
  palette: {
    primary: {
      main: '#4286F7'
    },
    background: {
      paper: '#f4f4f4'
    }
  },
  font: {
    info: '5rem',
    small: '0.8rem'
  }
} as ThemeOptions);
AppTheme = responsiveFontSizes(AppTheme);

export default AppTheme;