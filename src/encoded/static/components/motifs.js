import React from 'react';
import PropTypes from 'prop-types';
import * as logos from '../libs/d3-sequence-logo'; // This is for local development when changes are needed to d3-sequence-logo.

// Convert PWM file into JavaScript object
// Input "str" consists of PWM file
// Each row corresponds to a position in the motif
// The farthest left column is an index (no important nucleotide information)
// The next three columns describe the frequency of occurrence of each nucleotide
// Columns correspond from left to right to nucleotides A, C, G, and T
function convertTextToObj(str) {
    // Split the file by row and create a new object
    // The new object has an element corresponding to each row and each element is an array of the entries in that row, split by tab (the PWM file is tab-delineated)
    const cells = str.split('\n').map(el => el.split(/\s+/));
    const obj = [];
    // Create a new object without the index or rows that contain comments or unnecessary information and convert the frequency values from strings to numbers
    cells.forEach((cell) => {
        if (cell.length === 6) {
            obj.push([+cell[1], +cell[2], +cell[3], +cell[4]]);
        }
    });
    // We will use "obj" to create the logos because it has all the important nucleotide frequency information from the PWM file
    return obj;
}

// Fetch PWM file
export function getMotifData(pwmLink, fetch) {
    return fetch(pwmLink, {
        method: 'GET',
        headers: {
            Accept: 'application/json',
        },
    }).then((response) => {
        if (response.ok) {
            return response.text();
        }
        throw new Error('not ok');
    }).catch((e) => {
        console.log('OBJECT LOAD ERROR: %s', e);
    });
}

// Display information on page as JSON formatted data
export class Motifs extends React.Component {
    constructor() {
        super();

        this.drawMotifs = this.drawMotifs.bind(this);
        this.addMotifElement = this.addMotifElement.bind(this);
    }

    componentDidMount() {
        require.ensure(['d3', 'd3-sequence-logo'], (require) => {
            if (this.chartdisplay) {
                this.d3 = require('d3');
                this.sequenceLogos = logos; // require('d3-sequence-logo'); // logos This is for local development when changes are needed to d3-sequence-logo.
                const targetElement = this.chartdisplay;
                this.drawMotifs(targetElement);
            }
        });
    }

    // Redraw charts when window changes
    componentDidUpdate() {
        if (this.chartdisplay) {
            this.chartdisplay.innerHTML = '';
            const targetElement = this.chartdisplay;
            this.drawMotifs(targetElement);
        }
    }
    
    addMotifElement(targetElement, response, d, entryPoint) {
        // Convert PWM text data to object
        const PWM = convertTextToObj(response);
        // Append information about the PWM including Biosample, Organ, and Targets
        targetElement.insertAdjacentHTML('afterbegin', `<div class="motif-element" id="motif${d.accession}"></div>`);
        const targetList = d.targets.map(t => t.label);
        const targetListLabel = targetList.length > 1 ? 'Targets' : 'Target';
        const htmlStr = `
            <div class='motif-description'>
                <p><a href=${d['@id']}>${d.accession}</a></p>
                ${d.biosample_term_name ? `<p>Biosample: ${d.biosample_term_name}</p>` : ''}
                ${d.organ_slims ? `<p>Organ: ${d.organ_slims.join(', ')}</p>` : ''}
                ${targetList ? `<p>${targetListLabel}: ${targetList.join(', ')}</p>` : ''}
            </div>`;
        targetElement.insertAdjacentHTML('afterbegin', htmlStr);
        // Generate the logo from the PWM object
        entryPoint(`#motif${d.accession}`, PWM, this.d3);
    }

    drawMotifs(targetElement) {
        const results = this.props.context['@graph'];
        const urlBase = this.props.urlBase;

        // Keep track of whether or not a PWM document has been identified
        let emptyFlag = 1;

        const entryPoint = this.sequenceLogos.entryPoint;
        const d3 = this.d3;

        let pwmLink = '';
        // Check each element of @graph to see if it has documents and if the available documents are of the type "position weight matrix"
        // If so, fetch PWM data and insert logo and associated PWM information to a list
        results.forEach((d) => {
            if (d.documents[0]) {
                emptyFlag = 0;
                if (d.documents[0].document_type === 'position weight matrix') {
                    pwmLink = urlBase + d.documents[0]['@id'] + d.documents[0].attachment.href;

                    getMotifData(pwmLink, this.context.fetch, entryPoint, d3).then((response) => {
                        targetElement.insertAdjacentHTML('afterbegin', `<div class="element" id="element${d.accession}"></div>`);
                        const targetElement2 = document.getElementById(`element${d.accession}`);
                        this.addMotifElement(targetElement2, response, d, entryPoint, d3);
                    });
                }
            }
        });

        // If none of the elements of @graph have a PWM document, display notification
        if (emptyFlag) {
            targetElement.insertAdjacentHTML('afterbegin', '<div class="visualize-error">Choose other datasets. These do not include PWM data.</div>');
        }
    }

    render() {
        return (
            <div>
                <div className="sequence-logo-table">
                    <h4>Motifs</h4>
                    <div ref={(div) => { this.chartdisplay = div; }} className="sequence-logo" />
                </div>
            </div>
        );
    }
}

Motifs.propTypes = {
    context: PropTypes.object.isRequired,
    urlBase: PropTypes.string.isRequired,
};

Motifs.contextTypes = {
    fetch: PropTypes.func,
};
