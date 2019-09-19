import React from 'react';
import PropTypes from 'prop-types';
import _ from 'underscore';
import url from 'url';
import * as globals from './globals';
import { SortTablePanel, SortTable } from './sorttable';
import { Motifs } from './motifs';
import { BarChart, ChartList, ChartTable, lookupChromatinNames } from './visualizations';
import { requestSearch } from './objectutils';
import GenomeBrowser from './genome_browser';

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
    value: {
        title: 'Chromatin state',
        display: item => lookupChromatinNames(item.value),
    },
    peak: {
        title: 'Chromatin state window',
        getValue: item => `${item.chrom}:${item.start}..${item.end}`,
    },
    biosample_term_name: {
        title: 'Biosample',
        getValue: item => (item.biosample_ontology ? item.biosample_ontology.term_name : ''),
    },
    organ_slims: {
        title: 'Organ',
        getValue: item => (item.biosample_ontology && item.biosample_ontology.organ_slims && item.biosample_ontology.organ_slims.length > 0 ? item.biosample_ontology.organ_slims.join(', ') : ''),
    },
    dataset: {
        title: 'Dataset',
        display: item => <a href={item.dataset}>{item.dataset.split('/')[2]}</a>,
    },
    file: {
        title: 'File',
        display: item => <a href={`/files/${item.file}/`}>{item.file}</a>,
    },
};

const dataColumnsQTL = {
    method: {
        title: 'Method',
    },
    peak: {
        title: 'QTL location',
        getValue: item => `${item.chrom}:${item.start}..${item.end}`,
    },
    biosample_term_name: {
        title: 'Biosample',
        getValue: item => (item.biosample_ontology ? item.biosample_ontology.term_name : ''),
    },
    value: {
        title: 'Targets',
        getValue: item => item.value || 'N/A',
    },
    dataset: {
        title: 'Dataset',
        display: item => <a href={item.dataset}>{item.dataset.split('/')[2]}</a>,
    },
    file: {
        title: 'File',
        display: item => <a href={`/files/${item.file}/`}>{item.file}</a>,
    },
};

const dataColumnsQTLShort = {
    method: {
        title: 'Method',
    },
    biosample_term_name: {
        title: 'Biosample',
        getValue: item => (item.biosample_ontology ? item.biosample_ontology.term_name : ''),
    },
    value: {
        title: 'Targets',
        getValue: item => item.value || 'N/A',
    },
};

const dataColumnsOther = {
    method: {
        title: 'Method',
    },
    peak: {
        title: 'Peak location',
        getValue: item => `${item.chrom}:${item.start}..${item.end}`,
    },
    biosample_term_name: {
        title: 'Biosample',
        getValue: item => (item.biosample_ontology ? item.biosample_ontology.term_name : ''),
    },
    targets: {
        title: 'Targets',
        getValue: item => (item.targets && item.targets.length > 0 ? item.targets.join(', ') : ''),
    },
    organ_slims: {
        title: 'Organ',
        getValue: item => (item.biosample_ontology ? item.biosample_ontology.organ_slims.join(', ') : ''),
    },
    dataset: {
        title: 'Dataset',
        display: item => <a href={item.dataset}>{item.dataset.split('/')[2]}</a>,
    },
    file: {
        title: 'File',
        display: item => <a href={`/files/${item.file}/`}>{item.file}</a>,
    },
    value: {
        title: 'Value',
    },
    strand: {
        title: 'Strand',
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
                {(context.variants && context.variants.length > 0) ?
                    <p>Searched coordinates: {Object.keys(context.variants)[0]}</p>
                : null}
                {(context.regulome_score && context.regulome_score.probability && context.regulome_score.ranking) ?
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
        coordinate = +Object.keys(context.variants)[0].split('-')[1];
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

export const ResultsTable = (props) => {
    const data = props.data;
    const displayTitle = props.displayTitle;
    let dataColumns = null;
    if (props.dataFilter === 'chromatin') {
        dataColumns = dataColumnsChromatin;
    } else if (props.dataFilter === 'qtl') {
        if (props.shortened) {
            dataColumns = dataColumnsQTLShort;
        } else {
            dataColumns = dataColumnsQTL;
        }
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
                    <div className="error-message">{props.errorMessage}</div>
                </div>
            }
        </div>
    );
};

ResultsTable.propTypes = {
    data: React.PropTypes.array.isRequired,
    dataFilter: PropTypes.string,
    displayTitle: PropTypes.string.isRequired,
    errorMessage: PropTypes.string.isRequired,
    shortened: PropTypes.bool,
};

ResultsTable.defaultProps = {
    dataFilter: '',
    shortened: false,
};

const appendDatasetsToQuery = (query, chunkDatasets) => {
    let searchQuery = query;
    chunkDatasets.forEach((d) => {
        const dataset = d.dataset;
        searchQuery += `&dataset=${dataset}`;
    });
    return searchQuery;
};

// size of each query (how many datasets)
const chunkSize = 10;
// number of files to display on genome browser
const displaySize = 20;

class RegulomeSearch extends React.Component {
    constructor() {
        super();

        this.applicationRef = null;
        this.state = {
            thumbnailWidth: 0,
            screenWidth: 0,
            allFiles: [],
            includedFiles: [],
            multipleBrowserPages: false,
            browserCurrentPage: 1,
            browserTotalPages: 1,
        };

        // Bind this to non-React methods.
        this.requests = [];
        this.onFilter = this.onFilter.bind(this);
        this.chooseThumbnail = this.chooseThumbnail.bind(this);
        this.updateDimensions = this.updateDimensions.bind(this);
        this.addNewFiles = this.addNewFiles.bind(this);
        this.handlePagination = this.handlePagination.bind(this);
        this.chunkingDataset = this.chunkingDataset.bind(this);
    }

    componentDidMount() {
        this.updateDimensions();
        window.addEventListener('resize', this.updateDimensions);
        // if page loads on Valis thumbnail, we need to load extra data (all visualizable files associated with datasets for the page)
        // if the page does not load on the Valis thumbnail, we don't want to bother because the page will load much faster without all those queries
        if (this.context.location_href.split('/thumbnail=')[1] === 'valis') {
            this.chooseThumbnail('valis');
        }
    }

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        // update for new properties, new href, new page of results, or resizing of screen
        const hrefUpdate = this.context.location_href !== nextContext.location_href;
        const screenSizeUpdate = this.state.screenWidth !== this.applicationRef.offsetWidth;
        const pageUpdate = this.state.browserCurrentPage !== nextState.browserCurrentPage;
        return (!_.isEqual(this.props, nextProps) || hrefUpdate || screenSizeUpdate || pageUpdate);
    }

    onFilter(e) {
        if (this.props.onChange) {
            const search = e.currentTarget.getAttribute('href');
            this.props.onChange(search);
            e.stopPropagation();
            e.preventDefault();
        }
    }

    updateThumbnail(newThumbnail) {
        // if thumbnail is selected, navigate to link which will trigger a re-rendering
        const baseUri = this.context.location_href.split('/thumbnail=')[0];
        if (newThumbnail === null) {
            this.context.navigate(baseUri);
        } else {
            this.context.navigate(`${baseUri}/thumbnail=${newThumbnail}`);
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

    addNewFiles(searchQuery) {
        return new Promise((ok) => {
            requestSearch(searchQuery).then((results) => {
                const newFiles = results ? results['@graph'] : [];
                this.setState(prevState => ({
                    allFiles: [...prevState.allFiles, ...newFiles],
                }));
                ok('success');
            });
        });
    }

    handlePagination(pageDirection) {
        if (pageDirection === 'plus') {
            const pageIdx = this.state.browserCurrentPage;
            const startIdx = pageIdx * displaySize;
            const endIdx = (pageIdx + 1) * displaySize;
            const includedFiles = this.state.allFiles.slice(startIdx, endIdx);
            this.setState(prevState => ({
                includedFiles,
                browserCurrentPage: prevState.browserCurrentPage + 1,
            }));
        } else {
            const pageIdx = this.state.browserCurrentPage - 2;
            const startIdx = pageIdx * displaySize;
            const endIdx = ((pageIdx + 1) * displaySize);
            const includedFiles = this.state.allFiles.slice(startIdx, endIdx);
            this.setState(prevState => ({
                includedFiles,
                browserCurrentPage: prevState.browserCurrentPage - 1,
            }));
        }
    }

    chunkingDataset(requests, startIdxWrapper, endIdxWrapper, datasets, baseQuery) {
        // iterate over queries
        for (let chunkIdx = startIdxWrapper; chunkIdx < endIdxWrapper; chunkIdx += 1) {
            // subset of datasets for the query
            const startIdx = chunkIdx * chunkSize;
            const endIdx = (chunkIdx + 1) * chunkSize;
            let chunkDatasets = [];
            chunkDatasets = datasets.slice(startIdx, endIdx);
            // this is the query
            const searchQuery = appendDatasetsToQuery(baseQuery, chunkDatasets);
            // add results of query to full array of results
            requests[chunkIdx] = this.addNewFiles(searchQuery);
        }
        return requests;
    }

    chooseThumbnail(chosen) {
        if (chosen === 'valis' && this.state.allFiles.length < 1) {
            // Valis tab requires additional queries, unlike other tabs, in order to collect all the visualizable files corresponding to the SNP datasets
            const assembly = 'hg19';
            // there can be a lot of datasets to query for visualizable files so we are going to do it in chunks
            const duplicatedExperimentDatasets = this.props.context['@graph'].filter(d => d.dataset.includes('experiment'));
            // for some reason we are getting duplicates here so we need to filter those out
            const experimentDatasets = _.uniq(duplicatedExperimentDatasets, d => d.dataset);
            // each query corresponds to a promise and 'requests' keeps track of whether the query has successfully returned data
            const requests = [];
            // in order to append dataset information to file data, we generate lookups for biosample, assay, and target list by dataset
            const biosampleMap = {};
            const assayMap = {};
            const targetMap = {};
            experimentDatasets.forEach((dataset) => {
                biosampleMap[dataset.dataset] = dataset.biosample_ontology.term_name || '';
                assayMap[dataset.dataset] = dataset.method || '';
                targetMap[dataset.dataset] = dataset.targets ? dataset.targets.join(', ') : '';
            });
            // we have to construct queries for files corresponding to ChIP-seq, DNase-seq, and FAIRE-seq datasets separately because we want different files for each
            const chipDatasets = experimentDatasets.filter(d => d.method === 'ChIP-seq');
            const dnaseDatasets = experimentDatasets.filter(d => d.method === 'DNase-seq');
            const faireDatasets = experimentDatasets.filter(d => d.method === 'FAIRE-seq');
            // how many queries we need to run based on number of datasets per query
            const numChipChunks = Math.ceil(Object.keys(chipDatasets).length / chunkSize);
            const numDnaseChunks = Math.ceil(Object.keys(dnaseDatasets).length / chunkSize);
            const numFaireChunks = Math.ceil(Object.keys(faireDatasets).length / chunkSize);
            // the goal is to pick 1 each bigWig and bigBed file per experiment, with the following output types and replicate numbers for the different assays:
            // DNase → peaks, read-depth normalized signal (rep1)
            // ChIP → peaks and background as input for IDR, signal p-value (rep1,2) or rep1
            // FAIRE → peaks, signal
            // we start by collecting all files that satisfy these conditions
            const chipBaseQuery = `type=File&assembly=${assembly}&file_format=bigBed&file_format=bigWig&output_type=peaks+and+background+as+input+for+IDR&output_type=signal+p-value&sort=dataset&biological_replicates=1&limit=all`;
            const dnaseBaseQuery = `type=File&assembly=${assembly}&file_format=bigBed&file_format=bigWig&output_type=peaks&output_type=read-depth+normalized+signal&sort=dataset&biological_replicates=1&biological_replicates!=2&limit=all`;
            const faireBaseQuery = `type=File&assembly=${assembly}&file_format=bigBed&file_format=bigWig&output_type=peaks&output_type=signal&sort=dataset&limit=all`;
            // cannot query all datasets at once (query string is too long), so we need to construct series of queries with a reasonable number of datasets each
            // we construct an array of Promises for all the queries
            this.chunkingDataset(requests, 0, numChipChunks, chipDatasets, chipBaseQuery);
            this.chunkingDataset(requests, 0, numDnaseChunks, dnaseDatasets, dnaseBaseQuery);
            this.chunkingDataset(requests, 0, numFaireChunks, faireDatasets, faireBaseQuery);

            // once all the data has been retrieved, narrow down full set of files to 2 per dataset
            Promise.all(requests).then(() => {
                // sort by dataset
                const sortedFiles = _.sortBy(this.state.allFiles, obj => obj.dataset);
                // add biosample, assay, and target list from dataset to file information
                sortedFiles.forEach((d) => {
                    d.biosample = biosampleMap[d.dataset];
                    d.assay = assayMap[d.dataset];
                    d.target = targetMap[d.dataset];
                });
                // do first pass at filtering down full file list
                const trimmedFiles0 = sortedFiles.filter((file) => {
                    const DatasetFiles0 = sortedFiles.filter(f2 => f2.dataset === file.dataset);
                    if (DatasetFiles0.length > 2) {
                        // if there are more than 2 files for a ChIP-seq dataset, we prefer rep 1,2 to rep 1
                        if (file.assay === 'ChIP-seq') {
                            if (file.biological_replicates.length === 1) {
                                return false;
                            }
                            return true;
                        // if there are more than 2 files for a DNase-seq dataset, we prefer rep 1
                        } else if (file.assay === 'DNase-seq') {
                            if (file.biological_replicates.length === 1) {
                                return true;
                            }
                            return false;
                        // if there are more than 2 files for a FAIRE-seq dataset, we prefer multiple replicates
                        } else if (file.assay === 'FAIRE-seq') {
                            if (file.biological_replicates.length === 0) {
                                return false;
                            }
                            return true;
                        }
                        return true;
                    }
                    return true;
                });
                // it is still possible to have multiple files per dataset
                // in those cases, we will filter for only "released" files
                const trimmedFiles = trimmedFiles0.filter((file) => {
                    const datasetFiles = trimmedFiles0.filter(f2 => f2.dataset === file.dataset);
                    // only filter by file status if there are still more than 2 files for the dataset
                    if (datasetFiles.length > 2) {
                        if (file.status === 'released') {
                            return true;
                        }
                        return false;
                    }
                    return true;
                });
                // if there are more filtered files than we want to display on one page, we will paginate
                if (trimmedFiles.length > displaySize) {
                    const includedFiles = trimmedFiles.slice(0, displaySize);
                    const browserTotalPages = Math.ceil(trimmedFiles.length / displaySize);
                    this.setState({
                        allFiles: trimmedFiles,
                        includedFiles,
                        multipleBrowserPages: true,
                        browserTotalPages,
                        browserCurrentPage: 1,
                    }, () => {
                        this.updateThumbnail(chosen);
                    });
                } else {
                    this.setState({
                        allFiles: trimmedFiles,
                        includedFiles: trimmedFiles,
                    }, () => {
                        this.updateThumbnail(chosen);
                    });
                }
            });
        } else {
            // all necessary data is already available for all other tabs
            this.updateThumbnail(chosen);
        }
    }

    render() {
        const context = this.props.context;
        const urlBase = this.context.location_href.split('/regulome-search')[0];
        const coordinates = Object.keys(context.variants)[0];
        const allData = context['@graph'] || [];
        const QTLData = allData.filter(d => (d.method && d.method.indexOf('QTL') !== -1));
        const chipData = allData.filter(d => d.method === 'ChIP-seq');
        const dnaseData = allData.filter(d => (d.method === 'FAIRE-seq' || d.method === 'DNase-seq'));
        const chromatinData = allData.filter(d => (d.method === 'chromatin state'));
        const thumbnail = this.context.location_href.split('/thumbnail=')[1] || null;

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
                                {(context.variants) ?
                                    <div className="notification-line">
                                        <div className="notification-label">Searched coordinates</div>
                                        <div className="notification">{Object.keys(context.variants)[0]}</div>
                                    </div>
                                : null}
                                {allData && allData.length > 0 ?
                                    <div className="notification-line">
                                        <div className="notification-label">Peaks</div>
                                        <div className="notification">{allData.length - chromatinData.length} peaks</div>
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
                            {context.nearby_snps && context.nearby_snps.length > 0 ?
                                <NearbySNPsDrawing {...this.props} />
                            : null}
                            <div className={`thumbnail-gallery ${thumbnail ? 'small-thumbnails' : ''}`} >
                                <button
                                    className={`thumbnail ${thumbnail === 'valis' ? 'active' : ''}`}
                                    onClick={() => this.chooseThumbnail('valis')}
                                >
                                    <h4>Genome browser</h4>
                                    {(thumbnail === null) ?
                                        <div>
                                            <div className="line"><i className="icon icon-chevron-circle-right" />Click here to view results in a genome browser.</div>
                                            <div className="image-container">
                                                <img src="/static/img/browser-thumbnail-v2.png" alt="Click to view the genome browser" />
                                            </div>
                                        </div>
                                    : null}
                                </button>
                                <button
                                    className={`thumbnail ${thumbnail === 'chip' ? 'active' : ''}`}
                                    onClick={() => this.chooseThumbnail('chip')}
                                >
                                    <h4>ChIP data</h4>
                                    {(thumbnail === null) ?
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
                                    className={`thumbnail ${thumbnail === 'chromatin' ? 'active' : ''}`}
                                    onClick={() => this.chooseThumbnail('chromatin')}
                                >
                                    <h4>Chromatin state</h4>
                                    {(thumbnail === null) ?
                                        <div>
                                            <div className="line"><i className="icon icon-chevron-circle-right" />Click to view chromatin data.
                                                <div>(<b>{chromatinData.length}</b> result{chromatinData.length !== 1 ? 's' : ''})</div>
                                            </div>
                                            {chromatinData.length > 0 ?
                                                <BarChart data={chromatinData} dataFilter={'chromatin'} chartWidth={this.state.thumbnailWidth} chartLimit={10} chartOrientation={'horizontal'} />
                                            : null}
                                        </div>
                                    : null}
                                </button>
                                <button
                                    className={`thumbnail ${thumbnail === 'dnase' ? 'active' : ''}`}
                                    onClick={() => this.chooseThumbnail('dnase')}
                                >
                                    <h4>Accessibility</h4>
                                    {(thumbnail === null) ?
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
                                    className={`thumbnail ${thumbnail === 'motifs' ? 'active' : ''}`}
                                    onClick={() => this.chooseThumbnail('motifs')}
                                >
                                    <h4>Motifs</h4>
                                    {(thumbnail === null) ?
                                        <div>
                                            <div className="line"><i className="icon icon-chevron-circle-right" />Click to see PWM and Footprint data and their associated sequence logos.</div>
                                            <Motifs {...this.props} urlBase={urlBase} limit={4} />
                                        </div>
                                    : null}
                                </button>
                                <button
                                    className={`thumbnail ${thumbnail === 'qtl' ? 'active' : ''}`}
                                    onClick={() => this.chooseThumbnail('qtl')}
                                >
                                    <h4>QTL Data</h4>
                                    {(thumbnail === null) ?
                                        <div>
                                            <div className="line"><i className="icon icon-chevron-circle-right" />Click to see dsQTL and eQTL data.
                                                <div>(<b>{QTLData.length}</b> result{QTLData.length !== 1 ? 's' : ''})</div>
                                            </div>
                                            <ResultsTable data={QTLData} displayTitle={'dsQTL and eQTL data'} dataFilter={'qtl'} errorMessage={'No result table is available for this SNP.'} shortened />
                                        </div>
                                    : null}
                                </button>
                                {(thumbnail) ?
                                    <button
                                        className="thumbnail expand-thumbnail"
                                        onClick={() => this.chooseThumbnail(null)}
                                    >
                                        <h4><i className="icon icon-expand" /></h4>
                                    </button>
                                : null}
                            </div>
                            {(thumbnail) ?
                                <div>
                                    {(thumbnail === 'motifs') ?
                                        <div>
                                            <h4>Motifs</h4>
                                            <Motifs {...this.props} urlBase={urlBase} limit={0} classList={'padded'} />
                                        </div>
                                    : (thumbnail === 'valis') ?
                                        <div>
                                            <GenomeBrowser
                                                fixedHeight={this.state.multipleBrowserPages}
                                                files={this.state.includedFiles}
                                                expanded
                                                assembly={'hg19'}
                                                coordinates={coordinates}
                                            />
                                            {this.state.multipleBrowserPages ?
                                                <div className="pagination-container">
                                                    <div>
                                                        <button disabled={this.state.browserCurrentPage === 1} className="btn btn-page btn-page-left" onClick={() => this.handlePagination('minus')}><i className="icon icon-chevron-left" /></button>
                                                        <button disabled={this.state.browserCurrentPage === this.state.browserTotalPages} className="btn btn-page" onClick={() => this.handlePagination('plus')}><i className="icon icon-chevron-right" /></button>
                                                    </div>
                                                    <div>Page <b>{this.state.browserCurrentPage}</b> of <b>{this.state.browserTotalPages}</b></div>
                                                </div>
                                            : null}
                                        </div>
                                    : (thumbnail === 'chip') ?
                                        <div>
                                            {chipData.length > 0 ?
                                                <div>
                                                    <BarChart data={chipData} dataFilter={'chip'} chartWidth={this.state.screenWidth} chartLimit={0} chartOrientation={'horizontal'} />
                                                    <ResultsTable data={chipData} displayTitle={'ChIP data'} dataFilter={thumbnail} errorMessage={'No result table is available for this SNP.'} />
                                                </div>
                                            :
                                                <div>
                                                    <h4>ChIP experiments</h4>
                                                    <div className="error-message">No results available to display, please choose a different SNP.</div>
                                                </div>
                                            }
                                        </div>
                                    : (thumbnail === 'dnase') ?
                                        <div>
                                            {dnaseData.length > 0 ?
                                                <ChartList data={dnaseData} displayTitle={'FAIRE-seq and DNase-seq experiments'} chartWidth={Math.min(this.state.screenWidth, 1000)} dataFilter={thumbnail} />
                                            :
                                                <div>
                                                    <h4>FAIRE-seq and DNase-seq experiments</h4>
                                                    <div className="error-message">No results available to display, please choose a different SNP.</div>
                                                </div>
                                            }
                                        </div>
                                    : (thumbnail === 'qtl') ?
                                        <ResultsTable data={QTLData} displayTitle={'dsQTL and eQTL data'} dataFilter={thumbnail} errorMessage={'No result table is available for this SNP.'} />
                                    : (thumbnail === 'chromatin') ?
                                        <div>
                                            {chromatinData.length > 0 ?
                                                <ChartTable data={chromatinData} displayTitle={'Chromatin state'} chartWidth={Math.min(this.state.screenWidth, 1000)} />
                                            : null}
                                        </div>
                                    : (thumbnail === 'valis') ?
                                        <div>
                                            <h4>Genome browser</h4>
                                            <div className="error-message">This will be added in the next PR!</div>
                                        </div>
                                    : null}
                                </div>
                            : null}
                        </div>
                    </div>
                :
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
                }

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

export default {
    ResultsTable,
};

globals.contentViews.register(RegulomeSearch, 'regulome-search');
