import styled from 'styled-components';
import { FormControl as FC, Button as BT, OutlinedInput, Select } from '@material-ui/core';
import { Autocomplete as AC } from '@material-ui/lab';


export const Form = styled.form`
text-align: left;
`;

export const FormContent = styled.div`
  padding-top: ${props => props.theme.spacing(2)}px;
`

export const FormActions = styled.div`
  margin-top: ${props => props.theme.spacing(2)}px;
  text-align: right;

  button {
    margin-right: ${props => props.theme.spacing(2)}px;
  }
`;

export const FormControl: any = styled(FC)`
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

export const Autocomplete: any = styled(AC)`
  &.error {
    .MuiInputLabel-root {
      color:  ${props => props.theme.palette.error.main};
    }

    .MuiOutlinedInput-notchedOutline {
      border-color:  ${props => props.theme.palette.error.main};
    }

  }
`;

export const BranchSelectionDropdown: any = styled(Select)`
    display: inline-block;
    margin-left: 5px;
    color:  #fff;
    top: 5px;

    &:after, &:before{
      display: none
    }

  .MuiSelect-icon {
    color:  #fff;
  }

  .MuiSelect-select {
    padding-top: 0;
    padding-bottom: 0;
    font-weight: bold;
  }

  .MuiOutlinedInput-root {
    border:  none;
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

export const RequiredAstrix = styled.span`
&:after {
  content:" *";
  color: ${props => props.theme.palette.error.main};
}
`;

export const ColonAtRight = styled.div`
&:after {
  content:" :";
  float: right;
}
`;

export const SelectSmall = styled(Select)`
width: 100%;

& .MuiSelect-root {
  padding: 10.5px 14px;
  padding-right: 32px;
}
`;