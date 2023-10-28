
import { enqueueSnackbar, closeSnackbar } from 'notistack'
import React from 'react';

const withSnackbar = (Comp: any) => {
  // Comp.props['enqueueSnackbar'] = enqueueSnackbar
  let M = (props: any) => <Comp enqueueSnackbar={enqueueSnackbar} {...props}></Comp>

  return M
}

export default withSnackbar;