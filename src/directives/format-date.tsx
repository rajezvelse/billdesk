import React from 'react'
import moment from 'moment';
import { formatDate } from '../utils';

const FormatDate: React.FC<{value: Date | undefined; format?: string}> = (props: any) => {

  return <span>{formatDate(props.value, props.format)}</span>;
}

export default FormatDate;