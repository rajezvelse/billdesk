import React from 'react';
import ReactComponent from '../react-component';
import RootContext from '../root.context';
import { Activity } from "../directives";

import {
  PageHeader, PageHeaderTitle, PageContainer, Footer, ImagedBackgroundDark, MainContentWrapper,
  TopNavContainer, TopNav, TopNavItem, TopNavLogo, TopNavTools, ProfileAvatar,
  TopMenuIconButton, DropdownMenu, TooltipLight, ApiLoader
} from '../styled-components';
import { Grid } from '@material-ui/core';
import SettingsIcon from '@material-ui/icons/Settings';
import LockIcon from '@material-ui/icons/Lock';

import mainLogo from '../assets/images/logo-h.png';

import SalesMenu from './sales/sales-menu';
import PurchaseMenu from './purchase/purchase-menu';

class Main extends ReactComponent<any, any> {

  constructor(props: any) {
    super(props);

    this.state = {
      showSettingsDropdown: false
    }
  }

  // Lock the application
  lock = () => {
    this.context.setValue({ userInfo: undefined });
  }

  render() {
    return <>
      <RootContext.Consumer>
        {({ userInfo, activeView, navigate, preferences, isLoading }) => (
          <>
            {/* Api data loader icon */}
            {isLoading() && <ApiLoader>Loading</ApiLoader>}

            <ImagedBackgroundDark>
              <MainContentWrapper>
                {/* Top menu */}
                <TopNavContainer>
                  <TopNavLogo><img src={mainLogo} alt="" /></TopNavLogo>
                  <TopNav>
                    <TopNavItem onClick={() => navigate('Dashboard', {}, 'Dashboard')} className={activeView.name === 'Dashboard' ? 'active' : ''}>Dashboard</TopNavItem>
                    <TopNavItem onClick={() => navigate('NewPurchase', {}, 'New Purchase')} className={['NewPurchase', 'PurchaseDetails', 'PurchaseReports', 'Stocks'].indexOf(activeView.name) >= 0 ? 'active' : ''}>Purchase</TopNavItem>
                    <TopNavItem onClick={() => navigate('NewSale', {}, 'New Sale')} className={['NewSale', 'SaleDetails', 'SalesReports', 'Customers'].indexOf(activeView.name) >= 0 ? 'active' : ''}>Sales</TopNavItem>
                    <TopNavItem onClick={() => navigate('ExpensesList', {}, 'Expenses')} className={activeView.name === 'ExpenseList' ? 'active' : ''}>Expenses</TopNavItem>
                  </TopNav>

                  <TopNavTools>
                    <li>
                      <strong>{preferences && preferences.COMPANY_NAME}</strong>
                    </li>
                    <li>
                      <TooltipLight title="Lock" arrow placement="left">
                        <TopMenuIconButton size="small" onClick={this.lock}>
                          <LockIcon color="inherit" />
                        </TopMenuIconButton>
                      </TooltipLight>
                    </li>
                    <li>
                      <DropdownMenu>
                        <TooltipLight title="Settings" arrow placement="left">
                          <TopMenuIconButton onClick={() => this.setState({ showSettingsDropdown: true })} size="small">
                            <SettingsIcon color="inherit" />
                          </TopMenuIconButton>
                        </TooltipLight>

                        <ul>
                          <li onClick={() => navigate('Vendors', {}, 'Vendors')}>Vendors</li>
                          <li onClick={() => navigate('ProductsList', {}, 'Products')}>Products</li>
                          <li onClick={() => navigate('ProductCategories', {}, 'Product Categories')}>Product Categories</li>
                          <li onClick={() => navigate('Brands', {}, 'Vehicle Models')}>Vehicle Models</li>
                          <li onClick={() => navigate('ExpenseCategories', {}, 'Expense Categories')}>Expense Categories</li>
                          <li onClick={() => navigate('CompanySettings', {}, 'Settings')}>Settings</li>
                        </ul>
                      </DropdownMenu>
                    </li>
                    <li>
                      <DropdownMenu>
                        {userInfo && <ProfileAvatar variant={userInfo.avatar} size="small" outline="light" />}
                        <ul>
                          <li onClick={() => navigate('ChangePassword', {}, 'Change login password')}>Change password</li>
                          <li onClick={() => navigate('Login', {})}>Logout</li>
                        </ul>
                      </DropdownMenu>

                    </li>
                  </TopNavTools>
                </TopNavContainer>

                {/* Page view */}
                {!activeView ? <>
                  <PageHeader></PageHeader>
                  <PageContainer></PageContainer>
                  <Footer />
                </> :
                  <>
                    <PageHeader>
                      {(() => {
                        if (['NewSale', 'SaleDetails', 'SalesReports', 'Customers'].indexOf(activeView.name) >= 0)
                          return (<>
                            <Grid container>
                              <SalesMenu />
                            </Grid>
                          </>);
                        else if (['NewPurchase', 'PurchaseDetails', 'PurchaseReports', 'Stocks', 'ScrapsList'].indexOf(activeView.name) >= 0)
                          return (<>
                            <Grid container>
                              <PurchaseMenu />
                            </Grid>
                          </>);
                        else return <PageHeaderTitle>{activeView.title}</PageHeaderTitle>;
                      })()}
                    </PageHeader>
                    <PageContainer>
                      <Activity name={activeView.name} props={activeView.params} prevState={activeView.prevState} />
                    </PageContainer>
                    <Footer />
                  </>}

                {/* Footer */}
                <Footer>Billdesk</Footer>
              </MainContentWrapper>
            </ImagedBackgroundDark>
          </>
        )}
      </RootContext.Consumer>

    </>
  }
}

Main.contextType = RootContext;

export default Main;