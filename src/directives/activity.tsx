import React from "react";
import ReactComponent from '../react-component';
import { ActivityProps, ObjectType } from "../types";
import * as features from "../features";
import RootContext from '../root.context';
import { InfoError } from '../styled-components';

class Activity extends ReactComponent<ActivityProps, any> {
  getFeature = (name: string) => {
    return (features as ObjectType)[name];
  }

  isAuthenticated = (): boolean => {
    return this.context.userInfo instanceof Object;
  }

  render() {
    let Feature = this.getFeature(this.props.name);

    return <>
      {
        Feature ?
          <>
            {/* Check the Application is locked */}
            {this.context.locked ?
              (() => {
                let Login = this.getFeature('Login');
                return <Login />
              })() :
              <>
                {'authenticated' in this.props && this.props.authenticated === false ?
                  // Render no auth features
                  <Feature {...this.props.props} prevState={this.props.prevState || undefined} /> :

                  <>
                    {/* Validate authentication */}
                    {this.isAuthenticated() ?
                      <Feature {...this.props.props} prevState={this.props.prevState || undefined} />

                      // Redirect to login if not authenticated
                      : (() => {
                        let Login = this.getFeature('Login');
                        return <Login />
                      })()
                    }
                  </>

                }
              </>}
          </>

          : <InfoError>Not found</InfoError>
      }
    </>;
  }
}

Activity.contextType = RootContext;

export default Activity;
