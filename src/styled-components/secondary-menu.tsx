import styled from 'styled-components';

import { ButtonGroup, Button } from '@material-ui/core';

export const SecondaryMenuContainer = styled.div`
  position: relative
`;

export const SecondaryMenuTitle = styled.div`
  display: inline-block;
  padding: 15px;
  min-width: 196px;
`;

export const SecondaryMenu = styled(ButtonGroup)`
  position: relative;
  padding-top: 6px;

  button:not(:last-child) {
    border-top-right-radius: 5px;
  }
  button:not(:first-child) {
    border-top-left-radius: 5px;
  }
`;

export const SecondaryMenuItem = styled(Button)`
  padding: 0.7rem;
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

  &:hover  {
    background-image: -webkit-gradient(linear, 0 0, 0 100%, from(#c6d0e0), color-stop(85%, #ffffff), to(#cccccc));
    background-image: -webkit-linear-gradient(#c6d0e0, #8e8b8b 85%, #cccccc);
    background-image: -moz-linear-gradient(top, #c6d0e0, #ffffff 85%, #cccccc);
    background-image: -o-linear-gradient(#c6d0e0, #ffffff 85%, #cccccc);
    background-image: linear-gradient(#c6d0e0, #ffffff 85%, #cccccc);
  }

  &.active {
    background-image: unset;
    background-color: ${props => props.theme.palette.background.paper};
  }

`;