import React from 'react';
import PropTypes from 'prop-types';
import _ from 'underscore';
import url from 'url';
import * as globals from './globals';
import { SortTablePanel, SortTable } from './sorttable';
import { Motifs } from './motifs';
import { BarChart, ChartList, lookupChromatinNames } from './visualizations';
import { requestSearch } from './objectutils';
import GenomeBrowser from './genome_browser';
import NearbySNPsDrawing from './snps_diagram';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../libs/bootstrap/modal';
import { FacetList, filterByAllSelectedFilters } from './facets';
import { ChromatinView } from './chromatin_view';

const screenMediumMax = 787;
const screenSmallMax = 483;

const fieldsToSave = '&field=cloud_metadata.url&field=title&field=href&field=path&field=file_format_type&field=dataset&field=biosample_ontology.term_name&field=target&field=file_format&field=biosample_ontology.organ_slims&field=biosample_ontology.cell_slims&field=assay_term_name&field=biological_replicates';

// Define facets parameters
const facetParameters = [
    {
        type: 'file_format',
        title: 'File format',
        typeahead: false,
    },
    {
        type: 'organ',
        title: 'Organ / cell type',
        typeahead: true,
    },
    {
        type: 'biosample',
        title: 'Biosample',
        typeahead: true,
    },
    {
        type: 'assay',
        title: 'Method',
        typeahead: false,
    },
    {
        type: 'target',
        title: 'Target',
        typeahead: true,
    },
];

// Fetch data from href
function fetchData(href, fetch) {
    return fetch(href, {
        method: 'GET',
        headers: {
            Accept: 'application/json',
        },
    }).then((response) => {
        if (response.ok) {
            return response.json();
        }
        throw new Error('not ok');
    }).catch((e) => {
        console.log('OBJECT LOAD ERROR: %s', e);
    });
}

const dataTypeStrings = [
    {
        type: 'dbSNP IDs',
        explanation: 'Enter dbSNP IDs or upload a list of dbSNP IDs to identify DNA features and regulatory elements that contain the coordinate of the SNPs.',
    },
    {
        type: 'Single nucleotides',
        explanation: 'Enter hg19 coordinates for a single nucleotide as 0-based. These coordinates will be mapped to dbSNP IDs (if available) in addition to identifying DNA features and regulatory elements that contain the input coordinates.',
    },
    {
        type: 'A chromosomal region',
        explanation: 'Enter hg19 chromosomal regions, such as a promoter region upstream of a gene, as 0-based coordinates. All dbSNP IDs with an minor allele frequency >1% that are found in this region will be used to identify DNA features and regulatory elements that contain the coordinate of the SNPs.',
    },
];

const exampleEntries = [
    {
        label: 'multiple dbSNPs',
        input: 'rs75982468\nrs10117931\nrs11749731\nrs11160830\nrs2808110\nrs2839467\nrs147375898\nrs111686660\nrs11145227\nrs190318542\nrs148232663\nrs74792881\nrs3087079\nrs2166521\nrs62319725',
    },
    {
        label: 'coordinates ranges',
        input: 'chr12:69360231-69360232\nchr10:5852536-5852537\nchr10:11699181-11699182\nchr1:39026790-39026791\nchr1:109726205-109726206',
    },
];

// Columns for different subsets of data
const dataColumnsChromatin = {
    value: {
        title: 'Chromatin state',
        display: item => lookupChromatinNames(item.value),
    },
    biosample_term_name: {
        title: 'Biosample',
        getValue: item => (item.biosample_ontology ? item.biosample_ontology.term_name : ''),
    },
    biosample_classification: {
        title: 'Classification',
        getValue: item => (item.biosample_ontology ? item.biosample_ontology.classification : ''),
    },
    organ_slims: {
        title: 'Organ',
        getValue: item => (item.biosample_ontology && item.biosample_ontology.organ_slims && item.biosample_ontology.organ_slims.length > 0 ? item.biosample_ontology.organ_slims.join(', ') : ''),
    },
    dataset: {
        title: 'Dataset',
        display: item => <a href={item.dataset}>{item.dataset.split('/')[4]}</a>,
    },
    file: {
        title: 'File',
        display: item => <a href={`https://encodeproject.org/files/${item.file}/`}>{item.file}</a>,
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
        display: item => <a href={item.dataset}>{item.dataset.split('/')[4]}</a>,
    },
    file: {
        title: 'File',
        display: item => <a href={`https://encodeproject.org//files/${item.file}/`}>{item.file}</a>,
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

const dataColumnsChip = {
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
        display: item => <a href={item.dataset}>{item.dataset.split('/')[4]}</a>,
    },
    file: {
        title: 'File',
        display: item => <a href={`https://encodeproject.org/files/${item.file}/`}>{item.file}</a>,
    },
    value: {
        title: 'Value',
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
            <React.Fragment>
                <h4>
                    <div className="data-type" onClick={this.handleInfo} onKeyDown={this.handleInfo} role="button" tabIndex={0}>
                        <i className={`icon ${(this.state.open) ? ' icon-caret-down' : 'icon-caret-right'}`} /> {this.props.type}
                    </div>
                </h4>
                <p className={`data-type-explanation${(this.state.open) ? ' show' : ''}`}>{this.props.explanation}</p>
            </React.Fragment>
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

const AssemblySelector = (props) => {
    // need to display a focus style on "switch-label" because the input default checkbox is hidden and focus is therefore hidden
    const [focus, toggleFocus] = React.useState(false);

    return (
        <div className="assembly-switch">
            <div className={`switch-label ${props.selection === 'GRCh38' ? 'active' : ''}`}>GRCh38</div>
            <label
                className={`switch ${focus ? 'focused' : ''}`}
                htmlFor="assembly-switch"
                aria-label={`Assembly is ${props.selection}. Toggle to switch to ${props.selection === 'GRCh38' ? 'hg19' : 'GRCh38'}`}
            >
                <input
                    type="checkbox"
                    name="assembly-switch"
                    onChange={() => { props.onSelection(props.selection); }}
                    onKeyDown={(e) => { props.onSelection(props.selection, e); }}
                    checked={props.selection === 'hg19'}
                    id="assembly-switch"
                    aria-checked="false"
                    tabIndex="0"
                    onFocus={() => { toggleFocus(true); }}
                    onBlur={() => { toggleFocus(false); }}
                />
                <span className="slider round" />
            </label>
            <div className={`switch-label ${props.selection === 'hg19' ? 'active' : ''}`}>hg19</div>
        </div>
    );
};

AssemblySelector.propTypes = {
    selection: PropTypes.string.isRequired,
    onSelection: PropTypes.func.isRequired,
};

class AdvSearch extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            searchInput: '',
            maf: 0.01,
            modal: null,
            genome: props.genome,
        };

        this.handleChange = this.handleChange.bind(this);
        this.handleOnFocus = this.handleOnFocus.bind(this);
        this.handleExample = this.handleExample.bind(this);
        this.hideModal = this.hideModal.bind(this);
        this.handleSelection = this.handleSelection.bind(this);
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

    handleSelection(input, e) {
        // for accessibility, execute on spacebar click but not other events
        const spacebarKeyCode = 32;
        if (e && e.keyCode === spacebarKeyCode) {
            e.preventDefault();
            e.stopPropagation();
        }
        if ((e && e.keyCode === spacebarKeyCode) || !(e)) {
            this.props.toggleGenome(input);
            if (input === 'GRCh38') {
                this.setState({ genome: 'hg19' });
            } else {
                this.setState({ genome: 'GRCh38' });
            }
        }
    }

    handleOnFocus() {
        const summaryHref = `/regulome-summary/?regions=${this.state.searchInput.replaceAll('\n', '%0D%0A')}&genome=${this.state.genome}&maf=${this.state.maf}`;
        if (this.state.searchInput) {
            fetchData(summaryHref, this.context.fetch).then((response) => {
                if (response.total > 0) {
                    this.context.navigate(summaryHref);
                } else {
                    this.setState({ modal: 'Please define valid SNP(s) to complete a search.' });
                }
            });
        } else {
            this.setState({ modal: 'Please define at least one SNP to complete a search.' });
        }
    }

    hideModal() {
        this.setState({ modal: null });
    }

    render() {
        const context = this.props.context;
        const searchBase = url.parse(this.context.location_href).search || '';

        return (
            <React.Fragment>
                {this.state.modal ?
                  <Modal closeModal={this.hideModal}>
                      <ModalHeader title="Invalid SNP(s)." closeModal={this.hideModal} />
                      <ModalBody>
                          <p>{this.state.modal}</p>
                      </ModalBody>
                      <ModalFooter closeModal={this.hideModal} cancelTitle="OK" />
                  </Modal>
                : null}
                <div id="panel1" className="adv-search-form" autoComplete="off" aria-labelledby="tab1" onSubmit={this.handleOnFocus} >
                    <div className="form-group">
                        <label htmlFor="annotation">
                            <i className="icon icon-search" />Search by dbSNP ID or coordinate range: <AssemblySelector
                                selection={this.state.genome}
                                onSelection={this.handleSelection}
                                key={this.state.genome}
                            />
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

                            <input type="submit" value="Search" className="btn btn-sm btn-info" onClick={this.handleOnFocus} />
                        </div>
                    </div>
                </div>
                {(context.notification && context.notification !== 'No annotations found') ?
                    <div className="notification">{context.notification}</div>
                : null}
                {(context.query_coordinates && context.query_coordinates.length > 0) ?
                    <p>Searched coordinates: {context.query_coordinates[0]}</p>
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
            </React.Fragment>
        );
    }
}

AdvSearch.propTypes = {
    context: PropTypes.object.isRequired,
    genome: PropTypes.string.isRequired,
    toggleGenome: PropTypes.func.isRequired,
};

AdvSearch.contextTypes = {
    location_href: PropTypes.string,
    navigate: PropTypes.func,
    fetch: PropTypes.func,
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
    } else if (props.dataFilter === 'chip') {
        dataColumns = dataColumnsChip;
    }
    const colCount = Object.keys(dataColumns).length;

    let maxRows = 0;
    if (props.shortened) {
        maxRows = 10;
    }

    return (
        <React.Fragment>
            {data.length > 0 ?
                <SortTablePanel title="Results">
                    <SortTable list={data} columns={dataColumns} maxRows={maxRows} />
                </SortTablePanel>
            :
                <table className="table table-sortable table-panel">
                    {displayTitle ? <tr className="table-section" key="title"><th colSpan={colCount}>{displayTitle}</th></tr> : null}
                    <thead>
                        <tr key="header">
                            {Object.keys(dataColumns).map(columnId => <th key={columnId}>{dataColumns[columnId].title}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td colSpan={`${colCount}`}>{props.errorMessage}</td>
                        </tr>
                    </tbody>
                </table>
            }
        </React.Fragment>
    );
};

ResultsTable.propTypes = {
    data: PropTypes.array.isRequired,
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
        const dataset = d.dataset_rel;
        searchQuery += `&dataset=${dataset}`;
    });
    return searchQuery;
};

// size of each query (how many datasets)
const chunkSize = 12;
// number of files to display on genome browser
const displaySize = 20;
// Default number of populations to display for allele frequencies.
const defaultDisplayCount = 3;
const populationOrder = [
    'GnomAD',
    '1000Genomes',
    'TOPMED',
    'GnomAD_exomes',
    'ExAC',
    'NorthernSweden',
    'ALSPAC',
    'TWINSUK',
    'Vietnamese',
    'GoESP',
    'Estonian',
    'PAGE_STUDY',
    'source unknown',
];

const loadData = searchQuery => new Promise(((ok) => {
    requestSearch(searchQuery).then((results) => {
        const newFiles = (results && results['@graph']) ? results['@graph'] : [];
        ok(newFiles);
    });
}));

const chunkingDataset = (requests, startIdxWrapper, endIdxWrapper, datasets, baseQuery) => {
    // iterate over queries
    const promiseList = [];
    for (let chunkIdx = startIdxWrapper; chunkIdx < endIdxWrapper; chunkIdx += 1) {
        // subset of datasets for the query
        const startIdx = chunkIdx * chunkSize;
        const endIdx = (chunkIdx + 1) * chunkSize;
        let chunkDatasets = [];
        chunkDatasets = datasets.slice(startIdx, endIdx);
        // this is the query
        const searchQuery = appendDatasetsToQuery(baseQuery, chunkDatasets);
        // add results of query to full array of results
        promiseList.push(loadData(searchQuery));
    }
    return promiseList;
};

export class RegulomeSearch extends React.Component {
    constructor(props) {
        super(props);

        this.applicationRef = null;
        this.state = {
            thumbnailWidth: 0,
            screenWidth: 0,
            allFiles: [],
            filteredFiles: [],
            includedFiles: [],
            multipleBrowserPages: false,
            browserCurrentPage: 1,
            browserTotalPages: 1,
            selectedFilters: [],
            facetDisplay: false,
            showMoreFreqs: false,
            genome: props.context.genome || props.context.assembly || 'GRCh38',
        };

        // Bind this to non-React methods.
        this.requests = [];
        this.onFilter = this.onFilter.bind(this);
        this.loadHg19ValisData = this.loadHg19ValisData.bind(this);
        this.loadGRCh38ValisData = this.loadGRCh38ValisData.bind(this);
        this.chooseThumbnail = this.chooseThumbnail.bind(this);
        this.updateDimensions = this.updateDimensions.bind(this);
        this.handlePagination = this.handlePagination.bind(this);
        this.handleFacetList = this.handleFacetList.bind(this);
        this.toggleGenome = this.toggleGenome.bind(this);
    }

    componentDidMount() {
        this.updateDimensions();
        window.addEventListener('resize', this.updateDimensions);
        // if page loads on Valis thumbnail, we need to load extra data (all visualizable files associated with datasets for the page)
        // if the page does not load on the Valis thumbnail, we don't want to bother because the page will load much faster without all those queries
        if (this.context.location_href.split('/thumbnail=')[1] === 'valis') {
            this.chooseThumbnail('valis');
        }

        if (this.state.genome === 'hg19') {
            this.loadHg19ValisData();
        } else {
            this.loadGRCh38ValisData();
        }
    }


    shouldComponentUpdate(nextProps, nextState, nextContext) {
        // update for new properties, new href, new page of results, or resizing of screen
        const hrefUpdate = this.context.location_href !== nextContext.location_href;
        const screenSizeUpdate = this.state.screenWidth !== this.applicationRef.offsetWidth;
        const pageUpdate = this.state.browserCurrentPage !== nextState.browserCurrentPage;
        const filtersUpdate = this.state.selectedFilters !== nextState.selectedFilters;
        const facetDisplayUpdate = this.state.facetDisplay !== nextState.facetDisplay;
        const paginationChange = this.state.multipleBrowserPages !== nextState.multipleBrowserPages;
        const showFreqsToggled = this.state.showMoreFreqs !== nextState.showMoreFreqs;
        const genomeUpdate = this.state.genome !== nextState.genome;
        const filesUpdate = this.state.includedFiles.length !== nextState.includedFiles.length;
        const updateBool = !_.isEqual(this.props, nextProps) || hrefUpdate || screenSizeUpdate || pageUpdate || filtersUpdate || facetDisplayUpdate || paginationChange || showFreqsToggled || genomeUpdate || filesUpdate;
        return updateBool;
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
        // check for applicationRef because otherwise there are errors during resizing process
        if (this.applicationRef) {
            const screenWidth = this.applicationRef.offsetWidth;
            let thumbnailWidth = 0;
            // for desktop screens, the display is 3x2 thumbnails
            if (screenWidth > screenMediumMax) {
                thumbnailWidth = (this.applicationRef.offsetWidth / 3) - 40;
            // for vertical tablets, the display is 2x3 thumbnails
            } else if (screenWidth > screenSmallMax) {
                thumbnailWidth = (this.applicationRef.offsetWidth / 2) - 40;
            // anything narrower than a vertical tablet has a 1x3 display
            } else {
                thumbnailWidth = this.applicationRef.offsetWidth - 40;
            }
            this.setState({
                thumbnailWidth,
                screenWidth,
            });
        }
    }

    handlePagination(pageDirection) {
        if (pageDirection === 'plus') {
            const pageIdx = this.state.browserCurrentPage;
            const startIdx = pageIdx * displaySize;
            const endIdx = (pageIdx + 1) * displaySize;
            const includedFiles = this.state.filteredFiles.slice(startIdx, endIdx);
            this.setState(prevState => ({
                includedFiles,
                browserCurrentPage: prevState.browserCurrentPage + 1,
            }));
        } else {
            const pageIdx = this.state.browserCurrentPage - 2;
            const startIdx = pageIdx * displaySize;
            const endIdx = ((pageIdx + 1) * displaySize);
            const includedFiles = this.state.filteredFiles.slice(startIdx, endIdx);
            this.setState(prevState => ({
                includedFiles,
                browserCurrentPage: prevState.browserCurrentPage - 1,
            }));
        }
    }

    handleFacetList(selectedFilters) {
        const filteredFiles = filterByAllSelectedFilters(this.state.allFiles, selectedFilters, facetParameters);
        // if there are more filtered files than we want to display on one page, we will paginate
        const browserTotalPages = Math.ceil(filteredFiles.length / displaySize);
        if (filteredFiles.length > displaySize) {
            const includedFiles = filteredFiles.slice(0, displaySize);
            this.setState({
                selectedFilters,
                filteredFiles,
                includedFiles,
                multipleBrowserPages: true,
                browserTotalPages,
                browserCurrentPage: 1,
            });
        } else {
            this.setState({
                selectedFilters,
                filteredFiles,
                includedFiles: filteredFiles,
                multipleBrowserPages: false,
                browserTotalPages,
                browserCurrentPage: 1,
            });
        }
    }

    toggleGenome(select) {
        if (select === 'GRCh38') {
            this.setState({ genome: 'hg19' });
        } else {
            this.setState({ genome: 'GRCh38' });
        }
    }

    chooseThumbnail(newThumbnail) {
        // if thumbnail is selected, navigate to link which will trigger a re-rendering
        const baseUri = this.context.location_href.split('/thumbnail=')[0];
        if (newThumbnail === null) {
            this.context.navigate(baseUri);
        } else {
            this.context.navigate(`${baseUri}/thumbnail=${newThumbnail}`);
        }
    }

    loadHg19ValisData() {
        if (this.state.filteredFiles.length < 1 && this.props.context['@graph']) {
            // Valis tab requires additional queries, unlike other tabs, in order to collect all the visualizable files corresponding to the SNP datasets
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
            const organMap = {};
            experimentDatasets.forEach((dataset) => {
                biosampleMap[dataset.dataset] = dataset.biosample_ontology.term_name || '';
                assayMap[dataset.dataset] = dataset.method || '';
                targetMap[dataset.dataset] = dataset.targets ? dataset.targets.join(', ') : '';
                organMap[dataset.dataset] = (dataset.biosample_ontology.classification === 'tissue') ? dataset.biosample_ontology.organ_slims.join(', ') : dataset.biosample_ontology.cell_slims.join(', ');
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
            const chipBaseQuery = `type=File&assembly=${this.state.genome}&file_format=bigBed&file_format=bigWig&output_type=peaks+and+background+as+input+for+IDR&output_type=signal+p-value&sort=dataset&biological_replicates=1&limit=all&${fieldsToSave}`;
            const dnaseBaseQuery = `type=File&assembly=${this.state.genome}&file_format=bigBed&file_format=bigWig&output_type=peaks&output_type=read-depth+normalized+signal&sort=dataset&biological_replicates=1&biological_replicates!=2&limit=all&${fieldsToSave}`;
            const faireBaseQuery = `type=File&assembly=${this.state.genome}&file_format=bigBed&file_format=bigWig&output_type=peaks&output_type=signal&sort=dataset&limit=all&${fieldsToSave}`;
            // cannot query all datasets at once (query string is too long), so we need to construct series of queries with a reasonable number of datasets each
            // we construct an array of Promises for all the queries
            const chipPromises = chunkingDataset(requests, 0, numChipChunks, chipDatasets, chipBaseQuery);
            const dnasePromises = chunkingDataset(requests, 0, numDnaseChunks, dnaseDatasets, dnaseBaseQuery);
            const fairePromises = chunkingDataset(requests, 0, numFaireChunks, faireDatasets, faireBaseQuery);
            const allPromises = [...chipPromises, ...dnasePromises, ...fairePromises];

            Promise.all(allPromises)
                .then((results) => {
                    this.setState({ allFiles: results.flat() }, () => {
                        // sort by dataset
                        const sortedFiles = _.sortBy(this.state.allFiles, obj => obj.dataset);
                        sortedFiles.forEach((d) => {
                            const fileDataset = `https://www.encodeproject.org${d.dataset}`;
                            d.biosample = biosampleMap[fileDataset];
                            d.assay = assayMap[fileDataset];
                            d.target = targetMap[fileDataset];
                            d.organ = organMap[fileDataset];
                        });
                        // once all the data has been retrieved, narrow down full set of files to 2 per dataset
                        const trimmedFiles0 = sortedFiles.filter((file) => {
                            const DatasetFiles0 = sortedFiles.filter(f2 => f2.dataset === file.dataset);
                            if (DatasetFiles0.length > 2) {
                                // if there are more than 2 files for a ChIP-seq dataset, we prefer rep 1,2 to rep 1
                                if (file.assay_term_name === 'ChIP-seq') {
                                    if (file.biological_replicates.length === 1) {
                                        return false;
                                    }
                                    return true;
                                // if there are more than 2 files for a DNase-seq dataset, we prefer rep 1
                                } else if (file.assay_term_name === 'DNase-seq') {
                                    if (file.biological_replicates.length === 1) {
                                        return true;
                                    }
                                    return false;
                                // if there are more than 2 files for a FAIRE-seq dataset, we prefer multiple replicates
                                } else if (file.assay_term_name === 'FAIRE-seq') {
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
                                filteredFiles: trimmedFiles,
                                multipleBrowserPages: true,
                                browserTotalPages,
                                browserCurrentPage: 1,
                            });
                        } else {
                            this.setState({
                                allFiles: trimmedFiles,
                                filteredFiles: trimmedFiles,
                                includedFiles: trimmedFiles,
                            });
                        }
                    });
                });
        }
    }

    loadGRCh38ValisData() {
        if (this.state.filteredFiles.length < 1 && this.props.context['@graph']) {
            // Valis tab requires additional queries, unlike other tabs, in order to collect all the visualizable files corresponding to the SNP datasets
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
            const organMap = {};
            experimentDatasets.forEach((dataset) => {
                biosampleMap[dataset.dataset] = dataset.biosample_ontology.term_name || '';
                assayMap[dataset.dataset] = dataset.method || '';
                targetMap[dataset.dataset] = dataset.targets ? dataset.targets.join(', ') : '';
                organMap[dataset.dataset] = (dataset.biosample_ontology.classification === 'tissue') ? dataset.biosample_ontology.organ_slims.join(', ') : dataset.biosample_ontology.cell_slims.join(', ');
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
            const chipBaseQuery = `type=File&assembly=${this.state.genome}&file_format=bigBed&file_format=bigWig&sort=dataset&status!=revoked&status!=deleted&preferred_default=true&analyses.status=released&limit=all&${fieldsToSave}`;
            const dnaseBaseQuery = `type=File&assembly=${this.state.genome}&file_format=bigBed&file_format=bigWig&sort=dataset&status!=revoked&status!=deleted&preferred_default=true&analyses.status=released&limit=all&${fieldsToSave}`;
            const faireBaseQuery = `type=File&assembly=${this.state.genome}&file_format=bigBed&file_format=bigWig&output_type=peaks&output_type=signal&sort=dataset&status!=revoked&status!=deleted&limit=all&${fieldsToSave}`;
            // cannot query all datasets at once (query string is too long), so we need to construct series of queries with a reasonable number of datasets each
            // we construct an array of Promises for all the queries
            const chipPromises = chunkingDataset(requests, 0, numChipChunks, chipDatasets, chipBaseQuery);
            const dnasePromises = chunkingDataset(requests, 0, numDnaseChunks, dnaseDatasets, dnaseBaseQuery);
            const fairePromises = chunkingDataset(requests, 0, numFaireChunks, faireDatasets, faireBaseQuery);
            const allPromises = [...chipPromises, ...dnasePromises, ...fairePromises];

            Promise.all(allPromises)
                .then((results) => {
                    this.setState({ allFiles: results.flat() }, () => {
                        // sort by dataset
                        const sortedFiles = _.sortBy(this.state.allFiles, obj => obj.dataset);
                        sortedFiles.forEach((d) => {
                            const fileDataset = `https://www.encodeproject.org${d.dataset}`;
                            d.biosample = biosampleMap[fileDataset];
                            d.assay = assayMap[fileDataset];
                            d.target = targetMap[fileDataset];
                            d.organ = organMap[fileDataset];
                        });
                        // if there are more filtered files than we want to display on one page, we will paginate
                        if (sortedFiles.length > displaySize) {
                            const includedFiles = sortedFiles.slice(0, displaySize);
                            const browserTotalPages = Math.ceil(sortedFiles.length / displaySize);
                            this.setState({
                                allFiles: sortedFiles,
                                includedFiles,
                                filteredFiles: sortedFiles,
                                multipleBrowserPages: true,
                                browserTotalPages,
                                browserCurrentPage: 1,
                            });
                        } else {
                            this.setState({
                                allFiles: sortedFiles,
                                filteredFiles: sortedFiles,
                                includedFiles: sortedFiles,
                            });
                        }
                    });
                });
        }
    }

    render() {
        const context = this.props.context;
        const coordinates = context.query_coordinates[0];
        const allData = context['@graph'] || [];
        const QTLData = allData.filter(d => (d.method && d.method.indexOf('QTL') !== -1));
        const chipData = allData.filter(d => d.method === 'ChIP-seq');
        const dnaseData = allData.filter(d => (d.method === 'FAIRE-seq' || d.method === 'DNase-seq'));
        const chromatinData = allData.filter(d => (d.method === 'chromatin state'));
        const thumbnail = this.context.location_href.split('/thumbnail=')[1] || null;

        const toggleFreqsShow = () => this.setState(
            state => ({ showMoreFreqs: !state.showMoreFreqs })
        );
        const hitSnps = {};
        const sortedPopulations = {};
        if (coordinates) {
            const [chrom, startEnd] = coordinates.split(':');
            const [start, end] = startEnd.split('-');
            context.nearby_snps.forEach((snp) => {
                if (snp.chrom === chrom && snp.coordinates.gte === +start && snp.coordinates.lt === +end) {
                    hitSnps[snp.rsid] = {};
                    const populationAlleles = {};

                    if (snp.ref_allele_freq) {
                        const ref_allele_tag = Object.keys(snp.ref_allele_freq)[0]
                        if (Object.keys(snp.ref_allele_freq[ref_allele_tag]).length != 0) {
                            Object.keys(snp.ref_allele_freq).forEach((allele) => {
                                Object.keys(snp.ref_allele_freq[allele]).forEach((population) => {
                                    if (!snp.ref_allele_freq[allele][population]) {
                                        populationAlleles[population] = [`${allele}=N/A`]
                                    } else {
                                        populationAlleles[population] = [`${allele}=${snp.ref_allele_freq[allele][population]}`];
                                    }
                                    
                                        
                                    
                                });
                            });
                            Object.keys(snp.alt_allele_freq).forEach((allele) => {
                                Object.keys(snp.alt_allele_freq[allele]).forEach((population) => {
                                    if (!snp.alt_allele_freq[allele][population]) {                                   
                                        populationAlleles[population].push(`${allele}=N/A`);
                                    } else {
                                        populationAlleles[population].push(`${allele}=${snp.alt_allele_freq[allele][population]}`);                                    
                                    }                                
                                });
                            });

                        } else {
                            populationAlleles['source unknown'] = [`${ref_allele_tag}=N/A`];
                            Object.keys(snp.alt_allele_freq).forEach((allele) => {
                                populationAlleles['source unknown'].push(`${allele}=N/A`)

                            });
                            
                        }
                        
                    }
                    
                        
                    
                    sortedPopulations[snp.rsid] = [];
                    populationOrder.forEach((population) => {
                        if (populationAlleles[population]) {
                            hitSnps[snp.rsid][population] = populationAlleles[population].join(', ');
                            sortedPopulations[snp.rsid].push(population);
                        }
                    });
                }
            });
        }

        return (
            <div ref={(ref) => { this.applicationRef = ref; }} >
                <div className="assembly-badge-container">
                    <div className="assembly-badge">{this.state.genome}</div>
                </div>
                { ((Object.keys(this.props.context.notifications)[0] === 'Failed') && context.total !== 0) ?
                    <React.Fragment>
                        {Object.keys(this.props.context.notifications).map((note, noteIdx) =>
                            <div className="notification-line wider" key={noteIdx}>
                                <span className="notification-label">{note}</span>
                                <span className="notification">{this.props.context.notifications[note]}</span>
                            </div>
                        )}
                    </React.Fragment>
                : (context.total > 0) ?
                    <React.Fragment>
                        <div className="lead-logo">
                            <a href="/">
                                <img src="/static/img/RegulomeLogoFinal.gif" alt="Regulome logo" />
                                <div className="version-tag">2.0.3</div>
                            </a>
                        </div>
                        <React.Fragment>
                            <div className="search-information">
                                {(context.query_coordinates) ?
                                    <div className="notification-line">
                                        <div className="notification-label">Searched coordinates</div>
                                        <div className="notification">{context.query_coordinates[0]}</div>
                                    </div>
                                : null}
                                {allData && allData.length > 0 ?
                                    <div className="notification-line">
                                        <div className="notification-label">Peaks</div>
                                        <div className="notification">{allData.length - chromatinData.length} peaks</div>
                                    </div>
                                : null}
                                {(context.regulome_score) ?
                                    <React.Fragment>
                                        <div className="notification-line">
                                            <div className="notification-label">Rank</div>
                                            <div className="notification">{context.regulome_score.ranking}</div>
                                        </div>
                                        <div className="notification-line">
                                            <div className="notification-label">Score</div>
                                            <div className="notification">{context.regulome_score.probability}</div>
                                        </div>
                                    </React.Fragment>
                                : null}
                                {Object.keys(hitSnps).map(rsid =>
                                    <div className="notification-line" key={rsid}>
                                        <div className="notification-label">{rsid}</div>
                                        <div className="notification">
                                            <div>
                                                {sortedPopulations[rsid].slice(0, 3).map(
                                                    population => <div key={population}>{`${hitSnps[rsid][population]} (${population})`}</div>
                                                )}
                                            </div>
                                            {sortedPopulations[rsid].length > 3 && this.state.showMoreFreqs ?
                                                <div>
                                                    {sortedPopulations[rsid].slice(3, hitSnps[rsid].length).map(
                                                        population => <div key={population}>{`${hitSnps[rsid][population]} (${population})`}</div>
                                                    )}
                                                </div>
                                            : null}
                                            {sortedPopulations[rsid].length > defaultDisplayCount ? <button onClick={toggleFreqsShow}>{sortedPopulations[rsid].length - 3} {this.state.showMoreFreqs ? 'fewer' : 'more'}</button> : null}
                                        </div>
                                    </div>
                                )}
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
                                        <React.Fragment>
                                            <div className="line"><i className="icon icon-chevron-circle-right" />Click here to view tracks in a genome browser.
                                                <div>
                                                    (<b>{this.state.filteredFiles.length}</b> track{this.state.filteredFiles.length !== 1 ? 's' : ''})
                                                </div>
                                            </div>
                                            {this.state.filteredFiles.length > 0 ?
                                                <div className="image-container">
                                                    <img src={`/static/img/browser-thumbnail-${this.state.genome.toLowerCase()}.png`} alt="Click to view the genome browser" />
                                                </div>
                                            : null}
                                        </React.Fragment>
                                    : null}
                                </button>
                                <button
                                    className={`thumbnail ${thumbnail === 'chip' ? 'active' : ''}`}
                                    onClick={() => this.chooseThumbnail('chip')}
                                >
                                    <h4>ChIP data</h4>
                                    {(thumbnail === null) ?
                                        <React.Fragment>
                                            <div className="line"><i className="icon icon-chevron-circle-right" />Click to see detailed ChIP-seq data.
                                                <div>
                                                    (<b>{chipData.length}</b> result{chipData.length !== 1 ? 's' : ''})
                                                </div>
                                            </div>
                                            {chipData.length > 0 ?
                                                <BarChart data={chipData} dataFilter={'chip'} chartWidth={this.state.thumbnailWidth} chartLimit={10} chartOrientation={'horizontal'} />
                                            : null}
                                        </React.Fragment>
                                    : null}
                                </button>
                                <button
                                    className={`thumbnail ${thumbnail === 'chromatin' ? 'active' : ''}`}
                                    onClick={() => this.chooseThumbnail('chromatin')}
                                >
                                    <h4>Chromatin state</h4>
                                    {(thumbnail === null) ?
                                        <React.Fragment>
                                            <div className="line"><i className="icon icon-chevron-circle-right" />Click to view chromatin data.
                                                <div>
                                                    (<b>{chromatinData.length}</b> result{chromatinData.length !== 1 ? 's' : ''})
                                                </div>
                                            </div>
                                            {chromatinData.length > 0 ?
                                                <BarChart data={chromatinData} dataFilter={'chromatin'} chartWidth={this.state.thumbnailWidth} chartLimit={10} chartOrientation={'horizontal'} assembly={this.state.genome} />
                                            : null}
                                        </React.Fragment>
                                    : null}
                                </button>
                                <button
                                    className={`thumbnail ${thumbnail === 'dnase' ? 'active' : ''}`}
                                    onClick={() => this.chooseThumbnail('dnase')}
                                >
                                    <h4>Accessibility</h4>
                                    {(thumbnail === null) ?
                                        <React.Fragment>
                                            <div className="line"><i className="icon icon-chevron-circle-right" />
                                                {`Click to see ${this.state.genome === 'hg19' ? 'FAIRE-seq or' : ''} DNase-seq experiments.`}
                                                <div>
                                                    (<b>{dnaseData.length}</b> result{dnaseData.length !== 1 ? 's' : ''})
                                                </div>
                                            </div>
                                            {dnaseData.length > 0 ?
                                                <BarChart data={dnaseData} dataFilter={'dnase'} chartWidth={this.state.thumbnailWidth} chartLimit={10} chartOrientation={'horizontal'} />
                                            : null}
                                        </React.Fragment>
                                    : null}
                                </button>
                                <button
                                    className={`thumbnail ${thumbnail === 'motifs' ? 'active' : ''}`}
                                    onClick={() => this.chooseThumbnail('motifs')}
                                >
                                    <h4>Motifs</h4>
                                    {(thumbnail === null) ?
                                        <React.Fragment>
                                            <div className="line"><i className="icon icon-chevron-circle-right" />Click to see PWM and Footprint data.</div>
                                            <Motifs {...this.props} limit={4} />
                                        </React.Fragment>
                                    : null}
                                </button>
                                <button
                                    className={`thumbnail ${thumbnail === 'qtl' ? 'active' : ''}`}
                                    onClick={() => this.chooseThumbnail('qtl')}
                                >
                                    <h4>QTL data</h4>
                                    {(thumbnail === null) ?
                                        <React.Fragment>
                                            <div className="line"><i className="icon icon-chevron-circle-right" />Click to see dsQTL and eQTL data.
                                                <div>
                                                    (<b>{QTLData.length}</b> result{QTLData.length !== 1 ? 's' : ''})
                                                </div>
                                            </div>
                                            <ResultsTable data={QTLData} displayTitle={''} dataFilter={'qtl'} errorMessage={'No result table is available for this SNP.'} shortened />
                                        </React.Fragment>
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
                                <React.Fragment>
                                    {(thumbnail === 'motifs') ?
                                        <React.Fragment>
                                            <h4>Motifs</h4>
                                            <Motifs {...this.props} limit={0} classList={'padded'} />
                                        </React.Fragment>
                                    : (thumbnail === 'valis') ?
                                        <React.Fragment>
                                            <h4>Visualize files for {coordinates}</h4>
                                            <h4>There {this.state.filteredFiles.length === 1 ? 'is' : 'are'} {this.state.filteredFiles.length} track{this.state.filteredFiles.length === 1 ? '' : 's'}.</h4>
                                            <FacetList
                                                files={this.state.allFiles}
                                                handleFacetList={this.handleFacetList}
                                                filteredFiles={this.state.filteredFiles}
                                                selectedFilters={this.state.selectedFilters}
                                                facetParameters={facetParameters}
                                            />
                                            <GenomeBrowser
                                                key={this.state.includedFiles.length}
                                                fixedHeight={this.state.multipleBrowserPages}
                                                files={this.state.includedFiles}
                                                expanded
                                                assembly={this.state.genome}
                                                coordinates={coordinates}
                                                selectedFilters={this.state.selectedFilters}
                                            />
                                            {this.state.multipleBrowserPages ?
                                                <div className="pagination-container">
                                                    <div>
                                                        <button disabled={this.state.browserCurrentPage === 1} className="btn btn-page btn-page-left" onClick={() => this.handlePagination('minus')}><i className="icon icon-chevron-left" /></button>
                                                        <button disabled={this.state.browserCurrentPage === this.state.browserTotalPages} className="btn btn-page" onClick={() => this.handlePagination('plus')}><i className="icon icon-chevron-right" /></button>
                                                    </div>
                                                    <div>
                                                        Page <b>{this.state.browserCurrentPage}</b> of <b>{this.state.browserTotalPages}</b>
                                                    </div>
                                                </div>
                                            : null}
                                        </React.Fragment>
                                    : (thumbnail === 'chip') ?
                                        <React.Fragment>
                                            {chipData.length > 0 ?
                                                <React.Fragment>
                                                    <BarChart data={chipData} dataFilter={'chip'} chartWidth={this.state.screenWidth} chartLimit={0} chartOrientation={'horizontal'} />
                                                    <ResultsTable data={chipData} displayTitle={'ChIP data'} dataFilter={thumbnail} errorMessage={'No result table is available for this SNP.'} />
                                                </React.Fragment>
                                            :
                                                <React.Fragment>
                                                    <h4>ChIP experiments</h4>
                                                    <div className="error-message">No results available to display, please choose a different SNP.</div>
                                                </React.Fragment>
                                            }
                                        </React.Fragment>
                                    : (thumbnail === 'dnase') ?
                                        <React.Fragment>
                                            {dnaseData.length > 0 ?
                                                <ChartList data={dnaseData} displayTitle={'DNA accessibility experiments'} chartWidth={Math.min(this.state.screenWidth, 1000)} dataFilter={thumbnail} />
                                            :
                                                <React.Fragment>
                                                    <h4>DNA accessibility experiments</h4>
                                                    <div className="error-message">No results available to display, please choose a different SNP.</div>
                                                </React.Fragment>
                                            }
                                        </React.Fragment>
                                    : (thumbnail === 'qtl') ?
                                        <ResultsTable data={QTLData} displayTitle={'dsQTL and eQTL data'} dataFilter={thumbnail} errorMessage={'No result table is available for this SNP.'} />
                                    : (thumbnail === 'chromatin') ?
                                          <ChromatinView
                                              data={chromatinData}
                                              chartWidth={this.state.screenWidth}
                                              assembly={this.state.genome}
                                          />
                                    : null}
                                </React.Fragment>
                            : null}
                        </React.Fragment>
                    </React.Fragment>
                :
                    <React.Fragment>
                        <div className="lead-logo">
                            <a href="/">
                                <img src="/static/img/RegulomeLogoFinal.gif" alt="Regulome logo" />
                                <div className="version-tag">2.0.3</div>
                            </a>
                        </div>
                        <AdvSearch
                            {...this.props}
                            genome={this.state.genome}
                            toggleGenome={this.toggleGenome}
                        />
                        <div className="data-types">
                            <div className="data-types-instructions"><h4>Use RegulomeDB to identify DNA features and regulatory elements in non-coding regions of the human genome by entering ...</h4></div>
                            <div className="data-types-block">
                                {dataTypeStrings.map(d =>
                                    <DataType type={d.type} explanation={d.explanation} key={d.type} />
                                )}
                            </div>
                        </div>
                        <div className="link-to-legacy-regulome">Looking for the old version? Click <a href="http://legacy.regulomedb.org">here.</a></div>
                    </React.Fragment>
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
