
// Helper function for generating new sale number/ purchase number
export function generateRecordNumber(prefix: string, num: number){
  let recordNum: string = '0000000000' + num;

  recordNum = recordNum.slice(-6);

  return prefix + recordNum;
}