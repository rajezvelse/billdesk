import React from 'react';
import styled from 'styled-components';
import { GridCenter } from './grids';
import { Paper, Grid, CircularProgress, Typography } from '@material-ui/core';
import ErrorOutlineIcon from '@material-ui/icons/ErrorOutline';

// Info box
const InfoPaper = styled(Paper)`
padding: ${props => props.theme.spacing(3)}px;
text-align: center;
`;

export const InfoBox: React.FC = (props) => <GridCenter>
  <Grid item xs={10} sm={7} md={3} lg={3}>
    <InfoPaper elevation={2}>
      {props.children}
    </InfoPaper>
  </Grid>
</GridCenter>;


// Loading info
const LoaderAnimation = styled(CircularProgress)`
margin-bottom: ${props => props.theme.spacing(2)}px;
`;

const LoaderText = styled(Typography)``;

export const InfoLoading: React.FC = (props) => <InfoBox>
  <LoaderAnimation />

  <LoaderText>{props.children}</LoaderText>
</InfoBox>;


// Error info
const Icon = styled(ErrorOutlineIcon)`
margin-bottom: ${props => props.theme.spacing(2)}px;
color: ${props => props.theme.palette.error.main};
font-size: ${props => props.theme.font.info};
`;

const Text = styled(Typography)` 
color: ${props => props.theme.palette.error.main};
`;

export const InfoError: React.FC = (props) => <InfoBox>
  <Icon />

  <Text>{props.children}</Text>
</InfoBox>;