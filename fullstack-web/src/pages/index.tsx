import { withUrqlClient } from 'next-urql';
import { Navbar } from '../components/Navbar';
import { createUrqlClient } from '../utils/createUqrlClient';

const Index = () => (
  <>
    <Navbar />
    <div>hello world</div>
  </>
);

// This sets up provider on Index. { ssr: true } activates server side rendering!
export default withUrqlClient(createUrqlClient, { ssr: true })(Index);
