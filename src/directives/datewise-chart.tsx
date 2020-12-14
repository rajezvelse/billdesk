import React, { useState, useEffect } from 'react';
import {
  ReportChartContainer, ReportChartTitle,
  ReportChartNavLeft, ReportChartNavRight, ReportChartNavButton
} from '../styled-components';

import ArrowBackIosIcon from '@material-ui/icons/ArrowBackIos';
import ArrowForwardIosIcon from '@material-ui/icons/ArrowForwardIos';

import { BarChart, Bar, XAxis, YAxis, Tooltip as ChartTooltip, Legend, ResponsiveContainer } from 'recharts';

import { formatCurrency } from '../utils';

import moment from 'moment';

const DatewiseChart: React.FC<{ title: string; data: any, dataKeys: {[key: string]: string; } }> = (props: { title: string; data: any, dataKeys: {[key: string]: string; }}): any => {

  const [interval, setInterval] = useState<string>('days');
  const [data, setData] = useState<any[]>([]);
  const [pageData, setPageData] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);

  let dataKeyLabels: string[] = Object.keys(props.dataKeys);

  let pageLimit: number = 20;

  useEffect(() => {

    let newInterval: string = props.data.interval;

    let newData: any[] = props.data.records.map((r: any) => {
     let obj: any = {
        label: moment(r.date, newInterval === 'days' ? 'YYYY-MM-DD' : 'YYYY-MM').format(newInterval === 'days' ? 'DD-MMM' : 'MMM-YYYY'),
        labelFull: moment(r.date, newInterval === 'days' ? 'YYYY-MM-DD' : 'YYYY-MM').format(newInterval === 'days' ? 'DD-MMM-YYYY' : 'MMM-YYYY')
      };

      obj[dataKeyLabels[0]] = r[props.dataKeys[dataKeyLabels[0]]];
      obj[dataKeyLabels[1]] = r[props.dataKeys[dataKeyLabels[1]]];

      return obj;
    });

    setInterval(newInterval);
    setData(newData);
    setPageData(newData.slice(0, pageLimit));
    setCurrentPage(1);
    setTotalPages(Math.ceil(newData.length / pageLimit));
  }, [props.data]);

  let nextPage = () => {
    if (currentPage >= totalPages) return;

    setPageData(data.slice((currentPage + 1) * pageLimit - pageLimit, (currentPage + 1) * pageLimit));
    setCurrentPage(currentPage + 1)
  },
    prevPage = () => {
      if (currentPage <= 1) return;

      setPageData(data.slice((currentPage - 1) * pageLimit - pageLimit, (currentPage - 1) * pageLimit));
      setCurrentPage(currentPage - 1)
    };


  return <ReportChartContainer>
    <ReportChartTitle>{props.title}</ReportChartTitle>

    {(totalPages > 1 && currentPage > 1) && <ReportChartNavLeft>
      <ReportChartNavButton type="button" onClick={() => prevPage()}><ArrowBackIosIcon /> </ReportChartNavButton>
    </ReportChartNavLeft>}

    <ResponsiveContainer min-width={300} height={300} >
      <BarChart data={pageData}
        margin={{ top: 10, right: 30, bottom: 0 }} barSize={20}>

        <Legend verticalAlign="top" align="right" height={36} />

        <XAxis dataKey="label" axisLine={false} tick={{ strokeWidth: 0, fontSize: 12 }} tickLine={false} tickSize={20} height={36} orientation="top" />
        <YAxis axisLine={false} tick={{ strokeWidth: 1, fontSize: 12 }} tickLine={false} tickSize={5} width={110} tickFormatter={formatCurrency} />

        <ChartTooltip
          cursor={{ fill: '#87d4ea' }}
          formatter={(value: any) => formatCurrency(value)}
          labelFormatter={(label: any) => moment(label, interval === 'days' ? 'DD-MMM' : 'MMM-YYYY')
            .format(interval === 'days' ? 'LL' : 'MMMM YYYY')} />

        <Bar dataKey={dataKeyLabels[0]} fill="#8884d8" />
        <Bar dataKey={dataKeyLabels[1]} fill="#82ca9d" />
      </BarChart>
    </ResponsiveContainer>

    {(totalPages > 1 && currentPage < totalPages) && <ReportChartNavRight>
      <ReportChartNavButton type="button" onClick={() => nextPage()}><ArrowForwardIosIcon /> </ReportChartNavButton>
    </ReportChartNavRight>}

  </ReportChartContainer>
}

export default DatewiseChart;