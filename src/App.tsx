import React from "react";
import "./App.css";
import { ThemeProvider } from 'styled-components';

import { IpcRenderer, IpcRendererEvent } from "electron";

import AppTheme from './App.theme';
import RootContext from './root.context';
import { RootContextType } from "./types";
import { Activity } from "./directives";
import { InfoLoading, InfoError, ImagedBackgroundDark } from './styled-components';
import { StylesProvider, MuiThemeProvider } from '@material-ui/core';

class App extends React.Component<any, RootContextType> {
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
			electronIpc: electronIpc,
			userInfo: undefined,
			// {
			// 	"avatar": 1,
			// 	"createdAt": "2020-01-24T10:08:10.000Z",
			// 	"deleted": false,
			// 	"email": "admin@billdesk.com",
			// 	"firstName": "Administrator",
			// 	"id": 2,
			// 	"lastName": null,
			// 	"password": "$2b$10$ij7Jc1whEvlAsFcKhwgOzOLz66W2hZqhQeBnBYUisyvRYtxzx6LFK",
			// 	"phone": null,
			// 	"updatedAt": "2020-01-24T10:08:10.000Z",
			// 	"username": "admin"
			// }
		};
	}

	// Update state value
	setValue = (values: RootContextType, callback?: Function) => {
		this.setState(values, () => {
			if (callback) callback();
		});
	};

	componentDidMount() {
		// Load application preferences
		if (this.state.electronIpc) {
			this.state.electronIpc.on("getPreferencesResponse", (event: IpcRendererEvent, status, response) => {

				if (status === 200) {
					this.setValue({ preferences: response });
				}
			});

			this.state.electronIpc.send("getPreferences");
		}
	}

	render() {
		console.log(AppTheme, this.state)
		return (
			<StylesProvider injectFirst>
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

			</StylesProvider>
		);
	}
}

export default App;
