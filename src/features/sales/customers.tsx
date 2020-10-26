import React from 'react'
import ReactComponent from '../../react-component'

import { IpcRendererEvent } from "electron";
import RootContext from '../../root.context';

import uniqueId from 'lodash/uniqueId';
import {
  ItemsList, SectionTitle, CardSectionTitle, FormControl, Form, ValidationError,
  FormContent, ScrollWrapper, FormActions, StyledModal, WarningModalActions,
  DetailRow, DetailLabel, DetailValue
} from '../../styled-components';
import {
  Grid, ListItem, ListItemText, Card, CardContent, Button, Tooltip,
  TextField
} from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import DoubleArrowIcon from '@material-ui/icons/DoubleArrow';

import { withSnackbar } from 'notistack'

import * as Yup from 'yup';
import { Formik, Field, ErrorMessage } from 'formik';

class Customers extends ReactComponent<any, {
  mode: 'ADD' | 'EDIT' | 'VIEW';
  saveError: null | string;
  listError: null | string;
  customers: any[];
  searchText: string;
  selectedCustomer: any;
  formValues: {
    name: string;
    phone: string;
  }
  showDeleteWarning: boolean;
}> {
  validationSchema: Yup.ObjectSchema = Yup.object().shape({
    name: Yup.string().required('Please enter customer name'),
    phone: Yup.string().matches(/^(?:(?:\+|0{0,2})91(\s*[\ -]\s*)?|[0]?)?[789]\d{9}|(\d[ -]?){10}\d$/, 'Enter valid phone number')
  });

  constructor(props: any) {
    super(props);

    this.state = {
      mode: 'ADD',
      saveError: null,
      listError: null,
      customers: [],
      searchText: '',
      selectedCustomer: null,
      formValues: {
        name: '',
        phone: ''
      },
      showDeleteWarning: false
    }
  }


  componentDidMount() {
super.componentDidMount();

    // Load product categories list  
    if (this.context.electronIpc) this.fetchCustomers();
  }

  fetchCustomers = () => {
    this.context.electronIpc.once("fetchCustomersResponse", (event: IpcRendererEvent, status: number, response: any) => {
      this.context.setLoading(false);

      // On fail
      if (status !== 200) {
        console.log(response);
        this.setState({ listError: response });
        return;
      }

      this.setState({ customers: response, listError: null });
    });

    this.context.setLoading(true);
    this.context.electronIpc.send("fetchCustomers", { searchText: this.state.searchText });
  }

  openAddForm = (event: any, refreshList?: boolean) => {
    this.setState({
      mode: 'ADD',
      saveError: null,
      selectedCustomer: null,
      formValues: {
        name: '',
        phone: ''
      }
    }, () => {
      if (refreshList) this.fetchCustomers();
    })
  }

  viewCustomer = (item: any) => {
    this.setState({
      mode: 'VIEW',
      selectedCustomer: item
    })
  }

  selectForEdit = () => {

    this.setState({
      mode: 'EDIT',
      saveError: null,
      formValues: {
        name: this.state.selectedCustomer.name,
        phone: this.state.selectedCustomer.phone
      }
    });
  }

  save = (values: { [s: string]: any }): Promise<boolean> => {
    return new Promise((resolve, reject) => {

      if (this.state.mode === 'ADD') {

        this.context.electronIpc.once('addNewCustomerResponse', (event: IpcRendererEvent, status: number, response: any) => {
          this.context.setLoading(false);

          // On fail
          if (status !== 200) {
            reject(response);

            this.setState({
              saveError: response, formValues: {
                name: values.name,
                phone: values.phone
              }
            });
            return;
          }

          // On success
          this.props.enqueueSnackbar('Saved', { variant: 'success' })
          this.setState({
            saveError: null,
            mode: 'VIEW',
            selectedCustomer: response
          }, () => {
            this.fetchCustomers();
          })

        });

        // Send signal
        this.context.setLoading(true);
        this.context.electronIpc.send('addNewCustomer', {
          name: values.name,
          phone: values.phone
        })

      }

      if (this.state.mode === 'EDIT') {
        this.context.electronIpc.once('updateCustomerResponse', (event: IpcRendererEvent, status: number, response: any) => {
          this.context.setLoading(false);

          // On fail
          if (status !== 200) {
            this.setState({
              saveError: response, formValues: {
                name: values.name,
                phone: values.phone
              }
            });
            return;
          }

          // On success
          this.props.enqueueSnackbar('Saved', { variant: 'success' })
          this.setState({
            saveError: null,
            mode: 'VIEW',
            selectedCustomer: response
          }, () => {
            this.fetchCustomers();
          })

        });

        // Send signal
        this.context.setLoading(true);
        this.context.electronIpc.send('updateCustomer', {
          id: this.state.selectedCustomer.id,
          name: values.name,
          phone: values.phone
        })

      }
    });
  }

  deleteCustomer = () => {
    this.context.electronIpc.once('deleteCustomerResponse', (event: IpcRendererEvent, status: number, response: any) => {
      this.context.setLoading(false);

      // On fail
      if (status !== 200) {
        this.setState({ saveError: response });
        return;
      }

      // On success
      this.props.enqueueSnackbar('Deleted', { variant: 'success' })
      this.setState({ showDeleteWarning: false }, () => this.openAddForm(null, true));

    });

    // Send signal
    this.context.setLoading(true);
    this.context.electronIpc.send('deleteCustomer', { id: this.state.selectedCustomer.id })

  }

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
      <Grid container spacing={2}>
        <Grid item xs={4}>
          <Card>
            <CardContent>
              <CardSectionTitle gutterBottom variant="h5">
                Customers
                <Tooltip title="Add new brand" arrow placement="top">
                  <Button onClick={this.openAddForm} variant="contained" size="small" color="primary">
                    <AddIcon />
                  </Button>
                </Tooltip>
              </CardSectionTitle>
              <ScrollWrapper >
                <ItemsList>
                  <FormControl fullWidth>
                    <TextField label="Search" type="text" variant="outlined" size="small"
                      onKeyUp={(event: any) => {

                        let cls = this;
                        let searchText: string = event.target.value;

                        let fun: Function = () => {

                          cls.setState({ searchText }, () => {
                            cls.fetchCustomers();
                          })

                        };

                        this.debounce(fun);

                      }}
                    />
                  </FormControl>

                  {this.state.customers.map((item) => <ListItem key={uniqueId()} onClick={() => this.viewCustomer(item)} className={this.state.selectedCustomer && item.id == this.state.selectedCustomer.id ? 'selected' : ''}>
                    <ListItemText primary={item.name} secondary={item.phone}></ListItemText>
                    {this.state.selectedCustomer && item.id == this.state.selectedCustomer.id && <DoubleArrowIcon color="primary" style={{ fontSize: "2rem" }} />}
                  </ListItem>)}

                  {this.state.customers.length === 0 && <div>No customers found.</div>}
                </ItemsList>
              </ScrollWrapper>
            </CardContent>
          </Card>
        </Grid>

        {/* View/Add/Edit section */}
        <Grid item xs={4}>
          {this.state.mode === 'VIEW' && <CardContent>
            <SectionTitle gutterBottom variant="h5">Customer details</SectionTitle>

            <FormContent>
              <DetailRow>
                <DetailLabel xs={5}>Model name</DetailLabel>
                <DetailValue xs={7}>{this.state.selectedCustomer.name}</DetailValue>
              </DetailRow>

              <FormActions>
                <Button onClick={this.selectForEdit} type="button" variant="contained" color="primary" size="small">Edit</Button>
                <Button onClick={() => this.setState({ showDeleteWarning: true, saveError: null })} type="button" variant="contained" color="secondary" size="small">Delete</Button>
              </FormActions>
            </FormContent>

          </CardContent>}

          {(this.state.mode === 'ADD' || this.state.mode === 'EDIT') && <Card elevation={0}>
            <CardContent>
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
                    <SectionTitle gutterBottom variant="h5">{this.state.mode === 'EDIT' ? 'Update customer' : 'Add new customer'}</SectionTitle>
                    <FormContent>
                      <div>
                        <FormControl fullWidth>
                          <Field as={TextField} name="name" label="Customer name" type="text" required variant="outlined" size="small" error={touched.name && !!errors.name} />
                          <ErrorMessage name="name" component={ValidationError} />
                        </FormControl>

                        <FormControl fullWidth>
                          <Field as={TextField} name="phone" label="Customer phone" type="text" variant="outlined" size="small" error={touched.phone && !!errors.phone} />
                          <ErrorMessage name="phone" component={ValidationError} />
                        </FormControl>
                      </div>

                      {this.state.saveError && <div><ValidationError>{this.state.saveError}</ValidationError></div>}

                      <FormActions>

                        {this.state.mode === 'EDIT' && <Button onClick={() => this.viewCustomer(this.state.selectedCustomer)} type="button" disabled={isSubmitting} variant="contained" color="default" size="small">Cancel</Button>}

                        <Button type="submit" disabled={!isValid || isSubmitting} variant="contained" color="primary" size="small">Save</Button>
                      </FormActions>

                    </FormContent>
                  </Form>
                }
              </Formik>
            </CardContent>
          </Card>}

        </Grid>

        {/* Delete warning  */}
        <StyledModal
          open={this.state.showDeleteWarning}
          onClose={() => this.setState({ showDeleteWarning: false })}
        >
          <div className="modal-content">
            <p>Are you sure to delete?</p>
            <WarningModalActions>

              <Button onClick={this.deleteCustomer} type="button" variant="contained" color="secondary" size="small">Yes</Button>
              <Button onClick={() => this.setState({ showDeleteWarning: false })} type="button" variant="contained" color="default" size="small">No</Button>

            </WarningModalActions>

            <div>{this.state.saveError && <ValidationError>{this.state.saveError}</ValidationError>}</div>
          </div>
        </StyledModal>
      </Grid>

    </>);
  }
}

Customers.contextType = RootContext;

export default withSnackbar(Customers);

