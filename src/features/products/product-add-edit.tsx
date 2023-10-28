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



import * as Yup from 'yup';
import { Formik, Field, ErrorMessage } from 'formik';
import withSnackbar from '../../directives/with-snackbar';

class ProductAddEdit extends ReactComponent<any, {
  mode: 'ADD' | 'EDIT',
  brands: Array<any>;
  categories: Array<any>;
  formValues: {
    name: string;
    brand: '' | number;
    category: '' | number;
    price: '' | number;
  },
  saveError: null | string;
  selectedProduct: null | any;
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
      mode: props.selectedForEdit ? 'EDIT' : 'ADD',
      brands: [],
      categories: [],
      formValues: props.selectedForEdit ? {
        name: props.selectedForEdit.name,
        brand: props.selectedForEdit.brand,
        category: props.selectedForEdit.category,
        price: props.selectedForEdit.price
      } : {
          name: '',
          brand: '',
          category: '',
          price: ''
        },
      saveError: null,
      selectedProduct: props.selectedForEdit
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

      if (this.state.mode === 'ADD') {

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
          this.context.navigate('ProductsList', { focusItem: response }, 'Products');
        });

        // Send signal
        this.context.setLoading(true);
        this.context.electronIpc.send('addNewProduct', {
          name: values.name,
          brand: values.brand,
          category: values.category || null,
          price: values.price
        })

      }

      if (this.state.mode === 'EDIT') {
        this.context.electronIpc.once('updateProductResponse', (event: IpcRendererEvent, status: number, response: any) => {
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
          this.context.navigate('ProductsList', { focusItem: response }, 'Products');

        });

        // Send signal
        this.context.setLoading(true);
        this.context.electronIpc.send('updateProduct', {
          id: this.state.selectedProduct.id,
          name: values.name,
          brand: values.brand,
          category: values.category || null,
          price: values.price
        })

      }
    })
  }


  render() {
    return (
      <>
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
                isSubmitting
              }) => <Form noValidate autoComplete="off" onSubmit={handleSubmit}>
                  <SectionTitle gutterBottom variant="h5">{this.state.mode === 'EDIT' ? 'Update product details' : 'Add new product'}</SectionTitle>
                  <FormContent>

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
                        <Field as={TextField} name="price" label="Product selling price" type="number" required variant="outlined" size="small" error={touched.price && !!errors.price}
                          InputProps={{
                            startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                          }} />
                        <ErrorMessage name="price" component={ValidationError} />
                      </FormControl>
                    </div>

                    {this.state.saveError && <div><ValidationError>{this.state.saveError}</ValidationError></div>}

                    <FormActions>

                      <Button onClick={() => this.context.navigate('ProductsList', {}, 'Products')} type="button" disabled={isSubmitting} variant="contained" color="default" size="small">Cancel</Button>

                      <Button type="submit" disabled={!isValid || isSubmitting} variant="contained" color="primary" size="small">Save</Button>
                    </FormActions>

                  </FormContent>
                </Form>
              }
            </Formik>

          </Grid>
        </Grid>
      </>
    )
  }
}

ProductAddEdit.contextType = RootContext;

export default withSnackbar(ProductAddEdit);