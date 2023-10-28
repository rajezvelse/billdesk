import { ipcMain, IpcMainEvent, BrowserWindow } from 'electron';
import { Settings } from '../settings';
import { Product, Purchase, PurchaseParticulars, PurchasePayment } from '../entity';
import { Like, Brackets } from 'typeorm';
import { print, generateRecordNumber } from '../utils';

// List all payment of a particular purchase
ipcMain.on('fetchPurchasePayments', (event: IpcMainEvent, { purchaseId }) => {

  Settings.getConnection().then(async connection => {
    try {
      let paymentRepo = connection.getRepository(PurchasePayment);
      let records = await paymentRepo.find({ where: { purchaseRecord: purchaseId }, order: { date: 'ASC' } });

      Settings.sendWebContent('fetchPurchasePaymentsResponse', 200, records);
    } catch (err) {
      Settings.sendWebContent('fetchPurchasePaymentsResponse', 500, err.message)
    }

  }).catch(Err => console.log(Err))

});

// Add new purchase payment
ipcMain.on('addNewPurchasePayment', (event: IpcMainEvent, { purchaseId, date, mode, amount }) => {

  Settings.getConnection().then(async connection => {
    try {
      let paymentRepo = connection.getRepository(PurchasePayment);

      let record = new PurchasePayment();
      record.purchaseRecord = purchaseId;
      record.date = date;
      record.mode = mode;
      record.amount = amount;

      await paymentRepo.save(record);

      let payments = await paymentRepo.find({ where: { purchaseRecord: purchaseId } });

      let total: number = 0;

      payments.forEach((p: PurchasePayment) => {
        total += p.amount;
      })

      let purchaseRepo = connection.getRepository(Purchase);
      let purchaseRecord = await purchaseRepo.findOne(purchaseId);

      if (!purchaseRecord) {
        throw new Error('Couldn\'t retrive the created record')
      }

      purchaseRecord.paymentPaid = total;
      purchaseRecord.balanceAmount = purchaseRecord.totalDiscountedCost - total;

      await purchaseRepo.save(purchaseRecord);

      Settings.sendWebContent('addNewPurchasePaymentResponse', 200, record);
    } catch (err) {
      Settings.sendWebContent('addNewPurchasePaymentResponse', 500, err.message)
    }

  }).catch(Err => console.log(Err))

});

// Delete specific purchase payment record
ipcMain.on('deletePurchasePayment', (event: IpcMainEvent, { id }) => {

  Settings.getConnection().then(async connection => {
    try {
      let paymentRepo = connection.getRepository(PurchasePayment);
      let record = await paymentRepo.findOne({ where: { id: id }, relations: ['purchaseRecord'] });

      if (!record) {
        Settings.sendWebContent('deletePurchasePaymentResponse', 404, 'Purchase payment record not found');
        return
      }

      let purchaseId = record.purchaseRecord.id;

      await paymentRepo.delete(id);

      let payments = await paymentRepo.find({ where: { purchaseRecord: record.purchaseRecord } });

      let total: number = 0;

      payments.forEach((p: PurchasePayment) => {
        total += p.amount;
      })

      let purchaseRepo = connection.getRepository(Purchase);
      let purchaseRecord = await purchaseRepo.findOne({ where: { id: purchaseId } });
      if (!purchaseRecord) {
        throw new Error("Couldn't retrive the purchase record to update the balance")
      }
      purchaseRecord.paymentPaid = total;
      purchaseRecord.balanceAmount = purchaseRecord.totalDiscountedCost - total;

      await purchaseRepo.save(purchaseRecord);


      Settings.sendWebContent('deletePurchasePaymentResponse', 200, 'deleted');
    } catch (err) {
      Settings.sendWebContent('deletePurchasePaymentResponse', 500, err.message)
    }

  }).catch(Err => console.log(Err))

});