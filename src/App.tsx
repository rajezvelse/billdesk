import React from "react";
import "./App.css";
import logo from "./logo.svg";

import { ipcRenderer, IpcRenderer, IpcRendererEvent } from "electron";

import { RootContext, RootContextType } from "./contexts";

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
			electronIpc: electronIpc
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
				console.log(status, response);
				if (status === 200) {
					this.setValue({ preferences: response });
				}
			});

			this.state.electronIpc.send("getPreferences");
		}
	}

	render() {
		return (
			<div className="App">
				{!this.state.electronIpc ? (
					<div>Oops! IPC is not loaded...</div>
				) : (
					<>
						{!this.state.preferences ? (
							<div>Loading preferences...</div>
						) : (
							<RootContext.Provider value={this.state}>
								<header className="App-header">
									<img src={logo} className="App-logo" alt="logo" />
									<p>Welcome</p>
								</header>
							</RootContext.Provider>
						)}
					</>
				)}
			</div>
		);
	}
}

export default App;
