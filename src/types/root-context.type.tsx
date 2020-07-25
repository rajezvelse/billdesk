import { IpcRenderer } from "electron";

export interface RootContextType {
	setValue?: Function;
	electronIpc?: IpcRenderer | null;
	preferences?: { [s: string]: any };
	userInfo?: { [s: string]: any };
}
