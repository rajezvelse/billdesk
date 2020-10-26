import React from 'react'
import {formatCurrency } from '../utils'

const Currency: React.FC<{value: number;}> = (props: any) => {
  
return (<span>{formatCurrency(props.value)}</span>)
}

export default Currency;