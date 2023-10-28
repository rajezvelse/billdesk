import { DataSource } from "typeorm"


import { Settings } from './settings'

const datasource = new DataSource(Settings.datasoruceConfig)

datasource.initialize();

export default datasource;

