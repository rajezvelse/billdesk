import "reflect-metadata";
import { createConnection, Connection } from "typeorm";
import { ormConfig } from './orm.config';
import 'sqlite3';


// Creating new database connection
export function getConnection(): Promise<Connection> {

    return createConnection(ormConfig);

}