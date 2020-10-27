import { ipcMain, IpcMainEvent, BrowserWindow } from 'electron';
import { Settings } from '../settings';
import { Product, Vendor, Purchase, PurchaseParticulars, PurchasePayment, ProductCategory, Brand } from '../entity';
import { Like, Brackets } from 'typeorm';
import { print, generateRecordNumber } from '../utils';

ipcMain.on('getPurchaseFormData', (event: IpcMainEvent) => {

  Settings.getConnection().then(async connection => {
    try {

      // Fetch vendors list
      let vendorRepository = connection.getRepository(Vendor);

      let cQuery = vendorRepository.createQueryBuilder('c')
        .select(['c.id, c.name, c.phone']);

      cQuery = cQuery.orderBy('c.name', 'ASC');

      const vendors = await cQuery.getRawMany();


      // Fetch products list
      let productRepository = connection.getRepository(Product);

      let query = productRepository.createQueryBuilder('p')
        .select(['p.id, p.price, p.name as productName, b.name as brandName'])
        .leftJoin('brand', 'b', 'b.id=p.brand');

      query = query.orderBy('b.name', 'ASC').orderBy('p.name', 'ASC');

      const products = await query.getRawMany();

      Settings.sendWebContent('getPurchaseFormDataResponse', 200, { vendors, products });

    } catch (err) {
      Settings.sendWebContent('getPurchaseFormDataResponse', 500, err.message)
    }

  }).catch(Err => console.log(Err))

});

// Fetch purchase drafts
ipcMain.on('getPurchaseDrafts', (event: IpcMainEvent) => {

  Settings.getConnection().then(async connection => {
    try {

      let purchaseRepo = connection.getRepository(Purchase);

      let drafts = await purchaseRepo.find({ where: { status: 'DRAFT' }, order: { date: 'ASC' }, withDeleted: false, relations: ['vendor'] });

      Settings.sendWebContent('getPurchaseDraftsResponse', 200, drafts);

    } catch (err) {
      Settings.sendWebContent('getPurchaseDraftsResponse', 500, err.message)
    }

  }).catch(Err => console.log(Err))

});

// List purchase records
ipcMain.on('fetchPurchase', (event: IpcMainEvent, { pageLimit, pageNumber, orderBy, order, searchText, vendorId, startDate, endDate }) => {

  Settings.getConnection().then(async connection => {
    try {
      if (!pageLimit) pageLimit = 20;
      if (!pageNumber) pageNumber = 1;
      if (!orderBy) orderBy = 'name';
      if (!order) order = 'asc';

      let purchaseRepo = connection.getRepository(Purchase);

      let countQuery = purchaseRepo.createQueryBuilder('s')
        .select(['count(s.id) as count'])
        .leftJoin('vendors', 'c', 'c.id=s.vendor');


      let query = purchaseRepo.createQueryBuilder('s')
        .select(['s.id, s.purchaseNumber, s.date, s.totalCost, s.totalDiscount, s.totalDiscountedCost, s.paymentPaid, s.balanceAmount, c.name as vendorName'])
        .leftJoin('vendors', 'c', 'c.id=s.vendor');

      countQuery = countQuery.where(`s.status ='SUBMITTED'`);
      query = query.where(`s.status ='SUBMITTED'`);

      // Vendor filter
      if (vendorId) {

        countQuery = countQuery.andWhere(`c.id = ${vendorId}`);

        query = query.andWhere(`c.id = ${vendorId}`);
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

            if (index == 0) qb.where(`s.purchaseNumber LIKE '%${str}%'`);
            else qb.orWhere(`s.purchaseNumber LIKE '%${str}%'`);

            qb.orWhere(`strftime("%d/%m/%Y", s.date) LIKE '%${str}%'`)
              .orWhere(`c.name LIKE '%${str}%'`)
              .orWhere(`s.totalCost LIKE '%${str}%'`)
              .orWhere(`s.totalDiscount LIKE '%${str}%'`)
              .orWhere(`s.totalDiscountedCost LIKE '%${str}%'`)
              .orWhere(`s.balanceAmount LIKE '%${str}%'`)

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
        purchaseNumber: 's.purchaseNumber',
        vendorName: 'c.name',
        totalCost: 's.totalCost',
        totalDiscount: 's.totalDiscount',
        totalDiscountedCost: 's.totalDiscountedCost',
        balanceAmount: 's.balanceAmount'
      }
      query = query.orderBy(orderByFields[orderBy], order.toUpperCase());

      // Pagination
      let offset = pageNumber * pageLimit - pageLimit;
      query = query.offset(offset).limit(pageLimit);

      const records = await query.getRawMany();

      Settings.sendWebContent('fetchPurchaseResponse', 200, { totalPages, totalRecords, records });

    } catch (err) {
      Settings.sendWebContent('fetchPurchaseResponse', 500, err.message)
    }

  }).catch(Err => console.log(Err))

});

ipcMain.on('saveNewPurchase', (event: IpcMainEvent, { id, status, date, vendor, particulars, payment, totalCost, totalDiscount, totalDiscountedCost, balanceAmount }) => {

  Settings.getConnection().then(async connection => {
    try {

      let response: any = {};

      // Fetch vendors list
      let vendorRepository = connection.getRepository(Vendor);
      let purchaseRepo = connection.getRepository(Purchase);
      let purchaseParticularsRepo = connection.getRepository(PurchaseParticulars);
      let productRepo = connection.getRepository(Product);
      let paymentRepo = connection.getRepository(PurchasePayment);


      let vendorRecord: Vendor;

      if (vendor['vendorId']) {
        vendorRecord = await vendorRepository.findOne({ id: vendor.vendorId });
      }

      if(!vendorRecord) Settings.sendWebContent('saveNewPurchaseResponse', 404, 'Vendor not found');


      // Purchase record
      let purchaseRecord: Purchase;

      if (id) {
        purchaseRecord = await purchaseRepo.findOne(id);

        if (!purchaseRecord) {
          Settings.sendWebContent('saveNewPurchaseResponse', 404, 'Purchase record not found');
          return;
        }

      } else {
        purchaseRecord = new Purchase();
      }

      purchaseRecord.date = date;
      purchaseRecord.vendor = vendorRecord;
      purchaseRecord.totalCost = totalCost;
      purchaseRecord.totalDiscount = totalDiscount;
      purchaseRecord.totalDiscountedCost = totalDiscountedCost;
      purchaseRecord.paymentPaid = 0;
      purchaseRecord.balanceAmount = balanceAmount;
      purchaseRecord.status = status;

      if (status === 'SUBMITTED') {
        let lastNumber = 1;

        let lastSubmittedPurchase = await purchaseRepo.find({
          where: { status: 'SUBMITTED' },
          order: {
            id: 'DESC'
          },
          take: 1
        });

        if (lastSubmittedPurchase.length) {
          lastNumber = parseInt(lastSubmittedPurchase[0].purchaseNumber.replace('P', '')) + 1;
        }

        purchaseRecord.purchaseNumber = generateRecordNumber('P', lastNumber);
      }

      await purchaseRepo.save(purchaseRecord);


      try {
        // Particulars entries
        if (particulars.length > 0) {
          let existingParticularsRecords: Array<PurchaseParticulars> = await purchaseParticularsRepo.find({ purchaseRecord: purchaseRecord });
          let particularsRecords: Array<PurchaseParticulars> = [];

          let products = await productRepo.findByIds(particulars.map((p: any) => p.productId));

          particulars.forEach((p: any) => {

            let pRec: PurchaseParticulars;

            if (existingParticularsRecords.length) {
              pRec = existingParticularsRecords.shift();
            } else {
              pRec = new PurchaseParticulars();
            }

            pRec.purchaseRecord = purchaseRecord;
            pRec.product = p.productId;
            pRec.price = p.price;
            pRec.quantity = p.quantity;
            pRec.cost = p.cost;
            pRec.discount = p.discount;
            pRec.discountedCost = p.discountedCost;

            particularsRecords.push(pRec);

          })

          if (existingParticularsRecords.length)
            await purchaseParticularsRepo.delete(existingParticularsRecords.map((p: PurchaseParticulars) => p.id));

          await purchaseParticularsRepo.save(particularsRecords);
        }


        response = Object.assign(response, { ...purchaseRecord });

      } catch (e) {
        await purchaseRepo.delete(purchaseRecord.id);

        throw e;
      }

      if (payment.amount > 0) {
        try {
          // Payments entry

          let existingPayments = await paymentRepo.find({ purchaseRecord: purchaseRecord });

          let paymentRecord: PurchasePayment;

          if (existingPayments.length) paymentRecord = existingPayments.shift();
          else paymentRecord = new PurchasePayment();

          paymentRecord.purchaseRecord = purchaseRecord;
          paymentRecord.date = date;
          paymentRecord.mode = payment.mode;
          paymentRecord.amount = payment.amount;

          if (existingPayments.length)
            await paymentRepo.delete(existingPayments.map((p: PurchasePayment) => p.id));

          await paymentRepo.save(paymentRecord);

          response['payment'] = paymentRecord;

          // Update total payment received
          purchaseRecord.paymentPaid = payment.amount;
          await purchaseRepo.save(purchaseRecord);

          response['paymentPaid'] = purchaseRecord.paymentPaid;

        } catch (e) {
          await purchaseParticularsRepo.delete({ purchaseRecord: purchaseRecord });
          await purchaseRepo.delete(purchaseRecord.id);

          throw e;
        }
      }

      Settings.sendWebContent('saveNewPurchaseResponse', 200, response);

    } catch (err) {
      Settings.sendWebContent('saveNewPurchaseResponse', 500, err.message)
    }

  }).catch(Err => Err)

});

// Fetch specific sale data
ipcMain.on('fetchPurchaseData', (event: IpcMainEvent, { id }) => {

  Settings.getConnection().then(async connection => {
    try {
      let purchaseRepo = connection.getRepository(Purchase),
        particularsRepo = connection.getRepository(PurchaseParticulars),
        purchasePaymentsRepo = connection.getRepository(PurchasePayment);

      let record = await purchaseRepo.findOne(id, { relations: ['vendor'] });

      if (!record) {
        Settings.sendWebContent('fetchPurchaseDataResponse', 404, 'No Purchase record found');
        return;
      }

      let response = JSON.parse(JSON.stringify(record));
      response.particulars = await particularsRepo.find({ where: { purchaseRecord: record }, relations: ['product', 'product.category'] });
      response.payments = await purchasePaymentsRepo.find({ where: { purchaseRecord: record } });

      Settings.sendWebContent('fetchPurchaseDataResponse', 200, response);

    } catch (err) {
      Settings.sendWebContent('fetchPurchaseDataResponse', 500, err.message)
    }

  }).catch(Err => Err)

});

// Delete purchase draft
ipcMain.on('deletePurchaseDraft', (event: IpcMainEvent, { id }) => {

  Settings.getConnection().then(async connection => {
    try {
      let purchaseRepo = connection.getRepository(Purchase),
        particularsRepo = connection.getRepository(PurchaseParticulars),
        purchasePaymentsRepo = connection.getRepository(PurchasePayment);

      let record = await purchaseRepo.findOne(id);

      if (!record) {
        Settings.sendWebContent('deletePurchaseDraftResponse', 404, 'No Purchase record found');
        return;
      }

      await particularsRepo.delete({ purchaseRecord: record });
      await purchasePaymentsRepo.delete({ purchaseRecord: record });
      await purchaseRepo.delete(record.id);


      Settings.sendWebContent('deletePurchaseDraftResponse', 200, 'deleted');

    } catch (err) {
      Settings.sendWebContent('deletePurchaseDraftResponse', 500, err.message)
    }

  }).catch(Err => Err)

});

// Delete sale
ipcMain.on('deletePurchase', (event: IpcMainEvent, { id }) => {

  Settings.getConnection().then(async connection => {
    try {
      let purchaseRepo = connection.getRepository(Purchase);

      let record = await purchaseRepo.findOne(id);

      if (!record) {
        Settings.sendWebContent('deletePurchaseDraftResponse', 404, 'No Purchase record found');
        return;
      }

      await purchaseRepo.softDelete(record.id);

      Settings.sendWebContent('deletePurchaseResponse', 200, 'deleted');

    } catch (err) {
      Settings.sendWebContent('deletePurchaseResponse', 500, err.message)
    }

  }).catch(Err => Err)

});

// Purchase report filter data
ipcMain.on('fetchPurchaseReportFilterData', (event: IpcMainEvent) => {

  Settings.getConnection().then(async connection => {
    try {
      let vendorRepo = connection.getRepository(Vendor);

      let vendors = await vendorRepo.find({ order: { name: 'ASC' } });

      Settings.sendWebContent('fetchPurchaseReportFilterDataResponse', 200, { vendors });

    } catch (err) {
      Settings.sendWebContent('fetchPurchaseReportFilterDataResponse', 500, err.message)
    }

  }).catch(Err => Err)

});

// Purchase report filter data for metrics
ipcMain.on('fetchPurchaseReportFilterDataForMetrics', (event: IpcMainEvent) => {

  Settings.getConnection().then(async connection => {
    try {
      let brandRepo = connection.getRepository(Brand),
        productCategoryRepo = connection.getRepository(ProductCategory);

      let brands = await brandRepo.find({ order: { name: 'ASC' } }),
        productCategories = await productCategoryRepo.find({ order: { category: 'ASC' } });

      Settings.sendWebContent('fetchPurchaseReportFilterDataForMetricsResponse', 200, { brands, productCategories });

    } catch (err) {
      Settings.sendWebContent('fetchPurchaseReportFilterDataForMetricsResponse', 500, err.message)
    }

  }).catch(Err => Err)

});