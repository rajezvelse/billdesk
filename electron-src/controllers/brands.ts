import { ipcMain, IpcMainEvent } from 'electron';
import { Settings } from '../settings';
import { Brand } from '../entity';
import { print } from '../utils';

// List brands
ipcMain.on('fetchBrands', (params?: any) => {

  Settings.getConnection().then(async connection => {
    let brandRepository = connection.getRepository(Brand);

    const brands = await brandRepository.find();

    Settings.sendWebContent('fetchBrandsResponse', 200, brands);

  }).catch(Err => console.log(Err))

});


// Create new brand
ipcMain.on('addNewBrand', (event: IpcMainEvent, { name }) => {

  Settings.getConnection().then(async connection => {

    let brandRepository = connection.getRepository(Brand);

    let brand = new Brand();
    brand.name = name;

    await brandRepository.save(brand);


    Settings.sendWebContent('addNewBrandResponse', 200, brand)

  }).catch(Err => print(Err, 'danger'))

});


// Update brand
ipcMain.on('updateBrand', (event: IpcMainEvent, { id, name }) => {

  Settings.getConnection().then(async connection => {

    let brandRepository = connection.getRepository(Brand);

    let brand = await brandRepository.findOne({ id: id });

    if (!brand) {
        Settings.sendWebContent('updateBrandResponse', 400, 'Brand not found');
        return;
    }

    brand.name = name;

    await brandRepository.save(brand);

    Settings.sendWebContent('updateBrandResponse', 200, brand)

  }).catch(Err => print(Err, 'danger'))

});

// Delete brand
ipcMain.on('deleteBrand', (event: IpcMainEvent, { id }) => {

  Settings.getConnection().then(async connection => {

    let brandRepository = connection.getRepository(Brand);

    let brand = await brandRepository.findOne({ id: id });

    if (!brand) {
        Settings.sendWebContent('deleteBrandResponse', 400, 'Brand not found');
        return;
    }

    await brandRepository.softDelete({ id: id });

    Settings.sendWebContent('deleteBrandResponse', 200, 'deleted')

  }).catch(Err => print(Err, 'danger'))

});