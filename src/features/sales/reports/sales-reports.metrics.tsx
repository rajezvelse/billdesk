import React from 'react'
import ReactComponent from '../../../react-component';

import { IpcRendererEvent } from "electron";
import RootContext from '../../../root.context';

import {
  ReportCardInfoBlue, ReportCardBlue, ReportCardGreen, ReportCardPink, ReportChartCard, ReportChartContainer,
  Autocomplete, DetailRow, DetailValue, SectionTitle, ReportChartTitle, ReportChartCardVertical
} from '../../../styled-components';

import {
  Grid, CardContent,
  TextField, Paper

} from '@material-ui/core';

import { BarChart, Bar, XAxis, YAxis, Tooltip as ChartTooltip, Legend, ResponsiveContainer } from 'recharts';

import { Currency, PieChart } from '../../../directives';
import { formatCurrency, formatDate } from '../../../utils';
import SalesDatewiseChart from './sales-datewise-chart';


class SalesReportsMetrics extends ReactComponent<{
  startDate?: Date;
  endDate?: Date;
}, {
  brands: any[];
  productCategories: any[];
  products: any[];
  netSummary: any;
  dateWiseSalesPaymentsSummary: any;
  brandWiseSummary: any;
  categoryWiseSummary: any;
  productWiseSummary: any;
  filters: {
    brandId: number | null;
    productCategoryId: number | null;
    productId: number | null;
  };
  productSearchIsOpen: boolean;
  filterDataFetchError: any;
}> {

  constructor(props: any) {
    super(props);

    this.state = {
      brands: [],
      productCategories: [],
      products: [],
      netSummary: null,
      dateWiseSalesPaymentsSummary: null,
      brandWiseSummary: null,
      categoryWiseSummary: null,
      productWiseSummary: null,
      filters: {
        brandId: null,
        productCategoryId: null,
        productId: null
      },
      productSearchIsOpen: false,
      filterDataFetchError: null
    }
  }

  componentDidMount() {
    super.componentDidMount();

    this.fetchData();

    setTimeout(() => this.fetchFilterData(), 500);
  }

  componentDidUpdate(prevProps: {
    startDate?: Date;
    endDate?: Date;
  }) {
    if (this.getDateISO(this.props.startDate) !== this.getDateISO(prevProps.startDate)
      || this.getDateISO(this.props.endDate) !== this.getDateISO(prevProps.endDate)) {

      this.fetchData();

    }
  }

  onFilterChange = () => {
    this.fetchData();
  }

  fetchFilterData = () => {
    this.context.electronIpc.once("fetchSalesReportFilterDataForMetricsResponse", (event: IpcRendererEvent, status: number, response: any) => {
      this.context.setLoading(false);

      // On fail
      if (status !== 200) {
        console.log(response);
        this.setState({ filterDataFetchError: response });
        return;
      }

      this.setState({
        filterDataFetchError: null,
        brands: response.brands,
        productCategories: response.productCategories
      });
    });

    this.context.setLoading(true);
    this.context.electronIpc.send("fetchSalesReportFilterDataForMetrics");
  }

  fetchData = () => {
    this.context.electronIpc.once("fetchSalesReportsMetricsResponse", (event: IpcRendererEvent, status: number, response: any) => {
      this.context.setLoading(false);

      // On fail
      if (status !== 200) {
        console.log(response);
        return;
      }

      this.setState({
        netSummary: response.netSummary,
        dateWiseSalesPaymentsSummary: response.dateWiseSalesPaymentsSummary,
        brandWiseSummary: response.brandWiseSummary,
        categoryWiseSummary: response.categoryWiseSummary,
        productWiseSummary: response.productWiseSummary,
      })
    });

    this.context.setLoading(true);
    this.context.electronIpc.send("fetchSalesReportsMetrics", {
      startDate: this.props.startDate,
      endDate: this.props.endDate,
      productCategoryId: this.state.filters.productCategoryId,
      brandId: this.state.filters.brandId,
      productId: this.state.filters.productId
    });
  }

  fetchProducts = (searchText?: string) => {
    this.context.electronIpc.once("fetchProductsResponse", (event: IpcRendererEvent, status: number, response: any) => {
      this.context.setLoading(false);
      // On fail
      if (status !== 200) {
        console.log(response);
        this.setState({ products: [] });
        return;
      }

      this.setState({
        products: response.records
      });
    });

    this.context.setLoading(true);
    this.context.electronIpc.send("fetchProducts", {
      searchText,
      brandId: this.state.filters.brandId,
      categoryId: this.state.filters.productCategoryId
    });
  }

  timerId: number | null = null;
  debounce = (callback: Function, waitTime?: number) => {

    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }

    this.timerId = setTimeout(e => { callback(); }, waitTime || 800);

  }

  getDateISO = (date: any) => {
    if (date instanceof Date) {
      return date.toISOString();
    } else return null;
  }

  render() {
    return (<>

      {this.state.netSummary &&

        <ReportChartCard>
          <Grid container justify="center" spacing={8}>
            <Grid item xs={12} md={3}>
              <ReportCardInfoBlue>
                <CardContent>
                  <h5><Currency value={this.state.netSummary.totalBillCost} /></h5>
                  <p>Total sales</p>
                </CardContent>
              </ReportCardInfoBlue>
            </Grid>

            <Grid item xs={12} md={3}>
              <ReportCardBlue>
                <CardContent>
                  <h5><Currency value={this.state.netSummary.totalSalesPayment} /></h5>
                  <p>Payments received <br />*sales in the period</p>
                </CardContent>
              </ReportCardBlue>
            </Grid>

            <Grid item xs={12} md={3}>
              <ReportCardPink>
                <CardContent>
                  <h5><Currency value={this.state.netSummary.totaloutstandingAmount} /></h5>
                  <p>Outstanding <br />*sales in the period</p>
                </CardContent>
              </ReportCardPink>
            </Grid>

            <Grid item xs={12} md={3}>
              <ReportCardGreen>
                <CardContent>
                  <h5><Currency value={this.state.netSummary.totalPaymentReceived} /></h5>
                  <p>Total payments received</p>
                </CardContent>
              </ReportCardGreen>
            </Grid>
          </Grid>
          {this.state.dateWiseSalesPaymentsSummary && <>
            <SalesDatewiseChart title={`Sales Trend ${formatDate(this.props.startDate)} -  ${formatDate(this.props.endDate)}`} data={this.state.dateWiseSalesPaymentsSummary} />
          </>}
        </ReportChartCard>
      }

      {/* Analytics section */}
      <Paper elevation={0}>
        <SectionTitle gutterBottom variant="h4">Analytics</SectionTitle>
        <Grid container spacing={3}>

          {/* Brands filter */}
          <Grid item xs={12} md={4}>
            <DetailRow>
              <DetailValue xs={12}>
                <Autocomplete
                  options={this.state.brands}
                  getOptionLabel={(option: any) => option.name}
                  size="small"

                  value={this.state.filters.brandId ? this.state.brands.find((c: any) => c.id === this.state.filters.brandId) || null : null}
                  renderInput={(params: any) => <TextField {...params} label="Select vechicle model" type="text" variant="outlined" />}
                  openOnFocus={true}

                  onChange={(event: object, value: any | any[], reason: string) => {
                    let filters: any = this.state.filters;

                    filters.brandId = value ? value.id : null;

                    this.setState({ filters }, () => {
                      this.onFilterChange();
                    });

                  }}
                  onBlur={(e: any) => {
                  }}

                />
              </DetailValue>
            </DetailRow>
          </Grid>

          {/* Product category filter */}
          <Grid item xs={12} md={4}>
            <DetailRow>
              <DetailValue xs={12}>
                <Autocomplete
                  options={this.state.productCategories}
                  getOptionLabel={(option: any) => option.category}

                  size="small"
                  value={this.state.filters.productCategoryId ? this.state.productCategories.find((c: any) => c.id === this.state.filters.productCategoryId) || null : null}
                  renderInput={(params: any) => <TextField {...params} label="Select product category" type="text" variant="outlined" />}
                  openOnFocus={true}

                  onChange={(event: object, value: any | any[], reason: string) => {
                    let filters: any = this.state.filters;

                    filters.productCategoryId = value ? value.id : null;

                    this.setState({ filters }, () => {
                      this.onFilterChange();
                    });

                  }}

                  onBlur={(e: any) => {
                  }}

                />
              </DetailValue>
            </DetailRow>
          </Grid>

          {/* Products filter */}
          <Grid item xs={12} md={4}>
            <DetailRow>
              <DetailValue xs={12}>
                <Autocomplete
                  options={this.state.products}
                  getOptionLabel={(option: any) => {
                    let label: string = option.name;
                    return label;
                  }}
                  onOpen={() => this.setState({ productSearchIsOpen: true })}
                  onClose={() => this.setState({ productSearchIsOpen: false })}

                  size="small"
                  renderInput={(params: any) => <TextField {...params} label="Select product" type="text" variant="outlined" />}
                  openOnFocus={true}
                  onInputChange={(event: object, value: string, reason: string) => {
                    this.debounce(() => this.fetchProducts(value), 400);
                  }}
                  onChange={(event: object, value: any | any[], reason: string) => {
                    let filters: any = this.state.filters;

                    filters.productId = value ? value.id : null;

                    this.setState({ filters }, () => {
                      this.onFilterChange();
                    });

                  }}

                  onBlur={(e: any) => {
                  }}

                />
              </DetailValue>
            </DetailRow>
          </Grid>
        </Grid>

        <Grid container justify="center" spacing={6}>
          {/* Brand wise sales */}
          {this.state.brandWiseSummary && <Grid item xs={12} md={5}>
            <ReportChartTitle>Vechicle Model Trend</ReportChartTitle>

            {(() => {
              let data: any = this.state.brandWiseSummary.map((r: any) => {
                return { name: r.productBrand, value: r.totalSales }
              });

              return <PieChart data={data} />
            })()}


          </Grid>
          }

          {/* Product catergorywise sales */}
          {this.state.categoryWiseSummary && <Grid item xs={12} md={5}>
            <ReportChartTitle>Product Category Trend</ReportChartTitle>

            {(() => {
              let data: any = this.state.categoryWiseSummary.map((r: any) => {
                return { name: r.productCategory, value: r.totalSales }
              });

              return <PieChart data={data} />
            })()}


          </Grid>
          }

          {/* Product wise sales */}
          {this.state.productWiseSummary && <Grid item xs={12}>
            {(() => {
              let data: any[] = this.state.productWiseSummary.map((r: any) => {
                return {
                  label: `${r.brandName} - ${r.product}`.substring(0, 30) + (r.product.length > 30? '...' : ''),
                  sales: r.totalSales
                }
              });

              return <ReportChartCardVertical>
                <ReportChartContainer>

                  <ReportChartTitle>Productwise Sales Trend (Top 20)</ReportChartTitle>

                  <ResponsiveContainer min-width={300} height={(data.length * 50) + (data.length < 5? 80: 0)} >
                    <BarChart data={data} layout="vertical"
                      margin={{ top: 0, right: 0, bottom: 30 }} maxBarSize={20}>

                      <Legend verticalAlign="top" align="right" height={36} />

                      <XAxis type="number" axisLine={false} tick={{ strokeWidth: 0, fontSize: 12 }}
                        tickLine={false} tickSize={20} height={36} orientation="top"
                        tickFormatter={formatCurrency} />

                      <YAxis dataKey="label" type="category" axisLine={false}
                        tick={{ strokeWidth: 1, fontSize: 12 }} tickLine={false}
                        tickSize={15} width={300}
                        orientation="right" />

                      <ChartTooltip
                        cursor={{ fill: '#87d4ea' }}
                        formatter={(value: any) => formatCurrency(value)} />

                      <Bar dataKey="sales" fill="#8884d8"/>
                    </BarChart>
                  </ResponsiveContainer>
                </ReportChartContainer>
              </ReportChartCardVertical>
            })()}
          </Grid>
          }
        </Grid>

      </Paper>

    </>);
  }
}

SalesReportsMetrics.contextType = RootContext;

export default SalesReportsMetrics;

