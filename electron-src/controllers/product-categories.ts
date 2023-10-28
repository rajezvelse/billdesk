import { ipcMain, IpcMainEvent } from 'electron';
import { Settings } from '../settings';
import { ProductCategory } from '../entity';
import { print } from '../utils';

// List product categories
ipcMain.on('fetchProductCategories', (params?: any) => {

  Settings.getConnection().then(async connection => {
    let productCategoryRepository = connection.getRepository(ProductCategory);

    const productCategories = await productCategoryRepository.find();

    Settings.sendWebContent('fetchProductCategoriesResponse', 200, productCategories);

  }).catch(Err => console.log(Err))

});


// Create new product category
ipcMain.on('addNewProductCategory', (event: IpcMainEvent, { category }) => {

  Settings.getConnection().then(async connection => {

    let productCategoryRepository = connection.getRepository(ProductCategory);

    let productCategory = new ProductCategory();
    productCategory.category = category;

    await productCategoryRepository.save(productCategory);


    Settings.sendWebContent('addNewProductCategoryResponse', 200, productCategory)

  }).catch(Err => print(Err, 'danger'))

});


// Update product category
ipcMain.on('updateProductCategory', (event: IpcMainEvent, { id, category }) => {

  Settings.getConnection().then(async connection => {

    let productCategoryRepository = connection.getRepository(ProductCategory);

    let productCategory = await productCategoryRepository.findOne({ where: { id: id } });

    if (!productCategory) {
      Settings.sendWebContent('updateProductCategoryResponse', 400, 'Product category not found');
      return;
    }

    productCategory.category = category;

    await productCategoryRepository.save(productCategory);

    Settings.sendWebContent('updateProductCategoryResponse', 200, productCategory)

  }).catch(Err => print(Err, 'danger'))

});

// Delete product category
ipcMain.on('deleteProductCategory', (event: IpcMainEvent, { id }) => {

  Settings.getConnection().then(async connection => {

    let productCategoryRepository = connection.getRepository(ProductCategory);

    let productCategory = await productCategoryRepository.findOne({ where: { id: id } });

    if (!productCategory) {
      Settings.sendWebContent('deleteProductCategoryResponse', 400, 'Product category not found');
      return;
    }

    await productCategoryRepository.softDelete(id);

    Settings.sendWebContent('deleteProductCategoryResponse', 200, 'deleted')

  }).catch(Err => print(Err, 'danger'))

});