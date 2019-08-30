import { ConnectionOptions } from 'typeorm';
import { app } from 'electron';
import * as path from 'path';

export const ormConfig: ConnectionOptions = {
    "type": "sqlite",
    "database": path.join(app.getPath('userData'), 'storage', 'db.billdesk.sqlite'),
    "synchronize": true,
    "logging": false,
    "entities": [
        "out-tsc/electron/entity/**/*"
    ],
    "migrations": [
        "out-tsc/electron/migration/**/*"
    ],
    "subscribers": [
        "out-tsc/electron/subscriber/**/*"
    ],
    "cli": {
        "entitiesDir": "out-tsc/electron/entity",
        "migrationsDir": "out-tsc/electron/migration",
        "subscribersDir": "out-tsc/electron/subscriber"
    }
}