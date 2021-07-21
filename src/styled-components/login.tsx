import styled from 'styled-components';
import { Card, Link } from '@material-ui/core';

export const CardLogin = styled(Card)`
padding: ${props => props.theme.spacing(4)}px;
text-align: center;
`;

export const LoginLogo = styled.img`
width: 100%;
max-width: 200px;
height: auto;
`;

export const LoginOptionLink = styled(Link)`
margin-top: ${props => props.theme.spacing(1)}px;
`;