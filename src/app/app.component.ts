import { Component, OnInit, NgZone } from '@angular/core';
import { IpcRendererEvent } from 'electron';
import { ElectronIpcService } from '@app/services';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  users: Object[] = [];

  constructor(private electronIpc: ElectronIpcService, public zone: NgZone) { }

  ngOnInit() {

    setInterval(() => this.electronIpc.send('fetchUsers'), 3000);

    this.electronIpc.on('fetchUsersResponse', (event: IpcRendererEvent, ...args) => {
      this.zone.run(() => this.users = args[0]);
    });

  }

}
