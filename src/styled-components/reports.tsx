import  styled  from 'styled-components'
import { Tab, Tabs, Card, Button, Dialog, Divider } from '@material-ui/core'


export const ReportViews = styled(Tabs)`
border-bottom: 1px solid ${props => props.theme.palette.grey['300']};
`;

export const ReportViewTab = styled(Tab)`
text-transform: none;
min-height: 45px;
min-width: 120px;

&.Mui-selected {
  color: #f50057;
}

`;

export const ReportViewPaper = styled.div`
padding: 20px;
`;

export const ReportCard = styled(Card)`
color: #fff;
min-height: 120px;

& h5 {
  margin: 0;
  font-size: 1.5rem;
}

& p {
  margin: 0;
  margin-bottom: 0;
  margin-top: 5px;
  font-size: 0.88rem;
  font-weight: 400;
  line-height: 1.5;
  opacity: 0.6;
}

& p:last-child {
  margin-bottom: 0;
}
`;

export const ReportCardInfoBlue = styled(ReportCard)`
background-image: linear-gradient(to top, #46aef7 0%, #16d9e3 100%) !important;
`;

export const ReportCardBlue = styled(ReportCard)`
background-image: linear-gradient(to top, #4e4376 0%, #6e90a7 100%) !important;
`;

export const ReportCardGreen = styled(ReportCard)`
background-image: linear-gradient(to top, #15a86a 0%, #47ca9f 100%) !important;
`;

export const ReportCardPink = styled(ReportCard)`
background-image: linear-gradient(to top, #ff0844 0%, #ffb199 100%) !important;
`;

export const ReportChartCard = styled(Card)`
background-image: linear-gradient(to top,#87d4ea 0%,#f9f9f9 100%) !important;
padding: 50px 50px 0 50px;
margin-bottom: 30px;

`;

export const ReportChartCardVertical = styled(Card)`
background-image: linear-gradient(to right,#87d4ea 0%,#f9f9f9 100%) !important;
padding: 20px 20px 20px 20px;
margin-bottom: 30px;

`;

export const ReportChartContainer = styled.div`
position: relative;
width: 100%;
margin-top: 30px;

& .big-view-btn {
  position: absolute;
  top: 15px;
  right: 15px;
  z-index: 1
}
`;
export const ReportChartTitle = styled.div`
text-align: center;
font-size: 0.9rem;
text-decoration: underline dotted;
padding: 5px;
`;

export const ReportChartTitleSpaced = styled.div`
text-align: center;
font-size: 0.9rem;
text-decoration: underline dotted;
padding: 5px;
margin-bottom: 15px; 
`;

export const ReportChartNavLeft = styled.div`
display: inline-block;
position: absolute;
top: 0;
left: -50px;
margin-top: 140px;
`;

export const ReportChartNavRight = styled.div`
display: inline-block;
position: absolute;
top: 0;
right: -50px;
margin-top: 140px;
`;

export const ReportChartNavButton = styled(Button)`
margin: 0 10px;
color: #627982;

& .MuiButton-label {
  padding: 6px 0;
}
& .MuiSvgIcon-root {
  font-size: 2rem;
}
`;

export const ReportChartBigView = styled(Dialog)`
& .big-view-btn {
  position: absolute;
  top: 15px;
  right: 30px !important;
  z-index: 1
}
`;

export const ViewMoreButton = styled(Button)`
font-size: 11px;
text-transform: none;
padding: 6px 0;
text-decoration: underline;
color: #fafaffd1;

&:hover {
  background: transparent;
  color: #fff;
  text-decoration: underline;
}
`;

export const ReportDivider = styled(Divider)`
margin: 20px 0;
border: none;
background-color: transparent;
`;