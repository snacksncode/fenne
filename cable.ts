import { createConsumer } from '@rails/actioncable';

global.addEventListener = () => {};
global.removeEventListener = () => {};

let websocketUrl = 'ws://127.0.0.1:3000/cable';

const cable = createConsumer(websocketUrl);

export default cable;
