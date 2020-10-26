
export interface SnackbarMessageType {
  message: string;
  key: number;
}

export interface SnackbarContextType {
  open: boolean;
  snackPack: SnackbarMessageType[];
  messageInfo?: SnackbarMessageType;
}
