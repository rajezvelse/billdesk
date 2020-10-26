import styled from 'styled-components';
import { List } from '@material-ui/core';

export const ItemsList = styled(List)`
  li { 
    cursor: pointer; 
    border-bottom: 1px solid ${props => props.theme.palette.background.dropdownHover};
  }

  li:hover {
    background: ${props => props.theme.palette.background.dropdownHover};
    border-radius: 4px; 
  }

  li.selected {
    background: ${props => props.theme.palette.background.dropdownHover};
    border-radius: 4px; 
  }
`;
