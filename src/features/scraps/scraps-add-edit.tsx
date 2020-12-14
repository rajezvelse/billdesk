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

import { withSnackbar } from 'notistack'

import DateFnsUtils from '@date-io/date-fns';
import {
  MuiPickersUtilsProvider,
  DatePicker,
} from '@material-ui/pickers';

import * as Yup from 'yup';
import { Formik, Field, ErrorMessage, getIn } from 'formik';

class ScrapsAddEdit extends ReactComponent<any, {
  mode: 'ADD' | 'EDIT',
  products: Array<any>;
  selectedProduct: any;
  formValues: {
    date: Date;
    productId: string;
    quantity: number;
  },
  saveError: null | string;
  selectedScraps: null | any;
}> {
  validationSchema: Yup.ObjectSchema = Yup.object().shape({
    date: Yup.date().required('Please enter the date').nullable(),
    productId: Yup.number().required('Please select a product'),
    quantity: Yup.number().required('Please enter quantity')
      .positive('Please enter quantity in positive values')
      .test('should-be-lesser-than-available-qty', 'Please enter value below the available quantity', (value: number) => {
        if(!this.state.selectedProduct) return true;

        return value <= this.state.selectedProduct.quantityAvailable;
      })
  });

  constructor(props: any) {
    super(props);

    this.state = {
      mode: props.selectedForEdit ? 'EDIT' : 'ADD',
      selectedProduct: null,
      products: [],
      formValues: props.selectedForEdit ? {
        date: props.selectedForEdit.date,
        productId: props.selectedForEdit.productId,
        quantity: props.selectedForEdit.quantity,
      } : {
          date: new Date(),
          productId: '',
          quantity: 0
        },
      saveError: null,
      selectedScraps: props.selectedForEdit
    }
  }

  componentDidMount() {
    super.componentDidMount();

    this.loadFormData();
  }

  loadFormData = () => {
    this.context.electronIpc.once("getScrapsFormDataResponse", (event: IpcRendererEvent, status: number, response: any) => {
      this.context.setLoading(false);

      // On fail
      if (status !== 200) {
        return;
      }

      this.setState({ products: response.products });
    });

    this.context.setLoading(true);
    this.context.electronIpc.send("getScrapsFormData");
  }

  save = (values: { [s: string]: any }): Promise<boolean> => {
    return new Promise((resolve, reject) => {

      if (this.state.mode === 'ADD') {

        this.context.electronIpc.once('addNewScrapsResponse', (event: IpcRendererEvent, status: number, response: any) => {
          this.context.setLoading(false);

          // On fail
          if (status !== 200) {
            reject(response);

            this.setState({
              saveError: response, formValues: {
                date: values.date,
                productId: values.productId,
                quantity: values.quantity
              }
            });
            return;
          }

          // On success
          this.props.enqueueSnackbar('Saved', { variant: 'success' })
          this.context.navigate('ScrapsList', { focusItem: response }, 'Scraps');
        });

        // Send signal
        this.context.setLoading(true);
        this.context.electronIpc.send('addNewScraps', {
          date: values.date,
          productId: values.productId,
          quantity: values.quantity
        })

      }

      if (this.state.mode === 'EDIT') {
        this.context.electronIpc.once('updateScrapsResponse', (event: IpcRendererEvent, status: number, response: any) => {
          this.context.setLoading(false);

          // On fail
          if (status !== 200) {
            reject(response);

            this.setState({
              saveError: response, formValues: {
                date: values.date,
                productId: values.productId,
                quantity: values.quantity
              }
            });
            return;
          }

          // On success
          this.props.enqueueSnackbar('Saved', { variant: 'success' })
          this.context.navigate('ScrapsList', { focusItem: response }, 'Scraps');

        });

        // Send signal
        this.context.setLoading(true);
        this.context.electronIpc.send('updateScraps', {
          id: this.state.selectedScraps.id,
          date: values.date,
          productId: values.productId,
          quantity: values.quantity
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
                    <SectionTitle gutterBottom variant="h5">{this.state.mode === 'EDIT' ? 'Update scraps details' : 'Add new scraps details'}</SectionTitle>
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
                                id="scraps-date-picker"
                                label="Date of entry"
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
                          <Field name="productId" >{(params: any) => (

                            <Autocomplete
                              options={this.state.products}
                              getOptionLabel={(option: any) => {
                                return `${option.brandName} - ${option.productName}`
                              }}
                              getOptionDisabled={(option: any) => {
                                return option ? option.quantityAvailable <= 0 : false;
                              }}
                              size="small"
                              renderInput={(params: any) => <TextField {...params} name="productId" label="Product" type="text" variant="outlined" required />}
                              value={(params.field.value && params.field.value !== '' && this.state.products.length) ? this.state.products.find((b: any) => b.id === params.field.value) : null}
                              className={touched.productId && !!errors.productId ? "error" : ""}
                              openOnFocus={true}
                              onBlur={(e: any) => {
                                params.form.setFieldTouched('productId', true);
                              }}
                              onChange={(event: object, value: any | any[], reason: string) => {
                                params.form.setFieldValue('productId', value ? value.id : '', true);
                                this.setState({ selectedProduct: value })
                              }}
                            />
                          )}
                          </Field>
                          <ErrorMessage name="productId" component={ValidationError} />
                        </FormControl>

                      </div>

                      <div>
                        <FormControl fullWidth>
                          <Field as={TextField} name="quantity" label="Damaged quantity" type="number" required variant="outlined" size="small" error={touched.quantity && !!errors.quantity} 
                           InputProps={{
                            endAdornment: <InputAdornment position="end"><small>/ {this.state.selectedProduct? this.state.selectedProduct.quantityAvailable : 0}</small></InputAdornment>,
                          }}/>
                          <ErrorMessage name="quantity" component={ValidationError} />
                        </FormControl>
                      </div>

                      {this.state.saveError && <div><ValidationError>{this.state.saveError}</ValidationError></div>}

                      <FormActions>

                        <Button onClick={() => this.context.navigate('ScrapsList', {}, 'Scraps')} type="button" disabled={isSubmitting} variant="contained" color="default" size="small">Cancel</Button>

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

ScrapsAddEdit.contextType = RootContext;

export default withSnackbar(ScrapsAddEdit);