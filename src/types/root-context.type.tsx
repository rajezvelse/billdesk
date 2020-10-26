import { IpcRenderer } from "electron";
import ObjectType from './object.type';
import HistoryItemType from './history-item.type';

export interface RootContextType {
  setValue: Function;
  navigate: Function;
  getPrevHistory: Function;
  navigateBack: Function;
	electronIpc: IpcRenderer | null;
	preferences?: { [s: string]: any };
  userInfo: { [s: string]: any } | null;
  activeView: { name: string; params: any; title: string; prevState?: any; }
  history: Array<HistoryItemType>;
  apiCallsInAction: boolean[];
  setLoading: Function;
  isLoading: Function;
}
