import React from 'react';
import ReactComponent from '../react-component';

import { IpcRendererEvent } from "electron";
import RootContext from '../root.context';
import { Currency, DatewiseChart, IsGranted } from '../directives';
import { formatDate } from '../utils';

import {
  DateRangeContainer,
  ReportChartCard, ReportCardInfoBlue, ReportCardGreen, ReportCardPink, ReportCardBlue,
  ValidationError, ReportChartTitleSpaced, ViewMoreButton, ReportDivider
} from '../styled-components';
import {
  Card, CardContent, Grid, Button
} from '@material-ui/core';
import { DateRangePicker } from "materialui-daterange-picker";
import moment from 'moment';

import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';

class Dashboard extends ReactComponent<any, {
  summary: any;
  filters: {
    date: {
      label: string;
      startDate: Date;
      endDate: Date;
    }
  }
  showDateDropdown: boolean;
  selectedDateOption: 'today' | 'yesterday' | 'this_week' | 'this_month' | 'custom_range';
  fetchError: any;
}> {

  constructor(props: any) {
    super(props)

    this.state = {
      fetchError: null,
      summary: null,
      filters: {
        date: {
          label: "This Month",
          startDate: moment().startOf('month').toDate(),
          endDate: moment().endOf('month').toDate()
        }
      },
      showDateDropdown: false,
      selectedDateOption: 'this_month',
    }
  }

  componentDidMount() {
    this.fetchData();
  }

  fetchData = () => {
    this.context.electronIpc.once("fetchDashbardMetricsResponse", (event: IpcRendererEvent, status: number, response: any) => {
      this.context.setLoading(false);

      // On fail
      if (status !== 200) {
        console.log(response);
        this.setState({ fetchError: response })
        return;
      }

      this.setState({
        summary: response,
        fetchError: null
      })
    });

    this.context.setLoading(true);
    this.context.electronIpc.send("fetchDashbardMetrics", {
      startDate: this.state.filters.date.startDate,
      endDate: this.state.filters.date.endDate
    });
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

    this.setState({ filters, showDateDropdown: false }, () => this.fetchData());


  }

  render() {
    return (
      <>
        <Card elevation={0}>
          <CardContent>


            <div>

              {this.state.fetchError && <div><ValidationError>{this.state.fetchError}</ValidationError></div>}

              {(this.state.summary && !this.state.fetchError) &&

                <ReportChartCard>

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


                  {/* Summary */}
                  <IsGranted permissions={['view_purchase', 'view_sales', 'view_scraps']} anyOne={true}>
                    <ReportChartTitleSpaced>
                      <IsGranted permissions={['view_purchase']}>Purchase</IsGranted>
                      <IsGranted permissions={['view_purchase', 'view_sales']}>/</IsGranted>
                      <IsGranted permissions={['view_sales']}>Sales</IsGranted> {` Summary - `}
                      <Button size="small" onClick={() => this.setState({ showDateDropdown: !this.state.showDateDropdown })}>
                        {`${this.state.filters.date.label !== 'Custom date range' && this.state.filters.date.label} (${formatDate(this.state.filters.date.startDate)} -  ${formatDate(this.state.filters.date.endDate)})`}
                        <ArrowDropDownIcon />
                      </Button>
                    </ReportChartTitleSpaced>
                    <Grid container justify="center" spacing={8}>

                      <IsGranted permissions={['view_sales']}>
                        <Grid item xs={12} md={3}>

                          <ReportCardInfoBlue>
                            <CardContent>
                              <h5><Currency value={this.state.summary.totalSales} /></h5>
                              <p>Total sales</p>
                              <ViewMoreButton variant='text'
                                onClick={() => {
                                  this.context.navigate('SalesReports', {}, 'Sales report');
                                }}
                              >
                                View detailed sales report
                          </ViewMoreButton>
                            </CardContent>
                          </ReportCardInfoBlue>
                        </Grid>
                      </IsGranted>

                      <IsGranted permissions={['view_purchase']}>
                        <Grid item xs={12} md={3}>
                          <ReportCardBlue>
                            <CardContent>
                              <h5><Currency value={this.state.summary.totalPurchase} /></h5>
                              <p>Total purchase</p>
                              <ViewMoreButton variant='text'
                                onClick={() => {
                                  this.context.navigate('PurchaseReports', {}, 'Purchase report');
                                }}
                              >
                                View detailed purchase report
                          </ViewMoreButton>
                            </CardContent>
                          </ReportCardBlue>
                        </Grid>
                      </IsGranted>


                      <IsGranted permissions={['view_purchase', 'view_sales']}>
                        <Grid item xs={12} md={3}>
                          <ReportCardGreen>
                            <CardContent>
                              <h5><Currency value={this.state.summary.totalProfitUnrealized} /></h5>
                              <p>Profit/Loss  - unrealized</p>
                              <ViewMoreButton variant='text'
                                onClick={() => {
                                  this.context.navigate('ProductWiseProfit', {}, 'Productwise Profit/Loss');
                                }}
                              >
                                View productwise profit/loss
                          </ViewMoreButton>
                            </CardContent>
                          </ReportCardGreen>
                        </Grid>
                      </IsGranted>

                      <IsGranted permissions={['view_scraps']}>
                        <Grid item xs={12} md={3}>
                          <ReportCardPink>
                            <CardContent>
                              <h5><Currency value={this.state.summary.totalScrapLoss} /></h5>
                              <p>Total scrap losses</p>
                              <ViewMoreButton variant='text'
                                onClick={() => {
                                  this.context.navigate('ScrapsList', {}, 'Scraps');
                                }}
                              >
                                View all scrap records
                          </ViewMoreButton>
                            </CardContent>
                          </ReportCardPink>
                        </Grid>
                      </IsGranted>
                    </Grid>

                    <ReportDivider />
                  </IsGranted>

                  {/* Cashflow summary */}
                  <IsGranted permissions={['view_purchase', 'view_sales', 'view_scraps']} anyOne={true}>
                    <ReportChartTitleSpaced>{`Cashflow Summary - `}
                      <Button size="small" onClick={() => this.setState({ showDateDropdown: !this.state.showDateDropdown })}>
                        {`${this.state.filters.date.label !== 'Custom date range' && this.state.filters.date.label} (${formatDate(this.state.filters.date.startDate)} -  ${formatDate(this.state.filters.date.endDate)})`}
                        <ArrowDropDownIcon />
                      </Button>
                    </ReportChartTitleSpaced>
                    <Grid container justify="center" spacing={8}>

                      <IsGranted permissions={['view_sales']}>
                        <Grid item xs={12} md={3}>
                          <ReportCardInfoBlue>
                            <CardContent>
                              <h5><Currency value={this.state.summary.totalSalesPayment} /></h5>
                              <p>Total sales inwards</p>
                              <ViewMoreButton variant='text'
                                onClick={() => {
                                  this.context.navigate('SalesReports', {}, 'Sales report');
                                }}
                              >
                                View detailed sales report
                          </ViewMoreButton>
                            </CardContent>
                          </ReportCardInfoBlue>
                        </Grid>
                      </IsGranted>

                      <IsGranted permissions={['view_purchase']}>
                        <Grid item xs={12} md={3}>
                          <ReportCardBlue>
                            <CardContent>
                              <h5><Currency value={this.state.summary.totalPurchasePayment} /></h5>
                              <p>Total purchase payments</p>
                              <ViewMoreButton variant='text'
                                onClick={() => {
                                  this.context.navigate('PurchaseReports', {}, 'Purchase report');
                                }}
                              >
                                View detailed purchase report
                          </ViewMoreButton>
                            </CardContent>
                          </ReportCardBlue>
                        </Grid>
                      </IsGranted>

                      <IsGranted permissions={['view_expenses']}>
                        <Grid item xs={12} md={3}>
                          <ReportCardPink>
                            <CardContent>
                              <h5><Currency value={this.state.summary.totalExpense} /></h5>
                              <p>Total expenses</p>
                              <ViewMoreButton variant='text'
                                onClick={() => {
                                  this.context.navigate('ExpensesList', {}, 'Expenses');
                                }}
                              >
                                View detailed expense report
                          </ViewMoreButton>
                            </CardContent>
                          </ReportCardPink>
                        </Grid>
                      </IsGranted>

                      <IsGranted permissions={['view_purchase', 'view_sales', 'view_scraps', 'view_expenses']}>
                        <Grid item xs={12} md={3}>
                          <ReportCardGreen>
                            <CardContent>
                              <h5><Currency value={this.state.summary.totalSalesPayment - (this.state.summary.totalPurchasePayment + this.state.summary.totalExpense)} /></h5>
                              <p>Total cash in hand</p>
                            </CardContent>
                          </ReportCardGreen>
                        </Grid>
                      </IsGranted>
                    </Grid>
                  </IsGranted>

                  <IsGranted permissions={['view_purchase', 'view_sales', 'view_scraps', 'view_expenses']}>
                    {this.state.summary.dateWiseSalesProfitSummary && <>
                      <DatewiseChart title={`Sales-Profit Trend ${formatDate(this.state.filters.date.startDate)} -  ${formatDate(this.state.filters.date.endDate)}`} data={this.state.summary.dateWiseSalesProfitSummary} dataKeys={{ sales: 'totalSales', profit: 'totalProfit' }} />
                    </>}
                  </IsGranted>
                </ReportChartCard>
              }
            </div>
          </CardContent>
        </Card>
      </>);
  }
}

Dashboard.contextType = RootContext;

export default Dashboard;