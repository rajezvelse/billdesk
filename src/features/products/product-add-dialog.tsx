import React from 'react'
import ReactComponent from '../../react-component'

import { IpcRendererEvent } from "electron";
import RootContext from '../../root.context';

import {
  FormControl, Form, ValidationError, Autocomplete
} from '../../styled-components';
import {
  Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions
} from '@material-ui/core';


import * as Yup from 'yup';
import { Formik, Field, ErrorMessage } from 'formik';
import { WithSnackbarProps } from '../../types/snackbar.type';
import withSnackbar from '../../directives/with-snackbar';

class ProductAddDialog extends ReactComponent<WithSnackbarProps & { open: boolean; onClose: Function, initialValue: string }, {
  brands: Array<any>;
  categories: Array<any>;
  formValues: {
    name: string;
    brand: '' | number;
    category: '' | number;
    price: '' | number;
  },
  saveError: null | string;
}> {
  context: any;
  validationSchema: Yup.ObjectSchema<any> = Yup.object().shape({
    name: Yup.string().required('Please enter product name'),
    brand: Yup.number().required('Please select a model'),
    category: Yup.number(),
    price: Yup.number().required('Please enter product selling price')
      .positive('Please enter product selling price in positive values')
  });

  constructor(props: any) {
    super(props);

    this.state = {
      brands: [],
      categories: [],
      formValues: {
        name: '',
        brand: '',
        category: '',
        price: ''
      },
      saveError: null
    }
  }

  componentWillReceiveProps(nextProps: any) {

    if (nextProps.initialValue !== this.state.formValues.name) {
      let formValues: any = this.state.formValues;
      formValues.name = nextProps.initialValue;

      this.setState({ formValues });
    }
  }

  componentDidMount() {
super.componentDidMount();

    this.loadFormData();
  }

  loadFormData = () => {
    this.context.electronIpc.once("getProductFormDataResponse", (event: IpcRendererEvent, status: number, response: any) => {
      this.context.setLoading(false);

      // On fail
      if (status !== 200) {
        return;
      }

      this.setState({ brands: response.brands, categories: response.categories });
    });

    this.context.setLoading(true);
    this.context.electronIpc.send("getProductFormData");
  }

  save = (values: { [s: string]: any }): Promise<boolean> => {
    return new Promise((resolve, reject) => {


      this.context.electronIpc.once('addNewProductResponse', (event: IpcRendererEvent, status: number, response: any) => {
        this.context.setLoading(false);

        // On fail
        if (status !== 200) {
          reject(response);

          this.setState({
            saveError: response, formValues: {
              name: values.name,
              brand: values.brand,
              category: values.category,
              price: values.price
            }
          });
          return;
        }

        // On success
        this.props.enqueueSnackbar('Saved', { variant: 'success' })
        resolve(response);
      });

      // Send signal
      this.context.setLoading(true);
      this.context.electronIpc.send('addNewProduct', {
        name: values.name,
        brand: values.brand,
        category: values.category || null,
        price: values.price
      })

    })
  }


  render() {
    return (
      <>
        <Dialog open={this.props.open} onClose={() => this.props.onClose()} maxWidth="sm" fullWidth={true}>
          <DialogTitle>Enter new product details</DialogTitle>
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
              isSubmitting
            }) => <Form noValidate autoComplete="off" onSubmit={handleSubmit}>
                <div>

                  <DialogContent>
                    <div>

                      <FormControl fullWidth>
                        <Field name="brand">
                          {(params: any) => (
                            <Autocomplete
                              options={this.state.brands}
                              getOptionLabel={(option: any) => option.name}
                              size="small"
                              renderInput={(params: any) => <TextField {...params} label="Vehicle model" type="text" required variant="outlined" />}
                              value={(params.field.value && params.field.value !== '' && this.state.brands.length) ? this.state.brands.find(b => b.id === params.field.value) : null}
                              className={touched.brand && !!errors.brand ? "error" : ""}
                              openOnFocus={true}
                              onBlur={(e: any) => {
                                params.form.setFieldTouched('brand', true);
                              }}
                              onChange={(event: object, value: any | any[], reason: string) => {
                                params.form.setFieldValue('brand', value ? value.id : '', true);

                              }}
                            />
                          )}
                        </Field>

                        <ErrorMessage name="brand" component={ValidationError} />
                      </FormControl>

                    </div>

                    <div>
                      <FormControl fullWidth>
                        <Field as={TextField} name="name" label="Product name" type="text" required variant="outlined" size="small" error={touched.name && !!errors.name} />
                        <ErrorMessage name="name" component={ValidationError} />
                      </FormControl>
                    </div>

                    <div>
                      <FormControl fullWidth>
                        <Field name="category" >{(params: any) => (

                          <Autocomplete
                            options={this.state.categories}
                            getOptionLabel={(option: any) => option.category}
                            size="small"
                            renderInput={(params: any) => <TextField {...params} name="category" label="Product category" type="text" variant="outlined" />}
                            value={(params.field.value && params.field.value !== '' && this.state.categories.length) ? this.state.categories.find(b => b.id === params.field.value) : null}
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
                        <Field as={TextField} name="price" label="Product selling price" type="number" required variant="outlined" size="small" error={touched.price && !!errors.price} />
                        <ErrorMessage name="price" component={ValidationError} />
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
      </>
    )
  }
}

ProductAddDialog.contextType = RootContext;

export default withSnackbar(ProductAddDialog);