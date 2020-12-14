import React from 'react'
import ReactComponent from '../../react-component'

import RootContext from '../../root.context';
import { SecondaryMenuContainer, SecondaryMenu, SecondaryMenuItem } from '../../styled-components';

class SalesMenu extends ReactComponent<any, {
}> {

  render() {
    return (<>

      <RootContext.Consumer>
        {({ userInfo, activeView, navigate, preferences }) => (
          <SecondaryMenuContainer>
            <SecondaryMenu>
              <SecondaryMenuItem onClick={() => navigate('NewSale', {}, 'New Sale')} className={activeView.name === 'NewSale' ? 'active' : ''}>New Sale</SecondaryMenuItem>
              <SecondaryMenuItem onClick={() => navigate('SalesReports', {}, 'Sales reports')} className={activeView.name === 'SalesReports' ? 'active' : ''}>Reports</SecondaryMenuItem>
              <SecondaryMenuItem onClick={() => navigate('Customers', {}, 'Customers')} className={activeView.name === 'Customers' ? 'active' : ''}>Cutomers</SecondaryMenuItem>
            </SecondaryMenu>
          </SecondaryMenuContainer>
        )}</RootContext.Consumer>
    </>);
  }
}

export default SalesMenu;

