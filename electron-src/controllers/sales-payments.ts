import { ipcMain, IpcMainEvent, BrowserWindow } from 'electron';
import { Settings } from '../settings';
import { Product, Customer, Sales, SalesParticulars, SalesPayment } from '../entity';
import { Like, Brackets } from 'typeorm';
import { print, generateRecordNumber } from '../utils';

// List all payment of a particular sale
ipcMain.on('fetchSalePayments', (event: IpcMainEvent, { saleId}) => {

  Settings.getConnection().then(async connection => {
    try {
      let paymentRepo = connection.getRepository(SalesPayment);
      let records = await paymentRepo.find({ where: { salesRecord: saleId }, order: { date: 'ASC'}});

      Settings.sendWebContent('fetchSalePaymentsResponse', 200, records);
    } catch (err) {
      Settings.sendWebContent('fetchSalePaymentsResponse', 500, err.message)
    }

  }).catch(Err => console.log(Err))

});

// Add new sales payment
ipcMain.on('addNewSalePayment', (event: IpcMainEvent, { saleId, date, mode, amount }) => {

  Settings.getConnection().then(async connection => {
    try {
      let paymentRepo = connection.getRepository(SalesPayment);

      let record = new SalesPayment();
      record.salesRecord = saleId;
      record.date = date;
      record.mode = mode;
      record.amount = amount;

      await paymentRepo.save(record);

      let payments = await paymentRepo.find({ where: { salesRecord: saleId }});

      let total: number = 0;

      payments.forEach((p: SalesPayment) => {
        total += p.amount;
      })

      let saleRepo = connection.getRepository(Sales);
      let saleRecord = await saleRepo.findOne(saleId);
      saleRecord.outstandingAmount = saleRecord.totalDiscountedCost - total;

      await saleRepo.save(saleRecord);

      Settings.sendWebContent('addNewSalePaymentResponse', 200, record);
    } catch (err) {
      Settings.sendWebContent('addNewSalePaymentResponse', 500, err.message)
    }

  }).catch(Err => console.log(Err))

});

// Delete specific sale payment record
ipcMain.on('deleteSalePayment', (event: IpcMainEvent, { id }) => {

  Settings.getConnection().then(async connection => {
    try {
      let paymentRepo = connection.getRepository(SalesPayment);
      let record = await paymentRepo.findOne(id, { relations: ['salesRecord']});

      if(!record)  Settings.sendWebContent('deleteSalePaymentResponse', 404, 'Sales payment record not found');

      let saleId = record.salesRecord.id;

      await paymentRepo.delete(id);

      let payments = await paymentRepo.find({ where: { salesRecord: saleId }});

      let total: number = 0;

      payments.forEach((p: SalesPayment) => {
        total += p.amount;
      })

      let saleRepo = connection.getRepository(Sales);
      let saleRecord = await saleRepo.findOne(saleId);
      saleRecord.paymentReceived = total;
      saleRecord.outstandingAmount = saleRecord.totalDiscountedCost - total;

      await saleRepo.save(saleRecord);


      Settings.sendWebContent('deleteSalePaymentResponse', 200, 'deleted');
    } catch (err) {
      Settings.sendWebContent('deleteSalePaymentResponse', 500, err.message)
    }

  }).catch(Err => console.log(Err))

});