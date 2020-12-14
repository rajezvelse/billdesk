import React from 'react'
import ReactComponent from '../../react-component'

import RootContext from '../../root.context';
import { SecondaryMenuContainer, SecondaryMenu, SecondaryMenuItem } from '../../styled-components';

class PurchaseMenu extends ReactComponent<any, {
}> {

  render() {
    return (<>

      <RootContext.Consumer>
        {({ userInfo, activeView, navigate, preferences }) => (
          <SecondaryMenuContainer>
            <SecondaryMenu>
              <SecondaryMenuItem onClick={() => navigate('NewPurchase', {}, 'New Purchase')} className={activeView.name === 'NewPurchase' ? 'active' : ''}>New Purchase</SecondaryMenuItem>
              <SecondaryMenuItem onClick={() => navigate('PurchaseReports', {}, 'Purchase reports')} className={activeView.name === 'PurchaseReports' ? 'active' : ''}>Reports</SecondaryMenuItem>
              <SecondaryMenuItem onClick={() => navigate('Stocks', {}, 'Product stocks')} className={activeView.name === 'Stocks' ? 'active' : ''}>Stocks</SecondaryMenuItem>
              <SecondaryMenuItem onClick={() => navigate('ScrapsList', {}, 'Scraps')} className={activeView.name === 'ScrapsList' ? 'active' : ''}>Scraps</SecondaryMenuItem>
            </SecondaryMenu>
          </SecondaryMenuContainer>
        )}</RootContext.Consumer>
    </>);
  }
}

export default PurchaseMenu;

