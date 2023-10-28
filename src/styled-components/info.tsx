import React from 'react';
import styled from 'styled-components';
import { GridCenter } from './grids';
import { Paper, Grid, CircularProgress, Typography } from '@material-ui/core';
import ErrorOutlineIcon from '@material-ui/icons/ErrorOutline';
import ObjectType from '../types/object.type';

// Info box
const InfoPaper = styled(Paper)`
padding: ${props => props.theme.spacing(3)}px;
text-align: center;
`;

export const InfoBox: React.FC<ObjectType> = (props) => <GridCenter>
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

export const InfoLoading: React.FC<ObjectType> = (props) => <InfoBox>
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

export const InfoError: React.FC<ObjectType> = (props) => <InfoBox>
  <Icon />

  <Text>{props.children}</Text>
</InfoBox>;

export const ApiLoader = styled.div`
position: absolute;
top: 95px;
left: 50%;
z-index: 9999;
width: 90px;
margin-left: -45px;
background-color: #f3d60c;
padding: 2px 0px 5px;
border-radius: 2px;
text-align: center;
font-weight: 500;
box-shadow: ${props => props.theme.shadows[3]};

`;