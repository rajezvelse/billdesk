import React from 'react';
import ReactComponent from '../../react-component'
import { IpcRendererEvent } from "electron";
import RootContext from '../../root.context';

import {
  SectionTitle, FormControl, Form, ValidationError,
  FormContent, FormActions,
  StyledModal, WarningModalActions
} from '../../styled-components';
import {
  Grid, Card, CardContent, Button,
  TextField
} from '@material-ui/core';

import { withSnackbar } from 'notistack'

import * as Yup from 'yup';
import { Formik, Field, ErrorMessage } from 'formik';


class ChangePassword extends ReactComponent<any, {
  saveError: null | string;
  formValues: {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
  };
  showLogoutWarning: boolean;
}> {
  validationSchema: Yup.ObjectSchema = Yup.object().shape({
    currentPassword: Yup.string().required('Please enter the current password'),
    newPassword: Yup.string().required('Please enter new password').min(6, 'Password should have atleast 6 characters'),
    confirmNewPassword: Yup.string().required('Please re-enter the new password')
      .test('passwords-mismatch', 'Confirm password doesn\'t match with the new password.', function (value: string) {
        return this.parent.newPassword === value;
      }),
  });


  constructor(props: any) {
    super(props);

    this.state = {
      saveError: null,
      formValues: {
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      },
      showLogoutWarning: false
    }
  }


  save = (values: { [s: string]: any }): Promise<boolean> => {
    return new Promise((resolve, reject) => {

      this.context.electronIpc.once('changePasswordResponse', (event: IpcRendererEvent, status: number, response: any) => {
        this.context.setLoading(false);

        // On fail
        if (status !== 200) {
          reject(response);

          this.setState({
            saveError: response
          });
          return;
        }


        // On success
        this.setState({
          saveError: null,
          showLogoutWarning: true
        })

      });

      // Send signal
      this.context.setLoading(true);
      this.context.electronIpc.send('changePassword', {
        username: this.context.userInfo.username,
        currentPassword: values.currentPassword,
        newPassword: values.newPassword
      })

    });
  }

  render() {
    return (
      <RootContext.Consumer>
        {({ navigate }) => (
          <>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Card elevation={0}>
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
                          <SectionTitle gutterBottom variant="h5">Change login password</SectionTitle>
                          <FormContent>
                            <div>
                              <FormControl fullWidth>
                                <Field as={TextField} name="currentPassword" label="Current password" type="text" required variant="outlined" size="small" error={touched.currentPassword && !!errors.currentPassword} />
                                <ErrorMessage name="currentPassword" component={ValidationError} />
                              </FormControl>
                            </div>

                            <div>
                              <FormControl fullWidth>
                                <Field as={TextField} name="newPassword" label="New password" type="text" required variant="outlined" size="small" error={touched.newPassword && !!errors.newPassword} />
                                <ErrorMessage name="newPassword" component={ValidationError} />
                              </FormControl>
                            </div>

                            <div>
                              <FormControl fullWidth>
                                <Field as={TextField} name="confirmNewPassword" label="Confirm password" type="text" required variant="outlined" size="small" error={touched.confirmNewPassword && !!errors.confirmNewPassword} />
                                <ErrorMessage name="confirmNewPassword" component={ValidationError} />
                              </FormControl>
                            </div>


                            {this.state.saveError && <div><ValidationError>{this.state.saveError}</ValidationError></div>}

                            <FormActions>


                              <Button type="submit" disabled={!isValid || isSubmitting} variant="contained" color="primary" size="small">Change</Button>
                            </FormActions>

                          </FormContent>
                        </Form>
                      }
                    </Formik>
                  </CardContent>
                </Card>
              </Grid>

            </Grid>

            {/* Delete purchase warning   */}
            <StyledModal
              open={this.state.showLogoutWarning}
              onClose={() => this.setState({ showLogoutWarning: false })}
              disableBackdropClick={true}
              disableEscapeKeyDown={true}
            >
              <div className="modal-content">
                <p>Password changed successfully. Please re-login to continue with the new password.</p>
                <WarningModalActions>

                  <Button onClick={() => navigate('Login', {})} type="button" variant="contained" color="secondary" size="small">Logout</Button>

                </WarningModalActions>
              </div>
            </StyledModal>
          </>)}
      </RootContext.Consumer >);
  }
}

ChangePassword.contextType = RootContext;

export default withSnackbar(ChangePassword);