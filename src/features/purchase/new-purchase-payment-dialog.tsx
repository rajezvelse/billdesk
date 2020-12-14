import React from 'react'
import ReactComponent from '../../react-component'

import { IpcRendererEvent } from "electron";
import RootContext from '../../root.context';

import {
  FormControl, Form, ValidationError, SelectSmall
} from '../../styled-components';
import {
  Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, InputAdornment
} from '@material-ui/core';
import DateFnsUtils from '@date-io/date-fns';
import {
  MuiPickersUtilsProvider,
  DatePicker,
} from '@material-ui/pickers';

import * as Yup from 'yup';
import { Formik, Field, ErrorMessage, getIn } from 'formik';

class NewPurchasePaymentDialog extends ReactComponent<{ open: boolean; onClose: Function, purchaseId: number }, {
  brands: Array<any>;
  categories: Array<any>;
  formValues: {
    purchaseId: number;
    date: Date;
    mode: '' | string;
    amount: '' | number;
  },
  saveError: null | string;
}> {
  validationSchema: Yup.ObjectSchema = Yup.object().shape({
    purchaseId: Yup.number().required(),
    date: Yup.date().required('Please enter payment date').nullable(),
    mode: Yup.string().required('Please select a payment mode'),
    amount: Yup.number().required('Please enter the amount')
      .positive('Please enter the amount in positive values')
  });

  constructor(props: any) {
    super(props);

    this.state = {
      brands: [],
      categories: [],
      formValues: {
        purchaseId: props.purchaseId,
        date: new Date(),
        mode: 'CASH',
        amount: 0
      },
      saveError: null
    }
  }

  componentWillReceiveProps(nextProps: any) {

    if (nextProps.purchaseId !== this.state.formValues.purchaseId) {
      let formValues: any = this.state.formValues;
      formValues.purchaseId = nextProps.purchaseId;

      this.setState({ formValues });
    }
  }

  componentDidMount() {
super.componentDidMount();

  }

  save = (values: { [s: string]: any }): Promise<boolean> => {
    return new Promise((resolve, reject) => {


      this.context.electronIpc.once('addNewPurchasePaymentResponse', (event: IpcRendererEvent, status: number, response: any) => {
        this.context.setLoading(false);

        // On fail
        if (status !== 200) {
          console.log(response);
          reject(response);

          this.setState({
            saveError: response, formValues: {
              purchaseId: values.purchaseId,
              date: values.date,
              mode: values.mode,
              amount: values.amount
            }
          });
          return;
        }

        // On success
        resolve(response);
      });

      // Send signal
      this.context.setLoading(true);
      this.context.electronIpc.send('addNewPurchasePayment', {
        purchaseId: values.purchaseId,
        date: values.date,
        mode: values.mode,
        amount: values.amount
      })

    })
  }


  render() {
    return (
      <>
        <MuiPickersUtilsProvider utils={DateFnsUtils}>
          <Dialog open={this.props.open} onClose={() => this.props.onClose()} maxWidth="sm" fullWidth={true}>
            <DialogTitle>Enter new payment details</DialogTitle>
            <Formik initialValues={{ ...this.state.formValues }}
              validationSchema={this.validationSchema}
              validateOnMount={true}
              enableReinitialize={true}
              onSubmit={(values, { setSubmitting }) => {
                this.save(values).then(val => { this.props.onClose(val); }).catch(err => setSubmitting(false));
              }}>
              {({
                handleSubmit,
                touched,
                errors,
                isValid,
                isSubmitting,
                handleChange,
                values
              }) => <Form noValidate autoComplete="off" onSubmit={handleSubmit}>
                  <div>

                    <DialogContent>
                      <div>

                        <FormControl fullWidth>
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
                        </FormControl>

                        <FormControl fullWidth>
                          <Field as={SelectSmall} name={`mode`} placeholder="Payment mode" required variant="outlined" size="small"
                            error={getIn(touched, `mode`) && !!getIn(errors, `mode`)}>
                            <MenuItem value={'CASH'}>Cash</MenuItem>
                            <MenuItem value={'GPAY'}>Google Pay</MenuItem>
                            <MenuItem value={'NETBANKING'}>Net Banking</MenuItem>
                          </Field>

                          <ErrorMessage name="mode" component={ValidationError} />
                        </FormControl>

                      </div>

                      <div>
                        <FormControl fullWidth>
                          <Field as={TextField} name={`amount`} type="number" placeholder="amount" required variant="outlined" size="small" error={getIn(touched, `amount`) && !!getIn(errors, `amount`)}
                            InputProps={{
                              startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                            }} />

                          <ErrorMessage name="amount" component={ValidationError} />
                        </FormControl>
                      </div>


                      {this.state.saveError && <div><ValidationError>{this.state.saveError}</ValidationError></div>}
                    </DialogContent>

                    <DialogActions>

                      <Button onClick={() => this.props.onClose()} type="button" disabled={isSubmitting} color="default" size="small">Cancel</Button>

                      <Button type="submit" disabled={!isValid || isSubmitting} color="primary" size="small">Save</Button>
                    </DialogActions>

                  </div>
                </Form>
              }
            </Formik>

          </Dialog>
        </MuiPickersUtilsProvider>
      </>
    )
  }
}

NewPurchasePaymentDialog.contextType = RootContext;

export default NewPurchasePaymentDialog;