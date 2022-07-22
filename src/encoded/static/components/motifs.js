import React from 'react';
import _ from 'underscore';
import PropTypes from 'prop-types';
import * as logos from '../libs/d3-sequence-logo'; // This is for local development when changes are needed to d3-sequence-logo.

// Convert PWM file into JavaScript object
// Input "str" consists of PWM file
// Each row corresponds to a position in the motif
// The farthest left column is an index (no important nucleotide information)
// The next three columns describe the frequency of occurrence of each nucleotide
// Columns correspond from left to right to nucleotides A, C, G, and T
export function convertPwmTextToObj(str) {
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

// The format of .jaspar files is approximately an inverted structure as .pwm files
// We ascertain the length (n) of the first row of nucleotide data, and generate an empty array of arrays where each array is 4 elements long (one element for each nucleotide) and there are n rows, then we populate the arrays with data
export function convertJasparTextToObj(str) {
    const cells = str.split('\n').map(el => el.split(/\s+/));
    let obj = [];
    const nucleotides = ['A', 'C', 'G', 'T'];
    for (let idx = 0; idx < cells.length; idx += 1) {
        const cell = cells[idx];
        // Finding first row of nuceotide information
        if (nucleotides.includes(cell[0][0])) {
            obj = new Array(cell.length - 3);
            for (let i = 0; i < obj.length; i += 1) {
                obj[i] = new Array(4).fill(0);
            }
            break;
        }
    }
    // Populating the arrays with the retrieved data
    cells.forEach((cell) => {
        if (nucleotides.includes(cell[0][0])) {
            let rIdx = 0;
            const nIdx = nucleotides.indexOf(cell[0][0]);
            cell.forEach((c, cIdx) => {
                if (c !== ']' && c !== '[' && cIdx > 0) {
                    obj[rIdx][nIdx] = +c;
                    rIdx += 1;
                }
            });
        }
    });
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

        this.mounted = false;
        this.generatePWMLink = this.generatePWMLink.bind(this);
        this.addMotifElement = this.addMotifElement.bind(this);
    }

    componentDidMount() {
        require.ensure(['d3', 'd3-sequence-logo'], (require) => {
            this.d3 = require('d3');
            this.sequenceLogos = logos; // This is for local development when changes are needed to d3-sequence-logo.
            // this.sequenceLogos = require('d3-sequence-logo');
            const pwmLink = this.generatePWMLink();
            this.mounted = true;

            getMotifData(pwmLink, this.context.fetch).then((response) => {
                this.addMotifElement(response, pwmLink.includes('.pwm') ? 'pwm' : 'jaspar');
            });
        });
    }

    // Redraw charts when window changes
    componentDidUpdate() {
        if (this.mounted) {
            const pwmLink = this.generatePWMLink();
            getMotifData(pwmLink, this.context.fetch).then((response) => {
                this.addMotifElement(response, pwmLink.includes('.pwm') ? 'pwm' : 'jaspar');
            });
        }
    }

    // Generate PWM link from url and document
    generatePWMLink() {
        const element = this.props.element;
        return `${element.pwm}${element.href}`;
    }

    addMotifElement(response, fileType) {
        // Convert PWM text data to object
        let PWM;
        if (fileType === 'pwm') {
            PWM = convertPwmTextToObj(response);
        } else {
            PWM = convertJasparTextToObj(response);
        }

        // Determine padding required for alignment of logos
        const alignmentCoordinate = +this.props.coordinates.split(':')[1].split('-')[0];
        const startCoordinate = +this.props.element.start;
        const endCoordinate = +this.props.element.end;
        const strand = this.props.element.strand;
        const currentLength = +endCoordinate - +startCoordinate;
        const totalLength = +this.props.alignedEndCoordinate - +this.props.alignedStartCoordinate;
        let startAlignmentNeeded = 0;
        let endAlignmentNeeded = 0;
        if (strand === '-') {
            endAlignmentNeeded = +startCoordinate - +this.props.alignedStartCoordinate;
            startAlignmentNeeded = totalLength - endAlignmentNeeded - currentLength;
        } else {
            startAlignmentNeeded = +startCoordinate - +this.props.alignedStartCoordinate;
            endAlignmentNeeded = totalLength - startAlignmentNeeded - currentLength;
        }

        // Insert padding for alignment
        const newPWM = [...PWM];
        for (let startIdx = 0; startIdx < startAlignmentNeeded; startIdx += 1) {
            newPWM.unshift([0, 0, 0, 0]);
        }
        for (let endIdx = 0; endIdx < endAlignmentNeeded; endIdx += 1) {
            newPWM.push([0, 0, 0, 0]);
        }

        // Generate the logo from the PWM object
        this.sequenceLogos.entryPoint(this.chartdisplay, newPWM, this.d3, alignmentCoordinate, this.props.alignedStartCoordinate, this.props.alignedEndCoordinate, strand, false);
    }

    render() {
        const element = this.props.element;
        const targetList = element.targets;
        const footprintList = {};
        const pwmList = {};
        element.datasets.forEach((d, dIndex) => {
            const biosample = element.biosamples[dIndex];
            const accession = element.accessions[dIndex];
            if (biosample !== undefined) {
                footprintList[biosample] = d;
            } else {
                pwmList[accession] = d;
            }
        });

        const footprintKeysSorted = Object.keys(footprintList).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
        const pwmsLength = Object.keys(pwmList).length;
        const footprintsLength = Object.keys(footprintList).length;

        const targetListLabel = (targetList.indexOf(',') !== -1) ? 'Targets' : 'Target';
        const pwmsLabel = (pwmsLength > 1 || pwmsLength === 0) ? 'PWMs' : 'PWM';
        const footprintsLabel = (footprintsLength > 1 || footprintsLength === 0) ? 'Footprints' : 'Footprint';

        return (
            <div className="element" id={`element${element.pwm}`}>
                <div className={`motif-description ${this.props.shortened ? 'shortened-description' : ''}`}>
                    {(targetList.length > 0) ?
                        <p><span className="motif-label">{targetListLabel}</span>{targetList}</p>
                    : null}
                    {element.strand ?
                        <p><span className="motif-label">Strand</span><i className={`icon ${element.strand === '+' ? 'icon-plus-circle' : 'icon-minus-circle'}`} /></p>
                    : null}
                    {element.description && !(this.props.shortened) ?
                        <p><span className="motif-label">Description</span>{element.description}</p>
                    : null}
                    {!(this.props.shortened) ?
                        <React.Fragment>
                            {(footprintsLength > 0) ?
                                <div>
                                    <span className="motif-label">{footprintsLabel}</span>
                                    <div className={`scrollable-list ${footprintsLength > 3 ? 'shading' : ''}`}>
                                        {footprintKeysSorted.map(d => <div key={d}><a href={footprintList[d]}>{d}</a></div>)}
                                    </div>
                                </div>
                            : null}
                            {(pwmsLength > 0) ?
                                <p>
                                    <span className="motif-label">{pwmsLabel}</span>
                                    {Object.keys(pwmList).map((d, dIndex) => <a key={d} href={pwmList[d]}>{d}{dIndex === (Object.keys(pwmList).length - 1) ? '' : ', '}</a>)}
                                </p>
                            : null}
                        </React.Fragment>
                    :
                        <React.Fragment>
                            <p>{footprintsLength} {footprintsLabel}</p>
                            <p>{pwmsLength} {pwmsLabel}</p>
                            {(footprintsLength > 0) ?
                                <p className="motifs-list">
                                    <span className="motif-label">{footprintsLabel}</span>
                                    {footprintKeysSorted.slice(0, 5).map((d, dIndex) => <span className="biosample-label" key={d}>{d}{dIndex === (footprintsLength - 1) ? '' : ', '}</span>)}
                                    {(footprintsLength > 5) ?
                                        <span>...</span>
                                    : null}
                                </p>
                            : null}
                        </React.Fragment>
                    }
                </div>
                <div ref={(div) => { this.chartdisplay = div; }} className="motif-element" />
            </div>
        );
    }
}

MotifElement.propTypes = {
    element: PropTypes.object.isRequired,
    shortened: PropTypes.bool.isRequired,
    coordinates: PropTypes.string.isRequired,
    alignedStartCoordinate: PropTypes.number.isRequired,
    alignedEndCoordinate: PropTypes.number.isRequired,
};

MotifElement.contextTypes = {
    fetch: PropTypes.func,
};

export const Motifs = (props) => {
    const [d3lib, setD3Lib] = React.useState(0);
    const refToReference = React.useRef(null);
    const refContainer = React.useRef(null);
    const tableTop = React.useRef(null);
    const refPlaceholder = React.useRef(null);

    const results = props.context['@graph'];
    const limit = +props.limit;
    const classList = props.classList;

    // Filter results to find ones with PWM data
    const pwmLinkListFull = results.filter(d => d.documents && d.documents[0] && d.documents[0].document_type === 'position weight matrix');

    // Find all pwms that have both matching document and matching target(s)
    // Group pwms based on these two properties
    // Result is object with keys that are "[document link]#[target list linked by '-'s]"
    const groupedList = _.groupBy(pwmLinkListFull, link => `${link.documents[0]['@id']}#${link.targets.sort().join('-')}`);

    // Flatten group to create an array of pwms
    // Properties that are identical across the group (for instance: pwm document, strand, and targets) are collapsed
    // Properties that are not the same across the group (for instance: biosamples, accessions, datasets) are merged into an array
    let groupedListMapped = _.map(groupedList, group => ({
        pwm: group[0].documents[0]['@id'],
        href: group[0].documents[0].attachment.href,
        targets: group[0].targets.join(', '),
        accessions: _.pluck(group, 'file'),
        datasets: _.pluck(group, 'dataset'),
        start: group[0].start,
        end: group[0].end,
        strand: group[0].strand,
        biosamples: _.pluck(group, 'biosample_ontology').map(d => d.term_name),
        description: group[0].description ? group[0].description : null,
    }));

    // Sort flattened list by target
    groupedListMapped = _.sortBy(groupedListMapped, o => o.targets);

    // Subset of pwm list is displayed on thumbnails
    let pwmLinkList = {};
    if (limit > 0 && groupedListMapped.length !== 0) {
        pwmLinkList = groupedListMapped.slice(0, limit);
    } else {
        pwmLinkList = groupedListMapped;
    }

    // Compute offsets for the different pwms to find the widest window
    let alignedStartCoordinate = Infinity;
    let alignedEndCoordinate = 0;
    pwmLinkList.forEach((p) => {
        alignedStartCoordinate = Math.min(p.start, alignedStartCoordinate);
        alignedEndCoordinate = Math.max(p.end, alignedEndCoordinate);
    });

    // trimming the reference sequence to widest window of pwms
    const referenceLength = alignedEndCoordinate - alignedStartCoordinate;
    const referenceStart = alignedStartCoordinate - props.context.sequence.start;
    const referenceSequence = props.context.sequence.sequence.slice(referenceStart, referenceStart + referenceLength);

    React.useEffect(() => {
        document.addEventListener('scroll', trackScrolling);
        // drawing reference sequence as a pwm so it lines up with the others
        require.ensure(['d3', 'd3-sequence-logo'], (require) => {
            setD3Lib(require('d3'));
            const sequenceLogos = logos; // This is for local development when changes are needed to d3-sequence-logo.
            // this.sequenceLogos = require('d3-sequence-logo');

            const refSeq = referenceSequence.split('');
            const fakePWM = [];

            refSeq.forEach((nucleotide) => {
                const maxHeight = 1000;
                if (nucleotide === 'A') {
                    fakePWM.push([maxHeight, 0, 0, 0]);
                } else if (nucleotide === 'C') {
                    fakePWM.push([0, maxHeight, 0, 0]);
                } else if (nucleotide === 'G') {
                    fakePWM.push([0, 0, maxHeight, 0]);
                } else {
                    fakePWM.push([0, 0, 0, maxHeight]);
                }
            });

            sequenceLogos.entryPoint(refToReference.current, fakePWM, d3lib, referenceStart, referenceStart, referenceStart, '+', true);
        });
    });

    const trackScrolling = () => {
        if (tableTop.current.getBoundingClientRect().top <= 27) {
            refContainer.current.classList.add('fixed-position');
            refPlaceholder.current.setAttribute('style', `height:${refContainer.current.getBoundingClientRect().height}px`);
        } else {
            refContainer.current.classList.remove('fixed-position');
            refPlaceholder.current.setAttribute('style', 'width:0px');
        }
    };

    return (
        <React.Fragment>
            {(pwmLinkList.length === 0) ?
                <React.Fragment>
                    {limit !== 0 ?
                        <div className="motif-count">(<b>0</b> results)</div>
                    :
                        <div className="error-message">There are no results that include PWM or footprint data. Try a different search.</div>
                    }
                </React.Fragment>
            :
                <React.Fragment>
                    {(limit > 0) ?
                        <div className="motif-count">(<b>{groupedListMapped.length}</b> results)</div>
                    : null}
                    <div className={`sequence-logo-table ${classList}`} ref={tableTop}>
                        <div className="sequence-logo">
                            <div className="reference-sequence element" ref={refContainer} >
                                <div className="motif-description">Reference sequence</div>
                                <div ref={refToReference} className="motif-element" />
                            </div>
                            <div className="placeholder-element" ref={refPlaceholder} />
                            {pwmLinkList.map(d =>
                                <MotifElement
                                    key={d.pwm}
                                    element={d}
                                    shortened={limit > 0}
                                    coordinates={props.context.query_coordinates[0]}
                                    alignedStartCoordinate={alignedStartCoordinate}
                                    alignedEndCoordinate={alignedEndCoordinate}
                                />)}
                        </div>
                    </div>
                </React.Fragment>
            }
        </React.Fragment>
    );
};

Motifs.propTypes = {
    context: PropTypes.object.isRequired,
    limit: PropTypes.number.isRequired,
    classList: PropTypes.string,
};

Motifs.defaultProps = {
    classList: '',
};
