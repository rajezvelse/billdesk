import React from 'react'
import ReactComponent from '../../react-component'

import { IpcRendererEvent } from "electron";
import RootContext from '../../root.context';


import ProductAddDialog from '../products/product-add-dialog';
import SalesDrafts from './sales-drafts';

import {
  SectionTitle, SubSectionTitle, SubSection, Form, ParticularsTable,
  ParticularsTextField, ParticularsQtyField,
  ParticularsDiscountField, RightAlignedTd, NoBorderTd,
  Autocomplete, ParticularsAutoComplete, ParticularsTableSelect,
  ValidationError, RequiredAstrix, FormActions, TableHead,
  NoBorderWhiteTh, StyledModal, WarningModalActions
} from '../../styled-components';

import {
  Grid, CardContent, TextField, Button,
  MenuItem, IconButton, Tooltip, InputAdornment, Drawer
} from '@material-ui/core';
import HighlightOffIcon from '@material-ui/icons/HighlightOff';
import ViewListIcon from '@material-ui/icons/ViewList';
import DateFnsUtils from '@date-io/date-fns';
import {
  MuiPickersUtilsProvider,
  DatePicker,
} from '@material-ui/pickers';

import { withSnackbar, WithSnackbarProps } from 'notistack';

import * as Yup from 'yup';
import { Formik, Field, ErrorMessage, getIn, FieldArray } from 'formik';

import { Currency } from '../../directives';

import { uniqueId } from 'lodash';


interface formValuesType {
  date: Date;
  customer: {
    customerId: number | null;
    name: string;
    phone: string;
  };
  particulars: Array<{
    uid: string;
    rowNumber: number;
    productId: number | null;
    quantityAvailable: number;
    quantityRemaining: number;
    price: number;
    quantity: number;
    cost: number;
    discount: number;
    discountedCost: number;
  }>;
  payment: {
    mode: string;
    amount: number;
  };
}

class NewSale extends ReactComponent<WithSnackbarProps & { saleId: number; }, {
  customers: Array<any>;
  products: Array<any>;
  customerDetailsActionField: string | null;
  formValues: formValuesType;
  particularsLastRowNum: number;
  addNewProduct: {
    showModal: boolean;
    inputString: string;
    selectedIndex: number | null;
  };
  showDraftDrawer: boolean;
  saveError: null | string;
  saleId: number | null;
  showPaymentDeleteWarning: boolean;
  deleting: boolean;
  deleteError: null | string;
}> {

  validationSchema: Yup.ObjectSchema = Yup.object().shape({
    date: Yup.date().required('Please enter the date').nullable(),
    customer: Yup.object().shape({
      customerId: Yup.number().positive().integer().nullable(),
      name: Yup.string().required('Enter customer name').nullable(),
      phone: Yup.string().nullable().matches(/^(?:(?:\+|0{0,2})91(\s*[\ -]\s*)?|[0]?)?[789]\d{9}|(\d[ -]?){10}\d$/, 'Enter valid phone number')
    }),
    particulars: Yup.array().of(
      Yup.object().shape({
        rowNumber: Yup.number(),
        productId: Yup.number().when('rowNumber', {
          is: (rowNumber: number) => rowNumber < this.state.particularsLastRowNum,
          then: Yup.number().required().positive().integer().nullable(false),
          otherwise: Yup.number().nullable()
        }),
        quantityAvailable: Yup.number(),
        quantityRemaining: Yup.number().moreThan(-1),
        price: Yup.number().when('productId', {
          is: (productId: any) => !!productId,
          then: Yup.number().required(),
          otherwise: Yup.number()
        }),
        quantity: Yup.number().when('productId', {
          is: (productId: any) => !!productId,
          then: Yup.number().required().moreThan(0),
          otherwise: Yup.number()
        }),
        cost: Yup.number().when('productId', {
          is: (productId: any) => !!productId,
          then: Yup.number().required(),
          otherwise: Yup.number()
        }),
        discount: Yup.number().when('productId', {
          is: (productId: any) => !!productId,
          then: Yup.number().required().min(0),
          otherwise: Yup.number()
        }),
        discountedCost: Yup.number().when('productId', {
          is: (productId: any) => !!productId,
          then: Yup.number().required(),
          otherwise: Yup.number()
        })
      })
    ),
    payment: Yup.object().shape({
      mode: Yup.mixed().oneOf(['CASH', 'GPAY', 'NETBANKING']),
      amount: Yup.number().min(0)
    })
  });

  constructor(props: any) {
    super(props);

    this.state = {
      customers: [],
      products: [],
      customerDetailsActionField: null,
      formValues: this.getFormDefaultValue(),
      particularsLastRowNum: 1,
      addNewProduct: {
        showModal: false,
        inputString: '',
        selectedIndex: null
      },
      showDraftDrawer: false,
      saveError: null,
      saleId: props.saleId,
      showPaymentDeleteWarning: false,
      deleting: false,
      deleteError: null
    };

  }

  componentDidMount() {
    super.componentDidMount();

    this.loadFormData();
  }

  componentWillReceiveProps(nextProps: any) {

    this.onNewProps(nextProps);
  }

  onNewProps(nextProps: any) {

    // if (nextProps.saleId) {
      if (nextProps.saleId && nextProps.saleId !== this.state.saleId) {
        this.fetchSaleData(nextProps.saleId);
      }
    // } else {
    //   this.setState({
    //     formValues: this.getFormDefaultValue(),
    //     customerDetailsActionField: null,
    //     particularsLastRowNum: 1,
    //     saleId: null
    //   })
    // }
  }


  loadFormData = (valuesToBeUpdated?: any) => {
    this.context.electronIpc.once("getSalesFormDataResponse", (event: IpcRendererEvent, status: number, response: any) => {
      this.context.setLoading(false);

      // On fail
      if (status !== 200) {
        console.log(response)
        return;
      }

      if (valuesToBeUpdated instanceof Object) valuesToBeUpdated = Object.assign(valuesToBeUpdated, { customers: response.customers, products: response.products });
      else valuesToBeUpdated = { customers: response.customers, products: response.products };

      this.setState(valuesToBeUpdated);
    });

    this.context.setLoading(true);
    this.context.electronIpc.send("getSalesFormData");
  }

  fetchSaleData = (saleId: number | null) => {

    this.context.electronIpc.once("fetchSaleDataResponse", (event: IpcRendererEvent, status: number, response: any) => {
      this.context.setLoading(false);

      // On fail
      if (status !== 200) {
        console.log(response)
        // this.setState({ data: null, fetchError: response });
        return;
      }

      this.setState({
        formValues: {
          date: response.date,
          customer: {
            customerId: response.customer.id,
            name: response.customer.name,
            phone: response.customer.phone
          },
          particulars: response.particulars.map((p: any, index: number) => {
            let product: any = this.state.products.find((pdt: any) => pdt.id === p.product.id);
            let qtyA: number = product ? product.quantityAvailable : 0;

            return {
              uid: uniqueId(),
              rowNumber: index + 1,
              quantityAvailable: qtyA,
              quantityRemaining: qtyA - p.quantity,
              productId: p.product.id,
              price: p.price,
              quantity: p.quantity,
              cost: p.cost,
              discount: p.discount,
              discountedCost: p.discountedCost
            }
          }),
          payment: response.payments.length ? {
            mode: response.payments[0].mode,
            amount: response.payments[0].amount
          } : {
              mode: 'CASH',
              amount: 0
            }
        },
        customerDetailsActionField: 'name',
        particularsLastRowNum: response.particulars.length,
        saleId: saleId,
        showDraftDrawer: false

      });

    });

    this.context.setLoading(true);
    this.context.electronIpc.send("fetchSaleData", { id: saleId });
  }

  insertRow = () => {

    let formValues: any = this.state.formValues;

    formValues.particulars.push(this.getNewRow());

    this.setState({
      formValues: formValues,
      particularsLastRowNum: this.state.formValues.particulars.length
    })

  }

  updateItemRow = (setFieldValue: Function, arrayHelpers: any, index: number, price: number, qty: number, discount: number, quantityRemaining: number, modifiedField?: string) => {
    let cost: number = price * qty,
      dCost: number = (cost - discount),
      fPrefix: string = `particulars[${index}].`;

    // Updating available qty
    setFieldValue(fPrefix + 'quantityRemaining', quantityRemaining, true);

    if (modifiedField !== 'price') setFieldValue(fPrefix + 'price', price, true);
    if (modifiedField !== 'quantity') setFieldValue(fPrefix + 'quantity', qty, true);
    if (modifiedField !== 'cost') setFieldValue(fPrefix + 'cost', cost, true);
    if (modifiedField !== 'discount') setFieldValue(fPrefix + 'discount', discount, true);
    if (modifiedField !== 'discountedCost') setFieldValue(fPrefix + 'discountedCost', dCost, true);



  }

  getFormDefaultValue = (): any => {
    return {
      date: new Date(),
      customer: {
        customerId: null,
        name: '',
        phone: ''
      },
      particulars: [this.getNewRow()],
      payment: {
        mode: 'CASH',
        amount: 0
      }
    }
  }

  getNewRow = () => {

    return {
      uid: uniqueId() + (new Date()).getTime(),
      rowNumber: this.state ? this.state.particularsLastRowNum + 1 : 1,
      quantityAvailable: 0,
      quantityRemaining: 0,
      productId: null,
      price: 0,
      quantity: 0,
      cost: 0,
      discount: 0,
      discountedCost: 0
    }
  }

  getTotal = (values: Array<any>, field: string) => {
    let t: number = 0;

    values.forEach((v: any) => {
      t += parseFloat(v[field]);
    })

    return t;
  }

  handleSubmit = (action: 'DRAFT' | 'SUBMIT' | 'SUBMITNEW', values: formValuesType): Promise<any> => {
    return new Promise((resolve, reject) => {
      values.particulars = values.particulars.filter((p: any) => !!p.productId).map((p: any) => {

        delete p['uid'];
        delete p['rowNumber'];

        return p;
      });

      let totalCost: number = this.getTotal(values.particulars, 'cost'),
        totalDiscount: number = this.getTotal(values.particulars, 'discount'),
        totalDiscountedCost: number = this.getTotal(values.particulars, 'discountedCost'),
        outstandingAmount: number = totalDiscountedCost - values.payment.amount;

      let status = action === 'DRAFT' ? 'DRAFT' : 'SUBMITTED';

      this.context.electronIpc.once('saveNewSaleResponse', (event: IpcRendererEvent, status: number, response: any) => {
        this.context.setLoading(false);

        // On fail
        if (status !== 200) {
          reject(response);

          this.setState({
            saveError: response, formValues: values
          });

          return;
        }

        this.props.enqueueSnackbar('Saved', { variant: 'success' })

        // On success
        if (action === 'DRAFT' || action === 'SUBMITNEW') {
          resolve(action);
        }
        else if (action === 'SUBMIT') {
          this.context.navigate('SaleDetails', { id: response.id }, 'Sale details');
        }

      });

      let id = this.state.saleId || null;

      // Send signal
      this.context.setLoading(true);
      this.context.electronIpc.send('saveNewSale', { id, ...values, status, totalCost, totalDiscount, totalDiscountedCost, outstandingAmount })
    });
  }

  deleteDraft = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      this.context.electronIpc.once("deleteSalesDraftResponse", (event: IpcRendererEvent, status: number, response: any) => {
        this.context.setLoading(false);

        // On fail
        if (status !== 200) {
          console.log(response)

          this.setState({ deleteError: response, deleting: false, showPaymentDeleteWarning: false }, () => {
            reject(response);
          });

          return;
        }

        this.setState({ deleting: false, deleteError: null, showPaymentDeleteWarning: false }, () => {
          resolve(true);
        });

        this.props.enqueueSnackbar('Draft deleted', { variant: 'success' })
      });

      this.context.setLoading(true);
      this.context.electronIpc.send("deleteSalesDraft", { id: this.state.saleId });
    })
  }

  onNewProductDialogClose = (val: any) => {
    let stateVal: any = this.state;
    stateVal.addNewProduct.showModal = false;
    stateVal.addNewProduct.inputString = '';

    if (val instanceof Object) {
      stateVal.formValues.particulars[this.state.addNewProduct.selectedIndex as number].productId = val.id;
      stateVal.formValues.particulars[this.state.addNewProduct.selectedIndex as number].quantity = 1;
      stateVal.formValues.particulars[this.state.addNewProduct.selectedIndex as number].price = val.price;
      stateVal.formValues.particulars[this.state.addNewProduct.selectedIndex as number].cost = val.price;
      stateVal.formValues.particulars[this.state.addNewProduct.selectedIndex as number].discountedCost = val.price;
    }

    // Reinitialize form
    this.loadFormData(stateVal);
  }

  // Debounce function from type listener
  timerId: number | null = null;
  debounce = (callback: Function) => {

    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }

    this.timerId = setTimeout(e => { callback(); }, 800);

  }

  render() {
    return (<>
      <RootContext.Consumer>
        {({ navigate }) => (
          <>
            <MuiPickersUtilsProvider utils={DateFnsUtils}>
              <Formik initialValues={{ ...this.state.formValues }}
                validationSchema={this.validationSchema}
                validateOnMount={true}
                enableReinitialize={true}
                onSubmit={(values, { setSubmitting, resetForm, setTouched }) => {
                  this.handleSubmit('SUBMIT', values).then(val => {
                    setSubmitting(false);

                    if (val === 'DRAFT' || val === 'SUBMITNEW') this.setState({ formValues: this.getFormDefaultValue(), saleId: null }, () => {
                      resetForm()

                    });

                  }).catch(err => setSubmitting(false));
                }}>
                {({
                  handleSubmit,
                  touched,
                  errors,
                  isValid,
                  isSubmitting,
                  values,
                  setFieldValue,
                  handleChange,
                  resetForm,
                  validateForm,
                  setSubmitting
                }) => <Form noValidate autoComplete="off" onSubmit={handleSubmit}>
                    <Grid container spacing={5}>
                      <Grid item xs={12} md={12}>

                        <SectionTitle gutterBottom variant="h5">
                          New sale
                          <Tooltip title="View drafts" arrow placement="top">
                            <Button onClick={() => this.setState({ showDraftDrawer: true })} variant="contained" size="small" color="primary">
                              <ViewListIcon />
                            </Button>
                          </Tooltip>
                        </SectionTitle>

                        <CardContent >
                          <SubSection>
                            <Grid container>
                              <Grid item xs={3}>

                                <Field name="date">
                                  {(fParams: any) => (
                                    <DatePicker
                                      disableToolbar
                                      variant="inline"
                                      inputVariant="outlined"
                                      size="small"
                                      format="dd/MM/yyyy"
                                      autoOk={true}
                                      margin="normal"
                                      id="payment-date-picker"
                                      label="Date"
                                      value={values.date}
                                      onChange={(e: any) => {
                                        fParams.form.setFieldValue('date', e, true);
                                      }}
                                      onBlur={(e: any) => {
                                        fParams.form.setFieldTouched('date', true, true);
                                      }}
                                      error={getIn(touched, `date`) && !!getIn(errors, `date`)}
                                    />
                                  )}
                                </Field>

                                <ErrorMessage name="date" component={ValidationError} />
                              </Grid>
                            </Grid>
                          </SubSection>
                          {/* Customer details */}
                          <SubSection>
                            <SubSectionTitle gutterBottom variant="h6">Customer details:</SubSectionTitle>

                            <Grid container justify="center">
                              <Grid item xs={12}>
                                <Grid container spacing={3}>
                                  <Grid item xs={12} md={5}>
                                    <Field name="customer.name"

                                      render={
                                        (fParams: any) => <Autocomplete
                                          options={this.state.customers}

                                          getOptionLabel={(option: any) => {
                                            if (typeof (option) === 'string') {
                                              return option;
                                            }

                                            return option.name;
                                          }}

                                          size="small"
                                          value={(!values.customer.customerId ? fParams.field.value : (fParams.field.value && fParams.field.value !== '' && this.state.customers.length) ? (this.state.customers.find((c: any) => c.name === fParams.field.value.trim()) || null) : null)}
                                          renderInput={(params: any) => <TextField {...params} label="Customer name" type="text" variant="outlined" required error={getIn(touched, 'customer.name') && !!getIn(errors, 'customer.name')} />}
                                          openOnFocus={true}
                                          autoSelect
                                          selectOnFocus
                                          // clearOnBlur
                                          handleHomeEndKeys
                                          freeSolo
                                          onChange={(event: object, value: any | any[], reason: string) => {

                                            if (value && typeof (value) === 'string') {
                                              let match = this.state.customers.find((c: any) => c.name === value.trim());
                                              if (match) value = match;
                                            }

                                            if (value && typeof (value) === 'string') {
                                              if (values.customer.customerId) {
                                                setFieldValue('customer.customerId', null, true);
                                                setFieldValue('customer.phone', null, true);
                                              }

                                              setFieldValue(fParams.field.name, value, true);
                                            } else {
                                              setFieldValue('customer.customerId', value ? value.id : null, true);
                                              setFieldValue(fParams.field.name, value ? value.name : null, true);
                                              setFieldValue('customer.phone', value ? value.phone : null, true);
                                            }

                                            this.setState({ customerDetailsActionField: 'name' });

                                          }}

                                          onBlur={(e: any) => {

                                            fParams.form.setFieldTouched(fParams.field.name, true, true);
                                          }}

                                          disabled={values.customer.customerId && this.state.customerDetailsActionField !== 'name'}
                                        />}
                                    />

                                    <ErrorMessage name="customer.name" component={ValidationError} />
                                  </Grid>
                                  <Grid item xs={12} md={3}>
                                    <Field name="customer.phone"

                                      render={
                                        (fParams: any) => <Autocomplete
                                          options={this.state.customers.filter((c: any) => !!c.phone)}

                                          getOptionLabel={(option: any) => {
                                            if (typeof (option) === 'string') {
                                              return option;
                                            }

                                            return option.phone;
                                          }}

                                          size="small"
                                          value={(!values.customer.customerId ? fParams.field.value : (fParams.field.value && fParams.field.value !== '' && this.state.customers.length) ? (this.state.customers.find((c: any) => c.phone === fParams.field.value.trim()) || null) : null)}
                                          renderInput={(params: any) => <TextField {...params} label="Customer phone" type="text" variant="outlined" error={getIn(touched, 'customer.phone') && !!getIn(errors, 'customer.phone')} />}
                                          openOnFocus={true}
                                          autoSelect
                                          selectOnFocus
                                          // clearOnBlur
                                          handleHomeEndKeys
                                          freeSolo
                                          onChange={(event: object, value: any | any[], reason: string) => {

                                            if (value && typeof (value) === 'string') {
                                              let match = this.state.customers.find((c: any) => c.phone === value.trim());
                                              if (match) value = match;
                                            }

                                            if (value && typeof (value) === 'string') {
                                              if (values.customer.customerId) {
                                                setFieldValue('customer.customerId', null, true);
                                                setFieldValue('customer.name', null, true);
                                              }

                                              setFieldValue(fParams.field.name, value, true);
                                            } else {
                                              setFieldValue('customer.customerId', value ? value.id : null, true);
                                              setFieldValue(fParams.field.name, value ? value.name : null, true);
                                              setFieldValue('customer.name', value ? value.phone : null, true);
                                            }

                                            this.setState({ customerDetailsActionField: 'phone' });

                                          }}

                                          onBlur={(e: any) => {
                                            fParams.form.setFieldTouched(fParams.field.name, true);
                                          }}

                                          disabled={values.customer.customerId && this.state.customerDetailsActionField === 'name'}
                                        />} />

                                    <ErrorMessage name="customer.phone" component={ValidationError} />
                                  </Grid>
                                </Grid>
                              </Grid>
                            </Grid>
                          </SubSection>

                          {/* Particulars */}
                          <SubSection>
                            <SubSectionTitle variant="h6">Particulars:</SubSectionTitle>

                            <ParticularsTable>
                              <TableHead>
                                <tr>
                                  <th>#</th>
                                  <th><RequiredAstrix>Product</RequiredAstrix></th>
                                  <th><RequiredAstrix>Price</RequiredAstrix></th>
                                  <th><RequiredAstrix>Quantity</RequiredAstrix></th>
                                  <th><RequiredAstrix>Cost</RequiredAstrix></th>
                                  <th><RequiredAstrix>Discount</RequiredAstrix></th>
                                  <th><RequiredAstrix>Discounted cost</RequiredAstrix></th>
                                  <NoBorderWhiteTh></NoBorderWhiteTh>
                                </tr>
                              </TableHead>
                              <tbody>
                                <FieldArray
                                  name="particulars"
                                  render={arrayHelpers => (
                                    <>
                                      {values.particulars.map((item, index) => (
                                        <tr key={item.uid}>
                                          <td>{index + 1}</td>
                                          <td>
                                            <Field name={`particulars[${index}].productId`}>
                                              {(fParams: any) => (
                                                <ParticularsAutoComplete
                                                  options={this.state.products}
                                                  getOptionLabel={(option: any) => {
                                                    if (option.id === 'dummy') {
                                                      return option.label;
                                                    }
                                                    return `${option.brandName} - ${option.productName}`;
                                                  }}

                                                  filterOptions={(options: any[], params: any) => {

                                                    let filtered: any[] = [];

                                                    if (params.inputValue !== '') {
                                                      // Filter logic
                                                      let inputWords: string[] = params.inputValue.split(' ');
                                                      filtered = options.filter((option: any) => {
                                                        let matchCount: number = 0;
                                                        inputWords.forEach((w: string) => {
                                                          if ((new RegExp(w, 'i')).test(params.getOptionLabel(option))) matchCount += 1;
                                                        })
                                                        return matchCount === inputWords.length;
                                                      });

                                                      // Add placeholder for new product shortcut
                                                      filtered.push({
                                                        id: 'dummy',
                                                        label: `Add '${params.inputValue}' as new product`,
                                                        inputValue: params.inputValue
                                                      });
                                                    } else filtered = options;

                                                    return filtered;
                                                  }}

                                                  getOptionDisabled={(option: any) => {
                                                    return option ? option.quantityAvailable <= 0 : false;
                                                  }}

                                                  size="small"
                                                  value={(fParams.field.value && fParams.field.value !== '' && this.state.products.length) ? (this.state.products.find((p: any) => p.id === fParams.field.value) || null) : null}
                                                  renderInput={(params: any) => <TextField {...params} placeholder="Select product" type="text" variant="outlined" error={getIn(touched, `particulars[${index}].productId`) && !!getIn(errors, `particulars[${index}].productId`)} />}
                                                  openOnFocus={true}
                                                  selectOnFocus
                                                  clearOnBlur
                                                  handleHomeEndKeys
                                                  freeSolo

                                                  onBlur={(e: any) => {
                                                    fParams.form.setFieldTouched(`particulars[${index}].productId`, true);
                                                  }}
                                                  onChange={(event: any, value: any | any[], reason: string) => {
                                                    if (value && value.id === 'dummy') {
                                                      // Add new product option
                                                      this.setState({ addNewProduct: { showModal: true, inputString: value.inputValue, selectedIndex: index } });
                                                    }
                                                    else {
                                                      fParams.form.setFieldValue(fParams.field.name, value ? value.id : null, true);
                                                      fParams.form.setFieldValue(`particulars[${index}].quantityAvailable`, value ? value.quantityAvailable : 0, true);


                                                      this.updateItemRow(fParams.form.setFieldValue, arrayHelpers, index, value ? value.price : 0, value ? 1 : 0, 0, value ? value.quantityAvailable - 1 : 0);
                                                      if (values.particulars.length - 1 === index) { arrayHelpers.push(this.getNewRow()); this.setState({ particularsLastRowNum: this.state.particularsLastRowNum + 1 }) }
                                                    }

                                                  }}

                                                />
                                              )}
                                            </Field>

                                          </td>
                                          <RightAlignedTd><Currency value={values.particulars[index].price} /></RightAlignedTd>
                                          <td>
                                            <Field as={ParticularsQtyField} name={`particulars[${index}].quantity`} disabled={!values.particulars[index].productId} type="number" placeholder="Quantity" required variant="outlined" size="small" error={(getIn(touched, `particulars[${index}].quantity`) && !!getIn(errors, `particulars[${index}].quantity`)) || !!getIn(errors, `particulars[${index}].quantityRemaining`)}
                                              InputProps={{
                                                endAdornment: <InputAdornment position="end"><small>/ {values.particulars[index].quantityAvailable}</small></InputAdornment>,
                                              }}
                                              onChange={(e: any) => {

                                                let item = values.particulars[index];
                                                handleChange(e);

                                                this.debounce(
                                                  () => {
                                                    this.updateItemRow(setFieldValue, arrayHelpers, index, item.price, e.target.value, item.discount, item.quantityAvailable - e.target.value, 'quantity');
                                                    if (values.particulars.length - 1 === index) { arrayHelpers.push(this.getNewRow()); this.setState({ particularsLastRowNum: this.state.particularsLastRowNum + 1 }) }
                                                  }
                                                );

                                              }} />
                                          </td>
                                          <RightAlignedTd><Currency value={values.particulars[index].cost} /></RightAlignedTd>
                                          <td>
                                            <Field as={ParticularsDiscountField} name={`particulars[${index}].discount`} disabled={!values.particulars[index].productId} type="number" placeholder="Discount" required variant="outlined" size="small" error={getIn(touched, `particulars[${index}].discount`) && !!getIn(errors, `particulars[${index}].discount`)}
                                              InputProps={{
                                                startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                                              }}
                                              onChange={(e: any) => {
                                                let item = values.particulars[index];

                                                handleChange(e);

                                                this.debounce(
                                                  () => {
                                                    this.updateItemRow(setFieldValue, arrayHelpers, index, item.price, item.quantity, e.target.value, item.quantityRemaining, 'discount');
                                                    if (values.particulars.length - 1 === index) { arrayHelpers.push(this.getNewRow()); this.setState({ particularsLastRowNum: this.state.particularsLastRowNum + 1 }) }
                                                  }
                                                );

                                              }}
                                            />
                                          </td>
                                          <RightAlignedTd><Currency value={values.particulars[index].discountedCost} /></RightAlignedTd>
                                          <NoBorderTd>
                                            {values.particulars.length - 1 !== index &&
                                              <Tooltip title="Remove this item" arrow placement="top">
                                                <IconButton color="secondary"
                                                  onClick={(e: any) => {
                                                    arrayHelpers.remove(index);

                                                    if (values.particulars.length === 0) {
                                                      arrayHelpers.push(this.getNewRow());
                                                      this.setState({ particularsLastRowNum: this.state.particularsLastRowNum + 1 });
                                                    }                                                    
                                                    
                                                  }}>
                                                  <HighlightOffIcon />
                                                </IconButton>
                                              </Tooltip>
                                            }
                                          </NoBorderTd>
                                        </tr>
                                      ))}
                                    </>
                                  )} />


                                {/* Summary row */}
                                <tr>
                                  <NoBorderTd colSpan={4}></NoBorderTd>
                                  <td colSpan={2}>Total cost</td>
                                  <RightAlignedTd><Currency value={this.getTotal(values.particulars, 'cost')} /></RightAlignedTd>
                                </tr>
                                <tr>
                                  <NoBorderTd colSpan={4}></NoBorderTd>
                                  <td colSpan={2}>Total discount</td>
                                  <RightAlignedTd><Currency value={this.getTotal(values.particulars, 'discount')} /></RightAlignedTd>
                                </tr>
                                <tr>
                                  <NoBorderTd colSpan={4}></NoBorderTd>
                                  <td colSpan={2}>Total bill amount</td>
                                  <RightAlignedTd><Currency value={this.getTotal(values.particulars, 'discountedCost')} /></RightAlignedTd>
                                </tr>

                                <tr>

                                  <NoBorderTd colSpan={4} rowSpan={2}></NoBorderTd>
                                  <td colSpan={2} rowSpan={2}>
                                    Payment
                                </td>
                                  <td>
                                    <Field as={ParticularsTableSelect} name={`payment.mode`} placeholder="Payment mode" required variant="outlined" size="small">
                                      <MenuItem value={'CASH'}>Cash</MenuItem>
                                      <MenuItem value={'GPAY'}>Google Pay</MenuItem>
                                      <MenuItem value={'NETBANKING'}>Net Banking</MenuItem>
                                    </Field>

                                  </td>
                                </tr>
                                <tr>

                                  <td>
                                    <Field as={ParticularsTextField} name={`payment.amount`} type="number" placeholder="amount" required variant="outlined" size="small" error={getIn(touched, `payment.amount`) && !!getIn(errors, `payment.amount`)}
                                      InputProps={{
                                        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                                      }}
                                    />
                                  </td>
                                </tr>
                                <tr>
                                  <NoBorderTd colSpan={4}></NoBorderTd>
                                  <td colSpan={2}>Outstanding</td>
                                  <RightAlignedTd><Currency value={this.getTotal(values.particulars, 'discountedCost') - values.payment.amount} /></RightAlignedTd>
                                </tr>

                              </tbody>
                            </ParticularsTable>
                          </SubSection>

                          {this.state.saveError && <div><ValidationError>{this.state.saveError}</ValidationError></div>}

                          <FormActions>
                            <Button type="button" disabled={isSubmitting || this.state.deleting} onClick={(e: any) => resetForm()} variant="contained" color="default" size="small">Reset</Button>
                            {this.state.saleId &&
                              <Button type="button" disabled={isSubmitting || this.state.deleting} onClick={(e: any) => {
                                this.setState({ showPaymentDeleteWarning: true })
                              }} variant="contained" color="secondary" size="small">Delete draft</Button>
                            }
                            <Button type="button" disabled={!isValid || isSubmitting || this.state.deleting} onClick={(e: any) => {
                              validateForm().then((errors: any) => {
                                if (Object.keys(errors).length === 0) this.handleSubmit('DRAFT', values).then(val => {
                                  setSubmitting(false);

                                  if (val === 'DRAFT' || val === 'SUBMITNEW') this.setState({ formValues: this.getFormDefaultValue(), saleId: null }, () => {
                                    resetForm()
                                  });

                                }).catch(err => setSubmitting(false));
                              });
                            }}
                              variant="contained" color="secondary" size="small">Draft</Button>
                            <Button type="submit" disabled={!isValid || isSubmitting || this.state.deleting} variant="contained" color="primary" size="small">Submit</Button>
                            <Button type="button" disabled={!isValid || isSubmitting || this.state.deleting}
                              onClick={(e: any) => {
                                validateForm().then((errors: any) => {
                                  if (Object.keys(errors).length === 0) this.handleSubmit('SUBMITNEW', values).then(val => {
                                    setSubmitting(false);

                                    if (val === 'DRAFT' || val === 'SUBMITNEW') this.setState({ formValues: this.getFormDefaultValue(), saleId: null }, () => {
                                      resetForm()
                                    });

                                  }).catch(err => setSubmitting(false));
                                });
                              }}
                              variant="contained" color="primary" size="small">Submit & New</Button>
                          </FormActions>

                        </CardContent>

                      </Grid>
                    </Grid>

                  </Form>
                }
              </Formik>

            </MuiPickersUtilsProvider>

            {/* Add new product dialogue */}
            <ProductAddDialog open={this.state.addNewProduct.showModal} onClose={this.onNewProductDialogClose} initialValue={this.state.addNewProduct.inputString} />

            {/* Sales drafts drawer */}
            <Drawer anchor={'right'} open={this.state.showDraftDrawer} onClose={() => { if (this.state.showDraftDrawer) this.setState({ showDraftDrawer: false }) }}>
              <SalesDrafts onClose={(saleId?: number) => {
                this.setState({ showDraftDrawer: false }, () => {
                  this.fetchSaleData(saleId || null);
                })
              }} />
            </Drawer>

            {/* Delete warning   */}
            <StyledModal
              open={this.state.showPaymentDeleteWarning}
              onClose={() => this.setState({ showPaymentDeleteWarning: false })}
            >
              <div className="modal-content">
                <p>Are you sure to delete?</p>
                <WarningModalActions>

                  <Button onClick={() => {
                    this.deleteDraft().then((val: any) => {
                      this.context.navigate('NewSale', {}, 'New Sale');
                    });
                  }} type="button" variant="contained" color="secondary" size="small">Yes</Button>
                  <Button onClick={() => this.setState({ showPaymentDeleteWarning: false })} type="button" variant="contained" color="default" size="small">No</Button>

                </WarningModalActions>

                <div>{this.state.deleteError && <div><ValidationError>{this.state.deleteError}</ValidationError></div>}</div>
              </div>
            </StyledModal>
          </>
        )
        }
      </RootContext.Consumer>
    </>
    );
  }
}

NewSale.contextType = RootContext;

export default withSnackbar(NewSale);

