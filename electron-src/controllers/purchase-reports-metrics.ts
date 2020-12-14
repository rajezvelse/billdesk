import { ipcMain, IpcMainEvent, BrowserWindow } from 'electron';
import { Settings } from '../settings';
import { Product, Vendor, Purchase, PurchaseParticulars, PurchasePayment, ProductCategory, Brand } from '../entity';
import { Like, Brackets } from 'typeorm';
import { print, generateRecordNumber } from '../utils';
import * as moment from 'moment';

// Fetch purchase reports metrics data
ipcMain.on('fetchPurchaseReportsMetrics', (event: IpcMainEvent, { startDate, endDate, productCategoryId, brandId, productId }) => {

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

      let purchaseRepo = connection.getRepository(Purchase),
        particularsRepo = connection.getRepository(PurchaseParticulars),
        purchasePaymentsRepo = connection.getRepository(PurchasePayment);


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

        query = query.leftJoin('purchase', 's', 's.id=sp.purchaseRecord')
          .leftJoin('products', 'p', 'p.id=sp.product')
          .leftJoin('brand', 'b', 'b.id=p.brand')
          .leftJoin('product_category', 'pc', 'pc.id=p.category')
          .where(`s.status ='SUBMITTED'`)
          .andWhere('s.deletedAt IS NULL');

        return applyFilters(query);
      }

      // Net summary
      let netSumQ = purchaseRepo.createQueryBuilder('s')
        .select('sum(s.totalDiscountedCost) as totalBillCost, \
        sum(s.paymentPaid) as totalPurchasePayment, \
        sum(s.balanceAmount) as totalbalanceAmount')
        .where(`s.status ='SUBMITTED'`)
        .andWhere('s.deletedAt IS NULL');

      let netSummary = await applyFilters(netSumQ, true).getRawMany();
      netSummary = netSummary[0];

      let netPaymentsQ = purchasePaymentsRepo.createQueryBuilder('s')
        .select('sum(s.amount) as totalPayment, sr.id')
        .leftJoin('purchase', 'sr', 'sr.id=s.purchaseRecord')
        .where(`sr.status ='SUBMITTED'`)
        .andWhere('sr.deletedAt IS NULL');

      let netPaymentsSummary = await applyFilters(netPaymentsQ, true).getRawMany();

      netSummary['totalPaymentPaid'] = netPaymentsSummary[0].totalPayment;


      // Productwise summary
      let productWiseQ = particularsRepo.createQueryBuilder('sp')
        .select('p.id as productId, p.name as product, b.name as brandName, \
        sum(sp.discountedCost) as totalPurchase');
      let productWiseSummary = await constructQuery(productWiseQ).groupBy('p.id')
        .orderBy('totalPurchase', 'DESC').limit(20).getRawMany();

      // Brandwise summary
      let brandWiseQ = particularsRepo.createQueryBuilder('sp')
        .select('b.id as productBrandId, b.name as productBrand, \
        sum(sp.discountedCost) as totalPurchase');
      let brandWiseSummary = await constructQuery(brandWiseQ).groupBy('b.id').orderBy('totalPurchase', 'DESC').getRawMany();

      // Categorywise summary
      let categoryWiseQ = particularsRepo.createQueryBuilder('sp')
        .select('pc.id as productCategoryId, pc.category as productCategory, \
        sum(sp.discountedCost) as totalPurchase');
      let categoryWiseSummary = await constructQuery(categoryWiseQ).groupBy('pc.id').orderBy('totalPurchase', 'DESC').getRawMany();

      let isSameMonth = moment(endDate).format("MM") === moment(startDate).format('MM');
      let isSameDay = moment(startDate).format('YYYY-MM-DD') === moment(endDate).format('YYYY-MM-DD');
      let dateWiseStartDate = (!isSameDay) ? startDate : moment(startDate).subtract(6, 'days').toDate();
      let dateWiseEndDate = endDate;

      // Datewise purchase summary
      let dateWisePurchaseQ = purchaseRepo.createQueryBuilder('s')
        .select(`${isSameMonth ? 'strftime("%Y-%m-%d", s.date)' : 'strftime("%Y-%m", s.date)'} AS date, \
        sum(s.totalDiscountedCost) as totalBillCost`)
        .where(`s.status ='SUBMITTED'`)
        .andWhere('s.deletedAt IS NULL')
        .andWhere(`s.date >= '${dateWiseStartDate.toISOString()}'`)
        .andWhere(`s.date <= '${dateWiseEndDate.toISOString()}'`)
        .groupBy(`${isSameMonth ? 'strftime("%Y-%m-%d", s.date)' : 'strftime("%Y-%m", s.date)'}`)
        .orderBy('s.date', 'DESC');

      let dateWisePurchaseSummary = await dateWisePurchaseQ.getRawMany();

      // Datewise payments summary
      let dateWisePaymentsQ = purchasePaymentsRepo.createQueryBuilder('p')
        .select(`${isSameMonth ? 'strftime("%Y-%m-%d", p.date)' : 'strftime("%Y-%m", p.date)'} AS date, \
        sum(p.amount) as totalPayment, sr.id`)
        .leftJoin('purchase', 'sr', 'sr.id=p.purchaseRecord')
        .where(`sr.status ='SUBMITTED'`)
        .andWhere('sr.deletedAt IS NULL')
        .andWhere(`p.date >= '${dateWiseStartDate.toISOString()}'`)
        .andWhere(`p.date <= '${dateWiseEndDate.toISOString()}'`)
        .groupBy(`${isSameMonth ? 'strftime("%Y-%m-%d", p.date)' : 'strftime("%Y-%m", p.date)'}`).orderBy('p.date', 'DESC');

      let dateWisePaymentsSummary = await dateWisePaymentsQ.getRawMany();

      // Merge datewise purchase & payments
      let dateWisePurchaseObject = dateWisePurchaseSummary.reduce((obj: any, purchase: any) => {
        obj[purchase.date] = purchase.totalBillCost;
        return obj;
      }, {});

      let dateWisePaymentsObject = dateWisePaymentsSummary.reduce((obj: any, payment: any) => {
        obj[payment.date] = payment.totalPayment;
        return obj;
      }, {});

      // Enumerate intervals
      let dateWisePurchasePaymentsRecords: any[] = [];

      let loopDate: any = moment(dateWiseStartDate).startOf(isSameMonth? 'day': 'month'),
      loopEnd: any = moment(dateWiseEndDate).startOf(isSameMonth? 'day': 'month');

      while (!loopDate.isAfter(loopEnd)) {
        let d: string = loopDate.format(isSameMonth? 'YYYY-MM-DD': 'YYYY-MM'), 
        rec: any ={
          date: d,
          totalBillCost: d in dateWisePurchaseObject?  dateWisePurchaseObject[d]: 0,
          totalPayment: d in dateWisePaymentsObject?  dateWisePaymentsObject[d]: 0
        }
        loopDate.add(1, isSameMonth? 'days' : 'months').startOf(isSameMonth? 'day': 'month');
        dateWisePurchasePaymentsRecords.push(rec);
      }

      dateWisePurchasePaymentsRecords.sort((a: any, b: any) => {
        return moment(a.date, isSameMonth ? 'YYYY-MM-DD' : 'YYYY-MM').isSameOrAfter(moment(b.date, isSameMonth ? 'YYYY-MM-DD' : 'YYYY-MM')) ? -1 : 1;
      })

      let dateWisePurchasePaymentsSummary: any = {
        interval: isSameMonth ? 'days' : 'months',
        fromDate: dateWiseStartDate,
        toDate: dateWiseEndDate,
        records: dateWisePurchasePaymentsRecords
      };

      console.log(netSummary)

      Settings.sendWebContent('fetchPurchaseReportsMetricsResponse', 200, {
        netSummary, productWiseSummary, brandWiseSummary, categoryWiseSummary, dateWisePurchasePaymentsSummary
      });

    } catch (err) {
      Settings.sendWebContent('fetchPurchaseReportsMetricsResponse', 500, err.message)
    }

  }).catch(Err => Err)

});