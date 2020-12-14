import { ipcMain, IpcMainEvent, BrowserWindow } from 'electron';
import { Settings } from '../settings';
import { SalesParticulars } from '../entity';
import { Like, Brackets, MoreThan } from 'typeorm';
import { print } from '../utils';
import * as moment from 'moment';

ipcMain.on('fetchProductWiseProfit', (event: IpcMainEvent, { pageLimit, pageNumber, orderBy, order, searchText, startDate, endDate }) => {

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
      if (!orderBy) orderBy = 'totalProfit';
      if (!order) order = 'desc';

      let spRepository = connection.getRepository(SalesParticulars);

      let countQuery = spRepository.createQueryBuilder('p')
        .select(['count(distinct(p.product)) as count'])
        .leftJoin('sales', 's', 's.id=p.salesRecord')
        .leftJoin('products', 'pro', 'pro.id=p.product')
        .leftJoin('brand', 'b', 'b.id=pro.brand')
        .leftJoin('product_category', 'c', 'c.id=pro.category')
        .where(`s.status ='SUBMITTED'`)
        .andWhere(`s.deletedAt IS NULL`);


      let totalQuery = spRepository.createQueryBuilder('p')
        .select(['sum(p.profit) as totalProfit'])
        .leftJoin('sales', 's', 's.id=p.salesRecord')
        .leftJoin('products', 'pro', 'pro.id=p.product')
        .leftJoin('brand', 'b', 'b.id=pro.brand')
        .leftJoin('product_category', 'c', 'c.id=pro.category')
        .where(`s.status ='SUBMITTED'`)
        .andWhere(`s.deletedAt IS NULL`);

      let query = spRepository.createQueryBuilder('p')
        .select(['sum(p.discountedCost) as totalDiscountedCost, sum(p.profit) as totalProfit, pro.name as productName, c.category as category, b.name as brandName'])
        .leftJoin('sales', 's', 's.id=p.salesRecord')
        .leftJoin('products', 'pro', 'pro.id=p.product')
        .leftJoin('brand', 'b', 'b.id=pro.brand')
        .leftJoin('product_category', 'c', 'c.id=pro.category')
        .where(`s.status ='SUBMITTED'`)
        .andWhere(`s.deletedAt IS NULL`)
        .andWhere(`totalDiscountedCost > 0`);


      // Start date
      if (startDate) {
        countQuery = countQuery.andWhere(`s.date >= '${startDate.toISOString()}'`);
        totalQuery = totalQuery.andWhere(`s.date >= '${startDate.toISOString()}'`);
        query = query.andWhere(`s.date >= '${startDate.toISOString()}'`);
      }

      // End date
      if (endDate) {
        countQuery = countQuery.andWhere(`s.date <= '${endDate.toISOString()}'`);
        totalQuery = totalQuery.andWhere(`s.date <= '${endDate.toISOString()}'`);
        query = query.andWhere(`s.date <= '${endDate.toISOString()}'`);
      }


      if (searchText) {
        let sQ = new Brackets(qb => {

          searchText.split(" ").forEach((str: any, index: any) => {

            if (index == 0) qb.where(`pro.name LIKE '%${str}%'`);

            qb.orWhere(`c.category LIKE '%${str}%'`)
              .orWhere(`b.name LIKE '%${str}%'`);

          });
        });


        countQuery = countQuery.andWhere(sQ).groupBy('p.product');
        totalQuery = totalQuery.andWhere(sQ).groupBy('p.product');
        query = query.andWhere(sQ).groupBy('p.product');

      }


      // Total records count
      const countScraps = await countQuery.getRawMany();
      const totalScrapsResult = await totalQuery.getRawMany();
      let totalRecords = countScraps[0]['count'];
      let netProfit = totalScrapsResult[0]['totalProfit'];
      let totalPages = Math.ceil(totalRecords / pageLimit);

      // Sorting
      let orderByFields: any = {
        productName: 'pro.name',
        totalSales: 'sum(p.discountedCost)',
        totalProfit: ' sum(p.profit)',
        category: 'c.category',
        brandName: 'b.name'
      }
      query = query.orderBy(orderByFields[orderBy], order.toUpperCase());

      // Pagination
      let offset = (pageNumber * pageLimit) - pageLimit;
      query = query.offset(offset).limit(pageLimit);

      const records = await query.getRawMany();

      Settings.sendWebContent('fetchProductWiseProfitResponse', 200, { totalPages, totalRecords, netProfit, records });

    } catch (err) {
      Settings.sendWebContent('fetchProductWiseProfitResponse', 500, err.message)
    }

  }).catch(Err => console.log(Err))

});
