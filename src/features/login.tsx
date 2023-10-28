import React from "react";
import ReactComponent from '../react-component';
import { IpcRendererEvent } from "electron";
import { 
  ImagedBackgroundDark, GridCenter, FormControl, ButtonFullWidth, 
  OutlinedInputSmall, Form, CardLogin, LoginLogo, ValidationError, 
  ProfileAvatar, LoginOptionLink
 } from '../styled-components';
import { Grid, InputAdornment, Typography } from '@material-ui/core';
import { Face, Lock } from '@material-ui/icons';
import * as Yup from 'yup';
import { Formik, Field, ErrorMessage } from 'formik';
import RootContext from '../root.context';
import appLogo from '../assets/images/logo.png';


class Login extends ReactComponent<any, {
  loginError: null | string;
  favUser: null | { [s: string]: any };
  formValues: {
    username: string;
    password: string;
  }
}> {
  context: any;
  validationSchema: Yup.ObjectSchema<any> = Yup.object().shape({
    username: Yup.string().required('Please enter username'),
    password: Yup.string().required('Please enter password')
  });

  constructor(props: any) {
    super(props);

    this.state = {
      loginError: null,
      favUser: null,
      formValues: {
        username: '',
        password: ''
      }
    };
  }

  componentDidMount() {
    super.componentDidMount();


    if (this.context.preferences['FAV_USER']) {
      let favUser = this.context.preferences['FAV_USER'];

      this.setState({ favUser: favUser, formValues: { username: favUser.username, password: '' } });
    }
  }

  login = (values: { [s: string]: string }, setSubmitting: Function) => {

    this.context.electronIpc.once('authenticateResponse', (event: IpcRendererEvent, status: number, response: any) => {
      this.context.setLoading(false);
      setSubmitting(false);

      // On fail
      if (status !== 200) {
        this.setState({ loginError: response, formValues: { username: values.username, password: values.password } });
        return;
      }

      // On success
      this.context.setValue({ userInfo: response, locked: false });

      // Refresh preferences
      this.context.electronIpc.on("getPreferencesResponse", (event: IpcRendererEvent, status: number, response: any) => {

        if (status === 200) {
          this.context.setValue({ preferences: response });
        }
      });

      this.context.electronIpc.send("getPreferences");

    });

    // Send signal
    this.context.setLoading(true);
    this.context.electronIpc.send('authenticate', { username: values.username, password: values.password })
  }

  render() {
    
    return <ImagedBackgroundDark>
      <GridCenter>
        <Grid item xs={10} sm={9} md={6} lg={6}>
          <CardLogin>
            <Grid container direction="row" justifyContent="center" alignItems="center" spacing={2}>
              {/* Logo */}
              <Grid item xs={12} sm={5}>
                <LoginLogo src={appLogo} />
              </Grid>

              {/* Login form */}
              <Grid item xs={12} sm={7}>
                <Formik
                  initialValues={{ username: this.state.formValues.username, password: this.state.formValues.password }}
                  validationSchema={this.validationSchema}
                  validateOnMount={true}
                  enableReinitialize={true}
                  onSubmit={(values, { setSubmitting }) => {
                    this.login(values, setSubmitting);
                  }}
                >
                  {({
                    handleSubmit,
                    touched,
                    errors,
                    isValid,
                    isSubmitting
                  }) => (
                    <Form noValidate autoComplete="off" onSubmit={handleSubmit}>
                      <h2>Welcome</h2>

                      {this.state.favUser &&
                        <FormControl fullWidth >
                          <Grid container justifyContent="center" alignItems="center" spacing={10}>
                            <Grid item sm={3}><ProfileAvatar variant={this.state.favUser.avatar} /></Grid>
                            <Grid item sm={9}><Typography>{this.state.favUser.firstName}</Typography></Grid>
                          </Grid>
                        </FormControl>
                      }

                      {!this.state.favUser &&
                        <FormControl fullWidth variant="outlined">
                          <Field as={OutlinedInputSmall} name="username" error={touched.username && !!errors.username} placeholder="Username" startAdornment={<InputAdornment position="start"><Face /></InputAdornment>} />
                          <ErrorMessage name="username" component={ValidationError} />
                        </FormControl>
                      }

                      <FormControl fullWidth variant="outlined">
                        <Field as={OutlinedInputSmall} name="password" error={touched.password && !!errors.password} placeholder="Password" type="password" startAdornment={<InputAdornment position="start"><Lock /></InputAdornment>} />
                        <ErrorMessage name="password" component={ValidationError} />
                      </FormControl>

                      <FormControl fullWidth>
                        <ButtonFullWidth type="submit" disabled={!isValid || isSubmitting} variant="contained" color="primary" disableElevation>Login</ButtonFullWidth>

                        {this.state.favUser && !this.context.locked && <LoginOptionLink href="#" variant="body2" onClick={() => this.setState({
                          loginError: null,
                          favUser: null,
                          formValues: {
                            username: '',
                            password: ''
                          }
                        })}>Login as different user</LoginOptionLink> }

                        {this.state.loginError && <ValidationError>{this.state.loginError}</ValidationError>}
                      </FormControl>

                    </Form>
                  )}
                </Formik>

              </Grid>
            </Grid>
          </CardLogin>
        </Grid>
      </GridCenter>
    </ImagedBackgroundDark>;
  }
}

Login.contextType = RootContext;

export default Login;
