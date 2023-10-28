import React, { SyntheticEvent } from 'react';
import { IpcRendererEvent } from "electron";
import withSnackbar from "../directives/with-snackbar";
import ReactComponent from "../react-component";
import RootContext from "../root.context";
import {
  BranchSelectionDropdown
} from '../styled-components';
import {
  MenuItem
} from '@material-ui/core';

class BranchSelector extends ReactComponent<any, {
  saveError: null | string;
  listBranchesError: null | string;
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

  constructor(props: any) {
    super(props);

    this.state = {
      saveError: null,
      listBranchesError: null,
      branches: [],
      selectedBranch: '',
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
        this.setState({ listBranchesError: response });
        return;
      }

      let preferences = this.context.preferences;
      this.setState({ branches: response, listBranchesError: null, selectedBranch: preferences['COMPANY_ACTIVE_BRANCH'] || '' });
    });

    this.context.setLoading(true);
    this.context.electronIpc.send("fetchBranches");
  }

  handleBranchSelection = (event: any) => {
    let selectedBranch = event.target.value


    this.context.electronIpc.once('setPreferencesResponse', (event: IpcRendererEvent, status: number, response: any) => {
      this.context.setLoading(false);

      // On fail
      if (status !== 200) {

        this.setState({
          saveError: response,
          selectedBranch: ''
        });
        this.props.enqueueSnackbar('Failed to update active branch', { variant: 'error' })
        return;
      }


      // On success
      this.props.enqueueSnackbar('Active branch changed', { variant: 'success' })
      this.setState({
        saveError: null,
        selectedBranch: response['COMPANY_ACTIVE_BRANCH']
      }, () => {

        let preferences = this.context.preferences;
        Object.assign(preferences, response);

        this.context.setValue({ preferences });
        this.context.navigate('Dashboard', { forceReload: new Date().getTime() }, 'Dashboard')
      })

    });

    // Send signal
    this.context.setLoading(true);
    this.context.electronIpc.send('setPreferences', {
      preferencesData: {
        "COMPANY_ACTIVE_BRANCH": selectedBranch
      }
    })


  }

  render() {
    return (<>
      <BranchSelectionDropdown
        size="small"
        autoWidth
        displayEmpty
        value={this.state.selectedBranch}

        onChange={(event: any, value: any | any[], reason: string) => {
          this.handleBranchSelection(event)
        }}
      >
        <MenuItem value="">
          <em>Select branch</em>
        </MenuItem>
        {
          this.state.branches.map((branch) => (
            <MenuItem value={branch.id} key={branch.id}>{branch.name}</MenuItem>
          ))
        }
      </BranchSelectionDropdown>
    </>)
  }
}


BranchSelector.contextType = RootContext;

export default withSnackbar(BranchSelector);