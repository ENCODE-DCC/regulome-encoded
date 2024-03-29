import React from 'react';
import ReactDOM from 'react-dom';
import ReactDOMServer from 'react-dom/server';
import { getRenderedProps } from '../app';
import App from '..';


// App calls Browserfeat to act on the DOM, so prevent that functionality as we have no DOM.
jest.mock('../browserfeat');


describe('Server rendering', () => {
    let document;
    const homeUrl = 'http://localhost/regulome-search';
    const home = {
        '@id': '/regulome-search',
        '@type': ['regulome-search'],
        portal_title: 'RegulomeDB Search – RegulomeDB',
        title: 'RegulomeDB Search',
        query_coordinates: [],
        total: 0,
        variants: [],
        notifications: {
            Failed: 'Received 0 region queries. Exact one region or one variant can be processed by regulome-search',
        },
    };

    beforeEach(() => {
        const serverApp = <App context={home} href={homeUrl} styles="/static/build/style.css" />;
        const markup = `<!DOCTYPE html>\n${ReactDOMServer.renderToString(serverApp)}`;
        const parser = new DOMParser();
        document = parser.parseFromString(markup, 'text/html');
        window.location.href = homeUrl;
    });

    test('renders the application to html', () => {
        expect(document.title).toEqual(home.portal_title);
    });

    test('react render http-equiv correctly', () => {
        const metaHttpEquiv = document.querySelectorAll('meta[http-equiv]');
        expect(metaHttpEquiv).not.toHaveLength(0);
    });

    test('mounts the application over the rendered html', () => {
        let domNode;
        const props = getRenderedProps(document);
        ReactDOM.hydrate(<App {...props} domReader={(node) => { domNode = node; }} />, document);
        expect(domNode).toBe(document.documentElement);
    });
});
