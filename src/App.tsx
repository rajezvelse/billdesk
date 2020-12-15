import React from "react";
import ReactComponent from './react-component';
import "./App.css";
import { ThemeProvider } from 'styled-components';

import { IpcRenderer, IpcRendererEvent } from "electron";

import AppTheme from './App.theme';
import RootContext from './root.context';
import { RootContextType, RootContextPropsType, HistoryItemType } from "./types";
import { Activity } from "./directives";
import { InfoLoading, InfoError, ImagedBackgroundDark } from './styled-components';
import { StylesProvider, MuiThemeProvider } from '@material-ui/core';
import { SnackbarProvider } from 'notistack';

const defaultHistory: HistoryItemType[] = [
  { name: 'Dashboard', params: {}, title: 'Dashboard' }
];

class App extends ReactComponent<any, RootContextType> {

  constructor(props: any) {
    super(props);

    // Loadin electron renderer, which is used to communicate onto electron server
    let electronIpc: IpcRenderer | null = null;

    if (window.require) {
      try {
        electronIpc = window.require("electron").ipcRenderer;
      } catch (e) {
        console.warn(e);
      }
    } else {
      console.warn("Error loading electron IPC");
    }

    // Define Root context values
    this.state = {
      setValue: this.setValue,
      navigate: this.navigate,
      getPrevHistory: this.getPrevHistory,
      navigateBack: this.navigateBack,
      setLoading: this.setLoading,
      isLoading: this.isLoading,
      electronIpc: electronIpc,
      activeView: defaultHistory[defaultHistory.length - 1],
      history: defaultHistory,
      apiCallsInAction: [],
      userInfo: null

      // userInfo: {
      //   "avatar": 1,
      //   "createdAt": "2020-01-24T10:08:10.000Z",
      //   "deleted": false,
      //   "email": "admin@billdesk.com",
      //   "firstName": "Administrator",
      //   "id": 2,
      //   "lastName": null,
      //   "password": "$2b$10$ij7Jc1whEvlAsFcKhwgOzOLz66W2hZqhQeBnBYUisyvRYtxzx6LFK",
      //   "phone": null,
      //   "updatedAt": "2020-01-24T10:08:10.000Z",
      //   "username": "admin"
      // }
    };
  }

  // Update state value
  setValue = (values: RootContextPropsType, callback?: Function) => {
    this.setState(values as RootContextType, () => {
      if (callback) callback();
    });
  };

  // Navigate to activity
  navigate = (name: string, params: any, title: string, currentState?: any) => {

    if (name === 'Login') {
      this.setState({
        userInfo: null,
        activeView: {
          name: 'Dashboard',
          params: {},
          title: 'Dashboard'
        }
      }); return
    }

    let history: HistoryItemType[] = this.state.history;

    let activeView: any = this.state.activeView;
    activeView.state = currentState || undefined;

    history.push(activeView);

    if (history.length >= 50) history.shift();

    this.setState(
      { activeView: { name, params, title }, history },
      () => { });
  }

  getPrevHistory = (): HistoryItemType | null => {
    return this.state.history.length ? this.state.history[this.state.history.length - 1] : null;
  }

  navigateBack = (currentState?: any) => {

    let history: HistoryItemType[] = this.state.history;
    let last: HistoryItemType | null = history.length ? history[history.length - 1] : null;

    let activeView: any = this.state.activeView;
    activeView.state = currentState || undefined;

    history.push(activeView);

    if (history.length >= 50) history.shift();

    if (last)
      this.setState(
        {
          activeView: {
            name: last.name,
            params: last.params,
            title: last.title,
            prevState: last.state
          }, history
        });
  }

  setLoading = (status: boolean) => {
    let inAction: boolean[] = this.state.apiCallsInAction;

    if (status) inAction.push(true);
    else inAction.shift();

    this.setState({ apiCallsInAction: inAction });
  }

  isLoading = (): boolean => {
    return this.state.apiCallsInAction.length > 0;
  }

  componentDidMount() {
    super.componentDidMount();

    // Load application preferences
    if (this.state.electronIpc) {
      this.state.electronIpc.on("getPreferencesResponse", (event: IpcRendererEvent, status: number, response: any) => {

        if (status === 200) {
          this.setValue({ preferences: response });
        }
      });

      this.state.electronIpc.send("getPreferences");
    }
  }

  render() {
    // console.log(AppTheme, this.state)
    return (
      <StylesProvider injectFirst>
        {/* Info messages */}
        <SnackbarProvider
          maxSnack={3}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}>

          {/* Proving Material UI propperties */}
          <MuiThemeProvider theme={AppTheme}>

            {/* Provinding theme for styled-compoenents */}
            <ThemeProvider theme={AppTheme}>


              <div className="App">
                {!this.state.electronIpc ? (
                  <ImagedBackgroundDark>
                    <InfoError>Oops! IPC is not loaded</InfoError>
                  </ImagedBackgroundDark>
                ) : (
                    <>
                      {!this.state.preferences ? (
                        <ImagedBackgroundDark>
                          <InfoLoading>Loading preferences...</InfoLoading>
                        </ImagedBackgroundDark>
                      ) : (
                          <RootContext.Provider value={this.state}>

                            <Activity name="Main" authenticated props={{}} />

                          </RootContext.Provider>
                        )}
                    </>
                  )}
              </div>
            </ThemeProvider>
          </MuiThemeProvider>

        </SnackbarProvider>
      </StylesProvider>
    );
  }
}

export default App;
