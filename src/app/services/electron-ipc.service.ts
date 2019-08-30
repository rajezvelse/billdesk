import { Injectable } from '@angular/core';
import { ipcRenderer, IpcRenderer, IpcRendererEvent } from 'electron';


@Injectable({
  providedIn: 'root'
})
export class ElectronIpcService {
  private _ipc: IpcRenderer | undefined = void 0;

  constructor() {
    if ((<any>window).require) {
      try {
        this._ipc = (<any>window).require('electron').ipcRenderer;
      } catch (e) {
        throw e;
      }
    } else {
      console.warn('Electron\'s IPC was not loaded');
    }
  }

  public on(channel: string, listener: (IpcRendererEvent, ...args) => void): void {
    if (!this._ipc) {
      return;
    }
    this._ipc.on(channel, listener);
  }

  public send(channel: string, ...args): void {
    if (!this._ipc) {
      return;
    }
    this._ipc.send(channel, ...args);
  }
}
