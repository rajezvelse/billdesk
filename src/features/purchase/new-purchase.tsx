import React from 'react'
import ReactComponent from '../../react-component'

import { IpcRendererEvent } from "electron";
import RootContext from '../../root.context';


import ProductAddDialog from '../products/product-add-dialog';
import PurchaseDrafts from './purchase-drafts';

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



import * as Yup from 'yup';
import { Formik, Field, ErrorMessage, getIn, FieldArray } from 'formik';

import { Currency, IsGranted } from '../../directives';

import { uniqueId } from 'lodash';
import withSnackbar from '../../directives/with-snackbar';
import { WithSnackbarProps } from '../../types/snackbar.type';


interface formValuesType {
  date: Date;
  vendor: {
    vendorId: number | null;
  };
  particulars: Array<{
    uid: string;
    rowNumber: number;
    productId: number | null;
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

class NewPurchase extends ReactComponent<WithSnackbarProps & { purchaseId: number; }, {
  vendors: Array<any>;
  products: Array<any>;
  formValues: formValuesType;
  particularsLastRowNum: number;
  addNewProduct: {
    showModal: boolean;
    inputString: string;
    selectedIndex: number | null;
  };
  showDraftDrawer: boolean;
  saveError: null | string;
  purchaseId: number | null;
  showPaymentDeleteWarning: boolean;
  deleting: boolean;
  deleteError: null | string;
}> {
  context: any;

  validationSchema: Yup.ObjectSchema<any> = Yup.object().shape({
    date: Yup.date().required('Please enter the date').nullable(),
    vendor: Yup.object().shape({
      vendorId: Yup.number().positive().integer().nullable()
    }),
    particulars: Yup.array().of(
      Yup.object().shape({
        rowNumber: Yup.number(),
        productId: Yup.number().when('rowNumber',
          ([rowNumber], schema) => rowNumber < this.state.particularsLastRowNum ?
            schema.required().positive().integer().nonNullable() :
            schema.nullable()
        ),
        price: Yup.number().when('productId',
          ([productId], schema) => !!productId ? schema.required() : schema
        ),
        quantity: Yup.number().when('productId',
          ([productId], schema) => !!productId ? schema.required().moreThan(0) : schema
        ),
        cost: Yup.number().when('productId',
          ([productId], schema) => !!productId ? schema.required() : schema
        ),
        discount: Yup.number().when('productId',
          ([productId], schema) => !!productId ? schema.required().min(0) : schema
        ),
        discountedCost: Yup.number().when('productId',
          ([productId], schema) => !!productId ? schema.required() : schema
        )
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
      vendors: [],
      products: [],
      formValues: this.getFormDefaultValue(),
      particularsLastRowNum: 1,
      addNewProduct: {
        showModal: false,
        inputString: '',
        selectedIndex: null
      },
      showDraftDrawer: false,
      saveError: null,
      purchaseId: props.purchaseId,
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

    // if (nextProps.purchaseId) {
    if (nextProps.purchaseId && nextProps.purchaseId !== this.state.purchaseId) {
      this.fetchPurchaseData(nextProps.purchaseId);
    }
    // } else {
    //   this.setState({
    //     formValues: this.getFormDefaultValue(),
    //     particularsLastRowNum: 1,
    //     purchaseId: null
    //   })
    // }
  }


  loadFormData = (valuesToBeUpdated?: any) => {
    this.context.electronIpc.once("getPurchaseFormDataResponse", (event: IpcRendererEvent, status: number, response: any) => {

      this.context.setLoading(false);

      // On fail
      if (status !== 200) {
        console.log(response)
        return;
      }

      if (valuesToBeUpdated instanceof Object) valuesToBeUpdated = Object.assign(valuesToBeUpdated, { vendors: response.vendors, products: response.products });
      else valuesToBeUpdated = { vendors: response.vendors, products: response.products };

      this.setState(valuesToBeUpdated);
    });

    this.context.setLoading(true);
    this.context.electronIpc.send("getPurchaseFormData");
  }

  fetchPurchaseData = (purchaseId: number | null) => {

    this.context.electronIpc.once("fetchPurchaseDataResponse", (event: IpcRendererEvent, status: number, response: any) => {
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
          vendor: {
            vendorId: response.vendor.id
          },
          particulars: response.particulars.map((p: any, index: number) => {
            return {
              uid: uniqueId(),
              rowNumber: index + 1,
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
        particularsLastRowNum: response.particulars.length,
        purchaseId: purchaseId,
        showDraftDrawer: false

      });

    });

    this.context.setLoading(true);
    this.context.electronIpc.send("fetchPurchaseData", { id: purchaseId });
  }

  insertRow = () => {

    let formValues: any = this.state.formValues;

    formValues.particulars.push(this.getNewRow());

    this.setState({
      formValues: formValues,
      particularsLastRowNum: this.state.formValues.particulars.length
    })

  }

  updateItemRow = (setFieldValue: Function, arrayHelpers: any, index: number, price: number, qty: number, discount: number, modifiedField?: string) => {
    let cost: number = price * qty,
      dCost: number = (cost - discount),
      fPrefix: string = `particulars[${index}].`;

    if (modifiedField !== 'price') setFieldValue(fPrefix + 'price', price, true);
    if (modifiedField !== 'quantity') setFieldValue(fPrefix + 'quantity', qty, true);
    if (modifiedField !== 'cost') setFieldValue(fPrefix + 'cost', cost, true);
    if (modifiedField !== 'discount') setFieldValue(fPrefix + 'discount', discount, true);
    if (modifiedField !== 'discountedCost') setFieldValue(fPrefix + 'discountedCost', dCost, true);

  }

  getFormDefaultValue = (): any => {
    return {
      date: new Date(),
      vendor: {
        vendorId: null
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
        balanceAmount: number = totalDiscountedCost - values.payment.amount;

      let status = action === 'DRAFT' ? 'DRAFT' : 'SUBMITTED';

      this.context.electronIpc.once('saveNewPurchaseResponse', (event: IpcRendererEvent, status: number, response: any) => {
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
          this.context.navigate('PurchaseDetails', { id: response.id }, 'Purchase details');
        }

      });

      let id = this.state.purchaseId || null;

      // Send signal
      this.context.setLoading(true);
      this.context.electronIpc.send('saveNewPurchase', { id, ...values, status, totalCost, totalDiscount, totalDiscountedCost, balanceAmount })
    });
  }

  deleteDraft = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      this.context.electronIpc.once("deletePurchaseDraftResponse", (event: IpcRendererEvent, status: number, response: any) => {
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
      this.context.electronIpc.send("deletePurchaseDraft", { id: this.state.purchaseId });
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
  timerId: any = null;
  debounce = (callback: Function) => {

    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }

    this.timerId = setTimeout(e => { callback(); }, 800);

  }

  render() {
    return (<>
      <IsGranted permissions={['create_purchase']}>
        <RootContext.Consumer>
          {({ navigate }) => (
            <>
              <MuiPickersUtilsProvider utils={DateFnsUtils}>
                <Formik initialValues={{ ...this.state.formValues }}
                  validationSchema={this.validationSchema}
                  validateOnMount={true}
                  enableReinitialize={true}
                  onSubmit={(values, { setSubmitting, resetForm }) => {
                    this.handleSubmit('SUBMIT', values).then(val => {
                      setSubmitting(false);

                      if (val === 'DRAFT' || val === 'SUBMITNEW') this.setState({ formValues: this.getFormDefaultValue(), purchaseId: null }, () => {
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
                            New purchase
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
                            {/* Vendor details */}
                            <SubSection>
                              <SubSectionTitle gutterBottom variant="h6">Vendor details:</SubSectionTitle>

                              <Grid container justifyContent="center">
                                <Grid item xs={12}>
                                  <Grid container spacing={3}>
                                    <Grid item xs={12} md={5}>
                                      <Field name="vendor.name"

                                        render={
                                          (fParams: any) => <Autocomplete
                                            options={this.state.vendors}

                                            getOptionLabel={(option: any) => {
                                              if (typeof (option) === 'string') {
                                                return option;
                                              }

                                              return option.name;
                                            }}

                                            size="small"
                                            value={(!values.vendor.vendorId ? null : (values.vendor.vendorId && this.state.vendors.length) ? (this.state.vendors.find((c: any) => c.id === values.vendor.vendorId) || null) : null)}
                                            renderInput={(params: any) => <TextField {...params} label="Select vendor" type="text" variant="outlined" required error={getIn(touched, 'vendor.name') && !!getIn(errors, 'vendor.name')} />}
                                            openOnFocus={true}
                                            onChange={(event: object, value: any | any[], reason: string) => {

                                              setFieldValue('vendor.vendorId', value ? value.id : null, true);

                                            }}

                                            onBlur={(e: any) => {

                                              fParams.form.setFieldTouched(fParams.field.name, true, true);
                                            }}

                                            classess={{
                                              option: {
                                                // Hover                                                with light - grey
                                                '&[data-focus="true"]': {
                                                  backgroundColor: 'red',
                                                  borderColor: 'transparent',
                                                },
                                                // Selected                                                has dark- grey
                                                '&[aria-selected="true"]': {
                                                  backgroundColor: 'darkgray',
                                                  borderColor: 'transparent',
                                                },
                                              },
                                            }}
                                          />}
                                      />
                                      <ErrorMessage name="vendor.name" component={ValidationError} />
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

                                                        this.updateItemRow(fParams.form.setFieldValue, arrayHelpers, index, 0, value ? 1 : 0, 0);
                                                        if (values.particulars.length - 1 === index) { arrayHelpers.push(this.getNewRow()); this.setState({ particularsLastRowNum: this.state.particularsLastRowNum + 1 }) }
                                                      }

                                                    }}

                                                  />
                                                )}
                                              </Field>

                                            </td>
                                            <td>
                                              <Field as={ParticularsDiscountField} name={`particulars[${index}].price`} disabled={!values.particulars[index].productId} type="number" placeholder="Price" required variant="outlined" size="small" error={getIn(touched, `particulars[${index}].price`) && !!getIn(errors, `particulars[${index}].price`)}
                                                InputProps={{
                                                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                                                }}
                                                onChange={(e: any) => {

                                                  let item = values.particulars[index];
                                                  handleChange(e);

                                                  this.debounce(
                                                    () => {
                                                      this.updateItemRow(setFieldValue, arrayHelpers, index, e.target.value, item.quantity, item.discount, 'price');
                                                      if (values.particulars.length - 1 === index) { arrayHelpers.push(this.getNewRow()); this.setState({ particularsLastRowNum: this.state.particularsLastRowNum + 1 }) }
                                                    }
                                                  );

                                                }} />
                                            </td>
                                            <td>
                                              <Field as={ParticularsQtyField} name={`particulars[${index}].quantity`} disabled={!values.particulars[index].productId} type="number" placeholder="Quantity" required variant="outlined" size="small" error={getIn(touched, `particulars[${index}].quantity`) && !!getIn(errors, `particulars[${index}].quantity`)}
                                                onChange={(e: any) => {

                                                  let item = values.particulars[index];
                                                  handleChange(e);

                                                  this.debounce(
                                                    () => {
                                                      this.updateItemRow(setFieldValue, arrayHelpers, index, item.price, e.target.value, item.discount, 'quantity');
                                                      if (values.particulars.length - 1 === index) { arrayHelpers.push(this.getNewRow()); this.setState({ particularsLastRowNum: this.state.particularsLastRowNum + 1 }) }
                                                    }
                                                  );

                                                }} />
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
                                    <NoBorderTd colSpan={2}></NoBorderTd>
                                    <td colSpan={2}>Total bill amount</td>
                                    <RightAlignedTd><Currency value={this.getTotal(values.particulars, 'discountedCost')} /></RightAlignedTd>
                                  </tr>

                                  <tr>

                                    <NoBorderTd colSpan={2} rowSpan={2}></NoBorderTd>
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
                                    <NoBorderTd colSpan={2}></NoBorderTd>
                                    <td colSpan={2}>Balance</td>
                                    <RightAlignedTd><Currency value={this.getTotal(values.particulars, 'discountedCost') - values.payment.amount} /></RightAlignedTd>
                                  </tr>

                                </tbody>
                              </ParticularsTable>
                            </SubSection>

                            {this.state.saveError && <div><ValidationError>{this.state.saveError}</ValidationError></div>}

                            <FormActions>
                              <Button type="button" disabled={isSubmitting || this.state.deleting} onClick={(e: any) => resetForm()} variant="contained" color="default" size="small">Reset</Button>
                              {this.state.purchaseId &&
                                <Button type="button" disabled={isSubmitting || this.state.deleting} onClick={(e: any) => {
                                  this.setState({ showPaymentDeleteWarning: true })
                                }} variant="contained" color="secondary" size="small">Delete draft</Button>
                              }
                              <Button type="button" disabled={!isValid || isSubmitting || this.state.deleting} onClick={(e: any) => {
                                validateForm().then((errors: any) => {
                                  if (Object.keys(errors).length === 0) this.handleSubmit('DRAFT', values).then(val => {
                                    setSubmitting(false);

                                    if (val === 'DRAFT' || val === 'SUBMITNEW') this.setState({ formValues: this.getFormDefaultValue(), purchaseId: null }, () => {
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

                                      if (val === 'DRAFT' || val === 'SUBMITNEW') this.setState({ formValues: this.getFormDefaultValue(), purchaseId: null }, () => {
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

              {/* Purchase drafts drawer */}
              <Drawer anchor={'right'} open={this.state.showDraftDrawer} onClose={() => { if (this.state.showDraftDrawer) this.setState({ showDraftDrawer: false }) }}>
                <PurchaseDrafts onClose={(purchaseId?: number) => {
                  this.setState({ showDraftDrawer: false }, () => {
                    this.loadFormData();
                    this.fetchPurchaseData(purchaseId || null);
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
                        this.context.navigate('NewPurchase', {}, 'New Purchase');
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
      </IsGranted>
    </>
    );
  }
}

NewPurchase.contextType = RootContext;

export default withSnackbar(NewPurchase);

