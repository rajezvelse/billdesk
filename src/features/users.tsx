import React from 'react';
import ReactComponent from '../react-component'
import { IpcRendererEvent } from "electron";
import RootContext from '../root.context';
import { IsGranted } from '../directives';

import uniqueId from 'lodash/uniqueId';
import {
  ItemsList, SectionTitle, CardSectionTitle, FormControl, Form, ValidationError,
  FormContent, ScrollWrapper, FormActions, StyledModal, WarningModalActions,
  DetailRow, DetailLabel, DetailValue, Autocomplete, ColoredLabel
} from '../styled-components';
import {
  Grid, ListItem, ListItemText, Card, CardContent, Button, Tooltip,
  TextField, Switch, FormControlLabel
} from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import DoubleArrowIcon from '@material-ui/icons/DoubleArrow';

import { withSnackbar } from 'notistack'

import * as Yup from 'yup';
import { Formik, Field, ErrorMessage } from 'formik';


class Users extends ReactComponent<any, {
  mode: 'ADD' | 'EDIT' | 'VIEW' | 'CHANGE_PASSWORD';
  saveError: null | string;
  listError: null | string;
  users: any[];
  selectedUser: any;
  formValues: {
    username: string;
    password: string;
    confirmPassword: string;
    role: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    deleted: boolean;
  },
  roles: any[];
  showDeleteWarning: boolean;
}> {
  validationSchema: Yup.ObjectSchema = Yup.object().shape({
    username: Yup.string().required('Please enter user name'),
    password: Yup.string().required('Please enter password').min(6, 'Password should have atleast 6 characters'),
    confirmPassword: Yup.string().required('Please re-enter the password')
      .test('passwords-mismatch', 'Confirm password doesn\'t match with the password.', function (value: string) {
        return this.parent.password === value;
      }),
    email: Yup.string().email('Enter valid email address'),
    role: Yup.string().required('Please select user role'),
    firstName: Yup.string().required('Please enter first name'),
    lastName: Yup.string(),
    phone: Yup.string().required('Please enter phone number'),
    deleted: Yup.boolean(),
  });

  editValidationSchema: Yup.ObjectSchema = Yup.object().shape({
    username: Yup.string().required('Please enter user name'),
    email: Yup.string().email('Enter valid email address'),
    role: Yup.string().required('Please select user role'),
    firstName: Yup.string().required('Please enter first name'),
    lastName: Yup.string(),
    phone: Yup.string().required('Please enter phone number')
  });

  changePasswordValidationSchema: Yup.ObjectSchema = Yup.object().shape({
    password: Yup.string().required('Please enter password'),
    confirmPassword: Yup.string().required('Please re-enter the password')
      .test('passwords-mismatch', 'Confirm password doesn\'t match with the password.', function (value: string) {
        return this.parent.password === value;
      })
  });

  constructor(props: any) {
    super(props);

    this.state = {
      mode: 'ADD',
      saveError: null,
      listError: null,
      users: [],
      selectedUser: null,
      formValues: {
        username: '',
        password: '',
        confirmPassword: '',
        role: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        deleted: false
      },
      roles: [],
      showDeleteWarning: false
    }
  }


  componentDidMount() {
    super.componentDidMount();

    // Load users list  
    if (this.context.electronIpc) {
      this.fetchUsers();
      this.fetchFormData();
    }

  }

  fetchFormData = () => {
    this.context.electronIpc.once("fetchUsersFormDataResponse", (event: IpcRendererEvent, status: number, response: any) => {
      this.context.setLoading(false);

      // On fail
      if (status !== 200) {
        return;
      }

      this.setState({ roles: response });
    });

    this.context.setLoading(true);
    this.context.electronIpc.send("fetchUsersFormData");
  }

  fetchUsers = () => {
    this.context.electronIpc.once("fetchUsersResponse", (event: IpcRendererEvent, status: number, response: any) => {
      this.context.setLoading(false);

      // On fail
      if (status !== 200) {
        this.setState({ listError: response });
        return;
      }

      this.setState({ users: response, listError: null });
    });

    this.context.setLoading(true);
    this.context.electronIpc.send("fetchUsers");
  }

  openAddForm = (event: any, refreshList?: boolean) => {
    this.setState({
      mode: 'ADD',
      saveError: null,
      selectedUser: null,
      formValues: {
        username: '',
        password: '',
        confirmPassword: '',
        role: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        deleted: false
      }
    }, () => {
      if (refreshList) this.fetchUsers();
    })
  }

  viewUser = (item: any) => {
    this.setState({
      mode: 'VIEW',
      selectedUser: item
    })
  }

  selectForEdit = () => {

    this.setState({
      mode: 'EDIT',
      saveError: null,
      formValues: {
        username: this.state.selectedUser.username,
        password: '',
        confirmPassword: '',
        role: this.state.selectedUser.role ? this.state.selectedUser.role.id : '',
        firstName: this.state.selectedUser.firstName || '',
        lastName: this.state.selectedUser.lastName || '',
        email: this.state.selectedUser.email || '',
        phone: this.state.selectedUser.phone || '',
        deleted: this.state.selectedUser.deleted || false
      }
    });
  }

  selectForPC = () => {

    this.setState({
      mode: 'CHANGE_PASSWORD',
      saveError: null,
      formValues: {
        username: '',
        password: '',
        confirmPassword: '',
        role: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        deleted: false
      }
    });
  }

  save = (values: { [s: string]: any }): Promise<boolean> => {
    return new Promise((resolve, reject) => {

      if (this.state.mode === 'ADD') {

        this.context.electronIpc.once('addNewUserResponse', (event: IpcRendererEvent, status: number, response: any) => {
          this.context.setLoading(false);

          // On fail
          if (status !== 200) {
            reject(response);

            this.setState({
              saveError: response, formValues: {
                username: values.username,
                password: values.password,
                confirmPassword: values.confirmPassword,
                role: values.role,
                firstName: values.firstName,
                lastName: values.lastName,
                email: values.email,
                phone: values.phone,
                deleted: values.deleted
              }
            });
            return;
          }

          // On success
          this.props.enqueueSnackbar('Saved', { variant: 'success' })
          response.role = this.state.roles.find((r: any) => r.id === response.role);

          this.setState({
            saveError: null,
            mode: 'VIEW',
            selectedUser: response
          }, () => {
            this.fetchUsers();
          })

        });

        // Send signal
        this.context.setLoading(true);
        this.context.electronIpc.send('addNewUser', {
          username: values.username,
          password: values.password,
          role: values.role,
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          phone: values.phone,
          deleted: false
        })

      }

      if (this.state.mode === 'EDIT') {
        this.context.electronIpc.once('updateUserResponse', (event: IpcRendererEvent, status: number, response: any) => {
          this.context.setLoading(false);

          // On fail
          if (status !== 200) {
            reject(response);

            this.setState({
              saveError: response, formValues: {
                username: values.username,
                password: '',
                confirmPassword: '',
                role: values.role,
                firstName: values.firstName,
                lastName: values.lastName,
                email: values.email,
                phone: values.phone,
                deleted: values.deleted
              }
            });
            return;
          }

          // On success
          this.props.enqueueSnackbar('Saved', { variant: 'success' })
          response.role = this.state.roles.find((r: any) => r.id === response.role);

          this.setState({
            saveError: null,
            mode: 'VIEW',
            selectedUser: response
          }, () => {
            this.fetchUsers();
          })

        });

        // Send signal
        this.context.setLoading(true);
        this.context.electronIpc.send('updateUser', {
          id: this.state.selectedUser.id,
          username: values.username,
          role: values.role,
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          phone: values.phone,
          deleted: values.deleted
        })

      }

      if (this.state.mode === 'CHANGE_PASSWORD') {
        this.context.electronIpc.once('changeUserPasswordResponse', (event: IpcRendererEvent, status: number, response: any) => {
          this.context.setLoading(false);

          // On fail
          if (status !== 200) {
            reject(response);

            this.setState({
              saveError: response, formValues: {
                username: values.username,
                password: values.password,
                confirmPassword: values.confirmPassword,
                role: values.role,
                firstName: values.firstName,
                lastName: values.lastName,
                email: values.email,
                phone: values.phone,
                deleted: values.deleted
              }
            });
            return;
          }

          // On success
          this.props.enqueueSnackbar('Password changed', { variant: 'success' })

          this.setState({
            saveError: null,
            mode: 'VIEW'
          })

        });

        // Send signal
        this.context.setLoading(true);
        this.context.electronIpc.send('changeUserPassword', {
          id: this.state.selectedUser.id,
          newPassword: values.password
        })

      }
    })
  }

  deleteUser = () => {
    this.context.electronIpc.once('deleteUserResponse', (event: IpcRendererEvent, status: number, response: any) => {
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
    this.context.electronIpc.send('deleteUser', { id: this.state.selectedUser.id })

  }

  render() {
    return (
      <>
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <Card>
              <CardContent>
                <CardSectionTitle gutterBottom variant="h5">
                  Users list
                  <IsGranted permissions={['create_users']} >
                    <Tooltip title="Add new User" arrow placement="top">
                      <Button onClick={this.openAddForm} variant="contained" size="small" color="primary">
                        <AddIcon />
                      </Button>
                    </Tooltip>
                  </IsGranted>
                </CardSectionTitle>
                <ScrollWrapper >
                  <ItemsList>
                    {this.state.users.map((item) => <ListItem key={uniqueId()} onClick={() => this.viewUser(item)} className={this.state.selectedUser && item.id === this.state.selectedUser.id ? 'selected' : ''}>
                      <ListItemText>{item.firstName} {item.lastName}</ListItemText>
                      {this.state.selectedUser && item.id === this.state.selectedUser.id && <DoubleArrowIcon color="primary" style={{ fontSize: "2rem" }} />}
                    </ListItem>)}
                  </ItemsList>
                </ScrollWrapper>
              </CardContent>
            </Card>
          </Grid>

          {/* View/Add/Edit section */}
          <Grid item xs={8}>
            {this.state.mode === 'VIEW' && <CardContent>
              <SectionTitle gutterBottom variant="h5">User details</SectionTitle>

              <FormContent>
                <DetailRow>
                  <DetailLabel xs={5}>Name</DetailLabel>
                  <DetailValue xs={7}>{this.state.selectedUser.firstName} {this.state.selectedUser.lastName}</DetailValue>
                </DetailRow>
                <DetailRow>
                  <DetailLabel xs={5}>Username</DetailLabel>
                  <DetailValue xs={7}>{this.state.selectedUser.username}</DetailValue>
                </DetailRow>
                <DetailRow>
                  <DetailLabel xs={5}>Role</DetailLabel>
                  <DetailValue xs={7}>{this.state.selectedUser.role ? this.state.selectedUser.role.name : '-'}</DetailValue>
                </DetailRow>
                <DetailRow>
                  <DetailLabel xs={5}>Email</DetailLabel>
                  <DetailValue xs={7}>{this.state.selectedUser.email ? this.state.selectedUser.email : '-'}</DetailValue>
                </DetailRow>
                <DetailRow>
                  <DetailLabel xs={5}>Phone Number</DetailLabel>
                  <DetailValue xs={7}>{this.state.selectedUser.phone ? this.state.selectedUser.phone : '-'}</DetailValue>
                </DetailRow>
                <DetailRow>
                  <DetailLabel xs={5}>Status</DetailLabel>
                  <DetailValue xs={7}><ColoredLabel variant={this.state.selectedUser.deleted ? 'error' : 'success'}>{this.state.selectedUser.deleted ? 'Inactive' : 'Active'}</ColoredLabel></DetailValue>
                </DetailRow>

                <FormActions>

                  <IsGranted permissions={['update_users']} >
                    <Button onClick={this.selectForEdit} type="button" variant="contained" color="primary" size="small">Edit</Button>
                    <Button onClick={this.selectForPC} type="button" variant="contained" color="primary" size="small">Change password</Button>
                  </IsGranted>
                  <IsGranted permissions={['delete_users']} >
                    <Button onClick={() => this.setState({ showDeleteWarning: true, saveError: null })} type="button" variant="contained" color="secondary" size="small">Delete</Button>
                  </IsGranted>
                </FormActions>
              </FormContent>

            </CardContent>}

            <IsGranted permissions={['create_users', 'update_users']} >
              {(this.state.mode === 'ADD' || this.state.mode === 'EDIT') && <Card elevation={0}>
                <CardContent>
                  <Formik initialValues={{ ...this.state.formValues }}
                    validationSchema={this.state.mode === 'ADD' ? this.validationSchema : this.editValidationSchema}
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
                        <SectionTitle gutterBottom variant="h5">{this.state.mode === 'EDIT' ? 'Update User details' : 'Add new User'}</SectionTitle>
                        <FormContent>
                          <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>

                              <div>
                                <FormControl fullWidth>
                                  <Field as={TextField} name="firstName" label="First name" type="text" required variant="outlined" size="small" error={touched.firstName && !!errors.firstName} />
                                  <ErrorMessage name="firstName" component={ValidationError} />
                                </FormControl>
                              </div>
                              <div>
                                <FormControl fullWidth>
                                  <Field as={TextField} name="lastName" label="Last name" type="text" variant="outlined" size="small" error={touched.lastName && !!errors.lastName} />
                                  <ErrorMessage name="lastName" component={ValidationError} />
                                </FormControl>
                              </div>
                              <div>
                                <FormControl fullWidth>
                                  <Field as={TextField} name="email" label="Email" type="text" required variant="outlined" size="small" error={touched.email && !!errors.email} />
                                  <ErrorMessage name="email" component={ValidationError} />
                                </FormControl>
                              </div>
                              <div>
                                <FormControl fullWidth>
                                  <Field as={TextField} name="phone" label="Phone number" type="text" required variant="outlined" size="small" error={touched.phone && !!errors.phone} />
                                  <ErrorMessage name="phone" component={ValidationError} />
                                </FormControl>
                              </div>
                            </Grid>

                            <Grid item xs={12} md={6}>
                              <div>
                                <FormControl fullWidth>
                                  <Field as={TextField} name="username" label="Username" type="text" required variant="outlined" size="small" error={touched.username && !!errors.username} disabled={this.state.mode !== 'ADD'} />
                                  <ErrorMessage name="username" component={ValidationError} />
                                </FormControl>
                              </div>
                              <div>
                                <FormControl fullWidth>
                                  <Field name="role">
                                    {(params: any) => (
                                      <Autocomplete
                                        options={this.state.roles}
                                        getOptionLabel={(option: any) => option.name}
                                        size="small"
                                        renderInput={(params: any) => <TextField {...params} label="User role" type="text" required variant="outlined" />}
                                        value={(params.field.value && params.field.value !== '' && this.state.roles.length) ? this.state.roles.find(r => r.id === params.field.value) : null}
                                        className={touched.role && !!errors.role ? "error" : ""}
                                        openOnFocus={true}
                                        onBlur={(e: any) => {
                                          params.form.setFieldTouched('role', true);
                                        }}
                                        onChange={(event: object, value: any | any[], reason: string) => {
                                          params.form.setFieldValue('role', value ? value.id : '', true);

                                        }}
                                      />
                                    )}
                                  </Field>

                                  <ErrorMessage name="role" component={ValidationError} />
                                </FormControl>
                              </div>
                              {this.state.mode === 'ADD' && <>
                                <div>
                                  <FormControl fullWidth>
                                    <Field as={TextField} name="password" label="Password" type="password" required variant="outlined" size="small" error={touched.password && !!errors.password} />
                                    <ErrorMessage name="password" component={ValidationError} />
                                  </FormControl>
                                </div>

                                <div>
                                  <FormControl fullWidth>
                                    <Field as={TextField} name="confirmPassword" label="Confirm password" type="password" required variant="outlined" size="small" error={touched.confirmPassword && !!errors.confirmPassword} />
                                    <ErrorMessage name="confirmPassword" component={ValidationError} />
                                  </FormControl>
                                </div>
                              </>}

                              {this.state.mode === 'EDIT' && <>
                                <Field name="deleted">
                                  {(params: any) => (
                                    <FormControlLabel
                                      value="start"
                                      control={<Switch
                                        checked={!params.field.value}
                                        onBlur={(e: any) => {
                                          params.form.setFieldTouched('deleted', true);
                                        }}
                                        onChange={(event: any, checked: boolean) => {
                                          params.form.setFieldValue('deleted', !checked, true);
                                        }}
                                        color="primary"
                                        name="deleted"
                                        inputProps={{ 'aria-label': 'primary checkbox' }}
                                      />}
                                      label="Is Active?"
                                      labelPlacement="start"
                                    />

                                  )}
                                </Field>
                              </>}
                            </Grid>


                          </Grid>

                          {this.state.saveError && <div><ValidationError>{this.state.saveError}</ValidationError></div>}

                          <FormActions>

                            {this.state.mode === 'EDIT' && <Button onClick={() => this.viewUser(this.state.selectedUser)} type="button" disabled={isSubmitting} variant="contained" color="default" size="small">Cancel</Button>}

                            <Button type="submit" disabled={!isValid || isSubmitting} variant="contained" color="primary" size="small">Save</Button>
                          </FormActions>

                        </FormContent>
                      </Form>
                    }

                  </Formik>
                </CardContent>
              </Card>}

              {(this.state.mode === 'CHANGE_PASSWORD') && <Card elevation={0}>
                <CardContent>
                  <Formik initialValues={{ ...this.state.formValues }}
                    validationSchema={this.changePasswordValidationSchema}
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
                        <SectionTitle gutterBottom variant="h5">Change user password</SectionTitle>
                        <FormContent>
                          <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                              <DetailRow>
                                <DetailLabel xs={5}>Name</DetailLabel>
                                <DetailValue xs={7}>{this.state.selectedUser.firstName} {this.state.selectedUser.lastName}</DetailValue>
                              </DetailRow>

                              <div>
                                <FormControl fullWidth>
                                  <Field as={TextField} name="password" label="New password" type="password" required variant="outlined" size="small" error={touched.password && !!errors.password} />
                                  <ErrorMessage name="password" component={ValidationError} />
                                </FormControl>
                              </div>

                              <div>
                                <FormControl fullWidth>
                                  <Field as={TextField} name="confirmPassword" label="Confirm new password" type="password" required variant="outlined" size="small" error={touched.confirmPassword && !!errors.confirmPassword} />
                                  <ErrorMessage name="confirmPassword" component={ValidationError} />
                                </FormControl>
                              </div>



                              {this.state.saveError && <div><ValidationError>{this.state.saveError}</ValidationError></div>}

                              <FormActions>

                                {this.state.mode === 'CHANGE_PASSWORD' && <Button onClick={() => this.viewUser(this.state.selectedUser)} type="button" disabled={isSubmitting} variant="contained" color="default" size="small">Cancel</Button>}

                                <Button type="submit" disabled={!isValid || isSubmitting} variant="contained" color="primary" size="small">Save</Button>
                              </FormActions>

                            </Grid>
                          </Grid>
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

              <Button onClick={this.deleteUser} type="button" variant="contained" color="secondary" size="small">Yes</Button>
              <Button onClick={() => this.setState({ showDeleteWarning: false })} type="button" variant="contained" color="default" size="small">No</Button>

            </WarningModalActions>

            <div>{this.state.saveError && <ValidationError>{this.state.saveError}</ValidationError>}</div>
          </div>
        </StyledModal>
      </>);
  }
}

Users.contextType = RootContext;

export default withSnackbar(Users);