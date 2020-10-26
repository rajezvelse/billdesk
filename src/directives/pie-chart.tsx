import React from 'react';
import ReactComponent from '../react-component'
import RootContext from '../root.context'
import uniqueId from 'lodash/uniqueId';
import { PieChartProps, PieChart as Chart, Pie, Cell, Tooltip as ChartTooltip, Legend } from 'recharts'

import {
  ReportChartContainer, ReportChartBigView
} from '../styled-components'
import { formatCurrency } from '../utils'

import IconButton from '@material-ui/core/IconButton';
import FullscreenIcon from '@material-ui/icons/Fullscreen';
import HighlightOffIcon from '@material-ui/icons/HighlightOff';

class PieChart extends ReactComponent<PieChartProps, any> {
  COLORS = ['#71bfb7', '#4a99d3', '#3d66ae', '#59519f', '#633087', '#9c1e81', '#e12560', '#e7631c', '#ebbc01', '#b2da0e'];
  id: string = uniqueId();

  constructor(props: PieChartProps) {
    super(props);

    this.state = {
      data: this.props.data,
      bigView: false
    }
  }

  componentDidUpdate(prevProps: PieChartProps) {
    if (JSON.stringify(prevProps.data) !== JSON.stringify(this.props.data)) {
      this.setState({ data: this.props.data })
    }
  }

  onPieEnter = () => {

  }

  render() {
    return (<>

      {this.state.data && <div>
        <ReportChartContainer>
          <IconButton type="button" className="big-view-btn" onClick={() => this.setState({ bigView: true })}><FullscreenIcon /> </IconButton>

          <Chart width={400} height={300} onMouseEnter={this.onPieEnter}>
            <Legend verticalAlign="middle" align="right" layout="vertical" />

            <Pie
              cx={130}
              cy={150}
              innerRadius={50}
              outerRadius={130}
              fill="#8884d8"
              paddingAngle={3}
              dataKey="value"
              data={this.state.data}
            >
              {
                this.state.data.map((entry: any, index: number) =>
                  <Cell key={uniqueId()} fill={this.COLORS[index % this.COLORS.length]} />)
              }
            </Pie>

            <ChartTooltip
              cursor={{ fill: '#87d4ea' }}
              formatter={(value: any) => formatCurrency(value)} />

          </Chart>

        </ReportChartContainer>


        <ReportChartBigView fullScreen open={this.state.bigView}
          onClose={() => this.setState({ bigView: false })}>
          <ReportChartContainer>
            <IconButton type="button" className="big-view-btn" onClick={() => this.setState({ bigView: false })}><HighlightOffIcon /> </IconButton>

            <Chart width={window.screen.width - 200} height={window.screen.height - 150} onMouseEnter={this.onPieEnter}>
              <Legend verticalAlign="middle" align="right" layout="vertical" />

              <Pie
                cx={(window.screen.width - 200) / 3}
                cy={((window.screen.height - 200) / 2)}
                innerRadius={100}
                outerRadius={(window.screen.height - 200) / 2}
                fill="#8884d8"
                paddingAngle={3}
                dataKey="value"
                data={this.state.data}
              >
                {
                  this.state.data.map((entry: any, index: number) =>
                    <Cell key={uniqueId()} fill={this.COLORS[index % this.COLORS.length]} />)
                }
              </Pie>

              <ChartTooltip
              cursor={{ fill: '#87d4ea' }}
              formatter={(value: any) => formatCurrency(value)} />

            </Chart>

          </ReportChartContainer>
        </ReportChartBigView>
      </div>

      }
    </>
    );
  }

}

PieChart.contextType = RootContext;

export default PieChart;

