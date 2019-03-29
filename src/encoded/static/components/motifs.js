import React from 'react';
import PropTypes from 'prop-types';
// import * as logos from '../libs/d3-sequence-logo';

function convertTextToObj(str) {
    const cells = str.split('\n').map(el => el.split(/\s+/));
    const obj = [];
    cells.forEach((cell) => {
        if (cell.length === 6) {
            obj.push([+cell[1], +cell[2], +cell[3], +cell[4]]);
        }
    });
    return obj;
}

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
class Motifs extends React.Component {
    constructor(props, context) {
        super(props, context);

        this.drawMotifs = this.drawMotifs.bind(this);
        this.addMotifElement = this.addMotifElement.bind(this);
    }

    componentDidMount() {
        require.ensure(['d3', 'd3-sequence-logo'], (require) => {
            if (this.chartdisplay) {
                this.d3 = require('d3');
                this.sequenceLogos = require('d3-sequence-logo'); // logos
                const targetElement = this.chartdisplay;
                this.drawMotifs(targetElement);
            }
        });
    }

    // need to redraw charts when window changes
    componentDidUpdate() {
        if (this.chartdisplay) {
            this.chartdisplay.innerHTML = '';
            this.d3 = require('d3');
            this.sequenceLogos = require('d3-sequence-logo'); // logos
            const targetElement = this.chartdisplay;
            this.drawMotifs(targetElement);
        }
    }

    addMotifElement(targetElement, response, d, entryPoint) {
        const PWM = convertTextToObj(response);
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
        entryPoint(`#motif${d.accession}`, PWM, this.d3);
    }

    drawMotifs(targetElement) {
        const results = this.props.context['@graph'];
        const urlBase = this.props.urlBase;

        let emptyFlag = 1;

        const entryPoint = this.sequenceLogos.entryPoint;
        const d3 = this.d3;

        let pwmLink = '';
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

export default Motifs;
