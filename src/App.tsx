import React from 'react';
import './App.css';

import { ipcRenderer, IpcRenderer, IpcRendererEvent } from 'electron';

import { RootContext } from './contexts';

const App: React.FC = () => {

  if (!(window).require) {
    return <div>IPC was not loaded</div>;
  }

  try {
    let _ipc = (window).require('electron').ipcRenderer;
  } catch (e) {
    console.warn(e);
  }

  return (
    <div className="App">
      <RootContext.Provider value={{}} />
    </div>
  );
}

export default App;
