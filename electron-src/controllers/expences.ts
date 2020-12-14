import { ipcMain, IpcMainEvent, BrowserWindow } from 'electron';
import { Settings } from '../settings';
import { Expense, ExpenseCategory } from '../entity';
import { Like, Brackets } from 'typeorm';
import { print } from '../utils';
import * as moment from 'moment';

ipcMain.on('fetchExpenses', (event: IpcMainEvent, { pageLimit, pageNumber, orderBy, order, categoryId, searchText, startDate, endDate }) => {

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

      let expenseRepository = connection.getRepository(Expense);

      let countQuery = expenseRepository.createQueryBuilder('p')
        .select(['count(p.id) as count']);


      let totalQuery = expenseRepository.createQueryBuilder('p')
        .select(['sum(p.amount) as totalExpense']);

      let query = expenseRepository.createQueryBuilder('p')
        .select(['p.id, p.date, p.description, p.amount, c.id as category, c.category as categoryName']);

      countQuery = countQuery.leftJoin('expense_category', 'c', 'c.id=p.category');
      totalQuery = totalQuery.leftJoin('expense_category', 'c', 'c.id=p.category');

      query = query.leftJoin('expense_category', 'c', 'c.id=p.category');

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

      if (categoryId) {
        countQuery = countQuery.andWhere(`c.id = ${categoryId}`);
        totalQuery = totalQuery.andWhere(`c.id = ${categoryId}`);
        query = query.andWhere(`c.id = ${categoryId}`);

      }

      if (searchText) {
        let sQ = new Brackets(qb => {

          searchText.split(" ").forEach((str: any, index: any) => {

            if (index == 0) qb.where(`p.description LIKE '%${str}%'`);
            else qb.orWhere(`p.description LIKE '%${str}%'`);

            qb.orWhere(`c.category LIKE '%${str}%'`)
              .orWhere(`p.amount LIKE '%${str}%'`);

          });
        });


        countQuery = countQuery.andWhere(sQ);
        totalQuery = totalQuery.andWhere(sQ);
        query = query.andWhere(sQ);

      }


      // Total records count
      const countExpenses = await countQuery.getRawMany();
      const totalExpenseResult = await totalQuery.getRawMany();
      let totalRecords = countExpenses[0]['count'];
      let totalExpense = totalExpenseResult[0]['totalExpense'];
      let totalPages = Math.ceil(totalRecords / pageLimit);

      // Sorting
      let orderByFields: any = {
        date: 'p.date',
        description: 'p.description',
        amount: 'p.amount',
        categoryName: 'c.category'
      }
      query = query.orderBy(orderByFields[orderBy], order.toUpperCase());

      // Pagination
      let offset = (pageNumber * pageLimit) - pageLimit;
      query = query.offset(offset).limit(pageLimit);

      const records = await query.getRawMany();

      Settings.sendWebContent('fetchExpensesResponse', 200, { totalPages, totalRecords, totalExpense, records });

    } catch (err) {
      Settings.sendWebContent('fetchExpensesResponse', 500, err.message)
    }

  }).catch(Err => console.log(Err))

});

// Search expenses
ipcMain.on('searchExpenses', (event: IpcMainEvent, { categoryId, searchText }) => {

  Settings.getConnection().then(async connection => {
    try {

      let expenseRepository = connection.getRepository(Expense);

      let query = expenseRepository.createQueryBuilder('p')
        .select(['p.id, p.date, p.description, p.amount, c.id as category, c.category as categoryName'])
        .leftJoin('expense_category', 'c', 'c.id=p.category');

      let filterApplied = false;

      if (categoryId) {
        if (filterApplied) {
          query = query.andWhere(`c.id = ${categoryId}`);
        }
        else {
          query = query.where(`c.id = ${categoryId}`);
        }

        filterApplied = true;
      }

      if (searchText) {
        let sQ = new Brackets(qb => {

          searchText.split(" ").forEach((str: any, index: any) => {

            if (index == 0) qb.where(`p.description LIKE '%${str}%'`);
            else qb.orWhere(`p.description LIKE '%${str}%'`);

            qb.orWhere(`c.category LIKE '%${str}%'`)
              .orWhere(`p.amount LIKE '%${str}%'`);

          });
        });

        if (filterApplied) {
          query = query.andWhere(sQ);
        }
        else {
          query = query.where(sQ);
        }

        filterApplied = true;
      }

      query.orderBy('description', 'ASC');
      const records = await query.getRawMany();

      Settings.sendWebContent('searchExpensesResponse', 200, { records });

    } catch (err) {
      Settings.sendWebContent('searchExpensesResponse', 500, err.message)
    }

  }).catch(Err => console.log(Err))

});

ipcMain.on('getExpenseFormData', (params?: any) => {
  Settings.getConnection().then(async connection => {
    try {
      let pcRepo = connection.getRepository(ExpenseCategory);

      let categories = await pcRepo.find({ select: ['id', 'category'], order: { category: 'ASC' } });

      Settings.sendWebContent('getExpenseFormDataResponse', 200, { categories });

    } catch (err) {
      Settings.sendWebContent('getExpenseFormDataResponse', 500, err.message)
    }
  }).catch(Err => console.log(Err));
})


// Create new expense
ipcMain.on('addNewExpense', (event: IpcMainEvent, { date, description, category, amount }) => {

  Settings.getConnection().then(async connection => {

    try {
      let expenseRepository = connection.getRepository(Expense);

      let expense = new Expense();
      expense.date = date;
      expense.description = description;
      expense.category = category;
      expense.amount = amount;

      await expenseRepository.save(expense);


      Settings.sendWebContent('addNewExpenseResponse', 200, expense)

    } catch (err) {
      Settings.sendWebContent('addNewExpenseResponse', 500, err.message)
    }

  }).catch(Err => print(Err, 'danger'))

});


// Update expense
ipcMain.on('updateExpense', (event: IpcMainEvent, { id, date, description, category, amount }) => {

  Settings.getConnection().then(async connection => {

    try {
      let expenseRepository = connection.getRepository(Expense);

      let expense = await expenseRepository.findOne({ id: id });

      if (!expense) {
        Settings.sendWebContent('updateExpenseResponse', 400, 'Expense not found');
        return;
      }

      expense.date = date;
      expense.description = description;
      expense.category = category;
      expense.amount = amount;

      await expenseRepository.save(expense);

      Settings.sendWebContent('updateExpenseResponse', 200, expense)

    } catch (err) {
      Settings.sendWebContent('updateExpenseResponse', 500, err.message)
    }
  }).catch(Err => print(Err, 'danger'))

});

// Delete expense
ipcMain.on('deleteExpense', (event: IpcMainEvent, { id }) => {

  Settings.getConnection().then(async connection => {
    try {
      let expenseRepository = connection.getRepository(Expense);

      let expense = await expenseRepository.findOne({ id: id });

      if (!expense) {
        Settings.sendWebContent('deleteExpenseResponse', 400, 'Expense not found');
        return;
      }

      await expenseRepository.softDelete({ id: id });

      Settings.sendWebContent('deleteExpenseResponse', 200, 'deleted')

    } catch (err) {
      Settings.sendWebContent('deleteExpenseResponse', 500, err.message)
    }

  }).catch(Err => print(Err, 'danger'))

});
