import styled from 'styled-components';
import { } from '@material-ui/core';

export const MainContentWrapper = styled.div`
  padding: 0 15px 15px 15px;
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
`;

const Position = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  margin: 0 15px;

`;

export const Footer = styled(Position)`
  bottom: 8px;
  background-color: ${props => props.theme.palette.primary.main};
  padding: 8px 16px;
  color: #fff;
  border-radius: 0 0 5px 5px;
`;

export const PageHeader = styled(Position)`
  top: 60px;
  background-color: ${props => props.theme.palette.primary.main};
  padding: 16px;
  color: #fff;
  border-radius: 0 5px 0 0;
`;

export const PageContainer = styled(Position)`
  top: 110px;
  bottom: 42px;
  background: #fff; 
  color: ${props => props.theme.palette.text.primary};
  overflow: auto;
  padding: ${props => props.theme.spacing(2)}px;
`;

