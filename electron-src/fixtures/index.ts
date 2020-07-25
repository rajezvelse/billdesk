import { Settings } from '../settings';
import { print } from '../utils';
import * as roleFixtures from './roles.fixture';
import * as userFixtures from './users.fixture';

Settings.getConnection().then(async connection => {

    // Load one by one
    await roleFixtures.load(connection);
    await userFixtures.load(connection);

    print('Done');

}).catch(Err => print(Err, 'danger'));