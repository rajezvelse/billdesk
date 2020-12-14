import React from 'react';
import ReactComponent from '../react-component'
import { IpcRendererEvent } from "electron";
import RootContext from '../root.context';

import uniqueId from 'lodash/uniqueId';
import {
  ItemsList, SectionTitle, CardSectionTitle, FormControl, Form, ValidationError,
  FormContent, ScrollWrapper, FormActions, StyledModal, WarningModalActions,
  DetailRow, DetailLabel, DetailValue
} from '../styled-components';
import {
  Grid, ListItem, ListItemText, Card, CardContent, Button, Tooltip,
  TextField
} from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import DoubleArrowIcon from '@material-ui/icons/DoubleArrow';

import { withSnackbar } from 'notistack'

import * as Yup from 'yup';
import { Formik, Field, ErrorMessage } from 'formik';


class Vendors extends ReactComponent<any, {
  mode: 'ADD' | 'EDIT' | 'VIEW';
  saveError: null | string;
  listError: null | string;
  vendors: any[];
  selectedVendor: any;
  formValues: {
    name: string;
    mobile: string;
    email: string;
    address: string;
    gstin: string;
  }
  showDeleteWarning: boolean;
}> {
  validationSchema: Yup.ObjectSchema = Yup.object().shape({
    name: Yup.string().required('Please enter vendor name'),
    mobile: Yup.string().required('Please enter vendor mobile number'),
    email: Yup.string().email('Enter valid email address'),
    address: Yup.string(),
    gstin: Yup.string()
  });

  constructor(props: any) {
    super(props);

    this.state = {
      mode: 'ADD',
      saveError: null,
      listError: null,
      vendors: [],
      selectedVendor: null,
      formValues: {
        name: '',
        mobile: '',
        email: '',
        address: '',
        gstin: ''
      },
      showDeleteWarning: false
    }
  }


  componentDidMount() {
super.componentDidMount();

    // Load vendors list  
    if (this.context.electronIpc) this.fetchVendors();

  }

  fetchVendors = () => {
    this.context.electronIpc.once("fetchVendorsResponse", (event: IpcRendererEvent, status: number, response: any) => {
      this.context.setLoading(false);

      // On fail
      if (status !== 200) {
        this.setState({ listError: response });
        return;
      }

      this.setState({ vendors: response, listError: null });
    });

    this.context.setLoading(true);
    this.context.electronIpc.send("fetchVendors");
  }

  openAddForm = (event: any, refreshList?: boolean) => {
    this.setState({
      mode: 'ADD',
      saveError: null,
      selectedVendor: null,
      formValues: {
        name: '',
        mobile: '',
        email: '',
        address: '',
        gstin: ''
      }
    }, () => {
      if (refreshList) this.fetchVendors();
    })
  }

  viewVendor = (item: any) => {
    this.setState({
      mode: 'VIEW',
      selectedVendor: item
    })
  }

  selectForEdit = () => {

    this.setState({
      mode: 'EDIT',
      saveError: null,
      formValues: {
        name: this.state.selectedVendor.name,
        mobile: this.state.selectedVendor.mobile,
        email: this.state.selectedVendor.email,
        address: this.state.selectedVendor.address,
        gstin: this.state.selectedVendor.gstin
      }
    });
  }

  save = (values: { [s: string]: any }): Promise<boolean> => {
    return new Promise((resolve, reject) => {

      if (this.state.mode === 'ADD') {

        this.context.electronIpc.once('addNewVendorResponse', (event: IpcRendererEvent, status: number, response: any) => {
          this.context.setLoading(false);

          // On fail
          if (status !== 200) {
            reject(response);

            this.setState({
              saveError: response, formValues: {
                name: values.name,
                mobile: values.mobile,
                email: values.email,
                gstin: values.gstin,
                address: values.address
              }
            });
            return;
          }

          // On success
          this.props.enqueueSnackbar('Saved', { variant: 'success' })
          this.setState({
            saveError: null,
            mode: 'VIEW',
            selectedVendor: response
          }, () => {
            this.fetchVendors();
          })

        });

        // Send signal
        this.context.setLoading(true);
        this.context.electronIpc.send('addNewVendor', {
          name: values.name,
          mobile: values.mobile,
          email: values.email,
          gstin: values.gstin,
          address: values.address
        })

      }

      if (this.state.mode === 'EDIT') {
        this.context.electronIpc.once('updateVendorResponse', (event: IpcRendererEvent, status: number, response: any) => {
          this.context.setLoading(false);

          // On fail
          if (status !== 200) {
            reject(response);

            this.setState({
              saveError: response, formValues: {
                name: values.name,
                mobile: values.mobile,
                email: values.email,
                gstin: values.gstin,
                address: values.address
              }
            });
            return;
          }

          // On success
          this.props.enqueueSnackbar('Saved', { variant: 'success' })
          this.setState({
            saveError: null,
            mode: 'VIEW',
            selectedVendor: response
          }, () => {
            this.fetchVendors();
          })

        });

        // Send signal
        this.context.setLoading(true);
        this.context.electronIpc.send('updateVendor', {
          id: this.state.selectedVendor.id,
          name: values.name,
          mobile: values.mobile,
          email: values.email,
          gstin: values.gstin,
          address: values.address
        })

      }
    })
  }

  deleteVendor = () => {
    this.context.electronIpc.once('deleteVendorResponse', (event: IpcRendererEvent, status: number, response: any) => {
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
    this.context.electronIpc.send('deleteVendor', { id: this.state.selectedVendor.id })

  }

  render() {
    return (
      <>
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <Card>
              <CardContent>
                <CardSectionTitle gutterBottom variant="h5">
                  Vendors list
                  <Tooltip title="Add new Vendor" arrow placement="top">
                    <Button onClick={this.openAddForm} variant="contained" size="small" color="primary">
                      <AddIcon />
                    </Button>
                  </Tooltip>
                </CardSectionTitle>
                <ScrollWrapper >
                  <ItemsList>
                    {this.state.vendors.map((item) => <ListItem key={uniqueId()} onClick={() => this.viewVendor(item)} className={this.state.selectedVendor && item.id === this.state.selectedVendor.id ? 'selected' : ''}>
                      <ListItemText>{item.name}</ListItemText>
                      {this.state.selectedVendor && item.id === this.state.selectedVendor.id && <DoubleArrowIcon color="primary" style={{ fontSize: "2rem" }} />}
                    </ListItem>)}
                  </ItemsList>
                </ScrollWrapper>
              </CardContent>
            </Card>
          </Grid>

          {/* View/Add/Edit section */}
          <Grid item xs={5}>
            {this.state.mode === 'VIEW' && <CardContent>
              <SectionTitle gutterBottom variant="h5">Vendor details</SectionTitle>

              <FormContent>
                <DetailRow>
                  <DetailLabel xs={5}>Name</DetailLabel>
                  <DetailValue xs={7}>{this.state.selectedVendor.name}</DetailValue>
                </DetailRow>
                <DetailRow>
                  <DetailLabel xs={5}>Mobile</DetailLabel>
                  <DetailValue xs={7}>{this.state.selectedVendor.mobile}</DetailValue>
                </DetailRow>
                <DetailRow>
                  <DetailLabel xs={5}>Email</DetailLabel>
                  <DetailValue xs={7}>{this.state.selectedVendor.email ? this.state.selectedVendor.email : '-'}</DetailValue>
                </DetailRow>
                <DetailRow>
                  <DetailLabel xs={5}>GSTIN Number</DetailLabel>
                  <DetailValue xs={7}>{this.state.selectedVendor.gstin ? this.state.selectedVendor.gstin : '-'}</DetailValue>
                </DetailRow>
                <DetailRow>
                  <DetailLabel xs={5}>Address</DetailLabel>
                  <DetailValue xs={7}><span style={{ whiteSpace: 'pre-line' }}>{this.state.selectedVendor.address ? this.state.selectedVendor.address : '-'}</span></DetailValue>
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
                      <SectionTitle gutterBottom variant="h5">{this.state.mode === 'EDIT' ? 'Update Vendor details' : 'Add new Vendor'}</SectionTitle>
                      <FormContent>
                        <div>
                          <FormControl fullWidth>
                            <Field as={TextField} name="name" label="Vendor name" type="text" required variant="outlined" size="small" error={touched.name && !!errors.name} />
                            <ErrorMessage name="name" component={ValidationError} />
                          </FormControl>
                        </div>
                        <div>
                          <FormControl fullWidth>
                            <Field as={TextField} name="mobile" label="Vendor mobile number" required type="text" variant="outlined" size="small" error={touched.mobile && !!errors.mobile} />
                            <ErrorMessage name="mobile" component={ValidationError} />
                          </FormControl>
                        </div>
                        <div>
                          <FormControl fullWidth>
                            <Field as={TextField} name="email" label="Vendor email" type="text" variant="outlined" size="small" error={touched.email && !!errors.email} />
                            <ErrorMessage name="email" component={ValidationError} />
                          </FormControl>
                        </div>
                        <div>
                          <FormControl fullWidth>
                            <Field as={TextField} name="gstin" label="Vendor GSTIN number" type="text" variant="outlined" size="small" error={touched.gstin && !!errors.gstin} />
                            <ErrorMessage name="gstin" component={ValidationError} />
                          </FormControl>
                        </div>
                        <div>
                          <FormControl fullWidth>
                            <Field as={TextField} name="address" label="Vendor address" type="text" multiline={true} rows="6" variant="outlined" size="small" error={touched.address && !!errors.address} />
                            <ErrorMessage name="address" component={ValidationError} />
                          </FormControl>
                        </div>

                        {this.state.saveError && <div><ValidationError>{this.state.saveError}</ValidationError></div>}

                        <FormActions>

                          {this.state.mode === 'EDIT' && <Button onClick={() => this.viewVendor(this.state.selectedVendor)} type="button" disabled={isSubmitting} variant="contained" color="default" size="small">Cancel</Button>}

                          <Button type="submit" disabled={!isValid || isSubmitting} variant="contained" color="primary" size="small">Save</Button>
                        </FormActions>

                      </FormContent>
                    </Form>
                  }
                </Formik>
              </CardContent>
            </Card>}

          </Grid>
        </Grid>

        {/* Delete warning  */}
        <StyledModal
          open={this.state.showDeleteWarning}
          onClose={() => this.setState({ showDeleteWarning: false })}
        >
          <div className="modal-content">
            <p>Are you sure to delete?</p>
            <WarningModalActions>

              <Button onClick={this.deleteVendor} type="button" variant="contained" color="secondary" size="small">Yes</Button>
              <Button onClick={() => this.setState({ showDeleteWarning: false })} type="button" variant="contained" color="default" size="small">No</Button>

            </WarningModalActions>

            <div>{this.state.saveError && <ValidationError>{this.state.saveError}</ValidationError>}</div>
          </div>
        </StyledModal>
      </>);
  }
}

Vendors.contextType = RootContext;

export default withSnackbar(Vendors);