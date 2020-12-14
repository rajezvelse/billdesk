import { ipcMain, IpcMainEvent, BrowserWindow } from 'electron';
import { Settings } from '../settings';
import { Product, Brand, ProductCategory } from '../entity';
import { Like, Brackets } from 'typeorm';
import { print } from '../utils';

ipcMain.on('fetchProducts', (event: IpcMainEvent, { pageLimit, pageNumber, orderBy, order, brandId, categoryId, searchText }) => {

  Settings.getConnection().then(async connection => {
    try {
      if (!pageLimit) pageLimit = 20;
      if (!pageNumber) pageNumber = 1;
      if(!orderBy) orderBy = 'name';
      if(!order) order = 'asc';

      let productRepository = connection.getRepository(Product);

      let countQuery = productRepository.createQueryBuilder('p')
        .select(['count(p.id) as count']);

      let query = productRepository.createQueryBuilder('p')
        .select(['p.id, p.name, p.price, b.id as brand, b.name as brandName, c.id as category, c.category as categoryName']);

      countQuery = countQuery.leftJoin('brand', 'b', 'b.id=p.brand')
        .leftJoin('product_category', 'c', 'c.id=p.category');

      query = query.leftJoin('brand', 'b', 'b.id=p.brand')
        .leftJoin('product_category', 'c', 'c.id=p.category');

      let filterApplied = false;

      if (brandId) {

        countQuery = countQuery.where(`b.id = ${brandId}`);

        query = query.where(`b.id = ${brandId}`);
        filterApplied = true;
      }

      if (categoryId) {
        if (filterApplied) {
          countQuery = countQuery.andWhere(`c.id = ${categoryId}`);
          query = query.andWhere(`c.id = ${categoryId}`);
        }
        else {
          countQuery = countQuery.andWhere(`c.id = ${categoryId}`);
          query = query.where(`c.id = ${categoryId}`);
        }

        filterApplied = true;
      }

      if (searchText) {
        let sQ = new Brackets(qb => {

          searchText.split(" ").forEach((str: any, index: any) => {

            if (index == 0) qb.where(`p.name LIKE '%${str}%'`);
            else qb.orWhere(`p.name LIKE '%${str}%'`);

            qb.orWhere(`b.name LIKE '%${str}%'`)
              .orWhere(`c.category LIKE '%${str}%'`)
              .orWhere(`p.price LIKE '%${str}%'`);

          });
        });

        if (filterApplied) {
          countQuery = countQuery.andWhere(sQ);
          query = query.andWhere(sQ);
        }
        else {
          countQuery = countQuery.where(sQ);
          query = query.where(sQ);
        }

        filterApplied = true;
      }


      // Total records count
      const countProducts = await countQuery.getRawMany();
      let totalRecords = countProducts[0]['count'];
      let totalPages = Math.ceil(totalRecords / pageLimit);

      // Sorting
      let orderByFields: any = {
        name: 'p.name',
        brandName: 'b.name',
        price: 'p.price',
        categoryName: 'c.category'
      }
      query = query.orderBy(orderByFields[orderBy], order.toUpperCase());

      // Pagination
      let offset = (pageNumber * pageLimit) - pageLimit;
      query = query.offset(offset).limit(pageLimit);

      const records = await query.getRawMany();

      Settings.sendWebContent('fetchProductsResponse', 200, { totalPages, totalRecords, records });

    } catch (err) {
      Settings.sendWebContent('fetchProductsResponse', 500, err.message)
    }

  }).catch(Err => console.log(Err))

});

// Search products
ipcMain.on('searchProducts', (event: IpcMainEvent, { brandId, categoryId, searchText }) => {

  Settings.getConnection().then(async connection => {
    try {

      let productRepository = connection.getRepository(Product);

      let query = productRepository.createQueryBuilder('p')
        .select(['p.id, p.name, p.price, b.id as brand, b.name as brandName, c.id as category, c.category as categoryName'])
        .leftJoin('brand', 'b', 'b.id=p.brand')
        .leftJoin('product_category', 'c', 'c.id=p.category');

      let filterApplied = false;

      if (brandId) {
        query = query.where(`b.id = ${brandId}`);
        filterApplied = true;
      }

      if (categoryId) {
        if (filterApplied) {
          query = query.andWhere(`c.id = ${categoryId}`);
        }
        else {
          query = query.where(`c.id = ${categoryId}`);
        }

        filterApplied = true;
      }

      if (searchText) {
        let sQ = new Brackets(qb => {

          searchText.split(" ").forEach((str: any, index: any) => {

            if (index == 0) qb.where(`p.name LIKE '%${str}%'`);
            else qb.orWhere(`p.name LIKE '%${str}%'`);

            qb.orWhere(`b.name LIKE '%${str}%'`)
              .orWhere(`c.category LIKE '%${str}%'`)
              .orWhere(`p.price LIKE '%${str}%'`);

          });
        });

        if (filterApplied) {
          query = query.andWhere(sQ);
        }
        else {
          query = query.where(sQ);
        }

        filterApplied = true;
      }

      query.orderBy('name', 'ASC');
      const records = await query.getRawMany();

      Settings.sendWebContent('searchProductsResponse', 200, { records });

    } catch (err) {
      Settings.sendWebContent('searchProductsResponse', 500, err.message)
    }

  }).catch(Err => console.log(Err))

});

ipcMain.on('getProductFormData', (params?: any) => {
  Settings.getConnection().then(async connection => {
    try {
      let pcRepo = connection.getRepository(ProductCategory);
      let brandRepo = connection.getRepository(Brand);

      let categories = await pcRepo.find({ select: ['id', 'category'], order: { category: 'ASC'}  });
      let brands = await brandRepo.find({ select: ['id', 'name'], order: { name: 'ASC'}  });

      Settings.sendWebContent('getProductFormDataResponse', 200, { categories, brands });

    } catch (err) {
      Settings.sendWebContent('getProductFormDataResponse', 500, err.message)
    }
  }).catch(Err => console.log(Err));
})


// Create new product
ipcMain.on('addNewProduct', (event: IpcMainEvent, { name, brand, category, price }) => {

  Settings.getConnection().then(async connection => {

    try {
      let productRepository = connection.getRepository(Product);

      let product = new Product();
      product.name = name;
      product.brand = brand;
      product.category = category;
      product.price = price;

      await productRepository.save(product);


      Settings.sendWebContent('addNewProductResponse', 200, product)

    } catch (err) {
      Settings.sendWebContent('addNewProductResponse', 500, err.message)
    }

  }).catch(Err => print(Err, 'danger'))

});


// Update product
ipcMain.on('updateProduct', (event: IpcMainEvent, { id, name, brand, category, price }) => {

  Settings.getConnection().then(async connection => {

    try {
      let productRepository = connection.getRepository(Product);

      let product = await productRepository.findOne({ id: id });

      if (!product) {
        Settings.sendWebContent('updateProductResponse', 400, 'Product not found');
        return;
      }

      product.name = name;
      product.brand = brand;
      product.category = category;
      product.price = price;

      await productRepository.save(product);

      Settings.sendWebContent('updateProductResponse', 200, product)

    } catch (err) {
      Settings.sendWebContent('updateProductResponse', 500, err.message)
    }
  }).catch(Err => print(Err, 'danger'))

});

// Delete product
ipcMain.on('deleteProduct', (event: IpcMainEvent, { id }) => {

  Settings.getConnection().then(async connection => {
    try {
      let productRepository = connection.getRepository(Product);

      let product = await productRepository.findOne({ id: id });

      if (!product) {
        Settings.sendWebContent('deleteProductResponse', 400, 'Product not found');
        return;
      }

      await productRepository.softDelete({ id: id });

      Settings.sendWebContent('deleteProductResponse', 200, 'deleted')

    } catch (err) {
      Settings.sendWebContent('deleteProductResponse', 500, err.message)
    }

  }).catch(Err => print(Err, 'danger'))

});
