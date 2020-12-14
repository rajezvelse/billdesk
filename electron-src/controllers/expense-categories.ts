import { ipcMain, IpcMainEvent } from 'electron';
import { Settings } from '../settings';
import { ExpenseCategory } from '../entity';
import { print } from '../utils';

// List expense categories
ipcMain.on('fetchExpenseCategories', (params?: any) => {

  Settings.getConnection().then(async connection => {
    let expenseCategoryRepository = connection.getRepository(ExpenseCategory);

    const expenseCategories = await expenseCategoryRepository.find();

    Settings.sendWebContent('fetchExpenseCategoriesResponse', 200, expenseCategories);

  }).catch(Err => console.log(Err))

});


// Create new expense category
ipcMain.on('addNewExpenseCategory', (event: IpcMainEvent, { category }) => {

  Settings.getConnection().then(async connection => {

    let expenseCategoryRepository = connection.getRepository(ExpenseCategory);

    let expenseCategory = new ExpenseCategory();
    expenseCategory.category = category;

    await expenseCategoryRepository.save(expenseCategory);


    Settings.sendWebContent('addNewExpenseCategoryResponse', 200, expenseCategory)

  }).catch(Err => print(Err, 'danger'))

});


// Update expense category
ipcMain.on('updateExpenseCategory', (event: IpcMainEvent, { id, category }) => {

  Settings.getConnection().then(async connection => {

    let expenseCategoryRepository = connection.getRepository(ExpenseCategory);

    let expenseCategory = await expenseCategoryRepository.findOne({ id: id });

    if (!expenseCategory) {
        Settings.sendWebContent('updateExpenseCategoryResponse', 400, 'Expense category not found');
        return;
    }

    expenseCategory.category = category;

    await expenseCategoryRepository.save(expenseCategory);

    Settings.sendWebContent('updateExpenseCategoryResponse', 200, expenseCategory)

  }).catch(Err => print(Err, 'danger'))

});

// Delete expense category
ipcMain.on('deleteExpenseCategory', (event: IpcMainEvent, { id }) => {

  Settings.getConnection().then(async connection => {

    let expenseCategoryRepository = connection.getRepository(ExpenseCategory);

    let expenseCategory = await expenseCategoryRepository.findOne({ id: id });

    if (!expenseCategory) {
        Settings.sendWebContent('deleteExpenseCategoryResponse', 400, 'Expense category not found');
        return;
    }

    await expenseCategoryRepository.softDelete({ id: id });

    Settings.sendWebContent('deleteExpenseCategoryResponse', 200, 'deleted')

  }).catch(Err => print(Err, 'danger'))

});