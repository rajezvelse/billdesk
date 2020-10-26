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


class Brands extends ReactComponent<any, {
  mode: 'ADD' | 'EDIT' | 'VIEW';
  saveError: null | string;
  listError: null | string;
  brands: any[];
  selectedBrand: any;
  formValues: {
    name: string;
  }
  showDeleteWarning: boolean;
}> {
  validationSchema: Yup.ObjectSchema = Yup.object().shape({
    name: Yup.string().required('Please enter brand name')
  });

  constructor(props: any) {
    super(props);

    this.state = {
      mode: 'ADD',
      saveError: null,
      listError: null,
      brands: [],
      selectedBrand: null,
      formValues: {
        name: ''
      },
      showDeleteWarning: false
    }
  }


  componentDidMount() {
super.componentDidMount();

    // Load product categories list  
    if (this.context.electronIpc) this.fetchBrands();

  }

  fetchBrands = () => {
    this.context.electronIpc.once("fetchBrandsResponse", (event: IpcRendererEvent, status: number, response: any) => {
      this.context.setLoading(false);

      // On fail
      if (status !== 200) {
        this.setState({ listError: response });
        return;
      }

      this.setState({ brands: response, listError: null });
    });

    this.context.setLoading(true);
    this.context.electronIpc.send("fetchBrands");
  }

  openAddForm = (event: any, refreshList?: boolean) => {
    this.setState({
      mode: 'ADD',
      saveError: null,
      selectedBrand: null,
      formValues: {
        name: ''
      }
    }, () => {
      if (refreshList) this.fetchBrands();
    })
  }

  viewBrand = (item: any) => {
    this.setState({
      mode: 'VIEW',
      selectedBrand: item
    })
  }

  selectForEdit = () => {

    this.setState({
      mode: 'EDIT',
      saveError: null,
      formValues: {
        name: this.state.selectedBrand.name
      }
    });
  }

  save = (values: { [s: string]: any }): Promise<boolean> => {
    return new Promise((resolve, reject) => {

      if (this.state.mode === 'ADD') {

        this.context.electronIpc.once('addNewBrandResponse', (event: IpcRendererEvent, status: number, response: any) => {
          this.context.setLoading(false);

          // On fail
          if (status !== 200) {
            reject(response);

            this.setState({
              saveError: response, formValues: {
                name: values.name
              }
            });
            return;
          }

          // On success
          this.props.enqueueSnackbar('Saved', { variant: 'success' })
          this.setState({
            saveError: null,
            mode: 'VIEW',
            selectedBrand: response
          }, () => {
            this.fetchBrands();
          })

        });

        // Send signal
        this.context.setLoading(true);
        this.context.electronIpc.send('addNewBrand', {
          name: values.name
        })

      }

      if (this.state.mode === 'EDIT') {
        this.context.electronIpc.once('updateBrandResponse', (event: IpcRendererEvent, status: number, response: any) => {
          this.context.setLoading(false);

          // On fail
          if (status !== 200) {
            this.setState({
              saveError: response, formValues: {
                name: values.name
              }
            });
            return;
          }

          // On success
          this.props.enqueueSnackbar('Saved', { variant: 'success' })
          this.setState({
            saveError: null,
            mode: 'VIEW',
            selectedBrand: response
          }, () => {
            this.fetchBrands();
          })

        });

        // Send signal
        this.context.setLoading(true);
        this.context.electronIpc.send('updateBrand', {
          id: this.state.selectedBrand.id,
          name: values.name
        })

      }
    });
  }

  deleteBrand = () => {
    this.context.electronIpc.once('deleteBrandResponse', (event: IpcRendererEvent, status: number, response: any) => {
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
    this.context.electronIpc.send('deleteBrand', { id: this.state.selectedBrand.id })

  }

  render() {
    return (
      <>
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <Card>
              <CardContent>
                <CardSectionTitle gutterBottom variant="h5">
                  Vehicle models
                  <Tooltip title="Add new brand" arrow placement="top">
                    <Button onClick={this.openAddForm} variant="contained" size="small" color="primary">
                      <AddIcon />
                    </Button>
                  </Tooltip>
                </CardSectionTitle>
                <ScrollWrapper >
                  <ItemsList>
                    {this.state.brands.map((item) => <ListItem key={uniqueId()} onClick={() => this.viewBrand(item)} className={this.state.selectedBrand && item.id == this.state.selectedBrand.id ? 'selected' : ''}>
                      <ListItemText>{item.name}</ListItemText>
                      {this.state.selectedBrand && item.id == this.state.selectedBrand.id && <DoubleArrowIcon color="primary" style={{ fontSize: "2rem" }} />}
                    </ListItem>)}
                  </ItemsList>
                </ScrollWrapper>
              </CardContent>
            </Card>
          </Grid>

          {/* View/Add/Edit section */}
          <Grid item xs={4}>
            {this.state.mode === 'VIEW' && <CardContent>
              <SectionTitle gutterBottom variant="h5">Vehicle model details</SectionTitle>

              <FormContent>
                <DetailRow>
                  <DetailLabel xs={5}>Model name</DetailLabel>
                  <DetailValue xs={7}>{this.state.selectedBrand.name}</DetailValue>
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
                      <SectionTitle gutterBottom variant="h5">{this.state.mode === 'EDIT' ? 'Update model' : 'Add new model'}</SectionTitle>
                      <FormContent>
                        <div>
                          <FormControl fullWidth>
                            <Field as={TextField} name="name" label="Brand name" type="text" required variant="outlined" size="small" error={touched.name && !!errors.name} />
                            <ErrorMessage name="name" component={ValidationError} />
                          </FormControl>
                        </div>

                        {this.state.saveError && <div><ValidationError>{this.state.saveError}</ValidationError></div>}

                        <FormActions>

                          {this.state.mode === 'EDIT' && <Button onClick={() => this.viewBrand(this.state.selectedBrand)} type="button" disabled={isSubmitting} variant="contained" color="default" size="small">Cancel</Button>}

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

              <Button onClick={this.deleteBrand} type="button" variant="contained" color="secondary" size="small">Yes</Button>
              <Button onClick={() => this.setState({ showDeleteWarning: false })} type="button" variant="contained" color="default" size="small">No</Button>

            </WarningModalActions>

            <div>{this.state.saveError && <ValidationError>{this.state.saveError}</ValidationError>}</div>
          </div>
        </StyledModal>
      </>);
  }
}

Brands.contextType = RootContext;

export default withSnackbar(Brands);