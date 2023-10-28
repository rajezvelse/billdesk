import React from 'react'
import ReactComponent from '../../react-component'
import { IpcRendererEvent } from "electron"
import RootContext from '../../root.context'
import uniqueId from 'lodash/uniqueId';

import {
  CardSectionTitle, ValidationError, TableHead, TableFilterGrid,
  ColoredLabel
} from '../../styled-components';
import {
  Grid, Card, CardContent, TableContainer, Table, TableBody,
  TableRow, TableCell, TextField, TablePagination, TableSortLabel
} from '@material-ui/core';
import withSnackbar from '../../directives/with-snackbar';



class StocksList extends ReactComponent<any, {
  data: any[];
  totalRecords: number;
  totalPages: number;
  currentPage: number;
  rowsPerPage: number;
  orderBy: string;
  order: 'asc' | 'desc';

  fetchError: null | string;

  filters: {
    searchText: string;
  },
  filterData: any;
}> {
  context: any;
  constructor(props: any) {
    super(props);

    this.state = {
      data: [],
      totalRecords: 0,
      totalPages: 0,
      currentPage: 1,
      rowsPerPage: 20,
      orderBy: 'availableQuantity',
      order: 'desc',

      fetchError: null,
      filters: {
        searchText: ''
      },
      filterData: null
    }
  }

  componentDidMount() {
    super.componentDidMount();

    this.fetchData()
  }


  fetchData = (page?: number) => {
    if (!page) page = this.state.currentPage;


    this.context.electronIpc.once("getStocksDataResponse", (event: IpcRendererEvent, status: number, response: any) => {
      this.context.setLoading(false);

      // On fail
      if (status !== 200) {
        console.log(response)
        this.setState({ fetchError: response });
        return;
      }

      this.setState({ data: response.records, totalRecords: response.totalRecords, totalPages: response.totalPages, currentPage: page as number });
    });

    this.context.setLoading(true);
    this.context.electronIpc.send("getStocksData", {
      searchText: this.state.filters.searchText,
      pageLimit: this.state.rowsPerPage,
      pageNumber: page,
      orderBy: this.state.orderBy,
      order: this.state.order
    });
  }


  handleSorting = (orderBy: string) => {
    let order = this.state.order;

    if (this.state.orderBy === orderBy) {
      order = order === 'asc' ? 'desc' : 'asc';
    }
    else order = 'asc';

    this.setState({ orderBy, order }, () => {
      this.fetchData();
    });
  }

  timerId:  any = null;
  debounce = (callback: Function) => {

    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }

    this.timerId = setTimeout(e => { callback(); }, 800);

  }

  render() {
    return (
      <>
        <RootContext.Consumer>
          {({ navigate }) => (
            <>
              <Grid container spacing={5}>
                <Grid item xs={12}>

                  {this.state.fetchError ? (
                    <Card>
                      <CardContent>
                        {this.state.fetchError && <div><ValidationError>{this.state.fetchError}</ValidationError></div>}
                      </CardContent>
                    </Card>
                  ) : (
                      <Card>
                        <CardContent>
                          <CardSectionTitle gutterBottom variant="h5">Product stocks</CardSectionTitle>

                          {/* Filters */}
                          <TableFilterGrid container spacing={2}>
                            <Grid item xs={12} md={5}>
                              <TextField label="Search by product name, category" type="text" variant="outlined" size="small"
                                fullWidth
                                onKeyUp={(event: any) => {

                                  let cls = this;
                                  let searchText: string = event.target.value;

                                  let fun: Function = () => {
                                    let filters = cls.state.filters;
                                    filters.searchText = searchText ? searchText : '';

                                    cls.setState({ filters: filters }, () => {
                                      cls.fetchData();
                                    })

                                  };

                                  this.debounce(fun);

                                }}
                              />
                            </Grid>

                          </TableFilterGrid>

                          <TableContainer>
                            <Table>
                              <TableHead>
                                <TableRow>
                                  <TableCell component="th">
                                    <TableSortLabel
                                      active={this.state.orderBy === 'productCategory'}
                                      direction={this.state.order}
                                      onClick={() => {
                                        this.handleSorting('productCategory')
                                      }}
                                    ><strong>Product category</strong></TableSortLabel>
                                  </TableCell>
                                  <TableCell component="th">
                                    <TableSortLabel
                                      active={this.state.orderBy === 'productName'}
                                      direction={this.state.order}
                                      onClick={() => {
                                        this.handleSorting('productName')
                                      }}
                                    ><strong>Product name</strong></TableSortLabel></TableCell>
                                  <TableCell component="th">
                                    <TableSortLabel
                                      active={this.state.orderBy === 'purchaseQuantity'}
                                      direction={this.state.order}
                                      onClick={() => {
                                        this.handleSorting('purchaseQuantity')
                                      }}
                                    ><strong>Purchased quantity</strong></TableSortLabel></TableCell>
                                  <TableCell component="th">
                                    <TableSortLabel
                                      active={this.state.orderBy === 'salesQuantity'}
                                      direction={this.state.order}
                                      onClick={() => {
                                        this.handleSorting('salesQuantity')
                                      }}
                                    ><strong>Sold quantity</strong></TableSortLabel></TableCell>
                                  <TableCell component="th">
                                    <TableSortLabel
                                      active={this.state.orderBy === 'availableQuantity'}
                                      direction={this.state.order}
                                      onClick={() => {
                                        this.handleSorting('availableQuantity')
                                      }}
                                    ><strong>Stock available</strong></TableSortLabel></TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {this.state.data.map(stock => (
                                  <TableRow key={uniqueId()}>
                                    <TableCell>{stock.productCategory}</TableCell>
                                    <TableCell>{stock.productName}</TableCell>
                                    <TableCell>{stock.purchaseQuantity || 0}</TableCell>
                                    <TableCell>{stock.salesQuantity || 0}</TableCell>
                                    <TableCell>
                                      <ColoredLabel variant={stock.availableQuantity > 0 ? 'success' : 'error'}>
                                        {stock.availableQuantity || 0}
                                      </ColoredLabel>
                                    </TableCell>

                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                            
                            {this.state.data.length === 0 && <div>No records available.</div>}
                          </TableContainer>
                          {this.state.totalPages > 0 &&
                            <TablePagination
                              component='div'
                              count={this.state.totalRecords}
                              rowsPerPage={this.state.rowsPerPage}
                              rowsPerPageOptions={[]}
                              page={this.state.currentPage - 1}
                              onPageChange={(event: unknown, newPage: number) => {
                                this.fetchData(newPage + 1);
                              }}
                              onRowsPerPageChange={() => { }}
                            />
                          }
                        </CardContent>
                      </Card>
                    )}
                </Grid>
              </Grid>

            </>
          )}
        </RootContext.Consumer>
      </>)
  }
}

StocksList.contextType = RootContext;

export default withSnackbar(StocksList);