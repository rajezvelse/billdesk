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


class ExpenseCategories extends ReactComponent<any, {
  mode: 'ADD' | 'EDIT' | 'VIEW';
  saveError: null | string;
  listError: null | string;
  expenseCategories: any[];
  selectedExpenseCategory: any;
  formValues: {
    category: string;
  }
  showDeleteWarning: boolean;
}> {
  context: any;
  validationSchema: Yup.ObjectSchema<any> = Yup.object().shape({
    category: Yup.string().required('Please enter expense category')
  });

  constructor(props: any) {
    super(props);

    this.state = {
      mode: 'ADD',
      saveError: null,
      listError: null,
      expenseCategories: [],
      selectedExpenseCategory: null,
      formValues: {
        category: ''
      },
      showDeleteWarning: false
    }
  }


  componentDidMount() {
    super.componentDidMount();

    // Load expense categories list  
    if (this.context.electronIpc) this.fetchExpenseCategories();

  }

  fetchExpenseCategories = () => {
    this.context.electronIpc.once("fetchExpenseCategoriesResponse", (event: IpcRendererEvent, status: number, response: any) => {
      this.context.setLoading(false);

      // On fail
      if (status !== 200) {
        this.setState({ listError: response });
        return;
      }

      this.setState({ expenseCategories: response, listError: null });
    });

    this.context.setLoading(true);
    this.context.electronIpc.send("fetchExpenseCategories");
  }

  openAddForm = (event: any, refreshList?: boolean) => {
    this.setState({
      mode: 'ADD',
      saveError: null,
      selectedExpenseCategory: null,
      formValues: {
        category: ''
      }
    }, () => {
      if (refreshList) this.fetchExpenseCategories();
    })
  }

  viewExpenseCategory = (item: any) => {
    this.setState({
      mode: 'VIEW',
      selectedExpenseCategory: item
    })
  }

  selectForEdit = () => {

    this.setState({
      mode: 'EDIT',
      saveError: null,
      formValues: {
        category: this.state.selectedExpenseCategory.category
      }
    });
  }

  save = (values: { [s: string]: any }): Promise<boolean> => {
    return new Promise((resolve, reject) => {

      if (this.state.mode === 'ADD') {

        this.context.electronIpc.once('addNewExpenseCategoryResponse', (event: IpcRendererEvent, status: number, response: any) => {
          this.context.setLoading(false);

          // On fail
          if (status !== 200) {
            reject(response);

            this.setState({
              saveError: response, formValues: {
                category: values.category
              }
            });
            return;
          }

          // On success
          this.props.enqueueSnackbar('Saved', { variant: 'success' })
          this.setState({
            saveError: null,
            mode: 'VIEW',
            selectedExpenseCategory: response
          }, () => {
            this.fetchExpenseCategories();
          })

        });

        // Send signal
        this.context.setLoading(true);
        this.context.electronIpc.send('addNewExpenseCategory', {
          category: values.category
        })

      }

      if (this.state.mode === 'EDIT') {
        this.context.electronIpc.once('updateExpenseCategoryResponse', (event: IpcRendererEvent, status: number, response: any) => {
          this.context.setLoading(false);

          // On fail
          if (status !== 200) {
            reject(response);

            this.setState({
              saveError: response, formValues: {
                category: values.category
              }
            });
            return;
          }

          // On success
          this.props.enqueueSnackbar('Saved', { variant: 'success' })
          this.setState({
            saveError: null,
            mode: 'VIEW',
            selectedExpenseCategory: response
          }, () => {
            this.fetchExpenseCategories();
          })

        });

        // Send signal
        this.context.setLoading(true);
        this.context.electronIpc.send('updateExpenseCategory', {
          id: this.state.selectedExpenseCategory.id,
          category: values.category
        })

      }
    })
  }

  deleteExpenseCategory = () => {
    this.context.electronIpc.once('deleteExpenseCategoryResponse', (event: IpcRendererEvent, status: number, response: any) => {
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
    this.context.electronIpc.send('deleteExpenseCategory', { id: this.state.selectedExpenseCategory.id })

  }

  render() {
    return (
      <>
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <Card>
              <CardContent>
                <CardSectionTitle gutterBottom variant="h5">
                  Expense categories list
                  <IsGranted permissions={['create_expense_categories']}>
                    <Tooltip title="Add new expense category" arrow placement="top">
                      <Button onClick={this.openAddForm} variant="contained" size="small" color="primary">
                        <AddIcon />
                      </Button>
                    </Tooltip>
                  </IsGranted>
                </CardSectionTitle>
                <ScrollWrapper >
                  <ItemsList>
                    {this.state.expenseCategories.map((item) => <ListItem key={uniqueId()} onClick={() => this.viewExpenseCategory(item)} className={this.state.selectedExpenseCategory && item.id === this.state.selectedExpenseCategory.id ? 'selected' : ''}>
                      <ListItemText>{item.category}</ListItemText>
                      {this.state.selectedExpenseCategory && item.id === this.state.selectedExpenseCategory.id && <DoubleArrowIcon color="primary" style={{ fontSize: "2rem" }} />}
                    </ListItem>)}
                  </ItemsList>
                </ScrollWrapper>
              </CardContent>
            </Card>
          </Grid>

          {/* View/Add/Edit section */}
          <Grid item xs={4}>
            {this.state.mode === 'VIEW' && <CardContent>
              <SectionTitle gutterBottom variant="h5">Expense category details</SectionTitle>

              <FormContent>
                <DetailRow>
                  <DetailLabel xs={5}>Category</DetailLabel>
                  <DetailValue xs={7}>{this.state.selectedExpenseCategory.category}</DetailValue>
                </DetailRow>

                <FormActions>
                  <IsGranted permissions={['update_expense_categories']}>
                    <Button onClick={this.selectForEdit} type="button" variant="contained" color="primary" size="small">Edit</Button>
                  </IsGranted>
                  <IsGranted permissions={['delete_expense_categories']}>
                    <Button onClick={() => this.setState({ showDeleteWarning: true, saveError: null })} type="button" variant="contained" color="secondary" size="small">Delete</Button>
                  </IsGranted>
                </FormActions>
              </FormContent>

            </CardContent>}
            <IsGranted permissions={['create_expense_categories', 'update_expense_categories']}>
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
                        <SectionTitle gutterBottom variant="h5">{this.state.mode === 'EDIT' ? 'Update expense category' : 'Add new expense category'}</SectionTitle>
                        <FormContent>
                          <div>
                            <FormControl fullWidth>
                              <Field as={TextField} name="category" label="Expense category" type="text" required variant="outlined" size="small" error={touched.category && !!errors.category} />
                              <ErrorMessage name="category" component={ValidationError} />
                            </FormControl>
                          </div>

                          {this.state.saveError && <div><ValidationError>{this.state.saveError}</ValidationError></div>}

                          <FormActions>

                            {this.state.mode === 'EDIT' && <Button onClick={() => this.viewExpenseCategory(this.state.selectedExpenseCategory)} type="button" disabled={isSubmitting} variant="contained" color="default" size="small">Cancel</Button>}

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

              <Button onClick={this.deleteExpenseCategory} type="button" variant="contained" color="secondary" size="small">Yes</Button>
              <Button onClick={() => this.setState({ showDeleteWarning: false })} type="button" variant="contained" color="default" size="small">No</Button>

            </WarningModalActions>

            <div>{this.state.saveError && <ValidationError>{this.state.saveError}</ValidationError>}</div>
          </div>
        </StyledModal>
      </>);
  }
}

ExpenseCategories.contextType = RootContext;

export default withSnackbar(ExpenseCategories);