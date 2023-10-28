import React from 'react';
import styled from 'styled-components';
import { Typography, Modal, Grid, Tooltip, TableHead as TH, Divider, Button } from '@material-ui/core';
import avatars from '../assets/images/avatars.jpg';
import DoubleArrowIcon from '@material-ui/icons/DoubleArrow';

const PFStyle = styled.div`
background-image: url(${avatars});
display: inline-block;
width: ${(props: any) => props.width}px;
height: ${(props: any) => props.height}px;
border-radius: 50%;
background-size: ${(props: any) => props.bgsize}px;
background-position-x: ${(props: any) => props.x.toString()}px;
background-position-y: ${(props: any) => props.y.toString()}px;
border: ${(props: any) => props.bordercolor ? ('2px solid ' + props.bordercolor) : 'none'};
`;


export const ProfileAvatar = (props: { variant: number; size?: 'small' | 'medium', outline?: 'dark' | 'light' }) => {
  const spaces = {
    small: {
      width: 39,
      height: 39,
      bgSize: 514,
      left: -7,
      top: -5,
      xSpace: 52,
      ySpace: 52
    },
    medium: {
      width: 76,
      height: 76,
      bgSize: 970,
      left: -12,
      top: -8,
      xSpace: 97,
      ySpace: 97
    }
  },
    outlineColors = {
      light: '#fff',
      dark: '#000000de'
    };

  let variant = props.variant, size = props.size || 'medium', metrics = spaces[size];

  let hMultiplier: any, yMultiplier: any;

  [yMultiplier, hMultiplier] = variant < 10 ? ['0', variant.toString()] : (variant / 10).toString().split('.');

  hMultiplier = parseInt(hMultiplier);
  yMultiplier = parseInt(yMultiplier);

  let avaProps = {
    x: metrics.left + -1 * (hMultiplier - 1) * metrics.xSpace,
    y: metrics.top + -1 * yMultiplier * metrics.ySpace,
    bordercolor: props.outline ? outlineColors[props.outline] : null,
    width: metrics.width,
    height: metrics.height,
    bgsize: metrics.bgSize
  };

  return <PFStyle {...avaProps} > </PFStyle>;
}


export const AvatarOutliner = styled.div`
`;

export const CardSectionTitle = styled(Typography)`
  margin: -16px -16px 15px -16px;
  padding: 16px;
  background-color: ${props => props.theme.palette.grey['300']};
  

  button {
    float: right;
    right: 15px;
  }
`;

export const SectionTitle = styled(Typography)`
margin-bottom: 15px;
padding-bottom: 15px;
border-bottom: 1px solid ${props => props.theme.palette.grey['300']};

button {
  float: right;
  right: 15px;
  margin-left: ${props => props.theme.spacing(2)}px;
  min-height: 32px;
}
`;

export const SubSection = styled.div`
  margin-bottom: ${props => props.theme.spacing(3)}px;
`;

export const SubSectionTitle = styled(Typography)`
  padding: 10px 0;

  button {
    float: right;
    right: 15px;
  }
  
`;

export const ScrollWrapper = styled.div`
  height: ${props => props.theme.viewport.pageContainerHeight - 110}px;
  overflow: auto;
  padding-right: 10px;
`;

export const StyledModal: any = styled(Modal)`
  width: 500px;
  margin-top: 10%;
  left: 50% !important;
  margin-left: -250px;

  .modal-content {
    padding: 20px 20px 40px 20px;
    background: #fff;
    border-radius: 5px;
    text-align: center;
  }

`;

export const WarningModalActions = styled.div`
  text-align: center;
  margin-top: ${props => props.theme.spacing(2)}px;

  button {
    margin-right: ${props => props.theme.spacing(2)}px;
  }
`;

const Row = styled.div`
  margin-bottom: ${props => props.theme.spacing(2)}px;
`;

export const DetailRow: any = styled((props: any) => <Row><Grid container spacing={2}>{props.children}</Grid></Row>)`
  
`;

export const DetailLabel: any = styled((props: any) => <Grid item {...props}>{props.children}</Grid>)`
  font-weight: bold;
  
  &:after {
    content: ':';
    float: right;
    font-weight: normal;
  }
`;

export const DetailLabelNormal: any = styled((props: any) => <Grid item {...props}>{props.children}</Grid>)`
  
  &:after {
    content: ':';
    float: right;
    font-weight: normal;
  }
`;

export const DetailValue: any = styled((props: any) => <Grid item {...props}>{props.children}</Grid>)``;

// Table related
export const TableFilterGrid = styled(Grid)`
  margin-bottom : ${props => props.theme.spacing(2)}px;
`;

export const TableHead = styled(TH)`
  background: ${props => props.theme.palette.primary.light};
`;

export const TableButtonsContainer = styled.div`
  button {
    margin-right: ${props => props.theme.spacing(1)}px;
    font-size: ${props => props.theme.font.smaller};
  }
`;

export const TooltipLight = styled(Tooltip)`
  
    // background-color:  ${props => props.theme.palette.common.white};
    // color: ${props => props.theme.palette.text.primary};
  
`;

export const TextRight = styled.span`
  text-align: right;
`;

export const RightAlignedTd = styled.td`
  text-align: right;
`;

export const NoBorderTd = styled.td`
  border: none !important;
`;

export const NoBorderTh = styled.th`
  border: none !important;
`;

export const NoBorderWhiteTh = styled(NoBorderTd)`
  background-color: #fff;
`;

export const DisplayCard = styled.div`
text-align: center;
font-weight: bold;
color: ${props => props.theme.palette.secondary.main};
font-size: ${props => props.theme.typography.h5.fontSize};
border: 1px dashed ${props => props.theme.palette.secondary.main};
padding: 20px

`;

export const SectionDivider = styled(Divider)`
margin-top: 1.5rem;
margin-bottom: 1.5rem;
`;

export const FilterDropdownButton = styled(Button)`
min-width: 200px;
text-align: left;
white-space: pre;
`;

export const DateRangeContainer = styled.div`
position: absolute;
z-index: 999;
`;

export const ColoredLabel: any = styled.span<{ variant: string }>`
color: ${props => props.theme.palette[props.variant]['main']};
`;

export const DoubleArrowIconBack = styled(DoubleArrowIcon)`
transform: rotate(180deg);
`;
