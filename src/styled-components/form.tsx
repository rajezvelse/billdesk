import styled from 'styled-components';
import { FormControl as FC,  Button as BT, OutlinedInput } from '@material-ui/core';


export const Form = styled.form`
text-align: left;
`;

export const FormControl = styled(FC)`
margin-bottom: ${props => props.theme.spacing(2)}px;
`;

export const OutlinedInputSmall = styled(OutlinedInput)`
padding: 11px 14px;

.MuiInputAdornment-root {
  color: #7d7b7b;
}
.MuiOutlinedInput-input {
  padding: 0;
}
`;

export const Button = styled(BT)`
`;

export const ButtonFullWidth = styled(Button)`
width: 100%;
`

export const ValidationError = styled.div`
color: ${props => props.theme.palette.error.main};
font-size: ${props => props.theme.font.small};
margin-top: ${props => props.theme.spacing(1)}px;
`;