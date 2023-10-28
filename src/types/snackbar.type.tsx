
export interface SnackbarMessageType {
  message: string;
  key: number;
}

export interface SnackbarContextType {
  open: boolean;
  snackPack: SnackbarMessageType[];
  messageInfo?: SnackbarMessageType;
}

export interface WithSnackbarProps {
  enqueueSnackbar: (...args: any) => void
  closeSnackbar?: (...args: any) => void
}
