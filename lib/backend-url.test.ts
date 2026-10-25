/// <reference types="jest" />
import { parseBackendUrl } from './backend-url';

describe('parseBackendUrl', () => {
  it.each([
    ['http://192.168.1.10:4000', 'http://192.168.1.10:4000'],
    ['  http://localhost:4000  ', 'http://localhost:4000'],
    ['192.168.1.10:4000', 'http://192.168.1.10:4000'],
    ['http://10.0.2.2:4000/v2/', 'http://10.0.2.2:4000'],
    ['HTTPS://API.FennePlanner.com', 'https://api.fenneplanner.com'],
    ['https://api.fenneplanner.com:443', 'https://api.fenneplanner.com'],
    ['http://my-server.local:4000', 'http://my-server.local:4000'],
  ])('normalizes %s', (input, expected) => {
    expect(parseBackendUrl(input)).toEqual({ ok: true, url: expected });
  });

  it.each([
    ['', 'Enter the backend URL'],
    ['http://localhost', 'Include the port, for example http://192.168.1.10:4000'],
    ['ftp://192.168.1.10:4000', 'Use an http:// or https:// address'],
    ['http://:4000', 'Enter a valid hostname or IP address'],
    ['http://192.168.1.10:notaport', 'Enter a valid port number'],
    ['http://192.168.1.10:70000', 'Enter a valid port number'],
    ['http://192.168.1.10:0', 'Enter a valid port number'],
    ['ws://192.168.1.10:4000', 'Use an http:// or https:// address'],
    ['http://', 'Enter an address like http://192.168.1.10:4000'],
  ])('rejects %s', (input, message) => {
    expect(parseBackendUrl(input)).toEqual({ ok: false, message });
  });
});
