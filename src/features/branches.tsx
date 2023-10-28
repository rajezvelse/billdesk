import React from 'react';
import ReactComponent from '../react-component'
import { IpcRendererEvent } from "electron";
import RootContext from '../root.context';
import { IsGranted } from '../directives';

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



import * as Yup from 'yup';
import { Formik, Field, ErrorMessage } from 'formik';
import withSnackbar from '../directives/with-snackbar';


class Branches extends ReactComponent<any, {
  mode: 'ADD' | 'EDIT' | 'VIEW';
  saveError: null | string;
  listError: null | string;
  branches: any[];
  selectedBranch: any;
  formValues: {
    name: string;
    phone: string;
    address: string;
  }
  showDeleteWarning: boolean;
}> {
  context: any;
  validationSchema: Yup.ObjectSchema<any> = Yup.object().shape({
    name: Yup.string().required('Please enter branch name'),
    phone: Yup.string(),
    address: Yup.string()
  });

  constructor(props: any) {
    super(props);

    this.state = {
      mode: 'ADD',
      saveError: null,
      listError: null,
      branches: [],
      selectedBranch: null,
      formValues: {
        name: '',
        phone: '',
        address: '',
      },
      showDeleteWarning: false
    }
  }


  componentDidMount() {
    super.componentDidMount();

    // Load branches list  
    if (this.context.electronIpc) this.fetchBranches();

  }

  fetchBranches = () => {
    this.context.electronIpc.once("fetchBranchesResponse", (event: IpcRendererEvent, status: number, response: any) => {
      this.context.setLoading(false);

      // On fail
      if (status !== 200) {
        this.setState({ listError: response });
        return;
      }

      this.setState({ branches: response, listError: null });
    });

    this.context.setLoading(true);
    this.context.electronIpc.send("fetchBranches");
  }

  openAddForm = (event: any, refreshList?: boolean) => {
    this.setState({
      mode: 'ADD',
      saveError: null,
      selectedBranch: null,
      formValues: {
        name: '',
        phone: '',
        address: '',
      }
    }, () => {
      if (refreshList) this.fetchBranches();
    })
  }

  viewBranch = (item: any) => {
    this.setState({
      mode: 'VIEW',
      selectedBranch: item
    })
  }

  selectForEdit = () => {

    this.setState({
      mode: 'EDIT',
      saveError: null,
      formValues: {
        name: this.state.selectedBranch.name,
        phone: this.state.selectedBranch.phone || '',
        address: this.state.selectedBranch.address || ''
      }
    });
  }

  save = (values: { [s: string]: any }): Promise<boolean> => {
    return new Promise((resolve, reject) => {

      if (this.state.mode === 'ADD') {

        this.context.electronIpc.once('addNewBranchResponse', (event: IpcRendererEvent, status: number, response: any) => {
          this.context.setLoading(false);

          // On fail
          if (status !== 200) {
            reject(response);

            this.setState({
              saveError: response, formValues: {
                name: values.name,
                phone: values.phone,
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
            selectedBranch: response
          }, () => {
            this.fetchBranches();
          })

        });

        // Send signal
        this.context.setLoading(true);
        this.context.electronIpc.send('addNewBranch', {
          name: values.name,
          phone: values.phone,
          address: values.address
        })

      }

      if (this.state.mode === 'EDIT') {
        this.context.electronIpc.once('updateBranchResponse', (event: IpcRendererEvent, status: number, response: any) => {
          this.context.setLoading(false);

          // On fail
          if (status !== 200) {
            reject(response);

            this.setState({
              saveError: response, formValues: {
                name: values.name,
                phone: values.phone || '',
                address: values.address || ''
              }
            });
            return;
          }

          // On success
          this.props.enqueueSnackbar('Saved', { variant: 'success' })
          this.setState({
            saveError: null,
            mode: 'VIEW',
            selectedBranch: response
          }, () => {
            this.fetchBranches();
          })

        });

        // Send signal
        this.context.setLoading(true);
        this.context.electronIpc.send('updateBranch', {
          id: this.state.selectedBranch.id,
          name: values.name,
          phone: values.phone,
          address: values.address
        })

      }
    })
  }

  deleteBranch = () => {
    this.context.electronIpc.once('deleteBranchResponse', (event: IpcRendererEvent, status: number, response: any) => {
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
    this.context.electronIpc.send('deleteBranch', { id: this.state.selectedBranch.id })

  }

  render() {
    return (
      <>
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <Card>
              <CardContent>
                <CardSectionTitle gutterBottom variant="h5">
                  Branches list
                  <IsGranted permissions={['create_branches']}>
                    <Tooltip title="Add new Branch" arrow placement="top">
                      <Button onClick={this.openAddForm} variant="contained" size="small" color="primary">
                        <AddIcon />
                      </Button>
                    </Tooltip>
                  </IsGranted>
                </CardSectionTitle>
                <ScrollWrapper >
                  <ItemsList>
                    {this.state.branches.map((item) => <ListItem key={uniqueId()} onClick={() => this.viewBranch(item)} className={this.state.selectedBranch && item.id === this.state.selectedBranch.id ? 'selected' : ''}>
                      <ListItemText>{item.name}</ListItemText>
                      {this.state.selectedBranch && item.id === this.state.selectedBranch.id && <DoubleArrowIcon color="primary" style={{ fontSize: "2rem" }} />}
                    </ListItem>)}
                  </ItemsList>
                </ScrollWrapper>
              </CardContent>
            </Card>
          </Grid>

          {/* View/Add/Edit section */}
          <Grid item xs={5}>
            {this.state.mode === 'VIEW' && <CardContent>
              <SectionTitle gutterBottom variant="h5">Branch details</SectionTitle>

              <FormContent>
                <DetailRow>
                  <DetailLabel xs={5}>Name</DetailLabel>
                  <DetailValue xs={7}>{this.state.selectedBranch.name}</DetailValue>
                </DetailRow>
                <DetailRow>
                  <DetailLabel xs={5}>Mobile</DetailLabel>
                  <DetailValue xs={7}>{this.state.selectedBranch.phone}</DetailValue>
                </DetailRow>
                <DetailRow>
                  <DetailLabel xs={5}>Address</DetailLabel>
                  <DetailValue xs={7}><span style={{ whiteSpace: 'pre-line' }}>{this.state.selectedBranch.address ? this.state.selectedBranch.address : '-'}</span></DetailValue>
                </DetailRow>

                <FormActions>

                  <IsGranted permissions={['update_branches']}>
                    <Button onClick={this.selectForEdit} type="button" variant="contained" color="primary" size="small">Edit</Button>
                  </IsGranted>

                  <IsGranted permissions={['delete_branches']}>
                    <Button onClick={() => this.setState({ showDeleteWarning: true, saveError: null })} type="button" variant="contained" color="secondary" size="small">Delete</Button>
                  </IsGranted>
                </FormActions>
              </FormContent>

            </CardContent>}

            <IsGranted permissions={['create_branches', 'update_branches']}>
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
                        <SectionTitle gutterBottom variant="h5">{this.state.mode === 'EDIT' ? 'Update Branch details' : 'Add new Branch'}</SectionTitle>
                        <FormContent>
                          <div>
                            <FormControl fullWidth>
                              <Field as={TextField} name="name" label="Branch name" type="text" required variant="outlined" size="small" error={touched.name && !!errors.name} />
                              <ErrorMessage name="name" component={ValidationError} />
                            </FormControl>
                          </div>
                          <div>
                            <FormControl fullWidth>
                              <Field as={TextField} name="phone" label="Branch phone number" type="text" variant="outlined" size="small" error={touched.phone && !!errors.phone} />
                              <ErrorMessage name="phone" component={ValidationError} />
                            </FormControl>
                          </div>
                          <div>
                            <FormControl fullWidth>
                              <Field as={TextField} name="address" label="Branch address" type="text" multiline={true} minRows="6" variant="outlined" size="small" error={touched.address && !!errors.address} />
                              <ErrorMessage name="address" component={ValidationError} />
                            </FormControl>
                          </div>

                          {this.state.saveError && <div><ValidationError>{this.state.saveError}</ValidationError></div>}

                          <FormActions>

                            {this.state.mode === 'EDIT' && <Button onClick={() => this.viewBranch(this.state.selectedBranch)} type="button" disabled={isSubmitting} variant="contained" color="default" size="small">Cancel</Button>}

                            <Button type="submit" disabled={!isValid || isSubmitting} variant="contained" color="primary" size="small">Save</Button>
                          </FormActions>

                        </FormContent>
                      </Form>
                    }
                  </Formik>
                </CardContent>
              </Card>}
            </IsGranted>
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

              <Button onClick={this.deleteBranch} type="button" variant="contained" color="secondary" size="small">Yes</Button>
              <Button onClick={() => this.setState({ showDeleteWarning: false })} type="button" variant="contained" color="default" size="small">No</Button>

            </WarningModalActions>

            <div>{this.state.saveError && <ValidationError>{this.state.saveError}</ValidationError>}</div>
          </div>
        </StyledModal>
      </>);
  }
}

Branches.contextType = RootContext;

export default withSnackbar(Branches);