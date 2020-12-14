import React from 'react'
import ReactComponent from '../../../react-component'

import { IpcRendererEvent } from "electron";
import RootContext from '../../../root.context';

import PurchaseReportsRecords from './purchase-reports-records';
import PurchaseReportsMetrics from './purchase-reports.metrics';
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

class PurchaseReports extends ReactComponent<any, {
  activeView: 'records' | 'metrics';
  vendors: any[];
  filterDataFetchError: any;
  filters: {
    vendorId: number | null;
    searchText: string;
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
      vendors: [],
      filterDataFetchError: null,
      filters: {
        vendorId: null,
        searchText: '',
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
    this.context.electronIpc.once("fetchPurchaseReportFilterDataResponse", (event: IpcRendererEvent, status: number, response: any) => {
      this.context.setLoading(false);

      // On fail
      if (status !== 200) {
        console.log(response);
        this.setState({ filterDataFetchError: response });
        return;
      }

      this.setState({
        filterDataFetchError: null,
        vendors: response.vendors
      });
    });

    this.context.setLoading(true);
    this.context.electronIpc.send("fetchPurchaseReportFilterData");
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

          <CardSectionTitle gutterBottom variant="h5">Purchase report</CardSectionTitle>

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
                            startDate: moment().startOf('month').toDate(),
                            endDate: moment().endOf('month').toDate()
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
                      <DetailValue xs={9}>
                        <Autocomplete
                          options={this.state.vendors}
                          getOptionLabel={(option: any) => {
                            let label: string = option.name;
                            if (option.phone) label += `- ${option.phone}`;

                            return label;
                          }}

                          size="small"
                          renderInput={(params: any) => <TextField {...params} label="Filter by vendor" type="text" variant="outlined" />}
                          openOnFocus={true}

                          onChange={(event: object, value: any | any[], reason: string) => {
                            let filters: any = this.state.filters;

                            filters.vendorId = value ? value.id : null;

                            this.setState({ filters });

                          }}

                          onBlur={(e: any) => {
                          }}

                        />
                      </DetailValue>
                    </DetailRow>

                    {/* Search */}
                    <DetailRow>
                      <DetailValue xs={9}>
                        <TextField label="Search" type="text" variant="outlined" size="small"
                          fullWidth
                          onKeyUp={(event: any) => {

                            let cls = this;
                            let searchText: string = event.target.value;

                            let fun: Function = () => {
                              let filters = cls.state.filters;
                              filters.searchText = searchText ? searchText : '';

                              cls.setState({ filters: filters })

                            };

                            this.debounce(fun);

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
                <PurchaseReportsRecords
                  startDate={this.state.filters.date.startDate}
                  endDate={this.state.filters.date.endDate}
                  vendorId={this.state.filters.vendorId}
                  searchText={this.state.filters.searchText}
                  reportState={this.state} />}

              {/* Metrics view */}
              {this.state.activeView === 'metrics' &&
                <PurchaseReportsMetrics
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

PurchaseReports.contextType = RootContext;

export default PurchaseReports;
