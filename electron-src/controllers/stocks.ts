import { ipcMain, IpcMainEvent, BrowserWindow } from 'electron';
import { Settings } from '../settings';
import { Sales, SalesParticulars, Purchase, PurchaseParticulars, Product, ProductStocks } from '../entity';
import { Like, Brackets } from 'typeorm';
import { print, generateRecordNumber } from '../utils';


// Products stock details
ipcMain.on('getStocksData', (event: IpcMainEvent, { searchText, pageLimit, pageNumber, orderBy, order }) => {

  Settings.getConnection().then(async connection => {
    try {
      if (!pageLimit) pageLimit = 20;
      if (!pageNumber) pageNumber = 1;
      if (!orderBy) orderBy = 'productName';
      if (!order) order = 'asc';

      let productRepo = connection.getRepository(Product);
      let stocksRepo = connection.getRepository(ProductStocks);

      let countQuery = productRepo.createQueryBuilder('p')
        .select(['COUNT(p.id) AS count'])
        .leftJoin('product_category', 'c', 'c.id=p.category');


      let query = productRepo.createQueryBuilder('p')
        .select(['p.id AS productId, p.name AS productName, \
        c.category AS productCategory, \
        stocks.stockQuantity AS availableQuantity'])
        .leftJoin('product_category', 'c', 'c.id=p.category')

        .leftJoinAndSelect(subQuery => {
          return subQuery
            .from(ProductStocks, "st")
            .select('st.product as productId, SUM(st.quantityAvailable) AS stockQuantity')
            .andWhere('st.deletedAt IS NULL')
            .groupBy('st.product');
        }, "stocks", 'stocks.productId = p.id')

        .leftJoinAndSelect(subQuery => {
          return subQuery
            .from(PurchaseParticulars, "pp")
            .select('pp.product as productId, SUM(pp.quantity) AS purchaseQuantity')
            .leftJoin('purchase', 'pur', 'pur.id=pp.purchaseRecord')
            .where(`pur.status='SUBMITTED'`)
            .andWhere('pur.deletedAt IS NULL')
            .groupBy('pp.product');
        }, "purchase", 'purchase.productId = p.id')
        .leftJoinAndSelect(subQuery => {
          return subQuery
            .from(SalesParticulars, "sp")
            .select('sp.product as productId, SUM(sp.quantity) AS salesQuantity')
            .leftJoin('sales', 's', 's.id=sp.salesRecord')
            .where(`s.status='SUBMITTED'`)
            .andWhere('s.deletedAt IS NULL')
            .groupBy('sp.product');
        }, "sales", 'sales.productId = p.id');

      if (searchText) {
        let sQ = new Brackets(qb => {

          searchText.split(" ").forEach((str: any, index: any) => {

            if (index == 0) qb.where(`p.name LIKE '%${str}%'`);
            else qb.orWhere(`p.name LIKE '%${str}%'`);

            qb.orWhere(`c.category LIKE '%${str}%'`);

          });
        });

        countQuery = countQuery.andWhere(sQ);
        query = query.andWhere(sQ);
      }

      // Total records count
      const countProducts = await countQuery.getRawMany();
      let totalRecords = countProducts[0]['count'];
      let totalPages = Math.ceil(totalRecords / pageLimit);

      // Sorting
      let orderByFields: any = {
        productName: 'p.name',
        productCategory: 'c.category',
        purchaseQuantity: 'purchaseQuantity',
        salesQuantity: 'salesQuantity',
        availableQuantity: 'availableQuantity'
      }
      query = query.orderBy(orderByFields[orderBy], order.toUpperCase());

      // Pagination
      let offset = (pageNumber * pageLimit) - pageLimit;
      query = query.offset(offset).limit(pageLimit);

      const records = await query.getRawMany();

      Settings.sendWebContent('getStocksDataResponse', 200, { totalPages, totalRecords, records });

    } catch (err) {
      Settings.sendWebContent('getStocksDataResponse', 500, err.message)
    }

  }).catch(Err => console.log(Err))

});

// Prodcut stock details page filter data
ipcMain.on('getStockFilterData', (params?: any) => {
  Settings.getConnection().then(async connection => {
    try {
      let pRepo = connection.getRepository(Product);

      let products = await pRepo.find({ select: ['id', 'name'], order: { name: 'ASC' } });

      Settings.sendWebContent('getStockFilterDataResponse', 200, { products });

    } catch (err) {
      Settings.sendWebContent('getStockFilterDataResponse', 500, err.message)
    }
  }).catch(Err => console.log(Err));
})