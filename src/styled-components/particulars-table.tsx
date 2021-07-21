import styled from 'styled-components';
import { TextField, Select } from '@material-ui/core';
import { Autocomplete } from './form';

export const ParticularsTable = styled.table`
  width: 100%;
  border-collapse: collapse;

  & th {
    padding: 10px 15px;
    text-align: center;
    border: 1px dashed ${props => props.theme.palette.grey['500']};
    font-size: ${props => props.theme.typography.body2.fontSize};
  }
  & td {
    padding: 10px 15px;
    border: 1px dashed ${props => props.theme.palette.grey['500']};
    font-size: ${props => props.theme.typography.body2.fontSize};
  }
`;

export const ParticularsTextField = styled(TextField)`
  width: 150px;

  & .MuiOutlinedInput-adornedStart {
    padding-left: 12px;
  }

  & input {
    padding: 8px 12px;
    font-size: ${props => props.theme.typography.body2.fontSize};  
  }

  & input.MuiInputBase-inputAdornedStart {
    padding-left: 0;
  }

  & .MuiTypography-root {
    font-size: ${props => props.theme.typography.body2.fontSize};
  }

  & .MuiInputBase-root.Mui-disabled {
    background-color: ${props => props.theme.palette.grey['100']};
  }
`;

export const ParticularsQtyField = styled(ParticularsTextField)`
width: 100px;

input {
  padding-right: 0;
}

`;

export const ParticularsDiscountField = styled(ParticularsTextField)`
width: 100px;
`;

export const ParticularsAutoComplete = styled(Autocomplete)`
  min-width: 300px;

  & .MuiInputBase-root {
    padding: 4px 6px;
  }

  & input {
    font-size: ${props => props.theme.typography.body2.fontSize};
  }
`;

export const ParticularsTableSelect = styled(Select)`
width: 150px;

& .MuiSelect-root {
  padding: 8px 12px;
  padding-right: 32px;
  font-size: ${props => props.theme.typography.body2.fontSize};

}
`;