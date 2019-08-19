import React from 'react';
import PropTypes from 'prop-types';
import _ from 'underscore';
import url from 'url';
import * as globals from './globals';
import { SortTablePanel, SortTable } from './sorttable';
import { Motifs } from './motifs';
import { BarChart, ChartTable } from './visualizations';

const dataTypeStrings = [
    {
        type: 'dbSNP IDs',
        explanation: 'Enter dbSNP ID(s) (example) or upload a list of dbSNP IDs to identify DNA features and regulatory elements that contain the coordinate of the SNP(s).',
    },
    {
        type: 'Single nucleotides',
        explanation: 'Enter hg19 coordinates for a single nucleotide as 0-based (example) coordinates or in a BED file (example), VCF file (example), or GFF3 file (example). These coordinates will be mapped to a dbSNP IDs (if available) in addition to identifying DNA features and regulatory elements that contain the input coordinate(s).',
    },
    {
        type: 'A chromosomal region',
        explanation: 'Enter hg19 chromosomal regions, such as a promoter region upstream of a gene, as 0-based (example) coordinates or in a BED file (example) or GFF3 file (example). All dbSNP IDs with an allele frequency &gt;1% that are found in this region will be used to identify DNA features and regulatory elements that contain the coordinate of the SNP(s).',
    },
];

const exampleEntries = [
    {
        label: 'multiple dbSNPs',
        input: 'rs3768324\nrs75982468\nrs10905307\nrs10823321\nrs7745856',
    },
    {
        label: 'coordinates ranges',
        input: 'chr11:62607065-62607067\nchr10:5894499-5894500\nchr10:11741180-11741181\nchr1:39492462-39492463\nchr6:10695158-10695160',
    },
];

// Columns for different subsets of data
const dataColumnsChromatin = {
    assay_title: {
        title: 'Method',
        getValue: item => (item.assay_title || item.annotation_type),
    },
    biosample_term_name: {
        title: 'Biosample',
        getValue: item => (item.biosample_ontology ? item.biosample_ontology.term_name : ''),
    },
    organ_slims: {
        title: 'Organ',
        getValue: item => (item.biosample_ontology ? item.biosample_ontology.organ_slims.join(', ') : ''),
    },
    accession: {
        title: 'Link',
        display: item => <a href={item['@id']}>{item.accession}</a>,
    },
    description: {
        title: 'Description',
    },
};

const dataColumnsQTL = {
    assay_title: {
        title: 'Method',
        getValue: item => (item.assay_title || item.annotation_type),
    },
    biosample_term_name: {
        title: 'Biosample',
        getValue: item => (item.biosample_ontology ? item.biosample_ontology.term_name : ''),
    },
    target: {
        title: 'Targets',
        getValue: item => (item.target ? item.target.label : (item.targets) ? item.targets.map(t => t.label).join(', ') : ''),
    },
    accession: {
        title: 'Link',
        display: item => <a href={item['@id']}>{item.accession}</a>,
    },
    description: {
        title: 'Description',
    },
};

const dataColumnsOther = {
    assay_title: {
        title: 'Method',
        getValue: item => (item.assay_title || item.annotation_type),
    },
    biosample_term_name: {
        title: 'Biosample',
        getValue: item => (item.biosample_ontology ? item.biosample_ontology.term_name : ''),
    },
    target: {
        title: 'Targets',
        getValue: item => (item.target ? item.target.label : (item.targets) ? item.targets.map(t => t.label).join(', ') : ''),
    },
    organ_slims: {
        title: 'Organ',
        getValue: item => (item.biosample_ontology ? item.biosample_ontology.organ_slims.join(', ') : ''),
    },
    accession: {
        title: 'Link',
        display: item => <a href={item['@id']}>{item.accession}</a>,
    },
    description: {
        title: 'Description',
    },
};

class DataType extends React.Component {
    constructor() {
        super();

        this.state = {
            open: false,
        };

        // Bind this to non-React methods.
        this.handleInfo = this.handleInfo.bind(this);
    }

    toggleOpenState() {
        this.setState(state => ({
            open: !state.open,
        }));
    }

    handleInfo() {
        this.toggleOpenState();
    }

    render() {
        return (
            <div>
                <h4>
                    <div className="data-type" onClick={this.handleInfo} onKeyDown={this.handleInfo} role="button" tabIndex={0}>
                        <i className={`icon ${(this.state.open) ? ' icon-caret-down' : 'icon-caret-right'}`} /> {this.props.type}
                    </div>
                </h4>
                <p className={`data-type-explanation${(this.state.open) ? ' show' : ''}`}>{this.props.explanation}</p>
            </div>
        );
    }
}

DataType.propTypes = {
    type: PropTypes.string.isRequired,
    explanation: PropTypes.string.isRequired,
};

class ExampleEntry extends React.Component {
    constructor() {
        super();
        this.handleClick = this.handleClick.bind(this);
    }

    handleClick(e) {
        e.preventDefault();
        this.props.handleExample(this.props.input);
    }

    render() {
        return (
            <button className="example-input" onClick={this.handleClick}> {this.props.label} </button>
        );
    }
}

ExampleEntry.propTypes = {
    label: PropTypes.string.isRequired,
    input: PropTypes.string.isRequired,
    handleExample: PropTypes.func.isRequired,
};

class AdvSearch extends React.Component {
    constructor() {
        super();

        // Set intial React state.
        /* eslint-disable react/no-unused-state */
        // Need to disable this rule because of a bug in eslint-plugin-react.
        // https://github.com/yannickcr/eslint-plugin-react/issues/1484#issuecomment-366590614
        this.state = {
            coordinates: '',
            genome: 'GRCh37',
            searchInput: '',
        };
        /* eslint-enable react/no-unused-state */

        // Bind this to non-React methods.
        this.handleChange = this.handleChange.bind(this);
        this.handleOnFocus = this.handleOnFocus.bind(this);
        this.handleExample = this.handleExample.bind(this);
    }

    handleChange(e) {
        this.setState({
            searchInput: e.target.value,
        });
    }

    handleExample(exampleInput) {
        this.setState({
            searchInput: exampleInput,
        });
    }

    handleOnFocus() {
        this.context.navigate(this.context.location_href);
    }

    render() {
        const context = this.props.context;
        const searchBase = url.parse(this.context.location_href).search || '';

        return (
            <div>
                <form id="panel1" className="adv-search-form" autoComplete="off" aria-labelledby="tab1" onSubmit={this.handleOnFocus} >
                    <div className="form-group">
                        <label htmlFor="annotation">
                            <i className="icon icon-search" />Search by dbSNP ID or coordinate range (hg19)
                        </label>
                        <div className="input-group input-group-region-input">
                            <textarea className="multiple-entry-input" id="multiple-entry-input" placeholder="Enter search parameters here." onChange={this.handleChange} name="regions" value={this.state.searchInput} />

                            <div className="example-inputs">
                                Click for example entry:
                                {exampleEntries.map((entry, entryIdx) =>
                                    <span key={entry.label}>
                                        <ExampleEntry label={entry.label} input={entry.input} handleExample={this.handleExample} />
                                        { entryIdx !== (exampleEntries.length - 1) ?
                                            'or'
                                        :
                                        null}
                                    </span>
                                )}
                            </div>

                            <input type="submit" value="Search" className="btn btn-sm btn-info" />
                            <input type="hidden" name="genome" value={this.state.genome} />
                        </div>
                    </div>

                </form>

                {(context.notification && context.notification !== 'No annotations found') ?
                    <div className="notification">{context.notification}</div>
                : null}
                {(context.coordinates) ?
                    <p>Searched coordinates: {context.coordinates}</p>
                : null}
                {(context.regulome_score) ?
                    <p className="regulomescore">RegulomeDB score: {context.regulome_score.probability} (probability); {context.regulome_score.ranking} (ranking) </p>
                : null}
                {(context.regulome_score && !context.peak_details) ?
                    <a
                        rel="nofollow"
                        className="btn btn-info btn-sm"
                        href={searchBase ? `${searchBase}&peak_metadata` : '?peak_metadata'}
                    >
                        See peaks
                    </a>
                : null}
                {(context.peak_details !== undefined && context.peak_details !== null) ?
                    <div className="btn-container">
                        <a className="btn btn-info btn-sm" href={context.download_elements[0]} data-bypass>Download peak details (TSV)</a>
                        <a className="btn btn-info btn-sm" href={context.download_elements[1]} data-bypass>Download peak details (JSON)</a>
                    </div>
                : null}
            </div>
        );
    }
}

AdvSearch.propTypes = {
    context: PropTypes.object.isRequired,
};

AdvSearch.contextTypes = {
    location_href: PropTypes.string,
    navigate: PropTypes.func,
};

const PeakDetails = (props) => {
    const context = props.context;
    const peaks = context.peak_details;

    const peaksTableColumns = {
        method: {
            title: 'Method',
        },

        chrom: {
            title: 'Chromosome location',
            getValue: item => `${item.chrom}:${item.start}..${item.end}`,
        },

        biosample_term_name: {
            title: 'Biosample',
        },

        targets: {
            title: 'Targets',
            getValue: item => item.targets.join(', '),
        },
    };

    return (
        <div>
            <SortTablePanel title="Peak details">
                <SortTable list={peaks} columns={peaksTableColumns} />
            </SortTablePanel>
        </div>
    );
};

PeakDetails.propTypes = {
    context: React.PropTypes.object.isRequired,
};

const NearbySNPsDrawing = (props) => {
    const context = props.context;

    let startNearbySnps = 0;
    let endNearbySnps = 0;
    let coordinate = 0;
    let coordinateX = 0;

    const coordinateXEven = [-100];
    const coordinateXOdd = [-100];
    const coordinateYOffset = [];
    let countEven = 0;
    let countOdd = 0;
    if (context.nearby_snps && context.nearby_snps[0] && context.nearby_snps[0].coordinates) {
        startNearbySnps = +context.nearby_snps[0].coordinates.lt;
        endNearbySnps = +context.nearby_snps[context.nearby_snps.length - 1].coordinates.lt;
        coordinate = +context.coordinates.split('-')[1];
        coordinateX = (920 * ((coordinate - startNearbySnps) / (endNearbySnps - startNearbySnps))) + 40;

        context.nearby_snps.forEach((snp, snpIndex) => {
            let offset = 0;
            const tempCoordinate = (920 * ((+snp.coordinates.lt - startNearbySnps) / (endNearbySnps - startNearbySnps))) + 40;
            if (snpIndex % 2 === 0) {
                countEven += 1;
                coordinateXEven[countEven] = tempCoordinate;
                // check if coordinate was close to last even coordinate
                if ((coordinateXEven[countEven] - coordinateXEven[countEven - 1]) < 90) {
                    // check if last coordinate was also offset
                    if (coordinateYOffset[snpIndex - 2] !== 0) {
                        // if last coordinate was also offset, check if this coordinate was also too close to that one
                        if (coordinateXEven[countEven] - coordinateXEven[countEven - 1] < 90) {
                            offset = coordinateYOffset[snpIndex - 2] + 20;
                        } else {
                            offset = 20;
                        }
                    } else {
                        offset = 20;
                    }
                }
            } else {
                countOdd += 1;
                coordinateXOdd[countOdd] = tempCoordinate;
                // check if coordinate was close to last odd coordinate
                if ((coordinateXOdd[countOdd] - coordinateXOdd[countOdd - 1]) < 90) {
                    // check if last coordinate was also offset
                    if (coordinateYOffset[snpIndex - 2] !== 0) {
                        // if last coordinate was also offset, check if this coordinate was also too close to that one
                        if (coordinateXOdd[countOdd] - coordinateXOdd[countOdd - 1] < 90) {
                            offset = coordinateYOffset[snpIndex - 2] + 20;
                        } else {
                            offset = 20;
                        }
                    } else {
                        offset = 20;
                    }
                }
            }
            coordinateYOffset.push(offset);
        });
    }

    return (
        <div className="svg-container">
            <div className="svg-title top-title">Chromosome {context.nearby_snps[0].chrom.split('chr')[1]}</div>
            <div className="svg-title">SNPs matching searched coordinates and nearby SNPs</div>
            <svg className="nearby-snps" viewBox="0 0 1000 150" preserveAspectRatio="xMidYMid meet" aria-labelledby="diagram-of-nearby-snps" role="img">
                <title id="diagram-of-nearby-snps">Diagram of nearby SNPs</title>
                <defs>
                    <marker
                        id="arrow"
                        viewBox="0 0 10 10"
                        refX="5"
                        refY="5"
                        markerWidth="5"
                        markerHeight="6"
                        orient="auto-start-reverse"
                    >
                        <path d="M 0 0 L 10 5 L 0 10 z" />
                    </marker>
                </defs>
                <g className="grid x-grid" id="xGrid">
                    <line x1="10" x2="990" y1="75" y2="75" markerEnd="url(#arrow)" markerStart="url(#arrow)" stroke="#7F7F7F" strokeWidth="2" />
                </g>
                <g className="labels x-labels">
                    {context.nearby_snps.map((snp, snpIndex) => {
                        const snpX = (920 * ((+snp.coordinates.lt - startNearbySnps) / (endNearbySnps - startNearbySnps))) + 40;
                        if (snpIndex % 2 === 0) {
                            if (snpX === coordinateX) {
                                return (
                                    <g key={`tick${snpIndex}`}>
                                        <line x1={String(snpX)} x2={String(snpX)} y1={60 - coordinateYOffset[snpIndex]} y2="75" stroke="#c13b42" strokeWidth="2" />
                                    </g>
                                );
                            }
                            return (
                                <g key={`tick${snpIndex}`}>
                                    <line x1={String(snpX)} x2={String(snpX)} y1={60 - coordinateYOffset[snpIndex]} y2="75" stroke="#7F7F7F" strokeWidth="2" />
                                </g>
                            );
                        }
                        if (snpX === coordinateX) {
                            return (
                                <g key={`tick${snpIndex}`}>
                                    <line x1={String(snpX)} x2={String(snpX)} y1={90 + coordinateYOffset[snpIndex]} y2="75" stroke="#c13b42" strokeWidth="2" />
                                </g>
                            );
                        }
                        return (
                            <g key={`tick${snpIndex}`}>
                                <line x1={String(snpX)} x2={String(snpX)} y1={90 + coordinateYOffset[snpIndex]} y2="75" stroke="#7F7F7F" strokeWidth="2" />
                            </g>
                        );
                    })}
                    {context.nearby_snps.map((snp, snpIndex) => {
                        const snpX = (920 * ((snp.coordinates.lt - startNearbySnps) / (endNearbySnps - startNearbySnps))) + 40;
                        const labelX = snpX - 40;
                        if (snpIndex % 2 === 0) {
                            if (snpX === coordinateX) {
                                return (
                                    <g key={`snp${snpIndex}`}>
                                        <rect x={labelX - 8} y={43 - coordinateYOffset[snpIndex]} height="15" width="77" fill="white" opacity="0.6" />
                                        <text x={labelX} y={55 - coordinateYOffset[snpIndex]} className="bold-label">{snp.rsid}</text>
                                    </g>
                                );
                            }
                            return (
                                <g key={`snp${snpIndex}`}>
                                    <rect x={labelX - 8} y={43 - coordinateYOffset[snpIndex]} height="15" width="77" fill="white" opacity="0.6" />
                                    <text x={labelX} y={55 - coordinateYOffset[snpIndex]}>{snp.rsid}</text>
                                </g>
                            );
                        }
                        if (snpX === coordinateX) {
                            return (
                                <g key={`snp${snpIndex}`}>
                                    <rect x={labelX - 8} y={89 + coordinateYOffset[snpIndex]} height="20" width="77" fill="white" opacity="0.6" />
                                    <text x={labelX} y={105 + coordinateYOffset[snpIndex]} className="bold-label">{snp.rsid}</text>
                                </g>
                            );
                        }
                        return (
                            <g key={`snp${snpIndex}`}>
                                <rect x={labelX - 8} y={89 + coordinateYOffset[snpIndex]} height="20" width="77" fill="white" opacity="0.6" />
                                <text x={labelX} y={105 + coordinateYOffset[snpIndex]}>{snp.rsid}</text>
                            </g>
                        );
                    })}
                </g>
            </svg>
        </div>
    );
};

NearbySNPsDrawing.propTypes = {
    context: React.PropTypes.object.isRequired,
};

const ResultsTable = (props) => {
    const data = props.data;
    const displayTitle = props.displayTitle;
    let dataColumns = null;
    if (props.dataFilter === 'chromatin') {
        dataColumns = dataColumnsChromatin;
    } else if (props.dataFilter === 'qtl') {
        dataColumns = dataColumnsQTL;
    } else {
        dataColumns = dataColumnsOther;
    }

    return (
        <div>
            {data.length > 0 ?
                <SortTablePanel title="Results">
                    <SortTable list={data} columns={dataColumns} />
                </SortTablePanel>
            :
                <div>
                    <h4>{displayTitle}</h4>
                    <div className="error-message">No result table is available for this SNP.</div>
                </div>
            }
        </div>
    );
};

ResultsTable.propTypes = {
    data: React.PropTypes.array.isRequired,
    dataFilter: PropTypes.string,
    displayTitle: PropTypes.string.isRequired,
};

ResultsTable.defaultProps = {
    dataFilter: '',
};

class RegulomeSearch extends React.Component {
    constructor() {
        super();

        this.applicationRef = null;
        this.state = {
            selectedThumbnail: null,
            thumbnailWidth: 0,
            screenWidth: 0,
        };

        // Bind this to non-React methods.
        this.onFilter = this.onFilter.bind(this);
        this.chooseThumbnail = this.chooseThumbnail.bind(this);
        this.updateDimensions = this.updateDimensions.bind(this);
    }

    componentDidMount() {
        this.updateDimensions();
        window.addEventListener('resize', this.updateDimensions);
    }

    shouldComponentUpdate(nextProps, nextState) {
        const thumbnailUpdate = this.state.selectedThumbnail !== nextState.selectedThumbnail;
        const screenSizeUpdate = this.state.screenWidth !== this.applicationRef.offsetWidth;
        return (!_.isEqual(this.props, nextProps) || thumbnailUpdate || screenSizeUpdate);
    }

    onFilter(e) {
        if (this.props.onChange) {
            const search = e.currentTarget.getAttribute('href');
            this.props.onChange(search);
            e.stopPropagation();
            e.preventDefault();
        }
    }

    updateDimensions() {
        const screenWidth = this.applicationRef.offsetWidth;
        let thumbnailWidth = 0;
        if (screenWidth > 865) {
            thumbnailWidth = (this.applicationRef.offsetWidth / 3) - 40;
        } else {
            thumbnailWidth = this.applicationRef.offsetWidth - 40;
        }
        this.setState({
            thumbnailWidth,
            screenWidth,
        });
    }

    chooseThumbnail(chosen) {
        this.setState({ selectedThumbnail: chosen });
    }

    render() {
        const context = this.props.context;
        const notification = context.notification;
        const urlBase = this.context.location_href.split('/regulome-search')[0];
        const allData = context['@graph'];
        const QTLData = allData.filter(d => (d.annotation_type && d.annotation_type.indexOf('QTL') !== -1));
        const chipData = allData.filter(d => d.assay_title === 'ChIP-seq');
        const dnaseData = allData.filter(d => (d.assay_title === 'FAIRE-seq' || d.assay_title === 'DNase-seq'));
        const chromatinData = allData.filter(d => (d.annotation_type === 'chromatin state'));

        return (
            <div ref={(ref) => { this.applicationRef = ref; }} >
                {(context.total > 0) ?
                    <div>
                        <div className="lead-logo">
                            <a href="/">
                                <img src="/static/img/RegulomeLogoFinal.gif" alt="Regulome logo" />
                            </a>
                        </div>
                        <div>
                            <div className="search-information">
                                {(context.coordinates) ?
                                    <div className="notification-line">
                                        <div className="notification-label">Searched coordinates</div>
                                        <div className="notification">{context.coordinates}</div>
                                    </div>
                                : null}
                                {(context.notification) ?
                                    <div className="notification-line">
                                        <div className="notification-label">{context.notification.split(': ')[0]}</div>
                                        <div className="notification">{context.notification.split(': ')[1].replace('in this region', '')}</div>
                                    </div>
                                : null}
                                {(context.regulome_score) ?
                                    <div>
                                        <div className="notification-line">
                                            <div className="notification-label">Rank</div>
                                            <div className="notification">{context.regulome_score.ranking}</div>
                                        </div>
                                        <div className="notification-line">
                                            <div className="notification-label">Score</div>
                                            <div className="notification">{context.regulome_score.probability}</div>
                                        </div>
                                    </div>
                                : null}
                            </div>
                            {context.nearby_snps ?
                                <NearbySNPsDrawing {...this.props} />
                            : null}
                            <div className={`thumbnail-gallery ${this.state.selectedThumbnail ? 'small-thumbnails' : ''}`} >
                                <button
                                    className={`thumbnail ${this.state.selectedThumbnail === 'valis' ? 'active' : ''}`}
                                    onClick={() => this.chooseThumbnail('valis')}
                                >
                                    <h4>Genome browser</h4>
                                    {(this.state.selectedThumbnail === null) ?
                                        <div>
                                            <div className="line"><i className="icon icon-chevron-circle-right" />Click here to view results in a genome browser.</div>
                                            <div className="image-container">
                                                <img src="/static/img/browser_thumbnail.png" alt="Click to view the genome browser" />
                                            </div>
                                        </div>
                                    : null}
                                </button>
                                <button
                                    className={`thumbnail ${this.state.selectedThumbnail === 'chip' ? 'active' : ''}`}
                                    onClick={() => this.chooseThumbnail('chip')}
                                >
                                    <h4>ChIP data</h4>
                                    {(this.state.selectedThumbnail === null) ?
                                        <div>
                                            <div className="line"><i className="icon icon-chevron-circle-right" />Click to see detailed ChIP-seq data.
                                                <div>(<b>{chipData.length}</b> result{chipData.length !== 1 ? 's' : ''})</div>
                                            </div>
                                            {chipData.length > 0 ?
                                                <BarChart data={chipData} dataFilter={'chip'} chartWidth={this.state.thumbnailWidth} chartLimit={10} chartOrientation={'horizontal'} />
                                            : null}
                                        </div>
                                    : null}
                                </button>
                                <button
                                    className={`thumbnail ${this.state.selectedThumbnail === 'chromatin' ? 'active' : ''}`}
                                    onClick={() => this.chooseThumbnail('chromatin')}
                                >
                                    <h4>Chromatin state</h4>
                                    {(this.state.selectedThumbnail === null) ?
                                        <div className="line"><i className="icon icon-chevron-circle-right" />Click to view chromatin data.
                                            <div>(<b>{chromatinData.length}</b> result{chromatinData.length !== 1 ? 's' : ''})</div>
                                        </div>
                                    : null}
                                </button>
                                <button
                                    className={`thumbnail ${this.state.selectedThumbnail === 'dnase' ? 'active' : ''}`}
                                    onClick={() => this.chooseThumbnail('dnase')}
                                >
                                    <h4>Accessibility</h4>
                                    {(this.state.selectedThumbnail === null) ?
                                        <div>
                                            <div className="line"><i className="icon icon-chevron-circle-right" />Click to see FAIRE-seq or DNase-seq experiments.
                                                <div>(<b>{dnaseData.length}</b> result{dnaseData.length !== 1 ? 's' : ''})</div>
                                            </div>
                                            {dnaseData.length > 0 ?
                                                <BarChart data={dnaseData} dataFilter={'dnase'} chartWidth={this.state.thumbnailWidth} chartLimit={10} chartOrientation={'horizontal'} />
                                            : null}
                                        </div>
                                    : null}
                                </button>
                                <button
                                    className={`thumbnail ${this.state.selectedThumbnail === 'motifs' ? 'active' : ''}`}
                                    onClick={() => this.chooseThumbnail('motifs')}
                                >
                                    <h4>Motifs</h4>
                                    {(this.state.selectedThumbnail === null) ?
                                        <div>
                                            <div className="line"><i className="icon icon-chevron-circle-right" />Click to see PWM and Footprint data and their associated sequence logos.</div>
                                            <Motifs {...this.props} urlBase={urlBase} limit={4} />
                                        </div>
                                    : null}
                                </button>
                                <button
                                    className={`thumbnail ${this.state.selectedThumbnail === 'qtl' ? 'active' : ''}`}
                                    onClick={() => this.chooseThumbnail('qtl')}
                                >
                                    <h4>QTL Data</h4>
                                    {(this.state.selectedThumbnail === null) ?
                                        <div className="line"><i className="icon icon-chevron-circle-right" />Click to see dsQTL and eQTL data.
                                            <div>(<b>{QTLData.length}</b> result{QTLData.length !== 1 ? 's' : ''})</div>
                                        </div>
                                    : null}
                                </button>
                                {(this.state.selectedThumbnail) ?
                                    <button
                                        className="thumbnail expand-thumbnail"
                                        onClick={() => this.chooseThumbnail(null)}
                                    >
                                        <h4><i className="icon icon-expand" /></h4>
                                    </button>
                                : null}
                            </div>
                            {(this.state.selectedThumbnail) ?
                                <div>
                                    {(this.state.selectedThumbnail === 'motifs') ?
                                        <div>
                                            <h4>Motifs</h4>
                                            <Motifs {...this.props} urlBase={urlBase} limit={0} classList={'padded'} />
                                        </div>
                                    : (this.state.selectedThumbnail === 'chip') ?
                                        <div>
                                            {chipData.length > 0 ?
                                                <div>
                                                    <BarChart data={chipData} dataFilter={'chip'} chartWidth={this.state.screenWidth} chartLimit={0} chartOrientation={'horizontal'} />
                                                    <ResultsTable data={chipData} displayTitle={'ChIP data'} dataFilter={this.state.selectedThumbnail} />
                                                </div>
                                            :
                                                <div>
                                                    <h4>ChIP experiments</h4>
                                                    <div className="error-message">No results available to display, please choose a different SNP.</div>
                                                </div>
                                            }
                                        </div>
                                    : (this.state.selectedThumbnail === 'dnase') ?
                                        <div>
                                            {dnaseData.length > 0 ?
                                                <ChartTable data={dnaseData} displayTitle={'FAIRE-seq and DNase-seq experiments'} chartWidth={Math.min(this.state.screenWidth, 1000)} dataFilter={'dnase'} />
                                            :
                                                <div>
                                                    <h4>FAIRE-seq and DNase-seq experiments</h4>
                                                    <div className="error-message">No results available to display, please choose a different SNP.</div>
                                                </div>
                                            }
                                        </div>
                                    : (this.state.selectedThumbnail === 'qtl') ?
                                        <ResultsTable data={QTLData} displayTitle={'dsQTL and eQTL data'} dataFilter={this.state.selectedThumbnail} />
                                    : (this.state.selectedThumbnail === 'chromatin') ?
                                        <ResultsTable data={chromatinData} displayTitle={'Chromatin data'} dataFilter={this.state.selectedThumbnail} />
                                    : (this.state.selectedThumbnail === 'valis') ?
                                        <div>
                                            <h4>Genome browser</h4>
                                            <div className="error-message">This will be added in the next PR!</div>
                                        </div>
                                    : null}
                                </div>
                            : null}
                        </div>
                    </div>
                : null}

                {(context.peak_details) ?
                    <div>
                        <div className="lead-logo"><a href="/"><img src="/static/img/RegulomeLogoFinal.gif" alt="Regulome logo" /></a></div>
                        <PeakDetails {...this.props} />
                    </div>
                : null}

                {(context.peak_details === undefined && !notification.startsWith('Success')) ?
                    <div>
                        <div className="lead-logo"><a href="/"><img src="/static/img/RegulomeLogoFinal.gif" alt="Regulome logo" /></a></div>
                        <AdvSearch {...this.props} />
                        <div className="data-types">
                            <div className="data-types-instructions"><h4>Use RegulomeDB to identify DNA features and regulatory elements in non-coding regions of the human genome by entering ...</h4></div>
                            <div className="data-types-block">
                                {dataTypeStrings.map(d =>
                                    <DataType type={d.type} explanation={d.explanation} key={d.type} />
                                )}
                            </div>
                        </div>
                    </div>
                : null}

            </div>
        );
    }
}

RegulomeSearch.propTypes = {
    context: PropTypes.object.isRequired,
    onChange: PropTypes.func,
    region: PropTypes.string,
};

RegulomeSearch.defaultProps = {
    onChange: null,
    region: null,
};

RegulomeSearch.contextTypes = {
    location_href: PropTypes.string,
    navigate: PropTypes.func,
};

globals.contentViews.register(RegulomeSearch, 'region-search');
