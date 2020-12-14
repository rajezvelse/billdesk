import React from 'react'
import ReactComponent from '../../react-component'
import { IpcRendererEvent } from "electron"
import RootContext from '../../root.context'
import uniqueId from 'lodash/uniqueId';

import { Currency, FormatDate } from '../../directives';
import {
  CardSectionTitle, ValidationError, TableButtonsContainer,
  StyledModal, WarningModalActions, TableHead, TableFilterGrid,
  FilterDropdownButton, GridFullHeight,
  DateRangeContainer, ReportCardPink, DetailRow, DetailValue
} from '../../styled-components';
import {
  Grid, Card, CardContent, TableContainer, Table, TableBody,
  TableRow, TableCell, Tooltip, TextField, Button, TablePagination, TableSortLabel,
  ButtonGroup
} from '@material-ui/core';

import { withSnackbar } from 'notistack'

import { DateRangePicker } from "materialui-daterange-picker";
import moment from 'moment';

import AddIcon from '@material-ui/icons/Add';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';

class ScrapsList extends ReactComponent<any, {
  data: any[];
  totalRecords: number;
  totalPages: number;
  totalScrapLoss: number;
  currentPage: number;
  rowsPerPage: number;
  orderBy: string;
  order: 'asc' | 'desc';

  fetchError: null | string;
  showDeleteWarning: boolean;
  deleteError: string | null;
  selectedForDelete: number | null;

  filters: {
    searchText: string;
    date: {
      label: string;
      startDate: Date;
      endDate: Date;
    }
  },
  showDateDropdown: boolean;
  selectedDateOption: 'today' | 'yesterday' | 'this_week' | 'this_month' | 'custom_range';
  filterData: any;
}> {
  constructor(props: any) {
    super(props);

    this.state = {
      data: [],
      totalRecords: 0,
      totalPages: 0,
      totalScrapLoss: 0,
      currentPage: 1,
      rowsPerPage: 20,
      orderBy: 'date',
      order: 'desc',

      fetchError: null,
      showDeleteWarning: false,
      deleteError: null,
      selectedForDelete: null,
      filters: {
        searchText: '',
        date: {
          label: "This Month",
          startDate: moment().startOf('month').toDate(),
          endDate: moment().endOf('month').toDate()
        }
      },
      showDateDropdown: false,
      selectedDateOption: 'this_month',
      filterData: null
    }
  }

  componentDidMount() {
    super.componentDidMount();

    this.fetchData()
  }

  fetchData = (page?: number) => {
    if (!page) page = this.state.currentPage;


    this.context.electronIpc.once("fetchScrapsResponse", (event: IpcRendererEvent, status: number, response: any) => {
      this.context.setLoading(false);

      // On fail
      if (status !== 200) {
        this.setState({ fetchError: response });
        return;
      }

      this.setState({ data: response.records, totalRecords: response.totalRecords, totalScrapLoss: response.totalScrapLoss, totalPages: response.totalPages, currentPage: page as number });
    });

    this.context.setLoading(true);
    this.context.electronIpc.send("fetchScraps", {
      startDate: this.state.filters.date.startDate,
      endDate: this.state.filters.date.endDate,
      searchText: this.state.filters.searchText,
      pageLimit: this.state.rowsPerPage,
      pageNumber: page,
      orderBy: this.state.orderBy,
      order: this.state.order
    });
  }


  deleteScraps = (id: number) => {
    this.context.electronIpc.once('deleteScrapsResponse', (event: IpcRendererEvent, status: number, response: any) => {
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
    this.context.electronIpc.send('deleteScraps', { id })
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

    this.setState({ filters, showDateDropdown: false }, () => {
      this.fetchData();
    })
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

  timerId: number | null = null;
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
                          <CardSectionTitle gutterBottom variant="h5">
                            Scraps
                            <Tooltip title="Add new scraps" arrow placement="top">
                              <Button onClick={() => navigate('ScrapsAddEdit', {}, 'Mark scraps')} variant="contained" size="small" color="primary">
                                <AddIcon />
                              </Button>
                            </Tooltip>
                          </CardSectionTitle>

                          {/* Filters */}
                          <TableFilterGrid container spacing={2}>

                            <Grid item xs={12} md={5}>
                              <DetailRow>
                                <DetailValue xs={12}>
                                  {/* Date filter */}
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

                              <DetailRow>
                                <DetailValue xs={12}>
                                  <TextField label="Search by vehicle, category, product name" type="text" variant="outlined" size="small" fullWidth
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
                                </DetailValue>
                              </DetailRow>

                            </Grid>
                            <Grid item xs={12} md={6}>
                              <GridFullHeight container
                                justify="center"
                                alignItems="center">
                                <Grid item xs={12} md={6}>
                                  <ReportCardPink>
                                    <CardContent>
                                      <h5><Currency value={this.state.totalScrapLoss} /></h5>
                                      <p>Total scrap loss</p>
                                    </CardContent>
                                  </ReportCardPink>
                                </Grid>
                              </GridFullHeight>

                            </Grid>
                          </TableFilterGrid>

                          <TableContainer>
                            <Table>
                              <TableHead>
                                <TableRow>
                                  <TableCell component="th">
                                    <TableSortLabel
                                      active={this.state.orderBy === 'date'}
                                      direction={this.state.order}
                                      onClick={() => {
                                        this.handleSorting('date')
                                      }}
                                    ><strong>Date</strong></TableSortLabel>
                                  </TableCell>
                                  <TableCell component="th">
                                    <TableSortLabel
                                      active={this.state.orderBy === 'brandName'}
                                      direction={this.state.order}
                                      onClick={() => {
                                        this.handleSorting('brandName')
                                      }}
                                    ><strong>Vehicle model</strong></TableSortLabel></TableCell>
                                  <TableCell component="th">
                                    <TableSortLabel
                                      active={this.state.orderBy === 'category'}
                                      direction={this.state.order}
                                      onClick={() => {
                                        this.handleSorting('category')
                                      }}
                                    ><strong>Product category</strong></TableSortLabel></TableCell>
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
                                      active={this.state.orderBy === 'quantity'}
                                      direction={this.state.order}
                                      onClick={() => {
                                        this.handleSorting('quantity')
                                      }}
                                    >
                                      <strong>Quantity</strong>
                                    </TableSortLabel>
                                  </TableCell>
                                  <TableCell component="th">
                                    <TableSortLabel
                                      active={this.state.orderBy === 'loss'}
                                      direction={this.state.order}
                                      onClick={() => {
                                        this.handleSorting('loss')
                                      }}
                                    >
                                      <strong>Scrap loss</strong>
                                    </TableSortLabel>
                                  </TableCell>

                                  <TableCell component="th"></TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {this.state.data.map(scraps => (
                                  <TableRow key={uniqueId()}>
                                    <TableCell><FormatDate value={scraps.date} /></TableCell>
                                    <TableCell>{scraps.brandName}</TableCell>
                                    <TableCell>{scraps.category}</TableCell>
                                    <TableCell>{scraps.productName}</TableCell>
                                    <TableCell>{scraps.quantity}</TableCell>
                                    <TableCell><Currency value={scraps.loss} /></TableCell>
                                    <TableCell>
                                      <TableButtonsContainer>
                                        <Tooltip title="Delete scrap entry" arrow placement="top">
                                          <Button onClick={() => this.setState({ showDeleteWarning: true, selectedForDelete: scraps.id })} variant="contained" size="small" color="secondary">
                                            Delete
                                      </Button>
                                        </Tooltip>
                                      </TableButtonsContainer>
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

                    <Button onClick={() => this.deleteScraps(this.state.selectedForDelete as number)} type="button" variant="contained" color="secondary" size="small">Yes</Button>
                    <Button onClick={() => this.setState({ showDeleteWarning: false })} type="button" variant="contained" color="default" size="small">No</Button>

                  </WarningModalActions>

                  <div>{this.state.deleteError && <ValidationError>{this.state.deleteError}</ValidationError>}</div>
                </div>
              </StyledModal>
            </>
          )}
        </RootContext.Consumer>
      </>)
  }
}

ScrapsList.contextType = RootContext;

export default withSnackbar(ScrapsList);