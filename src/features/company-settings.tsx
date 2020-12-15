import React from 'react';
import ReactComponent from '../react-component'
import { IpcRendererEvent } from "electron";
import RootContext from '../root.context';

import {
  SectionTitle, FormControl, Form, ValidationError,
  FormContent, FormActions,
  DetailRow, DetailLabel, DetailValue
} from '../styled-components';
import {
  Grid, Card, CardContent, Button,
  TextField
} from '@material-ui/core';

import { withSnackbar } from 'notistack'

import * as Yup from 'yup';
import { Formik, Field, ErrorMessage } from 'formik';


class CompanySettings extends ReactComponent<any, {
  mode: 'EDIT' | 'VIEW';
  saveError: null | string;
  data: {
    COMPANY_NAME: string;
    COMPANY_MOBILE: string;
    COMPANY_EMAIL: string;
    COMPANY_WEBSITE: string;
    COMPANY_GSTIN: string;
    COMPANY_ADDRESS: string;
  };
}> {
  validationSchema: Yup.ObjectSchema = Yup.object().shape({
    COMPANY_NAME: Yup.string().required('Please enter shop name'),
    COMPANY_MOBILE: Yup.string().required('Please enter shop mobile number'),
    COMPANY_EMAIL: Yup.string().email('Enter valid email address'),
    COMPANY_WEBSITE: Yup.string().url('Enter valid URL'),
    COMPANY_GSTIN: Yup.string(),
    COMPANY_ADDRESS: Yup.string()
  });


  constructor(props: any) {
    super(props);

    this.state = {
      mode: 'VIEW',
      saveError: null,
      data: {
        COMPANY_NAME: '',
        COMPANY_MOBILE: '',
        COMPANY_EMAIL: '',
        COMPANY_WEBSITE: '',
        COMPANY_GSTIN: '',
        COMPANY_ADDRESS: ''
      }
    }
  }

  componentDidMount() {
super.componentDidMount();

    let data: any = {
      COMPANY_NAME: this.context.preferences['COMPANY_NAME'] || '',
      COMPANY_MOBILE: this.context.preferences['COMPANY_MOBILE'] || '',
      COMPANY_EMAIL: this.context.preferences['COMPANY_EMAIL'] || '',
      COMPANY_WEBSITE: this.context.preferences['COMPANY_WEBSITE'] || '',
      COMPANY_GSTIN: this.context.preferences['COMPANY_GSTIN'] || '',
      COMPANY_ADDRESS: this.context.preferences['COMPANY_ADDRESS'] || ''
    };

    this.setState({ data });
  }

  viewSettings = () => {
    this.setState({
      mode: 'VIEW'
    })
  }

  openForm = () => {
    this.setState({
      mode: 'EDIT',
      saveError: null,
    })
  }

  save = (values: { [s: string]: any }): Promise<boolean> => {
    return new Promise((resolve, reject) => {

      this.context.electronIpc.once('setPreferencesResponse', (event: IpcRendererEvent, status: number, response: any) => {
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
        this.props.enqueueSnackbar('Saved', { variant: 'success' })
        this.setState({
          saveError: null,
          mode: 'VIEW',
          data: response
        }, () => {

          let preferences = this.context.preferences;
          Object.assign(preferences, this.state.data);

          this.context.setValue({ preferences });
        })

      });

      // Send signal
      this.context.setLoading(true);
      this.context.electronIpc.send('setPreferences', {
        preferencesData: values
      })

    });
  }

  render() {
    return (
      <>
        <Grid container spacing={2}>
          {/* View/Edit section */}
          {this.state.mode === 'VIEW' &&
            <Grid item xs={5}>
              <CardContent>
                <SectionTitle gutterBottom variant="h5">Settings</SectionTitle>

                <FormContent>
                  <DetailRow>
                    <DetailLabel xs={5}>Shop name</DetailLabel>
                    <DetailValue xs={7}>{this.state.data.COMPANY_NAME ? this.state.data.COMPANY_NAME : '-'}</DetailValue>
                  </DetailRow>

                  <DetailRow>
                    <DetailLabel xs={5}>Shop mobile number</DetailLabel>
                    <DetailValue xs={7}>{this.state.data.COMPANY_MOBILE ? this.state.data.COMPANY_MOBILE : '-'}</DetailValue>
                  </DetailRow>
                  <DetailRow>
                    <DetailLabel xs={5}>Shop email</DetailLabel>
                    <DetailValue xs={7}>{this.state.data.COMPANY_WEBSITE ? <a href={"mailto:" + this.state.data.COMPANY_EMAIL}>{this.state.data.COMPANY_EMAIL}</a> : '-'}</DetailValue>
                  </DetailRow>
                  <DetailRow>
                    <DetailLabel xs={5}>Shop website</DetailLabel>
                    <DetailValue xs={7}>{this.state.data.COMPANY_WEBSITE ? <a href={this.state.data.COMPANY_WEBSITE} target="_blank" rel="noopener noreferrer">{this.state.data.COMPANY_WEBSITE}</a> : '-'}</DetailValue>
                  </DetailRow>
                  <DetailRow>
                    <DetailLabel xs={5}>Shop address</DetailLabel>
                    <DetailValue xs={7}><span style={{ whiteSpace: 'pre-line' }}>{this.state.data.COMPANY_ADDRESS ? this.state.data.COMPANY_ADDRESS : '-'}</span></DetailValue>
                  </DetailRow>

                  <FormActions>
                    <Button onClick={this.openForm} type="button" variant="contained" color="primary" size="small">Edit</Button>
                  </FormActions>
                </FormContent>

              </CardContent>
            </Grid>}

          {(this.state.mode === 'EDIT') &&

            <Grid item xs={10}>
              <Card elevation={0}>
                <CardContent>
                  <Formik initialValues={{ ...this.state.data }}
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
                        <SectionTitle gutterBottom variant="h5">Update settings</SectionTitle>
                        <FormContent>
                          <Grid container spacing={2}>
                            <Grid item xs={6}>
                              <div>
                                <FormControl fullWidth>
                                  <Field as={TextField} name="COMPANY_NAME" label="Shop name" type="text" required variant="outlined" size="small" error={touched.COMPANY_NAME && !!errors.COMPANY_NAME} />
                                  <ErrorMessage name="COMPANY_NAME" component={ValidationError} />
                                </FormControl>
                              </div>

                              <div>
                                <FormControl fullWidth>
                                  <Field as={TextField} name="COMPANY_MOBILE" label="Shop mobile number" type="text" required variant="outlined" size="small" error={touched.COMPANY_MOBILE && !!errors.COMPANY_MOBILE} />
                                  <ErrorMessage name="COMPANY_MOBILE" component={ValidationError} />
                                </FormControl>
                              </div>

                              <div>
                                <FormControl fullWidth>
                                  <Field as={TextField} name="COMPANY_EMAIL" label="Shop email" type="text" variant="outlined" size="small" error={touched.COMPANY_EMAIL && !!errors.COMPANY_EMAIL} />
                                  <ErrorMessage name="COMPANY_EMAIL" component={ValidationError} />
                                </FormControl>
                              </div>

                              <div>
                                <FormControl fullWidth>
                                  <Field as={TextField} name="COMPANY_GSTIN" label="Shop GSTIN number" type="text" variant="outlined" size="small" error={touched.COMPANY_GSTIN && !!errors.COMPANY_GSTIN} />
                                  <ErrorMessage name="COMPANY_GSTIN" component={ValidationError} />
                                </FormControl>
                              </div>
                            </Grid>
                            <Grid item xs={6}>

                              <div>
                                <FormControl fullWidth>
                                  <Field as={TextField} name="COMPANY_WEBSITE" label="Shop website" type="text" variant="outlined" size="small" error={touched.COMPANY_WEBSITE && !!errors.COMPANY_WEBSITE} />
                                  <ErrorMessage name="COMPANY_WEBSITE" component={ValidationError} />
                                </FormControl>
                              </div>

                              <div>
                                <FormControl fullWidth>
                                  <Field as={TextField} name="COMPANY_ADDRESS" label="Shop address" type="text" multiline={true} rows="3" variant="outlined" size="small" error={touched.COMPANY_ADDRESS && !!errors.COMPANY_ADDRESS} />
                                  <ErrorMessage name="COMPANY_ADDRESS" component={ValidationError} />
                                </FormControl>
                              </div>

                            </Grid>
                          </Grid>

                          {this.state.saveError && <div><ValidationError>{this.state.saveError}</ValidationError></div>}

                          <FormActions>

                            <Button onClick={() => this.viewSettings()} type="button" disabled={isSubmitting} variant="contained" color="default" size="small">Cancel</Button>

                            <Button type="submit" disabled={!isValid || isSubmitting} variant="contained" color="primary" size="small">Save</Button>
                          </FormActions>

                        </FormContent>
                      </Form>
                    }
                  </Formik>
                </CardContent>
              </Card>
            </Grid>}

        </Grid>
      </>);
  }
}

CompanySettings.contextType = RootContext;

export default withSnackbar(CompanySettings);