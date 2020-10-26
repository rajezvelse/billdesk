import React from 'react';

class ReactComponent<P, S> extends React.Component<P, S> {
  isUnmounted: boolean = false;

  constructor(props: P) {
    super(props);
  }

  componentDidMount() {
    this.isUnmounted = false;
  }

  componentWillUnmount() {
    this.isUnmounted = true;
  }

  setState = <K extends keyof S>(
    state: ((prevState: Readonly<S>, props: Readonly<P>) => (Pick<S, K> | S | null)) | (Pick<S, K> | S | null),
    callback?: () => void
  ): void => {

    if (!this.isUnmounted) {
      super.setState(state, callback);
    }
  };

}

export default ReactComponent;