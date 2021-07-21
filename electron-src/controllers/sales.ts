import { ipcMain, IpcMainEvent, BrowserWindow } from 'electron';
import { Settings } from '../settings';
import { Product, Customer, Sales, SalesParticulars, SalesPayment, ProductCategory, Brand, ProductStocks } from '../entity';
import { Brackets, MoreThan, In } from 'typeorm';
import { generateRecordNumber } from '../utils';
import { print } from '../utils';

ipcMain.on('getSalesFormData', (event: IpcMainEvent) => {

  Settings.getConnection().then(async connection => {
    try {

      // Fetch customers list
      let customerRepository = connection.getRepository(Customer);

      let cQuery = customerRepository.createQueryBuilder('c')
        .select(['c.id, c.name, c.phone']);

      cQuery = cQuery.orderBy('c.name', 'ASC');

      const customers = await cQuery.getRawMany();


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
        if(p.quantityAvailable === null) p.quantityAvailable = 0;
        return p;
      })

      Settings.sendWebContent('getSalesFormDataResponse', 200, { customers, products });

    } catch (err) {
      Settings.sendWebContent('getSalesFormDataResponse', 500, err.message)
    }

  }).catch(Err => console.log(Err))

});

// Fetch sales drafts
ipcMain.on('getSalesDrafts', (event: IpcMainEvent) => {

  Settings.getConnection().then(async connection => {
    try {

      let salesRepo = connection.getRepository(Sales);

      let drafts = await salesRepo.find({ where: { status: 'DRAFT' }, order: { date: 'ASC' }, withDeleted: false, relations: ['customer'] });

      Settings.sendWebContent('getSalesDraftsResponse', 200, drafts);

    } catch (err) {
      Settings.sendWebContent('getSalesDraftsResponse', 500, err.message)
    }

  }).catch(Err => console.log(Err))

});

// List sales records
ipcMain.on('fetchSales', (event: IpcMainEvent, { pageLimit, pageNumber, orderBy, order, searchText, customerId, startDate, endDate }) => {

  Settings.getConnection().then(async connection => {
    try {
      if (!pageLimit) pageLimit = 20;
      if (!pageNumber) pageNumber = 1;
      if (!orderBy) orderBy = 'name';
      if (!order) order = 'asc';

      let salesRepo = connection.getRepository(Sales);

      let countQuery = salesRepo.createQueryBuilder('s')
        .select(['count(s.id) as count'])
        .leftJoin('customers', 'c', 'c.id=s.customer');


      let query = salesRepo.createQueryBuilder('s')
        .select(['s.id, s.saleNumber, s.date, s.totalCost, s.totalDiscount, s.totalDiscountedCost, s.paymentReceived, s.outstandingAmount, c.name as customerName'])
        .leftJoin('customers', 'c', 'c.id=s.customer');

      countQuery = countQuery.where(`s.status ='SUBMITTED'`);
      query = query.where(`s.status ='SUBMITTED'`);

      // Customer filter
      if (customerId) {

        countQuery = countQuery.andWhere(`c.id = ${customerId}`);

        query = query.andWhere(`c.id = ${customerId}`);
      }

      // Start date
      if (startDate) {

        countQuery = countQuery.andWhere(`s.date >= '${startDate.toISOString()}'`);
        query = query.andWhere(`s.date >= '${startDate.toISOString()}'`);

      }

      // End date
      if (endDate) {
        countQuery = countQuery.andWhere(`s.date <= '${endDate.toISOString()}'`);
        query = query.andWhere(`s.date <= '${endDate.toISOString()}'`);
      }

      // Search criteria
      if (searchText) {
        let sQ = new Brackets(qb => {

          searchText.split(" ").forEach((str: any, index: any) => {

            if (index == 0) qb.where(`s.saleNumber LIKE '%${str}%'`);
            else qb.orWhere(`s.saleNumber LIKE '%${str}%'`);

            qb.orWhere(`strftime("%d/%m/%Y", s.date) LIKE '%${str}%'`)
              .orWhere(`c.name LIKE '%${str}%'`)
              .orWhere(`s.totalCost LIKE '%${str}%'`)
              .orWhere(`s.totalDiscount LIKE '%${str}%'`)
              .orWhere(`s.totalDiscountedCost LIKE '%${str}%'`)
              .orWhere(`s.outstandingAmount LIKE '%${str}%'`)

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
        date: 's.date',
        saleNumber: 's.saleNumber',
        customerName: 'c.name',
        totalCost: 's.totalCost',
        totalDiscount: 's.totalDiscount',
        totalDiscountedCost: 's.totalDiscountedCost',
        outstandingAmount: 's.outstandingAmount'
      }
      query = query.orderBy(orderByFields[orderBy], order.toUpperCase());

      // Pagination
      let offset = pageNumber * pageLimit - pageLimit;
      query = query.offset(offset).limit(pageLimit);

      const records = await query.getRawMany();

      Settings.sendWebContent('fetchSalesResponse', 200, { totalPages, totalRecords, records });

    } catch (err) {
      Settings.sendWebContent('fetchSalesResponse', 500, err.message)
    }

  }).catch(Err => console.log(Err))

});

ipcMain.on('saveNewSale', (event: IpcMainEvent, { id, status, date, customer, particulars, payment, totalCost, totalDiscount, totalDiscountedCost, outstandingAmount }) => {

  Settings.getConnection().then(async connection => {
    try {

      let response: any = {};

      // Fetch customers list
      let customerRepository = connection.getRepository(Customer);
      let salesRepo = connection.getRepository(Sales);
      let salesParticularsRepo = connection.getRepository(SalesParticulars);
      let productRepo = connection.getRepository(Product);
      let paymentRepo = connection.getRepository(SalesPayment);


      let customerRecord: Customer;

      if (customer['customerId']) {
        customerRecord = await customerRepository.findOne({ id: customer.customerId });
      } else {
        customerRecord = new Customer();
        customerRecord.name = customer.name;
        customerRecord.phone = customer.phone;

        await customerRepository.save(customerRecord);

        response['customer'] = customerRecord;
      }


      // Sales record
      let salesRecord: Sales;

      if (id) {
        salesRecord = await salesRepo.findOne(id);

        if (!salesRecord) {
          Settings.sendWebContent('saveNewSaleResponse', 404, 'Sales record not found');
          return;
        }

      } else {
        salesRecord = new Sales();
      }

      salesRecord.date = date;
      salesRecord.customer = customerRecord;
      salesRecord.totalCost = totalCost;
      salesRecord.totalDiscount = totalDiscount;
      salesRecord.totalDiscountedCost = totalDiscountedCost;
      salesRecord.paymentReceived = 0;
      salesRecord.outstandingAmount = outstandingAmount;
      salesRecord.status = status;

      if (status === 'SUBMITTED') {
        let lastNumber = 1;

        let lastSubmittedSale = await salesRepo.find({
          where: { status: 'SUBMITTED' },
          order: {
            id: 'DESC'
          },
          take: 1
        });

        if (lastSubmittedSale.length) {
          lastNumber = parseInt(lastSubmittedSale[0].saleNumber.replace('S', '')) + 1;
        }

        salesRecord.saleNumber = generateRecordNumber('S', lastNumber);
      }

      await salesRepo.save(salesRecord);


      try {
        // Particulars entries
        if (particulars.length > 0) {
          let existingParticularsRecords: Array<SalesParticulars> = await salesParticularsRepo.find({ salesRecord: salesRecord });
          let particularsRecords: Array<SalesParticulars> = [];

          const stocksRepo = connection.getRepository(ProductStocks);

          let stockDetails = await stocksRepo.find({ where: { product: In(particulars.map((p: any) => p.productId)), quantityAvailable: MoreThan(0) }, order: { product: 'ASC', quantityAvailable: 'ASC' }, relations: ['product'] });
          let stockRecordsToBeUpdated: ProductStocks[] = [];

          particulars.forEach((p: any) => {

            let pRec: SalesParticulars;

            if (existingParticularsRecords.length) {
              pRec = existingParticularsRecords.shift();
            } else {
              pRec = new SalesParticulars();
            }

            pRec.salesRecord = salesRecord;
            pRec.product = p.productId;
            pRec.price = p.price;
            pRec.quantity = p.quantity;
            pRec.cost = p.cost;
            pRec.discount = p.discount;
            pRec.discountedCost = p.discountedCost;
            pRec.purchaseCostPortions = null;
            pRec.profit = 0;

            // Revising the stocks records
            if (status === 'SUBMITTED') {
              let purchaseCostPortions = [];

              let matches = stockDetails.filter((sr: ProductStocks) => sr.product.id === p.productId);
              let soldQty: number = p.quantity;

              for (let smi: number = 0; smi < matches.length; smi++) {
                let stockMatch: ProductStocks = matches[smi];

                if (stockMatch.quantityAvailable >= soldQty) {
                  stockMatch.quantityAvailable -= soldQty;
                  stockRecordsToBeUpdated.push(stockMatch);

                  purchaseCostPortions.push({
                    q: soldQty,
                    p: stockMatch.price,
                    pr: (p.price * soldQty) - (stockMatch.price * soldQty)
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
                    pr: (p.price * processingQty) - (stockMatch.price * processingQty)
                  })

                  if (soldQty > 0) continue; else break;
                }
              }

              pRec.profit = purchaseCostPortions.reduce((tot: number, portion: any) => tot + portion['pr'], 0) - p.discount;
              pRec.purchaseCostPortions = JSON.stringify(purchaseCostPortions);

            }

            particularsRecords.push(pRec);

          })

          if (existingParticularsRecords.length)
            await salesParticularsRepo.delete(existingParticularsRecords.map((p: SalesParticulars) => p.id));

          await salesParticularsRepo.save(particularsRecords);

          // Update stocks records
          if (stockRecordsToBeUpdated.length > 0) await stocksRepo.save(stockRecordsToBeUpdated);

        }


        response = Object.assign(response, { ...salesRecord });

      } catch (e) {
        await salesRepo.delete(salesRecord.id);

        throw e;
      }

      if (payment.amount > 0) {
        try {
          // Payments entry

          let existingPayments = await paymentRepo.find({ salesRecord: salesRecord });

          let paymentRecord: SalesPayment;

          if (existingPayments.length) paymentRecord = existingPayments.shift();
          else paymentRecord = new SalesPayment();

          paymentRecord.salesRecord = salesRecord;
          paymentRecord.date = date;
          paymentRecord.mode = payment.mode;
          paymentRecord.amount = payment.amount;

          if (existingPayments.length)
            await paymentRepo.delete(existingPayments.map((p: SalesPayment) => p.id));

          await paymentRepo.save(paymentRecord);

          response['payment'] = paymentRecord;

          // Update total payment received
          salesRecord.paymentReceived = payment.amount;
          await salesRepo.save(salesRecord);

          response['paymentReceived'] = salesRecord.paymentReceived;

        } catch (e) {
          await salesParticularsRepo.delete({ salesRecord: salesRecord });
          await salesRepo.delete(salesRecord.id);

          throw e;
        }
      }

      Settings.sendWebContent('saveNewSaleResponse', 200, response);

    } catch (err) {
      Settings.sendWebContent('saveNewSaleResponse', 500, err.message)
    }

  }).catch(Err => Err)

});

// Fetch specific sale data
ipcMain.on('fetchSaleData', (event: IpcMainEvent, { id }) => {

  Settings.getConnection().then(async connection => {
    try {
      let salesRepo = connection.getRepository(Sales),
        particularsRepo = connection.getRepository(SalesParticulars),
        salesPaymentsRepo = connection.getRepository(SalesPayment);

      let record = await salesRepo.findOne(id, { relations: ['customer'] });

      if (!record) {
        Settings.sendWebContent('fetchSaleDataResponse', 404, 'No Sale record found');
        return;
      }

      let response = JSON.parse(JSON.stringify(record));
      response.particulars = await particularsRepo.find({ where: { salesRecord: record }, relations: ['product', 'product.category'] });
      response.payments = await salesPaymentsRepo.find({ where: { salesRecord: record }, order: { date: 'ASC' } });

      Settings.sendWebContent('fetchSaleDataResponse', 200, response);

    } catch (err) {
      Settings.sendWebContent('fetchSaleDataResponse', 500, err.message)
    }

  }).catch(Err => Err)

});

// Delete sales draft
ipcMain.on('deleteSalesDraft', (event: IpcMainEvent, { id }) => {

  Settings.getConnection().then(async connection => {
    try {
      let salesRepo = connection.getRepository(Sales),
        particularsRepo = connection.getRepository(SalesParticulars),
        salesPaymentsRepo = connection.getRepository(SalesPayment);

      let record = await salesRepo.findOne(id);

      if (!record) {
        Settings.sendWebContent('deleteSalesDraftResponse', 404, 'No Sale record found');
        return;
      }

      await particularsRepo.delete({ salesRecord: record });
      await salesPaymentsRepo.delete({ salesRecord: record });
      await salesRepo.delete(record.id);


      Settings.sendWebContent('deleteSalesDraftResponse', 200, 'deleted');

    } catch (err) {
      Settings.sendWebContent('deleteSalesDraftResponse', 500, err.message)
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

      let salesParticularsRepo = connection.getRepository(SalesParticulars);
      let particularsRecords: SalesParticulars[] = await salesParticularsRepo.find({ where: {salesRecord: record}, relations: ['product']});

      // Update stocks
      if (particularsRecords.length > 0) {
        const stocksRepo = connection.getRepository(ProductStocks);
        let particularsRecordsNormalized: any[] = [];

        particularsRecords.forEach((p: SalesParticulars) => {
          let portions = p.purchaseCostPortions !== null? JSON.parse(p.purchaseCostPortions): [];

          portions.forEach((por: any) => {
            particularsRecordsNormalized.push({
              purchasePrice: por['p'],
              productId: p.product.id,
              quantity: por['q']
            })
          });
        })

        if(particularsRecordsNormalized.length > 0){
          let i: number = 0, stockRecords: ProductStocks[] = [];

          let updateStocks = async (loopIndex: number) => {
            let particular: any = particularsRecordsNormalized[loopIndex];
            let purchasePrice = particular['purchasePrice'];
  
            let stockEntries = await stocksRepo.find({ where: { product: particular['productId'], price: purchasePrice } });
  
            if (stockEntries.length) {
              let stockMatchEntry = stockEntries[0];
              stockMatchEntry.quantityAvailable += particular['quantity'];
  
              stockRecords.push(stockMatchEntry);
            }
  
            if (i + 1 < particularsRecordsNormalized.length) {
              i += 1;
              await updateStocks(i);
            }
          }
  
          await updateStocks(0);
          if (stockRecords.length > 0) await stocksRepo.save(stockRecords);
        }
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
      let customerRepo = connection.getRepository(Customer);

      let customers = await customerRepo.find({ order: { name: 'ASC' } });

      Settings.sendWebContent('fetchSalesReportFilterDataResponse', 200, { customers });

    } catch (err) {
      Settings.sendWebContent('fetchSalesReportFilterDataResponse', 500, err.message)
    }

  }).catch(Err => Err)

});

// Sales report filter data for metrics
ipcMain.on('fetchSalesReportFilterDataForMetrics', (event: IpcMainEvent) => {

  Settings.getConnection().then(async connection => {
    try {
      let brandRepo = connection.getRepository(Brand),
        productCategoryRepo = connection.getRepository(ProductCategory);

      let brands = await brandRepo.find({ order: { name: 'ASC' } }),
        productCategories = await productCategoryRepo.find({ order: { category: 'ASC' } });

      Settings.sendWebContent('fetchSalesReportFilterDataForMetricsResponse', 200, { brands, productCategories });

    } catch (err) {
      Settings.sendWebContent('fetchSalesReportFilterDataForMetricsResponse', 500, err.message)
    }

  }).catch(Err => Err)

});