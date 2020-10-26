
interface ActivityProps {
	name: string;
	props: { [k: string]: any };
  authenticated?: boolean;
  prevState?: any;
}

export default ActivityProps;
