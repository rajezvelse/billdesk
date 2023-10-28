import React from "react";
import ReactComponent from '../react-component';
import RootContext from '../root.context';
import { ObjectType, RootContextType } from "../types";

class IsGranted extends ReactComponent<{ permissions: string[]; anyOne?: boolean; } & ObjectType, any> {
  context: any;

  render() {
    let userPermissions: string[] = !this.context.userInfo ? [] :
      !(this.context.userInfo.role instanceof Object && this.context.userInfo.role.permissions instanceof Array) ? [] :
        this.context.userInfo.role.permissions;

    let matchCount: number = 0;

    this.props.permissions.forEach((value: string) => {
      if (userPermissions.indexOf(value) >= 0) matchCount += 1;
    });


    if (this.props.anyOne)
      return (
        this.props.permissions.length && matchCount > 0 ?
          <>{this.props.children}</>
          : <></>
      );
    else
      return (
        this.props.permissions.length === matchCount ?
          <>{this.props.children}</>
          : <></>
      );
  }
}

IsGranted.contextType = RootContext;

export default IsGranted;