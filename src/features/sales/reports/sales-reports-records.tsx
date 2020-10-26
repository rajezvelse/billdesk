import React from 'react'
import ReactComponent from '../../../react-component';

import { IpcRendererEvent } from "electron";
import RootContext from '../../../root.context';
import uniqueId from 'lodash/uniqueId';

import {
  ValidationError, TableButtonsContainer, StyledModal, WarningModalActions, TableHead, ColoredLabel
} from '../../../styled-components';

import {
  Grid, Card, CardContent, Tooltip, Button, TablePagination,
  TableContainer, Table, TableRow, TableCell, TableBody, TableSortLabel,

} from '@material-ui/core';

import { Currency, FormatDate } from '../../../directives';

import { withSnackbar, WithSnackbarProps } from 'notistack';

class SalesReportsRecords extends ReactComponent<WithSnackbarProps & {
  reportState: any;
  customerId: number | null;
  startDate: Date;
  endDate: Date;
  searchText?: string;
}, {
  data: any[];
  fetchError: any;
  pageLimit: number;
  pageNumber: number;
  orderBy: string;
  order: 'asc' | 'desc';
  totalRecords: number;
  totalPages: number;
  currentPage: number;
  selectedForDelete: number | null;
  showDeleteWarning: boolean;
  deleteError: any;
}> {

  constructor(props: any) {
    super(props);

    this.state = {
      data: [],
      fetchError: null,
      pageLimit: 20,
      pageNumber: 1,
      orderBy: 'date',
      order: 'desc',
      totalRecords: 0,
      totalPages: 0,
      currentPage: 1,
      selectedForDelete: null,
      showDeleteWarning: false,
      deleteError: null
    }
  }

  componentDidMount() {
    super.componentDidMount();

    this.fetchData(1);
  }

  componentDidUpdate(prevProps: {
    customerId: number | null;
    searchText?: string;
    startDate: Date;
    endDate: Date;
  }) {
    if (this.props.customerId !== prevProps.customerId
      || this.props.searchText !== prevProps.searchText
      || this.getDateISO(this.props.startDate) !== this.getDateISO(prevProps.startDate)
      || this.getDateISO(this.props.endDate) !== this.getDateISO(prevProps.endDate)) {

      this.fetchData(1);

    }
  }

  fetchData = (page?: number) => {
    if (!page) page = this.state.currentPage;


    this.context.electronIpc.once("fetchSalesResponse", (event: IpcRendererEvent, status: number, response: any) => {
      this.context.setLoading(false);

      // On fail
      if (status !== 200) {
        this.setState({ fetchError: response });
        return;
      }

      this.setState({ data: response.records, totalRecords: response.totalRecords, totalPages: response.totalPages, currentPage: page as number });
    });

    this.context.setLoading(true);
    this.context.electronIpc.send("fetchSales", {
      startDate: this.props.startDate,
      endDate: this.props.endDate,
      customerId: this.props.customerId,
      searchText: this.props.searchText,
      pageLimit: this.state.pageLimit,
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

  deleteSale = (id: number) => {
    this.context.electronIpc.once('deleteSaleResponse', (event: IpcRendererEvent, status: number, response: any) => {
      this.context.setLoading(false);

      // On fail
      if (status !== 200) {
        this.setState({ deleteError: response });
        return;
      }

      // On success
      this.setState({ showDeleteWarning: false }, () => this.fetchData());
      this.props.enqueueSnackbar('Deleted', { variant: 'success' })

    });

    // Send signal
    this.context.setLoading(true);
    this.context.electronIpc.send('deleteSale', { id })
  }

  timerId: number | null = null;
  debounce = (callback: Function) => {

    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }

    this.timerId = setTimeout(e => { callback(); }, 800);

  }

  getDateISO = (date: any) => {
    if (date instanceof Date) {
      return date.toISOString();
    } else return null;
  }

  render() {
    return (<>
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
                    <Card elevation={0}>
                      <CardContent>

                        <TableContainer>
                          <Table>
                            <TableHead>
                              <TableRow>
                                <TableCell component="th">
                                  <TableSortLabel
                                    active={this.state.orderBy === 'saleNumber'}
                                    direction={this.state.order}
                                    onClick={() => {
                                      this.handleSorting('saleNumber')
                                    }}
                                  ><strong>Sale number</strong></TableSortLabel>
                                </TableCell>
                                <TableCell component="th">
                                  <TableSortLabel
                                    active={this.state.orderBy === 'date'}
                                    direction={this.state.order}
                                    onClick={() => {
                                      this.handleSorting('date')
                                    }}
                                  ><strong>Date</strong></TableSortLabel></TableCell>
                                <TableCell component="th">
                                  <TableSortLabel
                                    active={this.state.orderBy === 'customerName'}
                                    direction={this.state.order}
                                    onClick={() => {
                                      this.handleSorting('customerName')
                                    }}
                                  ><strong>Customer</strong></TableSortLabel></TableCell>
                                <TableCell component="th">
                                  <TableSortLabel
                                    active={this.state.orderBy === 'totalCost'}
                                    direction={this.state.order}
                                    onClick={() => {
                                      this.handleSorting('totalCost')
                                    }}
                                  ><strong>Total cost</strong></TableSortLabel></TableCell>
                                <TableCell component="th">
                                  <TableSortLabel
                                    active={this.state.orderBy === 'totalDiscount'}
                                    direction={this.state.order}
                                    onClick={() => {
                                      this.handleSorting('totalDiscount')
                                    }}
                                  ><strong>Discount</strong></TableSortLabel></TableCell>
                                <TableCell component="th">
                                  <TableSortLabel
                                    active={this.state.orderBy === 'totalDiscountedCost'}
                                    direction={this.state.order}
                                    onClick={() => {
                                      this.handleSorting('totalDiscountedCost')
                                    }}
                                  ><strong>Bill amount</strong></TableSortLabel></TableCell>
                                <TableCell component="th">
                                  <TableSortLabel
                                    active={this.state.orderBy === 'outstandingAmount'}
                                    direction={this.state.order}
                                    onClick={() => {
                                      this.handleSorting('outstandingAmount')
                                    }}
                                  ><strong>Outstanding</strong></TableSortLabel></TableCell>

                                <TableCell component="th"></TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {this.state.data.map(sale => (
                                <TableRow key={uniqueId()}>
                                  <TableCell>{sale.saleNumber}</TableCell>
                                  <TableCell><FormatDate value={sale.date} /></TableCell>
                                  <TableCell>{sale.customerName}</TableCell>
                                  <TableCell><Currency value={sale.totalCost} /></TableCell>
                                  <TableCell><Currency value={sale.totalDiscount} /></TableCell>
                                  <TableCell><Currency value={sale.totalDiscountedCost} /></TableCell>
                                  <TableCell><ColoredLabel variant={sale.outstandingAmount <= 0 ? 'success' : 'error'}><Currency value={sale.outstandingAmount} /></ColoredLabel></TableCell>
                                  <TableCell>
                                    <TableButtonsContainer>
                                      <Tooltip title="View sale details" arrow placement="top">
                                        <Button onClick={() => navigate('SaleDetails', { id: sale.id }, 'Sale details', this.props.reportState)} variant="contained" size="small" color="primary">
                                          View
                                    </Button>
                                      </Tooltip>
                                      <Tooltip title="Delete sale" arrow placement="top">
                                        <Button onClick={() => this.setState({ showDeleteWarning: true, selectedForDelete: sale.id })} variant="contained" size="small" color="secondary">
                                          Delete
                                    </Button>
                                      </Tooltip>
                                    </TableButtonsContainer>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>

                        </TableContainer>
                        {this.state.totalPages > 0 &&
                          <TablePagination
                            component='div'
                            count={this.state.totalPages}
                            rowsPerPage={this.state.pageLimit}
                            rowsPerPageOptions={[]}
                            page={this.state.currentPage - 1}
                            onChangePage={(event: unknown, newPage: number) => {
                              this.fetchData(newPage + 1);
                            }}
                            onChangeRowsPerPage={() => { }}
                          />
                        }
                      </CardContent>
                    </Card>
                  )}
              </Grid>
            </Grid>

            {/* Delete warning   */}
            <StyledModal
              open={this.state.showDeleteWarning}
              onClose={() => this.setState({ showDeleteWarning: false })}
            >
              <div className="modal-content">
                <p>Are you sure to delete?</p>
                <WarningModalActions>

                  <Button onClick={() => this.deleteSale(this.state.selectedForDelete as number)} type="button" variant="contained" color="secondary" size="small">Yes</Button>
                  <Button onClick={() => this.setState({ showDeleteWarning: false })} type="button" variant="contained" color="default" size="small">No</Button>

                </WarningModalActions>

                <div>{this.state.deleteError && <ValidationError>{this.state.deleteError}</ValidationError>}</div>
              </div>
            </StyledModal>
          </>
        )}
      </RootContext.Consumer>
    </>);
  }
}

SalesReportsRecords.contextType = RootContext;

export default withSnackbar(SalesReportsRecords);

