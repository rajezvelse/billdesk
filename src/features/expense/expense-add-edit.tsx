import React from 'react'
import ReactComponent from '../../react-component'

import { IpcRendererEvent } from "electron";
import RootContext from '../../root.context';

import {
  SectionTitle, FormControl, Form, ValidationError, Autocomplete,
  FormContent, FormActions
} from '../../styled-components';
import {
  Grid, Button, TextField, InputAdornment
} from '@material-ui/core';



import DateFnsUtils from '@date-io/date-fns';
import {
  MuiPickersUtilsProvider,
  DatePicker,
} from '@material-ui/pickers';

import * as Yup from 'yup';
import { Formik, Field, ErrorMessage, getIn } from 'formik';
import withSnackbar from '../../directives/with-snackbar';

class ExpenseAddEdit extends ReactComponent<any, {
  mode: 'ADD' | 'EDIT',
  categories: Array<any>;
  formValues: {
    date: Date;
    description: string;
    category: '' | number;
    amount: '' | number;
  },
  saveError: null | string;
  selectedExpense: null | any;
}> {
  context: any;
  validationSchema: Yup.ObjectSchema<any> = Yup.object().shape({
    date: Yup.date().required('Please enter the date').nullable(),
    description: Yup.string().required('Please enter description'),
    category: Yup.number().required('Please select expense category'),
    amount: Yup.number().required('Please enter expense amount')
      .positive('Please enter expense amount in positive values')
  });

  constructor(props: any) {
    super(props);

    this.state = {
      mode: props.selectedForEdit ? 'EDIT' : 'ADD',
      categories: [],
      formValues: props.selectedForEdit ? {
        date: props.selectedForEdit.date,
        description: props.selectedForEdit.description,
        category: props.selectedForEdit.category,
        amount: props.selectedForEdit.amount
      } : {
          date: new Date(),
          description: '',
          category: '',
          amount: 0
        },
      saveError: null,
      selectedExpense: props.selectedForEdit
    }
  }

  componentDidMount() {
    super.componentDidMount();

    this.loadFormData();
  }

  loadFormData = () => {
    this.context.electronIpc.once("getExpenseFormDataResponse", (event: IpcRendererEvent, status: number, response: any) => {
      this.context.setLoading(false);

      // On fail
      if (status !== 200) {
        return;
      }

      this.setState({ categories: response.categories });
    });

    this.context.setLoading(true);
    this.context.electronIpc.send("getExpenseFormData");
  }

  save = (values: { [s: string]: any }): Promise<boolean> => {
    return new Promise((resolve, reject) => {

      if (this.state.mode === 'ADD') {

        this.context.electronIpc.once('addNewExpenseResponse', (event: IpcRendererEvent, status: number, response: any) => {
          this.context.setLoading(false);

          // On fail
          if (status !== 200) {
            reject(response);

            this.setState({
              saveError: response, formValues: {
                date: values.date,
                description: values.description,
                category: values.category,
                amount: values.amount
              }
            });
            return;
          }

          // On success
          this.props.enqueueSnackbar('Saved', { variant: 'success' })
          this.context.navigate('ExpensesList', { focusItem: response }, 'Expenses');
        });

        // Send signal
        this.context.setLoading(true);
        this.context.electronIpc.send('addNewExpense', {
          date: values.date,
          description: values.description,
          category: values.category || null,
          amount: values.amount
        })

      }

      if (this.state.mode === 'EDIT') {
        this.context.electronIpc.once('updateExpenseResponse', (event: IpcRendererEvent, status: number, response: any) => {
          this.context.setLoading(false);

          // On fail
          if (status !== 200) {
            reject(response);

            this.setState({
              saveError: response, formValues: {
                date: values.date,
                description: values.description,
                category: values.category,
                amount: values.amount
              }
            });
            return;
          }

          // On success
          this.props.enqueueSnackbar('Saved', { variant: 'success' })
          this.context.navigate('ExpensesList', { focusItem: response }, 'Expenses');

        });

        // Send signal
        this.context.setLoading(true);
        this.context.electronIpc.send('updateExpense', {
          id: this.state.selectedExpense.id,
          date: values.date,
          description: values.description,
          category: values.category || null,
          amount: values.amount
        })

      }
    })
  }


  render() {
    return (
      <>

        <MuiPickersUtilsProvider utils={DateFnsUtils}>
          <Grid container>
            <Grid item xs={5}>
              <Formik initialValues={{ ...this.state.formValues }}
                validationSchema={this.validationSchema}
                validateOnMount={true}
                enableReinitialize={true}
                onSubmit={(values, { setSubmitting }) => {
                  this.save(values).then(val => { }).catch(err => setSubmitting(false));
                }}>
                {({
                  handleSubmit,
                  touched,
                  errors,
                  isValid,
                  isSubmitting,
                  values
                }) => <Form noValidate autoComplete="off" onSubmit={handleSubmit}>
                    <SectionTitle gutterBottom variant="h5">{this.state.mode === 'EDIT' ? 'Update expense details' : 'Add new expense'}</SectionTitle>
                    <FormContent>

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
                                id="expense-date-picker"
                                label="Expense date"
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
                      </div>

                      <div>
                        <FormControl fullWidth>
                          <Field name="category" >{(params: any) => (

                            <Autocomplete
                              options={this.state.categories}
                              getOptionLabel={(option: any) => option.category}
                              size="small"
                              renderInput={(params: any) => <TextField {...params} name="category" label="Expense category" type="text" variant="outlined" required/>}
                              value={(params.field.value && params.field.value !== '' && this.state.categories.length) ? this.state.categories.find((b: any) => b.id === params.field.value) : null}
                              className={touched.category && !!errors.category ? "error" : ""}
                              openOnFocus={true}
                              onBlur={(e: any) => {
                                params.form.setFieldTouched('category', true);
                              }}
                              onChange={(event: object, value: any | any[], reason: string) => {
                                params.form.setFieldValue('category', value ? value.id : '', true);

                              }}
                            />
                          )}
                          </Field>
                          <ErrorMessage name="category" component={ValidationError} />
                        </FormControl>

                      </div>

                      <div>
                        <FormControl fullWidth>
                          <Field as={TextField} name="description" label="Expense description" type="text" required variant="outlined" size="small" error={touched.description && !!errors.description} />
                          <ErrorMessage name="description" component={ValidationError} />
                        </FormControl>
                      </div>



                      <div>
                        <FormControl fullWidth>
                          <Field as={TextField} name="amount" label="Expense amount" type="number" required variant="outlined" size="small" error={touched.amount && !!errors.amount}
                            InputProps={{
                              startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                            }} />
                          <ErrorMessage name="amount" component={ValidationError} />
                        </FormControl>
                      </div>

                      {this.state.saveError && <div><ValidationError>{this.state.saveError}</ValidationError></div>}

                      <FormActions>

                        <Button onClick={() => this.context.navigate('ExpensesList', {}, 'Expenses')} type="button" disabled={isSubmitting} variant="contained" color="default" size="small">Cancel</Button>

                        <Button type="submit" disabled={!isValid || isSubmitting} variant="contained" color="primary" size="small">Save</Button>
                      </FormActions>

                    </FormContent>
                  </Form>
                }
              </Formik>

            </Grid>
          </Grid>
        </MuiPickersUtilsProvider>
      </>
    )
  }
}

ExpenseAddEdit.contextType = RootContext;

export default withSnackbar(ExpenseAddEdit);