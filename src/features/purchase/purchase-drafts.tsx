import React from 'react'
import ReactComponent from '../../react-component'

import { IpcRendererEvent } from "electron";
import RootContext from '../../root.context';

import uniqueId from 'lodash/uniqueId';
import { InfoError, DraftsDrawerContainer, CardSectionTitle, ItemsList } from '../../styled-components';
import { CardContent, ListItem, ListItemText } from '@material-ui/core';
import { FormatDate } from '../../directives';

class PurchaseDrafts extends ReactComponent<any, {
  drafts: any[];
  loadError: null | string;
}> {
  constructor(props: any) {
    super(props);

    this.state = {
      drafts: [],
      loadError: null
    }
  }

  componentDidMount() {
    super.componentDidMount();

    this.loadDrafts();
  }

  onDraftSelect = (index: number) => {
    this.props.onClose(this.state.drafts[index].id);
  }

  loadDrafts = () => {
    this.context.electronIpc.once("getPurchaseDraftsResponse", (event: IpcRendererEvent, status: number, response: any) => {
      this.context.setLoading(false);

      // On fail
      if (status !== 200) {
        console.log(response)

        this.setState({ loadError: response });
        return;
      }

      this.setState({ drafts: response, loadError: null });
    });

    this.context.setLoading(true);
    this.context.electronIpc.send("getPurchaseDrafts");
  }

  render() {
    return (<>

      {this.state.loadError ? <InfoError>{this.state.loadError}</InfoError> : <>
        <DraftsDrawerContainer>

          <CardContent>
            <CardSectionTitle gutterBottom variant="h5">Purchase drafts</CardSectionTitle>

            <ItemsList>
              {this.state.drafts.map((draft: any, index: any) =>
                <ListItem key={uniqueId()} onClick={() => this.onDraftSelect(index)}>
                  <ListItemText primary={draft.vendor.name} secondary={<FormatDate value={draft.date} format={'DD/MM/YYYY, hh:mm a'} />}></ListItemText>
                </ListItem>
              )}
            </ItemsList>

          </CardContent>

        </DraftsDrawerContainer>
      </>}

    </>);
  }
}

PurchaseDrafts.contextType = RootContext;

export default PurchaseDrafts;

