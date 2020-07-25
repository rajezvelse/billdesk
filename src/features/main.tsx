import React from 'react';
import { IconButton } from '@material-ui/core';
import {
  ImagedBackgroundDark, MainContentWrapper, TopNavContainer, TopNav,
  TopNavItem, TopNavLogo, TopNavTools, PageHeader, Footer,
  PageContainer, ProfileAvatar
} from '../styled-components';
import SettingsIcon from '@material-ui/icons/Settings';

import RootContext from '../root.context';

import mainLogo from '../assets/images/logo-h.png';

class Main extends React.Component {
  render() {
    return <>
      <RootContext.Consumer>
        {({ userInfo }) => (
          <ImagedBackgroundDark>
            <MainContentWrapper>
              {/* Top menu */}
              <TopNavContainer>
                <TopNavLogo><img src={mainLogo} /></TopNavLogo>
                <TopNav>
                  <TopNavItem>Dashboard</TopNavItem>
                  <TopNavItem>Purchase</TopNavItem>
                </TopNav>

                <TopNavTools>
                  <li>
                    <strong>KAVIMATHI AUTOMOBILES</strong>
                  </li>
                  <li>
                    <IconButton size="small" style={{ color: '#fff' }}>
                      <SettingsIcon color="inherit" />
                    </IconButton>
                  </li>
                  <li>
                    {userInfo && <ProfileAvatar variant={userInfo.avatar} size="small" outline="light" />}
                  </li>
                </TopNavTools>
              </TopNavContainer>
              <PageHeader>Dashboard</PageHeader>
              <PageContainer>asdas</PageContainer>
              <Footer>Billdesk</Footer>
            </MainContentWrapper>
          </ImagedBackgroundDark>
        )}
      </RootContext.Consumer>

    </>
  }
}

export default Main;