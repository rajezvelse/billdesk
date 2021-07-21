import React from 'react'
import ReactComponent from '../../react-component'
import { IpcRendererEvent } from "electron"
import RootContext from '../../root.context'
import { IsGranted } from '../../directives';
import uniqueId from 'lodash/uniqueId';

import { Currency } from '../../directives';
import {
  CardSectionTitle, ValidationError, TableButtonsContainer,
  StyledModal, WarningModalActions, Autocomplete, TableHead, TableFilterGrid
} from '../../styled-components';
import {
  Grid, Card, CardContent, TableContainer, Table, TableBody,
  TableRow, TableCell, Tooltip, TextField, Button, TablePagination, TableSortLabel
} from '@material-ui/core';

import { withSnackbar } from 'notistack'

import AddIcon from '@material-ui/icons/Add';

class ProductsList extends ReactComponent<any, {
  data: any[];
  totalRecords: number;
  totalPages: number;
  currentPage: number;
  rowsPerPage: number;
  orderBy: string;
  order: 'asc' | 'desc';

  fetchError: null | string;
  showDeleteWarning: boolean;
  deleteError: string | null;
  selectedForDelete: number | null;

  filters: {
    brandId: number | null;
    categoryId: number | null;
    searchText: string;
  },
  filterData: any;
}> {
  constructor(props: any) {
    super(props);

    this.state = {
      data: [],
      totalRecords: 0,
      totalPages: 0,
      currentPage: 1,
      rowsPerPage: 20,
      orderBy: 'name',
      order: 'asc',

      fetchError: null,
      showDeleteWarning: false,
      deleteError: null,
      selectedForDelete: null,
      filters: {
        brandId: null,
        categoryId: null,
        searchText: '',
      },
      filterData: null
    }
  }

  componentDidMount() {
    super.componentDidMount();

    this.fetchData()
    this.loadFormData()
  }

  loadFormData = () => {

    this.context.electronIpc.once("getProductFormDataResponse", (event: IpcRendererEvent, status: number, response: any) => {
      this.context.setLoading(false);

      // On fail
      if (status !== 200) {
        return;
      }

      this.setState({ filterData: { brands: response.brands, categories: response.categories } });
    });

    this.context.setLoading(true);
    this.context.electronIpc.send("getProductFormData");
  }

  fetchData = (page?: number) => {
    if (!page) page = this.state.currentPage;


    this.context.electronIpc.once("fetchProductsResponse", (event: IpcRendererEvent, status: number, response: any) => {
      this.context.setLoading(false);

      // On fail
      if (status !== 200) {
        this.setState({ fetchError: response });
        return;
      }

      this.setState({ data: response.records, totalRecords: response.totalRecords, totalPages: response.totalPages, currentPage: page as number });
    });

    this.context.setLoading(true);
    this.context.electronIpc.send("fetchProducts", {
      brandId: this.state.filters.brandId,
      categoryId: this.state.filters.categoryId,
      searchText: this.state.filters.searchText,
      pageLimit: this.state.rowsPerPage,
      pageNumber: page,
      orderBy: this.state.orderBy,
      order: this.state.order
    });
  }


  deleteProduct = (id: number) => {
    this.context.electronIpc.once('deleteProductResponse', (event: IpcRendererEvent, status: number, response: any) => {
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
    this.context.electronIpc.send('deleteProduct', { id })
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
                            Products
                            <IsGranted permissions={['create_products']}>
                              <Tooltip title="Add new product" arrow placement="top">
                                <Button onClick={() => navigate('ProductAddEdit', {}, 'Add new product')} variant="contained" size="small" color="primary">
                                  <AddIcon />
                                </Button>
                              </Tooltip>
                            </IsGranted>
                          </CardSectionTitle>

                          {/* Filters */}
                          {this.state.filterData && <TableFilterGrid container spacing={2}>
                            <Grid item xs={4}>
                              <Autocomplete
                                options={this.state.filterData.brands}
                                getOptionLabel={(option: any) => option.name}
                                size="small"
                                renderInput={(params: any) => <TextField {...params} label="Vehicle model" type="text" variant="outlined" />}
                                openOnFocus={true}

                                onChange={(event: object, value: any | any[], reason: string) => {
                                  // params.form.setFieldValue('brand', value ? value.id : '', true);
                                  let filters = this.state.filters;
                                  filters.brandId = value ? value.id : null;

                                  this.setState({ filters: filters }, () => {
                                    this.fetchData();
                                  })

                                }}
                              />
                            </Grid>
                            <Grid item xs={4}>
                              <Autocomplete
                                options={this.state.filterData.categories}
                                getOptionLabel={(option: any) => option.category}
                                size="small"
                                renderInput={(params: any) => <TextField {...params} label="Product category" type="text" variant="outlined" />}
                                openOnFocus={true}

                                onChange={(event: object, value: any | any[], reason: string) => {
                                  let filters = this.state.filters;
                                  filters.categoryId = value ? value.id : null;

                                  this.setState({ filters: filters }, () => {
                                    this.fetchData();
                                  })

                                }}
                              />
                            </Grid>
                            <Grid item xs={4}>
                              <TextField label="Search" type="text" variant="outlined" size="small"
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
                          </TableFilterGrid>}

                          <TableContainer>
                            <Table>
                              <TableHead>
                                <TableRow>
                                  <TableCell component="th">
                                    <TableSortLabel
                                      active={this.state.orderBy === 'brandName'}
                                      direction={this.state.order}
                                      onClick={() => {
                                        this.handleSorting('brandName')
                                      }}
                                    ><strong>Vehicle model</strong></TableSortLabel>
                                  </TableCell>
                                  <TableCell component="th">
                                    <TableSortLabel
                                      active={this.state.orderBy === 'name'}
                                      direction={this.state.order}
                                      onClick={() => {
                                        this.handleSorting('name')
                                      }}
                                    ><strong>Product name</strong></TableSortLabel></TableCell>
                                  <TableCell component="th">
                                    <TableSortLabel
                                      active={this.state.orderBy === 'price'}
                                      direction={this.state.order}
                                      onClick={() => {
                                        this.handleSorting('price')
                                      }}
                                    ><strong>Price</strong></TableSortLabel></TableCell>
                                  <TableCell component="th">
                                    <TableSortLabel
                                      active={this.state.orderBy === 'categoryName'}
                                      direction={this.state.order}
                                      onClick={() => {
                                        this.handleSorting('categoryName')
                                      }}
                                    ><strong>Category</strong></TableSortLabel></TableCell>
                                  <IsGranted permissions={['update_products', 'delete_products']} anyOne={true}>
                                    <TableCell component="th"></TableCell>
                                  </IsGranted>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {this.state.data.map(product => (
                                  <TableRow key={uniqueId()}>
                                    <TableCell>{product.brandName}</TableCell>
                                    <TableCell>{product.name}</TableCell>
                                    <TableCell><Currency value={product.price} /></TableCell>
                                    <TableCell>{product.categoryName || '-'}</TableCell>
                                    <IsGranted permissions={['update_products', 'delete_products']} anyOne={true}>
                                      <TableCell>
                                        <TableButtonsContainer>
                                          <IsGranted permissions={['update_products']} >
                                            <Tooltip title="Edit product details" arrow placement="top">
                                              <Button onClick={() => navigate('ProductAddEdit', { selectedForEdit: product }, 'Edit product details')} variant="contained" size="small" color="primary">
                                                Edit
                                              </Button>
                                            </Tooltip>
                                          </IsGranted>
                                          <IsGranted permissions={['delete_products']} >
                                            <Tooltip title="Delete product" arrow placement="top">
                                              <Button onClick={() => this.setState({ showDeleteWarning: true, selectedForDelete: product.id })} variant="contained" size="small" color="secondary">
                                                Delete
                                              </Button>
                                            </Tooltip>
                                          </IsGranted>
                                        </TableButtonsContainer>
                                      </TableCell>
                                    </IsGranted>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>

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

                    <Button onClick={() => this.deleteProduct(this.state.selectedForDelete as number)} type="button" variant="contained" color="secondary" size="small">Yes</Button>
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

ProductsList.contextType = RootContext;

export default withSnackbar(ProductsList);