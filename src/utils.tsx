
import moment from 'moment'

// Number to currency
export const formatCurrency = (value: number): string => {
  if(value === null || value === undefined) return '₹ 0';
  
  let converted: string = parseFloat(value.toString()).toFixed(2).replace(/(\d)(?=(\d{2})+\d\.)/g, '$1,');
  return '₹ ' + converted;

}

// Date object to string
export const formatDate = (value: Date | undefined, format?: string) => {
  if(!value) return '-';

  let converted: string = moment(value).format(format || 'DD/MM/YYYY');

  return converted;
}