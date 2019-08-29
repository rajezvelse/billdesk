import { Injectable } from '@angular/core';
// import { Connection, createConnection, ConnectionOptions } from 'typeorm';

//--
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  // private readonly options: ConnectionOptions;

  // constructor() {

  //   // Setting typeorm connection options
  //   this.options = {
  //     type: "sqlite",
  //     database: environment.databasePath,
  //     synchronize: true,
  //     logging: false,
  //     entities: [
  //       "src/entity/**/*.ts"
  //     ],
  //     migrations: [
  //       "src/migration/**/*.ts"
  //     ],
  //     subscribers: [
  //       "src/subscriber/**/*.ts"
  //     ],
  //     cli: {
  //       "entitiesDir": "src/entity",
  //       "migrationsDir": "src/migration",
  //       "subscribersDir": "src/subscriber"
  //     }
  //   };
  // }

  // // Create database connection
  // connection(): Promise<Connection> {
  //   return createConnection(this.options);
  // }


}
