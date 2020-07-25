import styled from 'styled-components';
import bgDark from '../assets/images/bg-dark.jpeg';

export const ImagedBackgroundDark = styled.div`

background: linear-gradient(-155deg, #1177be 5%, #1da8df 70%, #1baec7 100%);
background-image: url(${bgDark});
min-height: 100vh;
position: relative;
background-attachment: fixed;
background-size: cover;
color: #fff;

`;