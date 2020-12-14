import { ipcMain, IpcMainEvent, BrowserWindow } from 'electron';
import { Settings } from '../settings';
import { Scraps, Product, ProductStocks } from '../entity';
import { Like, Brackets, MoreThan } from 'typeorm';
import { print } from '../utils';
import * as moment from 'moment';

ipcMain.on('fetchScraps', (event: IpcMainEvent, { pageLimit, pageNumber, orderBy, order, searchText, startDate, endDate }) => {

  Settings.getConnection().then(async connection => {
    try {
      if (!startDate) {
        startDate = moment(new Date()).startOf('month');
        startDate.set('hour', 0).set('minute', 0).set('second', 0);
        startDate = startDate.toDate();
      }
      if (!endDate) {
        endDate = moment(new Date()).endOf('month');
        endDate.set('hour', 23).set('minute', 59).set('second', 59);
        endDate = endDate.toDate();
      }


      if (!pageLimit) pageLimit = 20;
      if (!pageNumber) pageNumber = 1;
      if (!orderBy) orderBy = 'date';
      if (!order) order = 'asc';

      let scrapsRepository = connection.getRepository(Scraps);

      let countQuery = scrapsRepository.createQueryBuilder('p')
        .select(['count(p.id) as count'])
        .leftJoin('products', 'pro', 'pro.id=p.product')
        .leftJoin('brand', 'b', 'b.id=pro.brand')
        .leftJoin('product_category', 'c', 'c.id=pro.category');


      let totalQuery = scrapsRepository.createQueryBuilder('p')
        .select(['sum(p.loss) as totalScrapLoss'])
        .leftJoin('products', 'pro', 'pro.id=p.product')
        .leftJoin('brand', 'b', 'b.id=pro.brand')
        .leftJoin('product_category', 'c', 'c.id=pro.category');

      let query = scrapsRepository.createQueryBuilder('p')
        .leftJoin('products', 'pro', 'pro.id=p.product')
        .leftJoin('brand', 'b', 'b.id=pro.brand')
        .leftJoin('product_category', 'c', 'c.id=pro.category')
        .select(['p.id, p.date, p.quantity, p.loss, pro.name as productName, c.category as category, b.name as brandName']);


      // Start date
      if (startDate) {
        countQuery = countQuery.andWhere(`p.date >= '${startDate.toISOString()}'`);
        totalQuery = totalQuery.andWhere(`p.date >= '${startDate.toISOString()}'`);
        query = query.andWhere(`p.date >= '${startDate.toISOString()}'`);
      }

      // End date
      if (endDate) {
        countQuery = countQuery.andWhere(`p.date <= '${endDate.toISOString()}'`);
        totalQuery = totalQuery.andWhere(`p.date <= '${endDate.toISOString()}'`);
        query = query.andWhere(`p.date <= '${endDate.toISOString()}'`);
      }


      if (searchText) {
        let sQ = new Brackets(qb => {

          searchText.split(" ").forEach((str: any, index: any) => {

            if (index == 0) qb.where(`pro.name LIKE '%${str}%'`);

            qb.orWhere(`c.category LIKE '%${str}%'`)
              .orWhere(`b.name LIKE '%${str}%'`);

          });
        });


        countQuery = countQuery.andWhere(sQ);
        totalQuery = totalQuery.andWhere(sQ);
        query = query.andWhere(sQ);

      }


      // Total records count
      const countScraps = await countQuery.getRawMany();
      const totalScrapsResult = await totalQuery.getRawMany();
      let totalRecords = countScraps[0]['count'];
      let totalScrapLoss = totalScrapsResult[0]['totalScrapLoss'];
      let totalPages = Math.ceil(totalRecords / pageLimit);

      // Sorting
      let orderByFields: any = {
        date: 'p.date',
        productName: 'pro.name',
        quantity: 'p.quantity',
        loss: 'p.loss',
        category: 'c.category',
        brandName: 'b.name'
      }
      query = query.orderBy(orderByFields[orderBy], order.toUpperCase());

      // Pagination
      let offset = (pageNumber * pageLimit) - pageLimit;
      query = query.offset(offset).limit(pageLimit);

      const records = await query.getRawMany();

      Settings.sendWebContent('fetchScrapsResponse', 200, { totalPages, totalRecords, totalScrapLoss, records });

    } catch (err) {
      Settings.sendWebContent('fetchScrapsResponse', 500, err.message)
    }

  }).catch(Err => console.log(Err))

});

ipcMain.on('getScrapsFormData', (params?: any) => {
  Settings.getConnection().then(async connection => {
    try {
      // Fetch products list
      let productRepository = connection.getRepository(Product);

      let query = productRepository.createQueryBuilder('p')
        .select(['p.id, p.price, p.name as productName, b.name as brandName, SUM(st.quantityAvailable) as quantityAvailable'])
        .leftJoin('brand', 'b', 'b.id=p.brand')
        .leftJoin('product_stocks', 'st', 'st.product=p.id')
        .groupBy('p.id');

      query = query.orderBy('b.name', 'ASC').orderBy('p.name', 'ASC');

      let products = await query.getRawMany();

      products = products.map((p: any) => {
        if (p.quantityAvailable === null) p.quantityAvailable = 0;
        return p;
      })

      Settings.sendWebContent('getScrapsFormDataResponse', 200, { products });

    } catch (err) {
      Settings.sendWebContent('getScrapsFormDataResponse', 500, err.message)
    }
  }).catch(Err => console.log(Err));
})


// Create new scraps
ipcMain.on('addNewScraps', (event: IpcMainEvent, { date, productId, quantity }) => {

  Settings.getConnection().then(async connection => {

    try {
      let scrapsRepository = connection.getRepository(Scraps);

      let scraps = new Scraps();
      scraps.date = date;
      scraps.product = productId;
      scraps.quantity = quantity;

      // Revising the stocks records
      const stocksRepo = connection.getRepository(ProductStocks);

      let stockRecordsToBeUpdated: ProductStocks[] = [];

      let purchaseCostPortions = [];

      let matches = await stocksRepo.find({ where: { product: productId, quantityAvailable: MoreThan(0) }, order: { product: 'ASC', quantityAvailable: 'ASC' }, relations: ['product'] });
      let soldQty: number = quantity;

      for (let smi: number = 0; smi < matches.length; smi++) {
        let stockMatch: ProductStocks = matches[smi];

        if (stockMatch.quantityAvailable >= soldQty) {
          stockMatch.quantityAvailable -= soldQty;
          stockRecordsToBeUpdated.push(stockMatch);

          purchaseCostPortions.push({
            q: soldQty,
            p: stockMatch.price,
            ls: (stockMatch.price * soldQty)
          })

          break;

        } else {
          let processingQty: number = stockMatch.quantityAvailable;
          soldQty -= processingQty;
          stockMatch.quantityAvailable = 0;
          stockRecordsToBeUpdated.push(stockMatch);

          purchaseCostPortions.push({
            q: processingQty,
            p: stockMatch.price,
            ls: (stockMatch.price * processingQty)
          })

          if (soldQty > 0) continue; else break;
        }
      }

      scraps.loss = purchaseCostPortions.reduce((tot: number, portion: any) => tot + portion['ls'], 0);
      scraps.purchaseCostPortions = JSON.stringify(purchaseCostPortions);

      // Update stocks records
      if (stockRecordsToBeUpdated.length > 0) await stocksRepo.save(stockRecordsToBeUpdated);

      await scrapsRepository.save(scraps);


      Settings.sendWebContent('addNewScrapsResponse', 200, scraps)

    } catch (err) {
      Settings.sendWebContent('addNewScrapsResponse', 500, err.message)
    }

  }).catch(Err => print(Err, 'danger'))

});

// Delete scraps
ipcMain.on('deleteScraps', (event: IpcMainEvent, { id }) => {

  Settings.getConnection().then(async connection => {
    try {
      let scrapsRepository = connection.getRepository(Scraps);

      let scraps = await scrapsRepository.findOne({ where: { id: id }, relations: ['product'] });

      if (!scraps) {
        Settings.sendWebContent('deleteScrapsResponse', 400, 'Scraps not found');
        return;
      }

      // Update stocks
      const stocksRepo = connection.getRepository(ProductStocks);
      let recordsNormalized: any[] = [];

      let portions = scraps.purchaseCostPortions !== null ? JSON.parse(scraps.purchaseCostPortions) : [];

      portions.forEach((por: any) => {
        recordsNormalized.push({
          purchasePrice: por['p'],
          productId: scraps.product.id,
          quantity: por['q']
        })
      });

      if (recordsNormalized.length > 0) {
        let i: number = 0, stockRecords: ProductStocks[] = [];

        let updateStocks = async (loopIndex: number) => {
          let particular: any = recordsNormalized[loopIndex];
          let purchasePrice = particular['purchasePrice'];

          let stockEntries = await stocksRepo.find({ where: { product: particular['productId'], price: purchasePrice } });

          if (stockEntries.length) {
            let stockMatchEntry = stockEntries[0];
            stockMatchEntry.quantityAvailable += particular['quantity'];

            stockRecords.push(stockMatchEntry);
          }

          if (i + 1 < recordsNormalized.length) {
            i += 1;
            await updateStocks(i);
          }
        }

        await updateStocks(0);
        if (stockRecords.length > 0) await stocksRepo.save(stockRecords);

      }

      await scrapsRepository.softDelete({ id: id });

      Settings.sendWebContent('deleteScrapsResponse', 200, 'deleted')

    } catch (err) {
      Settings.sendWebContent('deleteScrapsResponse', 500, err.message)
    }

  }).catch(Err => print(Err, 'danger'))

});
