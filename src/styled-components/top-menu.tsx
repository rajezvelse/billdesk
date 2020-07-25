import styled from 'styled-components';
import { ButtonGroup, Button } from '@material-ui/core';

export const TopNavContainer = styled.nav`
  position: relative;
`;

export const TopNavLogo = styled.div`
  display: inline-block;
  width: auto;
  vertical-align: bottom;
  background-color: ${props => props.theme.palette.background.paper};
  img {
    height: 50px;
    width: auto;
    margin: 5px 25px;

  }
`;

export const TopNav = styled(ButtonGroup)`
  button:not(:last-child) {
    border-top-right-radius: 5px;
  }
  button:not(:first-child) {
    border-top-left-radius: 5px;
  }

`;

export const TopNavItem = styled(Button)`
    padding: 1.3rem 1rem 1.2rem 1rem;
    color: #4d4d4d;
    font-size: .775rem;
    font-weight: 400;
    min-width: 100px;
    text-align: center;
    margin-right: 1px;
    text-transform: uppercase;
    -webkit-border-radius: 5px 5px 0 0;
    -moz-border-radius: 5px 5px 0 0;
    border-radius: 5px 5px 0 0;
    background-color: ${props => props.theme.palette.background.paper};
    background-image: -webkit-gradient(linear, 0 0, 0 100%, from(#f2f2f2), color-stop(85%, #ffffff), to(#cccccc));
    background-image: -webkit-linear-gradient(#f2f2f2, #ffffff 85%, #cccccc);
    background-image: -moz-linear-gradient(top, #f2f2f2, #ffffff 85%, #cccccc);
    background-image: -o-linear-gradient(#f2f2f2, #ffffff 85%, #cccccc);
    background-image: linear-gradient(#f2f2f2, #ffffff 85%, #cccccc);
    background-repeat: no-repeat;
    white-space: nowrap;

&:hover {
    background: ${props => props.theme.palette.primary.main};
    background-image: unset;
    color: #fff;
}

`;

export const TopNavTools = styled.ul`
  list-style-type: none;
  display: inline-block;
  position: absolute;
  right: 0;
  margin: 0;
  margin-top: 10px;

  li {
    display: inline-block;
    vertical-align: middle;
    margin-right: 20px;
  }
`;
 

