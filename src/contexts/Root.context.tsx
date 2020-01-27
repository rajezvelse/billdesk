import React from "react";
import { IpcRenderer } from "electron";

export const RootContext = React.createContext({});

export interface RootContextType {
	electronIpc?: IpcRenderer | null;
	preferences?: Object;
}
