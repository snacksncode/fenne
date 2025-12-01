import { getBaseUrl } from '@/api';
import { createConsumer } from '@rails/actioncable';

global.addEventListener = () => {};
global.removeEventListener = () => {};

let websocketUrl = `ws://${getBaseUrl()}/cable`;

const cable = createConsumer(websocketUrl);

export default cable;
