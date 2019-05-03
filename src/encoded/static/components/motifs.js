import React from 'react';
import PropTypes from 'prop-types';
// import * as logos from '../libs/d3-sequence-logo'; // This is for local development when changes are needed to d3-sequence-logo.

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
export class MotifElement extends React.Component {
    constructor() {
        super();

        // this.drawMotifs = this.drawMotifs.bind(this);
        this.addMotifElement = this.addMotifElement.bind(this);
    }

    componentDidMount() {
        require.ensure(['d3', 'd3-sequence-logo'], (require) => {
            this.d3 = require('d3');
            this.sequenceLogos = require('d3-sequence-logo'); // logos This is for local development when changes are needed to d3-sequence-logo.

            const targetElement = this.chartdisplay;
            const entryPoint = this.sequenceLogos.entryPoint;

            getMotifData(this.pwmLink, this.context.fetch).then((response) => {
                this.addMotifElement(targetElement, response, entryPoint);
            });
        });
    }

    // Redraw charts when window changes
    componentDidUpdate() {
        this.d3 = require('d3');
        this.sequenceLogos = require('d3-sequence-logo'); // logos This is for local development when changes are needed to d3-sequence-logo.

        const targetElement = this.chartdisplay;
        const entryPoint = this.sequenceLogos.entryPoint;

        // Need to remove current logo or another logo will be appended to original
        this.chartdisplay.innerHTML = '';

        getMotifData(this.pwmLink, this.context.fetch).then((response) => {
            this.addMotifElement(targetElement, response, entryPoint);
        });
    }

    addMotifElement(targetElement, response, entryPoint) {
        // Convert PWM text data to object
        const PWM = convertTextToObj(response);
        // Generate the logo from the PWM object
        entryPoint(targetElement, PWM, this.d3);
    }

    render() {
        const element = this.props.element;
        const targetList = element.targets.map(t => t.label);
        const targetListLabel = targetList.length > 1 ? 'Targets' : 'Target';
        const pwmLink = `${this.props.urlBase}${element.documents[0]['@id']}${element.documents[0].attachment.href}`;

        return (
            <div className="element" id={`element${element.accession}`}>
                <div className="motif-description">
                    <p><a href={element['@id']}>{element.accession}</a></p>
                    {element.biosample_term_name ?
                        <p>Biosample: {element.biosample_term_name}</p>
                    : null}
                    {element.organ_slims ?
                        <p>Organ: {element.organ_slims.join(', ')}</p>
                    : null}
                    {targetList ?
                        <p>{targetListLabel}: {targetList.join(', ')}</p>
                    : null}
                </div>
                <div ref={(div) => { this.chartdisplay = div; this.pwmLink = pwmLink; }} className="motif-element" />
            </div>
        );
    }
}

MotifElement.propTypes = {
    element: PropTypes.object.isRequired,
    urlBase: PropTypes.string.isRequired,
};

MotifElement.contextTypes = {
    fetch: PropTypes.func,
};

export const Motifs = (props) => {
    const results = props.context['@graph'];
    const urlBase = props.urlBase;
    const pwmLinkList = [];

    // Iterate through results to see which have associated PWM data
    results.forEach((d) => {
        if (d.documents[0]) {
            if (d.documents[0].document_type === 'position weight matrix') {
                pwmLinkList.push(d);
            }
        }
    });

    return (
        <div>
            <div className="sequence-logo-table">
                <h4>Motifs</h4>
                <div className="sequence-logo">
                    {(pwmLinkList.length === 0) ?
                        <div className="visualize-error">Choose other datasets. These do not include PWM data.</div>
                    :
                        <div>
                            {pwmLinkList.map(d => <MotifElement key={d.accession} element={d} urlBase={urlBase} />)}
                        </div>
                    }
                </div>
            </div>
        </div>
    );
};

Motifs.propTypes = {
    context: PropTypes.object.isRequired,
    urlBase: PropTypes.string.isRequired,
};
