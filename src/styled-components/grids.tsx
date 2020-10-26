import React from 'react';
import styled from 'styled-components';
import { Grid } from '@material-ui/core';

// Info box
const GridCenterStyle = styled(Grid)`
min-height: 80vh;
`;

export const GridCenter: React.FC = (props) => <GridCenterStyle container direction="row" justify="center" alignItems="center">
  {props.children}
</GridCenterStyle>;

export const GridFullHeight = styled(Grid)`
height: 100%;
`;
