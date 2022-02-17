import React from 'react';
import PropTypes from 'prop-types';
import url from 'url';
import * as globals from './globals';

// Display information on page as JSON formatted data
export class DisplayAsJson extends React.Component {
    constructor() {
        super();

        // Bind this to non-React methods.
        this.onClick = this.onClick.bind(this);
    }

    onClick() {
        const urlComponents = url.parse(this.context.location_href);
        if (urlComponents.query !== null) {
            window.location.href += '&format=json';
        } else {
            window.location.href += '?format=json';
        }
    }

    render() {
        return (
            <button className="convert-to-json" title="Convert page to JSON-formatted data" aria-label="Convert page to JSON-formatted data" onClick={this.onClick}>&#123; ; &#125;</button>
        );
    }
}

DisplayAsJson.contextTypes = {
    location_href: PropTypes.string,
};

export function shadeOverflowOnScroll(e) {
    // shading element that indicates there is further to scroll down
    const bottomShading = e.target.parentNode.getElementsByClassName('shading')[0];
    if (bottomShading) {
        if (e.target.scrollHeight - e.target.scrollTop === e.target.clientHeight) {
            bottomShading.classList.add('hide-shading');
        } else {
            bottomShading.classList.remove('hide-shading');
        }
    }

    // shading element that indicates there is further to scroll up
    const topShading = e.target.parentNode.getElementsByClassName('top-shading')[0];
    if (topShading) {
        if (e.target.scrollTop > 0) {
            topShading.classList.remove('hide-shading');
        } else {
            topShading.classList.add('hide-shading');
        }
    }
}


// Do a search of an arbitrary query string passed in the `query` parameter, and return a promise.
// If, for whatever reason, no results could be had, an empty object gets returned from the
// promise.
export function requestSearch(query) {
    return fetch(`https://www.encodeproject.org/search/?${query}`, {
        method: 'GET',
        headers: {
            Accept: 'application/json',
        },
    }).then((response) => {
        // Convert the response to JSON.
        if (response.ok) {
            return response.json();
        }
        return Promise.resolve(null);
    }).then(responseJson => responseJson || {});
}


// Do a search of the specific objects whose @ids are listed in the `atIds` parameter. Because we
// have to specify the @id of each object in the URL of the GET request, the URL can get quite
// long, so if the number of `atIds` @ids goes beyond the `chunkSize` constant, we break thev
// searches into chunks, and the maximum number of @ids in each chunk is `chunkSize`. We
// then send out all the search GET requests at once, combine them into one array of
// files returned as a promise.
//
// You can also supply an array of objects in the filteringObjects parameter. Any file @ids in
// `atIds` that matches an object['@id'] in `filteringObjects` doesn't get included in the GET
// request.
//
// Note: this function calls `fetch`, so you can't call this function from code that runs on the
// server or it'll complain that `fetch` isn't defined. If called from a React component, make sure
// you only call it when you know the component is mounted, like from the componentDidMount method.
//
// atIds: array of file @ids.
// uri: Base URI specifying the type and statuses of the objects we want to get. The list of object
//      @ids gets added to this URI.
// filteringObjects: Array of files to filter out of the array of file @ids in the fileIds parameter.
export function requestObjects(atIds, uri, filteringObjects) {
    const chunkSize = 100; // Maximum # of files to search for at once
    const filteringFileIds = {}; // @ids of files we've searched for and don't need retrieval
    let filteredObjectIds = {}; // @ids of files we need to retrieve

    // Make a searchable object of file IDs for files to filter out of our list.
    if (filteringObjects && filteringObjects.length) {
        filteringObjects.forEach((filteringObject) => {
            filteringFileIds[filteringObject['@id']] = filteringObject;
        });

        // Filter the given file @ids to exclude those files we already have in data.@graph,
        // just so we don't use bandwidth getting things we already have.
        filteredObjectIds = atIds.filter(atId => !filteringFileIds[atId]);
    } else {
        // The caller didn't supply an array of files to filter out, so filtered files are just
        // all of them.
        filteredObjectIds = atIds;
    }

    // Break fileIds into an array of arrays of <= `chunkSize` @ids so we don't generate search
    // URLs that are too long for the server to handle.
    const objectChunks = [];
    for (let start = 0, chunkIndex = 0; start < filteredObjectIds.length; start += chunkSize, chunkIndex += 1) {
        objectChunks[chunkIndex] = filteredObjectIds.slice(start, start + chunkSize);
    }

    // Going to send out all search chunk GET requests at once, and then wait for all of them to
    // complete.
    return Promise.all(objectChunks.map((objectChunk) => {
        // Build URL containing file search for specific files for each chunk of files.
        const objectUrl = uri.concat(objectChunk.reduce((combined, current) => `${combined}&${globals.encodedURIComponent('@id')}=${globals.encodedURIComponent(current)}`, ''));
        return fetch(objectUrl, {
            method: 'GET',
            headers: {
                Accept: 'application/json',
            },
        }).then((response) => {
            // Convert each response response to JSON
            if (response.ok) {
                return response.json();
            }
            return Promise.resolve(null);
        });
    })).then((chunks) => {
        // All search chunks have resolved or errored. We get an array of search results in
        // `chunks` -- one per chunk. Now collect their files from their @graphs into one array of
        // files and return them as the promise result.
        if (chunks && chunks.length) {
            return chunks.reduce((objects, chunk) => (chunk && chunk['@graph'].length ? objects.concat(chunk['@graph']) : objects), []);
        }

        // Didn't get any good chucks back, so just return no results.
        return [];
    });
}


// Do a search of the specific files whose @ids are listed in the `fileIds` parameter.
//
// You can also supply an array of objects in the filteringFiles parameter. Any file @ids in
// `atIds` that matches an object['@id'] in `filteringFiles` doesn't get included in the GET
// request.
//
// Note: this function calls requestObjects which calls `fetch`, so you can't call this function
// from code that runs on the server or it'll complain that `fetch` isn't defined. If called from a
// React component, make sure you only call it when you know the component is mounted, like from
// the componentDidMount method.
//
// fileIds: array of file @ids.
// filteringFiles: Array of files to filter out of the array of file @ids in the fileIds parameter.
export function requestFiles(fileIds, filteringFiles) {
    return requestObjects(fileIds, 'https://www.encodeproject.org/search/?type=File&limit=all&status!=deleted&status!=revoked&status!=replaced', filteringFiles);
}
