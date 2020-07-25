import React from 'react';
import styled from 'styled-components';
import { Avatar, } from '@material-ui/core';
import avatars from '../assets/images/avatars.jpg';

const PFStyle = styled.div`
background-image: url(${avatars});
display: inline-block;
width: ${(props: any) => props.width}px;
height: ${(props: any) => props.height}px;
border-radius: 50%;
background-size: ${(props: any) => props.bgSize}px;
background-position-x: ${(props: any) => props.x.toString()}px;
background-position-y: ${(props: any) => props.y.toString()}px;
border: ${(props: any) => props.borderColor ? ('2px solid ' + props.borderColor) : 'none'};
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
    borderColor: props.outline ? outlineColors[props.outline] : null,
    width: metrics.width,
    height: metrics.height,
    bgSize: metrics.bgSize
  };

  return <PFStyle {...avaProps} > </PFStyle>;
}


export const AvatarOutliner = styled.div`
`;