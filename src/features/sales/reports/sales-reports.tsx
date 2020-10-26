import React from 'react'
import ReactComponent from '../../../react-component'

import { IpcRendererEvent } from "electron";
import RootContext from '../../../root.context';

import SalesReportsRecords from './sales-reports-records';
import SalesReportsMetrics from './sales-reports.metrics';
import {
  CardSectionTitle, ReportViewPaper,
  Autocomplete, TableFilterGrid, FilterDropdownButton,
  DateRangeContainer, DetailRow, DetailLabel, DetailValue
} from '../../../styled-components';

import {
  Grid, Card, CardContent, Paper,
  TextField, ButtonGroup, Button
} from '@material-ui/core';

import { DateRangePicker } from "materialui-daterange-picker";
import moment from 'moment';

import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';

import { FormatDate } from '../../../directives'

class SalesReports extends ReactComponent<any, {
  activeView: 'records' | 'metrics';
  customers: any[];
  filterDataFetchError: any;
  filters: {
    customerId: number | null;
    date: {
      label: string;
      startDate: Date;
      endDate: Date;
    }
  }
  showDateDropdown: boolean;
  selectedDateOption: 'today' | 'yesterday' | 'this_week' | 'this_month' | 'custom_range';
  productSearchIsOpen: boolean;
}> {

  constructor(props: any) {
    super(props);

    this.state = this.props.prevState ? this.props.prevState as any : {
      activeView: 'metrics',
      customers: [],
      filterDataFetchError: null,
      filters: {
        customerId: null,
        date: {
          label: "This Month",
          startDate: moment().startOf('month').toDate(),
          endDate: moment().endOf('month').toDate()
        }
      },
      showDateDropdown: false,
      selectedDateOption: 'today',
      productSearchIsOpen: false
    }
  }

  componentDidMount() {
    super.componentDidMount();

    this.fetchFilterData();
  }

  fetchFilterData = () => {
    this.context.electronIpc.once("fetchSalesReportFilterDataResponse", (event: IpcRendererEvent, status: number, response: any) => {
      this.context.setLoading(false);

      // On fail
      if (status !== 200) {
        console.log(response);
        this.setState({ filterDataFetchError: response });
        return;
      }

      this.setState({
        filterDataFetchError: null,
        customers: response.customers
      });
    });

    this.context.setLoading(true);
    this.context.electronIpc.send("fetchSalesReportFilterData");
  }


  handleViewChange = (view: 'records' | 'metrics') => {
    this.setState({ activeView: view })
  }

  handleDateDropdownClick = (value: any) => {
    if (!value.label) value.label = 'Custom date range';

    let startDate: any, endDate: any;

    if (value.startDate) {
      startDate = moment(value.startDate);
      startDate.set('hour', 0).set('minute', 0).set('second', 0);
      value.startDate = startDate.toDate();
    }

    if (value.endDate) {
      endDate = moment(value.endDate);
      endDate.set('hour', 23).set('minute', 59).set('second', 59);
      value.endDate = endDate.toDate();
    }

    let filters: any = this.state.filters;
    filters.date = value;

    this.setState({ filters, showDateDropdown: false })
  }

  timerId: number | null = null;
  debounce = (callback: Function, waitTime?: number) => {

    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }

    this.timerId = setTimeout(e => { callback(); }, waitTime || 800);

  }

  render() {
    return (<>

      <Card>
        <CardContent>

          <CardSectionTitle gutterBottom variant="h5">Sales report</CardSectionTitle>

          <ReportViewPaper>

            <TableFilterGrid>
              <Grid container spacing={3}>
                <Grid item xs={2} md={6}>
                  <DetailRow>
                    <DetailLabel xs={3}>Report view</DetailLabel>
                    <DetailValue xs={9}>
                      <ButtonGroup variant="contained" color="primary">
                        <Button type="button" onClick={() => this.handleViewChange('metrics')} endIcon={this.state.activeView === 'metrics' ? <CheckCircleOutlineIcon /> : null}>Metrics</Button>
                        <Button type="button" onClick={() => this.handleViewChange('records')} endIcon={this.state.activeView === 'records' ? <CheckCircleOutlineIcon /> : null}>Records</Button>
                      </ButtonGroup>
                    </DetailValue>
                  </DetailRow>


                  {/* Date filter */}
                  <DetailRow>
                    <DetailLabel xs={3}>Date</DetailLabel>
                    <DetailValue xs={9}>
                      {/* Date filter option dropdown */}
                      <ButtonGroup variant="contained" color="primary">
                        <FilterDropdownButton onClick={() => this.setState({ showDateDropdown: true })}>
                          {this.state.filters.date.label} {this.state.filters.date.label === 'Custom date range' && <span>(<FormatDate value={this.state.filters.date['startDate']} /> -  <FormatDate value={this.state.filters.date['endDate']} />)</span>}
                        </FilterDropdownButton>
                        <Button
                          color="primary"
                          size="small"
                          onClick={() => this.setState({ showDateDropdown: !this.state.showDateDropdown })}
                        >
                          <ArrowDropDownIcon />
                        </Button>
                      </ButtonGroup>

                      {/* Date range picker */}
                      <DateRangeContainer>
                        <DateRangePicker
                          initialDateRange={{
                            startDate: moment().startOf('day').toDate(),
                            endDate: moment().endOf('day').toDate()
                          }}
                          open={this.state.showDateDropdown}
                          toggle={() => this.setState({ showDateDropdown: !this.state.showDateDropdown })}
                          onChange={this.handleDateDropdownClick}
                        />
                      </DateRangeContainer>
                    </DetailValue>
                  </DetailRow>


                </Grid>

                <Grid item xs={12} md={6}>
                  {this.state.activeView === 'metrics' && <>
                    
                  </>}

                  {this.state.activeView === 'records' && <>
                    {/* Customer filter */}
                    <DetailRow>
                      <DetailLabel xs={3}>Customer</DetailLabel>
                      <DetailValue xs={9}>
                        <Autocomplete
                          options={this.state.customers}
                          getOptionLabel={(option: any) => {
                            let label: string = option.name;
                            if (option.phone) label += `- ${option.phone}`;

                            return label;
                          }}

                          size="small"
                          renderInput={(params: any) => <TextField {...params} label="Select customer" type="text" variant="outlined" />}
                          openOnFocus={true}

                          onChange={(event: object, value: any | any[], reason: string) => {
                            let filters: any = this.state.filters;

                            filters.customerId = value ? value.id : null;

                            this.setState({ filters });

                          }}

                          onBlur={(e: any) => {
                          }}

                        />
                      </DetailValue>
                    </DetailRow>
                  </>}

                </Grid>
              </Grid>
            </TableFilterGrid>
            <Paper elevation={0}>

              {/* Record view */}
              {this.state.activeView === 'records' &&
                <SalesReportsRecords
                  startDate={this.state.filters.date.startDate}
                  endDate={this.state.filters.date.endDate}
                  customerId={this.state.filters.customerId}
                  reportState={this.state} />}

              {/* Metrics view */}
              {this.state.activeView === 'metrics' &&
                <SalesReportsMetrics
                  startDate={this.state.filters.date.startDate}
                  endDate={this.state.filters.date.endDate}
                />}

            </Paper>

          </ReportViewPaper>
        </CardContent>
      </Card>

    </>);
  }
}

SalesReports.contextType = RootContext;

export default SalesReports;

