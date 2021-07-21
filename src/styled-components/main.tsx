import styled from 'styled-components';

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
  padding: 0;
  color: #fff;
  border-radius: 0 5px 0 0;
`;

export const PageHeaderTitle = styled.div`
  padding: 15px;
`;

export const PageContainer = styled(Position)`
  top: 109px;
  bottom: 42px;
  background: #fff; 
  color: ${props => props.theme.palette.text.primary};
  overflow: auto;
  padding: ${props => props.theme.spacing(3)}px ${props => props.theme.spacing(5)}px;
`;

export const DropdownMenu = styled.div`
  position: relative;
  
  ul {
    display: none;
    position: absolute;
    right: -10px;
    background-color: #fff;
    min-width: 160px;
    box-shadow: 0px 8px 8px 0px rgba(0,0,0,0.4);
    z-index: 1;
    color: black;
    border-radius: 4px;
    list-style-type: none;
    padding: 10px 0;
    font-size: ${props => props.theme.font.small};
  }
  ul li  {
    border: none;
    background: none;
    padding: 5px 15px;
    cursor: pointer;
    margin: 0;
    display: block;
  }

  ul li:hover {
    background-color: ${props => props.theme.palette.background.dropdownHover};
  }

  &:hover ul {
    display: block;
  }
`;
