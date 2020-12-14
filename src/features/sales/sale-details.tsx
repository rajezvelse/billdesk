import React from 'react'
import ReactComponent from '../../react-component'

import { IpcRendererEvent } from "electron";
import RootContext from '../../root.context';

import { default as NewSalesPaymentDialog } from './new-sales-payment-dialog';

import {
  SectionTitle, SubSectionTitle, FormContent, DetailRow, DetailLabelNormal, DetailValue, ParticularsTable, NoBorderTd,
  ValidationError, RequiredAstrix, TableHead, GridFullHeight, DisplayCard, NoBorderWhiteTh,
  StyledModal, WarningModalActions, SectionDivider, DoubleArrowIconBack
} from '../../styled-components';

import {
  Grid, CardContent, TableContainer, Table, TableBody,
  TableRow, TableCell, Button, IconButton, Tooltip
} from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import HighlightOffIcon from '@material-ui/icons/HighlightOff';

import { withSnackbar, WithSnackbarProps } from 'notistack';

import { Currency, FormatDate } from '../../directives';

import { uniqueId } from 'lodash';

class SaleDetails extends ReactComponent<WithSnackbarProps & { id: number; }, {
  data: any;
  totalPayment: number;
  fetchError: null | string;
  openAddNewPaymentDialog: boolean;
  showPaymentDeleteWarning: boolean;
  selectedPaymentForDelete: number | null;
  deletePaymentError: null | string;
  selectedForDelete: number | null;
  showDeleteWarning: boolean;
  deleteError: any;
}> {

  constructor(props: any) {
    super(props);

    this.state = {
      data: null,
      totalPayment: 0,
      fetchError: null,
      openAddNewPaymentDialog: false,
      selectedPaymentForDelete: null,
      showPaymentDeleteWarning: false,
      deletePaymentError: null,
      selectedForDelete: null,
      showDeleteWarning: false,
      deleteError: null
    }
  }

  componentDidMount() {
super.componentDidMount();

    this.fetchData();
  }

  fetchData = () => {

    this.context.electronIpc.once("fetchSaleDataResponse", (event: IpcRendererEvent, status: number, response: any) => {
this.context.setLoading(false);

      // On fail
      if (status !== 200) {
        console.log(response)
        this.setState({ data: null, fetchError: response });
        return;
      }

      this.setState({ data: response, fetchError: null, totalPayment: this.getTotal(response.payments, 'amount') });
    });

    this.context.setLoading(true);
this.context.electronIpc.send("fetchSaleData", { id: this.props.id });
  }

  onAddNewPaymentDialogClose = (val: any) => {
    this.setState({ openAddNewPaymentDialog: false }, () => {
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
      this.setState({ showDeleteWarning: false }, () => this.context.navigateBack());
      this.props.enqueueSnackbar('Deleted', { variant: 'success' })

    });

    // Send signal
    this.context.setLoading(true);
    this.context.electronIpc.send('deleteSale', { id })
  }

  deletePayment = () => {
    this.context.electronIpc.once("deleteSalePaymentResponse", (event: IpcRendererEvent, status: number, response: any) => {
      this.context.setLoading(false);

      // On fail
      if (status !== 200) {
        console.log(response)

        this.setState({ deletePaymentError: response });
        return;
      }

      this.setState({ selectedPaymentForDelete: null, deletePaymentError: null, showPaymentDeleteWarning: false }, () => {
        this.fetchData();
      });
      this.props.enqueueSnackbar('Payment deleted', { variant: 'success' });
    });

    this.context.setLoading(true);
    this.context.electronIpc.send("deleteSalePayment", { id: this.state.selectedPaymentForDelete });
  }

  getTotal = (values: Array<any>, field: string) => {
    let t: number = 0;

    values.forEach((v: any) => {
      t += parseFloat(v[field]);
    })

    return t;
  }

  render() {
    return (<>
      <RootContext.Consumer>
        {({ navigate, navigateBack, getPrevHistory }) => (
          <>
            <Grid container spacing={5}>
              <Grid item xs={12} md={12}>

                <SectionTitle gutterBottom variant="h5">
                  Sale details

                    <Tooltip title="Delete sale" arrow placement="top">
                      <Button onClick={() => this.setState({ showDeleteWarning: true, selectedForDelete: this.state.data.id })} variant="contained" size="small" color="secondary">
                        Delete
                      </Button>
                    </Tooltip>
                 
                    <Button onClick={() => navigateBack()} variant="contained" size="small" color="primary">
                      <DoubleArrowIconBack />
                      
                      {(() => {
                        let prev: any = getPrevHistory();

                        if(prev.name === 'NewSale') return 'Back to new sale';
                        else if (prev.name === 'SalesReports') return 'Back to sales report';
                        else return '';
                      })()}
                    </Button>

                 </SectionTitle>

                <CardContent >
                  {/* If error while fetching */}
                  {this.state.fetchError &&
                    <div>{this.state.fetchError}</div>
                  }

                  {/* Details display */}
                  {/* Customer details */}
                  {(!this.state.fetchError && this.state.data) && <>
                    <Grid container>
                      <Grid item xs={12} md={5}>
                        <FormContent>
                          <DetailRow>
                            <DetailLabelNormal xs={12} md={4}>Sale number</DetailLabelNormal>
                            <DetailValue xs={12} md={8}>{this.state.data.saleNumber ? this.state.data.saleNumber : '-'}</DetailValue>
                          </DetailRow>
                          <DetailRow>
                            <DetailLabelNormal xs={12} md={4}>Date</DetailLabelNormal>
                            <DetailValue xs={12} md={8}>{this.state.data.date ? <FormatDate value={this.state.data.date} /> : '-'}</DetailValue>
                          </DetailRow>
                        </FormContent>

                        <SubSectionTitle gutterBottom variant="h6">Customer details:</SubSectionTitle>

                        <FormContent>
                          <DetailRow>
                            <DetailLabelNormal xs={12} md={4}>Customer name</DetailLabelNormal>
                            <DetailValue xs={12} md={8}>{this.state.data.customer.name ? this.state.data.customer.name : '-'}</DetailValue>
                          </DetailRow>
                          <DetailRow>
                            <DetailLabelNormal xs={12} md={4}>Customer phone</DetailLabelNormal>
                            <DetailValue xs={12} md={8}>{this.state.data.customer.phone ? this.state.data.customer.phone : '-'}</DetailValue>
                          </DetailRow>
                        </FormContent>
                      </Grid>

                      {/* Outstanding amount & Total paid */}
                      <Grid item xs={12} md={6}>
                        <GridFullHeight container direction="column"
                          justify="center"
                          alignItems="center">
                          <Grid item xs={12} md={8}>
                            <DisplayCard>

                              <p><Currency value={this.state.data.outstandingAmount} /></p>
                              <p>Total Outstanding Amount</p>

                            </DisplayCard>
                          </Grid>
                        </GridFullHeight>
                      </Grid>
                    </Grid>


                    {/* Particulars */}
                    <SubSectionTitle gutterBottom variant="h6">Particulars:</SubSectionTitle>
                    <ParticularsTable>
                      <TableHead>
                        <tr>
                          <th>#</th>
                          <th><RequiredAstrix>Product</RequiredAstrix></th>
                          <th><RequiredAstrix>Price</RequiredAstrix></th>
                          <th><RequiredAstrix>Quantity</RequiredAstrix></th>
                          <th><RequiredAstrix>Cost</RequiredAstrix></th>
                          <th><RequiredAstrix>Discount</RequiredAstrix></th>
                          <th><RequiredAstrix>Discounted cost</RequiredAstrix></th>
                        </tr>
                      </TableHead>
                      <tbody>
                        {this.state.data.particulars.map((item: any, index: number) => <tr key={uniqueId()}>
                          <td>{index + 1}</td>
                          <td>{item.product.category.category} - {item.product.name}</td>
                          <td><Currency value={item.price} /></td>
                          <td>{item.quantity}</td>
                          <td><Currency value={item.cost} /></td>
                          <td><Currency value={item.discount} /></td>
                          <td><Currency value={item.discountedCost} /></td>

                        </tr>)}

                        {/* Summary */}
                        <tr>
                          <NoBorderTd colSpan={4}></NoBorderTd>
                          <td colSpan={2}>Total cost</td>
                          <td><Currency value={this.state.data.totalCost} /></td>
                        </tr>
                        <tr>
                          <NoBorderTd colSpan={4}></NoBorderTd>
                          <td colSpan={2}>Total discount</td>
                          <td><Currency value={this.state.data.totalDiscount} /></td>
                        </tr>
                        <tr>
                          <NoBorderTd colSpan={4}></NoBorderTd>
                          <td colSpan={2}>Total bill amount</td>
                          <td><Currency value={this.state.data.totalDiscountedCost} /></td>
                        </tr>
                      </tbody>
                    </ParticularsTable>

                    <SectionDivider light />

                    <Grid container>
                      {/* Payment history */}
                      <Grid item xs={12} md={6}>

                        <Grid container>
                          <Grid item xs={10}>
                            <SubSectionTitle gutterBottom variant="h6">
                              Payment history:

                              {this.state.data.outstandingAmount > 0 &&
                                <Tooltip title="Add new payment" arrow placement="top">
                                  <Button onClick={() => this.setState({ openAddNewPaymentDialog: true })} variant="contained" size="small" color="primary">
                                    <AddIcon />
                                  </Button>
                                </Tooltip>
                              }
                            </SubSectionTitle>
                          </Grid>
                        </Grid>

                        <TableContainer>

                          <Table>
                            <TableHead>
                              <TableRow>
                                <TableCell component="th">#</TableCell>
                                <TableCell component="th">Date</TableCell>
                                <TableCell component="th">Payment mode</TableCell>
                                <TableCell component="th">Amount</TableCell>
                                <NoBorderWhiteTh></NoBorderWhiteTh>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {this.state.data.payments.map((payment: any, index: number) => (
                                <TableRow key={uniqueId()}>
                                  <TableCell>{index + 1}</TableCell>
                                  <TableCell><FormatDate value={payment.date} /></TableCell>
                                  <TableCell>{payment.mode}</TableCell>
                                  <TableCell><Currency value={payment.amount} /></TableCell>

                                  <NoBorderTd>
                                    <Tooltip title="Delete payment" arrow placement="top">
                                      <IconButton onClick={() => this.setState({ showPaymentDeleteWarning: true, selectedPaymentForDelete: payment.id })} color="secondary">
                                        <HighlightOffIcon />
                                      </IconButton>
                                    </Tooltip>
                                  </NoBorderTd>
                                </TableRow>
                              ))}
                              <TableRow>
                                <TableCell ></TableCell>
                                <TableCell ></TableCell>
                                <TableCell >Total payment</TableCell>
                                <TableCell ><Currency value={this.state.totalPayment} /></TableCell>
                                <NoBorderTd></NoBorderTd>
                              </TableRow>
                            </TableBody>
                          </Table>

                        </TableContainer>

                      </Grid>

                      <Grid item xs={12} md={6}>

                      </Grid>
                    </Grid>

                    {/* Add new payment dialogue */}
                    <NewSalesPaymentDialog open={this.state.openAddNewPaymentDialog} onClose={this.onAddNewPaymentDialogClose} saleId={this.state.data.id} />

                  </>}
                </CardContent>

              </Grid>
            </Grid>

            
            {/* Delete sale warning   */}
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

            {/* Delete payment warning   */}
            <StyledModal
              open={this.state.showPaymentDeleteWarning}
              onClose={() => this.setState({ showPaymentDeleteWarning: false })}
            >
              <div className="modal-content">
                <p>Are you sure to delete?</p>
                <WarningModalActions>

                  <Button onClick={() => this.deletePayment()} type="button" variant="contained" color="secondary" size="small">Yes</Button>
                  <Button onClick={() => this.setState({ showPaymentDeleteWarning: false })} type="button" variant="contained" color="default" size="small">No</Button>

                </WarningModalActions>

                <div>{this.state.deletePaymentError && <ValidationError>{this.state.deletePaymentError}</ValidationError>}</div>
              </div>
            </StyledModal>
          </>)}
      </RootContext.Consumer>
    </>);
  }
}

SaleDetails.contextType = RootContext;

export default withSnackbar(SaleDetails);

