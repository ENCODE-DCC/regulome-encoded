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

        this.generatePWMLink = this.generatePWMLink.bind(this);
        this.addMotifElement = this.addMotifElement.bind(this);
    }

    componentDidMount() {
        require.ensure(['d3', 'd3-sequence-logo'], (require) => {
            this.d3 = require('d3');
            this.sequenceLogos = require('d3-sequence-logo'); // logos This is for local development when changes are needed to d3-sequence-logo.
            const pwmLink = this.generatePWMLink();

            getMotifData(pwmLink, this.context.fetch).then((response) => {
                this.addMotifElement(response);
            });
        });
    }

    // Redraw charts when window changes
    componentDidUpdate() {
        const pwmLink = this.generatePWMLink();
        getMotifData(pwmLink, this.context.fetch).then((response) => {
            this.addMotifElement(response);
        });
    }

    // Generate PWM link from url and document
    generatePWMLink() {
        const element = this.props.element;
        const urlBase = this.props.urlBase;
        return `${urlBase}${element.documents[0]['@id']}${element.documents[0].attachment.href}`;
    }

    addMotifElement(response) {
        // Convert PWM text data to object
        const PWM = convertTextToObj(response);
        // Generate the logo from the PWM object
        this.sequenceLogos.entryPoint(this.chartdisplay, PWM, this.d3);
    }

    render() {
        const element = this.props.element;
        const targetList = element.targets;
        const targetListLabel = targetList.length > 1 ? 'Targets' : 'Target';
        const accession = element.dataset.split('/')[2];

        return (
            <div className="element" id={`element${accession}`}>
                <div className="motif-description">
                    {!(this.props.shortened) ?
                        <p><a href={element.dataset}>{accession}</a></p>
                    : null}
                    {element.organ_slims ?
                        <p><span className="motif-label">Organ</span>{element.organ_slims.join(', ')}</p>
                    : null}
                    {targetList ?
                        <p><span className="motif-label">{targetListLabel}</span>{targetList.join(', ')}</p>
                    : null}
                    <p><span className="motif-label">Method</span>{element.method}</p>
                    {element.biosample_ontology ?
                        <p><span className="motif-label">Biosample</span>{element.biosample_ontology.term_name}</p>
                    : null}
                    {element.description && !(this.props.shortened) ?
                        <p><span className="motif-label">Description</span>{element.description}</p>
                    : null}
                </div>
                <div ref={(div) => { this.chartdisplay = div; }} className="motif-element" />
            </div>
        );
    }
}

MotifElement.propTypes = {
    element: PropTypes.object.isRequired,
    urlBase: PropTypes.string.isRequired,
    shortened: PropTypes.bool.isRequired,
};

MotifElement.contextTypes = {
    fetch: PropTypes.func,
};

export const Motifs = (props) => {
    const results = props.context['@graph'];
    const urlBase = props.urlBase;
    const limit = +props.limit;
    const classList = props.classList;

    // Filter results to find ones with associated PWM data
    const pwmLinkListFull = results.filter(d => d.documents && d.documents[0] && d.documents[0].document_type === 'position weight matrix');
    let pwmLinkList = [];
    if (limit > 0 && pwmLinkListFull.length !== 0) {
        pwmLinkList = pwmLinkListFull.slice(0, limit);
    } else {
        pwmLinkList = pwmLinkListFull;
    }

    return (
        <div>
            {(pwmLinkList.length === 0) ?
                <div>
                    {limit !== 0 ?
                        <div className="motif-error">(<b>0</b> results)</div>
                    :
                        <div className="error-message">There are no results that include PWM data. Try a different search.</div>
                    }
                </div>
            :
                <div className={`sequence-logo-table ${classList}`}>
                    <div className="sequence-logo">
                        {pwmLinkList.map(d => <MotifElement key={d.dataset.split('/')[2]} element={d} urlBase={urlBase} shortened={limit > 0} />)}
                    </div>
                </div>
            }
        </div>
    );
};

Motifs.propTypes = {
    context: PropTypes.object.isRequired,
    urlBase: PropTypes.string.isRequired,
    limit: PropTypes.number.isRequired,
    classList: PropTypes.string,
};

Motifs.defaultProps = {
    classList: '',
};
