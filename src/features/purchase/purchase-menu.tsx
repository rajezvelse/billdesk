import React from 'react'
import ReactComponent from '../../react-component'

import RootContext from '../../root.context';
import { IsGranted } from '../../directives';
import { SecondaryMenuContainer, SecondaryMenu, SecondaryMenuItem } from '../../styled-components';

class PurchaseMenu extends ReactComponent<any, {
}> {

  render() {
    return (<>

      <RootContext.Consumer>
        {({ userInfo, activeView, navigate, preferences }) => (
          <SecondaryMenuContainer>
            <SecondaryMenu>
              <IsGranted permissions={['create_purchase']}><SecondaryMenuItem onClick={() => navigate('NewPurchase', {}, 'New Purchase')} className={activeView.name === 'NewPurchase' ? 'active' : ''}>New Purchase</SecondaryMenuItem></IsGranted>
              <IsGranted permissions={['view_purchase']}><SecondaryMenuItem onClick={() => navigate('PurchaseReports', {}, 'Purchase reports')} className={activeView.name === 'PurchaseReports' ? 'active' : ''}>Reports</SecondaryMenuItem></IsGranted>
              <IsGranted permissions={['view_stocks']}><SecondaryMenuItem onClick={() => navigate('Stocks', {}, 'Product stocks')} className={activeView.name === 'Stocks' ? 'active' : ''}>Stocks</SecondaryMenuItem></IsGranted>
              <IsGranted permissions={['view_scraps']}><SecondaryMenuItem onClick={() => navigate('ScrapsList', {}, 'Scraps')} className={activeView.name === 'ScrapsList' ? 'active' : ''}>Scraps</SecondaryMenuItem></IsGranted>
            </SecondaryMenu>
          </SecondaryMenuContainer>
        )}</RootContext.Consumer>
    </>);
  }
}

export default PurchaseMenu;

