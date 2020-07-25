import React from "react";
import { ActivityProps, ObjectType } from "../types";
import * as features from "../features";
import RootContext from '../root.context';
import { InfoError } from '../styled-components';

class Activity extends React.Component<ActivityProps> {
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
						{/* Validate authentication */}
						{'authenticated' in this.props && this.props.authenticated !== false ?
							<>
								{this.isAuthenticated() ?
									<Feature {...this.props.props} />

									// Redirect to login if not authenticated
									: (() => {
										let Login = this.getFeature('Login');
										return <Login />
									})()
								}
							</> :
							// Render no auth features
							<Feature {...this.props.props} />
						}

					</>

					: <InfoError>Not found</InfoError>
			}
		</>;
	}
}

Activity.contextType = RootContext;

export default Activity;
