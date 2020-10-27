import { ipcMain, IpcMainEvent, BrowserWindow } from 'electron';
import { Settings } from '../settings';
import { Product, Customer, Sales, SalesParticulars, SalesPayment, ProductCategory, Brand } from '../entity';
import { Like, Brackets } from 'typeorm';
import { print, generateRecordNumber } from '../utils';
import * as moment from 'moment';

// Fetch sales reports metrics data
ipcMain.on('fetchSalesReportsMetrics', (event: IpcMainEvent, { startDate, endDate, productCategoryId, brandId, productId }) => {

  Settings.getConnection().then(async connection => {
    try {
      if (!startDate) {
        startDate = moment(new Date());
        startDate.set('hour', 0).set('minute', 0).set('second', 0);
        startDate = startDate.toDate();
      }
      if (!endDate) {
        endDate = moment(new Date());
        endDate.set('hour', 23).set('minute', 59).set('second', 59);
        endDate = endDate.toDate();
      }

      let salesRepo = connection.getRepository(Sales),
        particularsRepo = connection.getRepository(SalesParticulars),
        salesPaymentsRepo = connection.getRepository(SalesPayment);


      const applyFilters = (query: any, onlyDates?: boolean) => {
        // Start date
        if (startDate) {
          query = query.andWhere(`s.date >= '${startDate.toISOString()}'`);
        }

        // End date
        if (endDate) {
          query = query.andWhere(`s.date <= '${endDate.toISOString()}'`);
        }

        if(!onlyDates){

          if(productCategoryId){
            query = query.andWhere(`p.category = '${productCategoryId}'`);
          }
  
          if(brandId){
            query = query.andWhere(`p.brand = '${brandId}'`);
          }
  
          if(productId){
            query = query.andWhere(`p.id = '${productId}'`);
          }
        }
        
        return query;
      }

      const constructQuery = (query: any) => {

        query = query.leftJoin('sales', 's', 's.id=sp.salesRecord')
          .leftJoin('products', 'p', 'p.id=sp.product')
          .leftJoin('brand', 'b', 'b.id=p.brand')
          .leftJoin('product_category', 'pc', 'pc.id=p.category')
          .where(`s.status ='SUBMITTED'`)
          .andWhere('s.deletedAt IS NULL');

        return applyFilters(query);
      }

      // Net summary
      let netSumQ = salesRepo.createQueryBuilder('s')
        .select('sum(s.totalDiscountedCost) as totalBillCost, \
        sum(s.paymentReceived) as totalSalesPayment, \
        sum(s.outstandingAmount) as totaloutstandingAmount')
        .where(`s.status ='SUBMITTED'`)
        .andWhere('s.deletedAt IS NULL');

      let netSummary = await applyFilters(netSumQ, true).getRawMany();
      netSummary = netSummary[0];

      let netPaymentsQ = salesPaymentsRepo.createQueryBuilder('s')
        .select('sum(s.amount) as totalPayment, sr.id')
        .leftJoin('sales', 'sr', 'sr.id=s.salesRecord')
        .where(`sr.status ='SUBMITTED'`)
        .andWhere('sr.deletedAt IS NULL');

      let netPaymentsSummary = await applyFilters(netPaymentsQ, true).getRawMany();

      netSummary['totalPaymentReceived'] = netPaymentsSummary[0].totalPayment;


      // Productwise summary
      let productWiseQ = particularsRepo.createQueryBuilder('sp')
        .select('p.id as productId, p.name as product, b.name as brandName, \
        sum(sp.discountedCost) as totalSales');
      let productWiseSummary = await constructQuery(productWiseQ).groupBy('p.id')
        .orderBy('totalSales', 'DESC').limit(20).getRawMany();

      // Brandwise summary
      let brandWiseQ = particularsRepo.createQueryBuilder('sp')
        .select('b.id as productBrandId, b.name as productBrand, \
        sum(sp.discountedCost) as totalSales');
      let brandWiseSummary = await constructQuery(brandWiseQ).groupBy('b.id').orderBy('totalSales', 'DESC').getRawMany();

      // Categorywise summary
      let categoryWiseQ = particularsRepo.createQueryBuilder('sp')
        .select('pc.id as productCategoryId, pc.category as productCategory, \
        sum(sp.discountedCost) as totalSales');
      let categoryWiseSummary = await constructQuery(categoryWiseQ).groupBy('pc.id').orderBy('totalSales', 'DESC').getRawMany();

      let isSameMonth = moment(endDate).format("MM") === moment(startDate).format('MM');
      let isSameDay = moment(startDate).format('YYYY-MM-DD') === moment(endDate).format('YYYY-MM-DD');
      let dateWiseStartDate = (!isSameDay) ? startDate : moment(startDate).subtract(6, 'days').toDate();
      let dateWiseEndDate = endDate;

      // Datewise sales summary
      let dateWiseSalesQ = salesRepo.createQueryBuilder('s')
        .select(`${isSameMonth ? 'strftime("%Y-%m-%d", s.date)' : 'strftime("%Y-%m", s.date)'} AS date, \
        sum(s.totalDiscountedCost) as totalBillCost`)
        .where(`s.status ='SUBMITTED'`)
        .andWhere('s.deletedAt IS NULL')
        .andWhere(`s.date >= '${dateWiseStartDate.toISOString()}'`)
        .andWhere(`s.date <= '${dateWiseEndDate.toISOString()}'`)
        .groupBy(`${isSameMonth ? 'strftime("%Y-%m-%d", s.date)' : 'strftime("%Y-%m", s.date)'}`)
        .orderBy('s.date', 'DESC');

      let dateWiseSalesSummary = await dateWiseSalesQ.getRawMany();

      // Datewise payments summary
      let dateWisePaymentsQ = salesPaymentsRepo.createQueryBuilder('p')
        .select(`${isSameMonth ? 'strftime("%Y-%m-%d", p.date)' : 'strftime("%Y-%m", p.date)'} AS date, \
        sum(p.amount) as totalPayment, sr.id`)
        .leftJoin('sales', 'sr', 'sr.id=p.salesRecord')
        .where(`sr.status ='SUBMITTED'`)
        .andWhere('sr.deletedAt IS NULL')
        .andWhere(`p.date >= '${dateWiseStartDate.toISOString()}'`)
        .andWhere(`p.date <= '${dateWiseEndDate.toISOString()}'`)
        .groupBy(`${isSameMonth ? 'strftime("%Y-%m-%d", p.date)' : 'strftime("%Y-%m", p.date)'}`).orderBy('p.date', 'DESC');

      let dateWisePaymentsSummary = await dateWisePaymentsQ.getRawMany();

      // Merge datewise sales & payments
      let dateWiseSalesObject = dateWiseSalesSummary.reduce((obj: any, sale: any) => {
        obj[sale.date] = sale.totalBillCost;
        return obj;
      }, {});

      let dateWisePaymentsObject = dateWisePaymentsSummary.reduce((obj: any, payment: any) => {
        obj[payment.date] = payment.totalPayment;
        return obj;
      }, {});

      // Enumerate intervals
      let dateWiseSalesPaymentsRecords: any[] = [];

      let loopDate: any = moment(dateWiseStartDate).startOf(isSameMonth? 'day': 'month'),
      loopEnd: any = moment(dateWiseEndDate).startOf(isSameMonth? 'day': 'month');

      while (!loopDate.isAfter(loopEnd)) {
        let d: string = loopDate.format(isSameMonth? 'YYYY-MM-DD': 'YYYY-MM'), 
        rec: any ={
          date: d,
          totalBillCost: d in dateWiseSalesObject?  dateWiseSalesObject[d]: 0,
          totalPayment: d in dateWisePaymentsObject?  dateWisePaymentsObject[d]: 0
        }
        loopDate.add(1, isSameMonth? 'days' : 'months').startOf(isSameMonth? 'day': 'month');
        dateWiseSalesPaymentsRecords.push(rec);
      }

      dateWiseSalesPaymentsRecords.sort((a: any, b: any) => {
        return moment(a.date, isSameMonth ? 'YYYY-MM-DD' : 'YYYY-MM').isSameOrAfter(moment(b.date, isSameMonth ? 'YYYY-MM-DD' : 'YYYY-MM')) ? -1 : 1;
      })

      let dateWiseSalesPaymentsSummary: any = {
        interval: isSameMonth ? 'days' : 'months',
        fromDate: dateWiseStartDate,
        toDate: dateWiseEndDate,
        records: dateWiseSalesPaymentsRecords
      };

      console.log(netSummary)

      Settings.sendWebContent('fetchSalesReportsMetricsResponse', 200, {
        netSummary, productWiseSummary, brandWiseSummary, categoryWiseSummary, dateWiseSalesPaymentsSummary
      });

    } catch (err) {
      Settings.sendWebContent('fetchSalesReportsMetricsResponse', 500, err.message)
    }

  }).catch(Err => Err)

});

// Delete sale
ipcMain.on('deleteSale', (event: IpcMainEvent, { id }) => {

  Settings.getConnection().then(async connection => {
    try {
      let salesRepo = connection.getRepository(Sales);

      let record = await salesRepo.findOne(id);

      if (!record) {
        Settings.sendWebContent('deleteSalesDraftResponse', 404, 'No Sale record found');
        return;
      }

      await salesRepo.softDelete(record.id);

      Settings.sendWebContent('deleteSaleResponse', 200, 'deleted');

    } catch (err) {
      Settings.sendWebContent('deleteSaleResponse', 500, err.message)
    }

  }).catch(Err => Err)

});

// Sales report filter data
ipcMain.on('fetchSalesReportFilterData', (event: IpcMainEvent) => {

  Settings.getConnection().then(async connection => {
    try {
      let customerRepo = connection.getRepository(Customer),
        brandRepo = connection.getRepository(Brand),
        productCategoryRepo = connection.getRepository(ProductCategory);

      let customers = await customerRepo.find({ order: { name: 'ASC' } }),
        brands = await brandRepo.find({ order: { name: 'ASC' } }),
        productCategories = await productCategoryRepo.find({ order: { category: 'ASC' } });

      Settings.sendWebContent('fetchSalesReportFilterDataResponse', 200, { customers, brands, productCategories });

    } catch (err) {
      Settings.sendWebContent('fetchSalesReportFilterDataResponse', 500, err.message)
    }

  }).catch(Err => Err)

});