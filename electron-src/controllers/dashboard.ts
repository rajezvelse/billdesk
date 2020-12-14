import { ipcMain, IpcMainEvent, BrowserWindow } from 'electron';
import { Settings } from '../settings';
import { Sales, SalesParticulars, SalesPayment, Scraps, Purchase, Expense, PurchasePayment } from '../entity';
import { Like, Brackets } from 'typeorm';
import * as moment from 'moment';

// Fetch sales reports metrics data
ipcMain.on('fetchDashbardMetrics', (event: IpcMainEvent, { startDate, endDate }) => {

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

      const applyFilters = (query: any, onlyDates?: boolean) => {
        // Start date
        if (startDate) {
          query = query.andWhere(`s.date >= '${startDate.toISOString()}'`);
        }

        // End date
        if (endDate) {
          query = query.andWhere(`s.date <= '${endDate.toISOString()}'`);
        }

        // if(!onlyDates){

        //   if(productCategoryId){
        //     query = query.andWhere(`p.category = '${productCategoryId}'`);
        //   }

        //   if(brandId){
        //     query = query.andWhere(`p.brand = '${brandId}'`);
        //   }

        //   if(productId){
        //     query = query.andWhere(`p.id = '${productId}'`);
        //   }
        // }

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

      let salesRepo = connection.getRepository(Sales),
        particularsRepo = connection.getRepository(SalesParticulars),
        salesPaymentsRepo = connection.getRepository(SalesPayment),
        purchaseRepo = connection.getRepository(Purchase),
        purchasePaymentsRepo = connection.getRepository(PurchasePayment),
        expenseRepository = connection.getRepository(Expense),
        scrapsRepository = connection.getRepository(Scraps);

      let responseData: any = {};

      // Net sales summary
      let netSSumQ = salesRepo.createQueryBuilder('s')
        .select('sum(s.totalDiscountedCost) as totalBillCost, \
       sum(sp.profit) as totalProfit')
        .leftJoin('sales_particulars', 'sp', 'sp.salesRecord=s.id')
        .where(`s.status ='SUBMITTED'`)
        .andWhere('s.deletedAt IS NULL');

      let netSalesSummary = await applyFilters(netSSumQ, true).getRawMany();
      responseData['totalSales'] = netSalesSummary[0]['totalBillCost'];
      responseData['totalProfitUnrealized'] = netSalesSummary[0]['totalProfit'];

      let netSPaymentsQ = salesPaymentsRepo.createQueryBuilder('s')
        .select('sum(s.amount) as totalPayment, sr.id')
        .leftJoin('sales', 'sr', 'sr.id=s.salesRecord')
        .where(`sr.status ='SUBMITTED'`)
        .andWhere('sr.deletedAt IS NULL');

      let netSalesPaymentsSummary = await applyFilters(netSPaymentsQ, true).getRawMany();
      responseData['totalSalesPayment'] = netSalesPaymentsSummary[0]['totalPayment'];

      // Net purchase summary
      let netPSumQ = purchaseRepo.createQueryBuilder('s')
        .select('sum(s.totalDiscountedCost) as totalBillCost')
        .where(`s.status ='SUBMITTED'`)
        .andWhere('s.deletedAt IS NULL');

      let netPurchaseSummary = await applyFilters(netPSumQ, true).getRawMany();
      responseData['totalPurchase'] = netPurchaseSummary[0]['totalBillCost'];

      let netPPaymentsQ = purchasePaymentsRepo.createQueryBuilder('s')
        .select('sum(s.amount) as totalPayment, sr.id')
        .leftJoin('purchase', 'sr', 'sr.id=s.purchaseRecord')
        .where(`sr.status ='SUBMITTED'`)
        .andWhere('sr.deletedAt IS NULL');

      let netPurchasePaymentsSummary = await applyFilters(netPPaymentsQ, true).getRawMany();
      responseData['totalPurchasePayment'] = netPurchasePaymentsSummary[0]['totalPayment'];


      // Expense summary
      let expenseQ = expenseRepository.createQueryBuilder('s')
      .select('sum(s.amount) as totalExpense')
      .andWhere('s.deletedAt IS NULL');

      let netExpenseSummary = await applyFilters(expenseQ, true).getRawMany();
      responseData['totalExpense'] = netExpenseSummary[0]['totalExpense'];

       // Scraps summary
       let netScrapsSumQ = scrapsRepository.createQueryBuilder('s')
       .select('sum(s.loss) as totalScrapLoss')
       .andWhere('s.deletedAt IS NULL');

     let netScrapsSummary = await applyFilters(netScrapsSumQ, true).getRawMany();
     responseData['totalScrapLoss'] = netScrapsSummary[0]['totalScrapLoss'];

      
      let isSameMonth = moment(endDate).format("MM") === moment(startDate).format('MM');
      let isSameDay = moment(startDate).format('YYYY-MM-DD') === moment(endDate).format('YYYY-MM-DD');
      let dateWiseStartDate = (!isSameDay) ? startDate : moment(startDate).subtract(6, 'days').toDate();
      let dateWiseEndDate = endDate;

      // Datewise sales summary
      let dateWiseSalesQ = salesRepo.createQueryBuilder('s')
        .select(`${isSameMonth ? 'strftime("%Y-%m-%d", s.date)' : 'strftime("%Y-%m", s.date)'} AS date, \
        sum(s.totalDiscountedCost) as totalBillCost, \
        sum(sp.profit) as totalProfit`)
        .leftJoin('sales_particulars', 'sp', 'sp.salesRecord=s.id')
        .where(`s.status ='SUBMITTED'`)
        .andWhere('s.deletedAt IS NULL')
        .andWhere(`s.date >= '${dateWiseStartDate.toISOString()}'`)
        .andWhere(`s.date <= '${dateWiseEndDate.toISOString()}'`)
        .groupBy(`${isSameMonth ? 'strftime("%Y-%m-%d", s.date)' : 'strftime("%Y-%m", s.date)'}`)
        .orderBy('s.date', 'DESC');

      let dateWiseSalesSummary = await dateWiseSalesQ.getRawMany();
      // Merge datewise sales & payments
      let dateWiseSalesObject = dateWiseSalesSummary.reduce((obj: any, sale: any) => {
        obj[sale.date] = {
          totalBillCost: sale.totalBillCost,
          totalProfit: sale.totalProfit
        };
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
           totalSales: d in dateWiseSalesObject?  dateWiseSalesObject[d].totalBillCost: 0,
           totalProfit: d in dateWiseSalesObject?  dateWiseSalesObject[d].totalProfit: 0,
         }
         loopDate.add(1, isSameMonth? 'days' : 'months').startOf(isSameMonth? 'day': 'month');
         dateWiseSalesPaymentsRecords.push(rec);
       }
 
       dateWiseSalesPaymentsRecords.sort((a: any, b: any) => {
         return moment(a.date, isSameMonth ? 'YYYY-MM-DD' : 'YYYY-MM').isSameOrAfter(moment(b.date, isSameMonth ? 'YYYY-MM-DD' : 'YYYY-MM')) ? -1 : 1;
       })
 
       responseData['dateWiseSalesProfitSummary'] = {
         interval: isSameMonth ? 'days' : 'months',
         fromDate: dateWiseStartDate,
         toDate: dateWiseEndDate,
         records: dateWiseSalesPaymentsRecords
       };


      Settings.sendWebContent('fetchDashbardMetricsResponse', 200, responseData);

    } catch (err) {
      Settings.sendWebContent('fetchDashbardMetricsResponse', 500, err.message)
    }

  }).catch(Err => Err)

});