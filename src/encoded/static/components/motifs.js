import React from 'react';
import PropTypes from 'prop-types';
import _ from 'underscore';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../libs/bootstrap/modal';
import * as globals from './globals';
import url from 'url';
import { FetchedData, Param } from './fetched';
// import * as logos from '../libs/d3-sequence-logo';


// Display information on page as JSON formatted data
export class Motifs extends React.Component {
    constructor(props, context) {
        super(props, context);

        // Bind `this` to non-React methods.
        this.drawMotifs = this.drawMotifs.bind(this);
    };

    componentDidMount() {

        require.ensure(['d3', 'd3-sequence-logo'], (require) => {

            if (this.chartdisplay){

                this.d3 = require('d3');
                this.sequenceLogos = require('d3-sequence-logo'); // logos
                const targetElement = this.chartdisplay;
                this.drawMotifs(targetElement);

            }

        });

    }

    drawMotifs(targetElement) {

        const results = this.props.context['@graph'];
        const urlBase = this.props.urlBase;

        let emptyFlag = 1;
        
        let entryPoint = this.sequenceLogos.entryPoint;
        let d3 = this.d3;

        let pwmLink = '';
        results.forEach(d => {
            if (d.documents[0]){
                emptyFlag = 0;
                if (d.documents[0].document_type === 'position weight matrix'){
                    pwmLink = urlBase+d.documents[0]['@id']+d.documents[0].attachment.href;

                    function getMotifData(pwmLink,fetch,entryPoint,d3) {
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

                    function convertTextToObj(str){
                        let cells = str.split('\n').map(function (el) { return el.split(/\s+/); });
                        let obj = [];
                        cells.forEach(function(cell){
                            if (cell.length === 6){
                                obj.push([+cell[1],+cell[2],+cell[3],+cell[4]]);
                            }
                        });
                        return obj;
                    }

                    function addMotifElement(targetElement,response,d,entryPoint,d3){
                        let PWM = convertTextToObj(response);
                        targetElement.insertAdjacentHTML('afterbegin','<div class="motif-element" id="motif'+d.accession+'"></div>')
                        let html_str = `
                            <div class='motif-description'>
                                <p><a href=${d['@id']}>${d.accession}</a></p>
                                ${d.biosample_term_name ? `<p>Biosample: ${d.biosample_term_name}</p>` : ''}
                                ${d.organ_slims ? `<p>Organ: ${d.organ_slims.join(', ')}</p>` : ''}
                            </div>`;
                        targetElement.insertAdjacentHTML('afterbegin',html_str);
                        entryPoint("#motif"+d.accession, PWM, d3);
                    }

                    getMotifData(pwmLink,this.context.fetch,entryPoint,d3).then((response) => {
                        targetElement.insertAdjacentHTML('afterbegin','<div class="element" id="element'+d.accession+'"></div>');
                        let targetElement2 = document.getElementById("element"+d.accession);
                        addMotifElement(targetElement2,response,d,entryPoint,d3);
                    });

                }
            }
        });

        if (emptyFlag) {
            targetElement.insertAdjacentHTML('afterbegin','<div class="visualize-error">Choose other datasets. These do not include PWM data.</div>')
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

Motifs.contextTypes = {
    fetch: PropTypes.func,
};
