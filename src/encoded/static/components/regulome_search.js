import React from 'react';
import PropTypes from 'prop-types';
import _ from 'underscore';
import url from 'url';
import * as globals from './globals';
import { Panel, PanelBody } from '../libs/bootstrap/panel';
import { FacetList, FilterList } from './regulome_datasearch';
import { SortTablePanel, SortTable } from './sorttable';

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
        input: 'chr11:62607065-62607067\nchr10:5894500-5894501\nchr10:11741181-11741181\nchr1:39492463-39492463\nchr6:10695158-10695160',
    },
];

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
        this.setState((state) => ({
            open: !state.open
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
            <Panel>
                <PanelBody>
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

                    {(context.notification) ?
                        <div className="notification">{context.notification}</div>
                    : null}
                    {(context.coordinates) ?
                        <p>Searched coordinates: {context.coordinates}</p>
                    : null}
                    {(context.regulome_score) ?
                        <p className="regulomescore">RegulomeDB score: {context.regulome_score}</p>
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
                </PanelBody>
            </Panel>
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

const ResultsTable = (props) => {
    const context = props.context;
    const data = context['@graph'];

    const dataColumns = {

        assay_title: {
            title: 'Method',
            getValue: item => (item.assay_title || item.annotation_type),
        },

        biosample_term_name: {
            title: 'Biosample',
            getValue: (item) => item.biosample_ontology ? item.biosample_ontology.term_name : '',
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

    return (
        <div>
            <SortTablePanel title="Results">
                <SortTable list={data} columns={dataColumns} />
            </SortTablePanel>
        </div>
    );
};

ResultsTable.propTypes = {
    context: React.PropTypes.object.isRequired,
};

class RegulomeSearch extends React.Component {
    constructor() {
        super();

        this.assembly = 'hg19';

        // Bind this to non-React methods.
        this.onFilter = this.onFilter.bind(this);
    }

    shouldComponentUpdate(nextProps) {
        return !_.isEqual(this.props, nextProps);
    }

    onFilter(e) {
        if (this.props.onChange) {
            const search = e.currentTarget.getAttribute('href');
            this.props.onChange(search);
            e.stopPropagation();
            e.preventDefault();
        }
    }

    render() {
        const visualizeLimit = 100;
        const context = this.props.context;
        const results = context['@graph'];
        const notification = context.notification;
        const searchBase = url.parse(this.context.location_href).search || '';
        const filters = context.filters;
        const facets = context.facets;
        const total = context.total;
        const visualizeDisabled = total > visualizeLimit;

        const visualizeCfg = context.visualize_batch;

        // Get a sorted list of batch hubs keys with case-insensitive sort
        let visualizeKeys = [];
        if (context.visualize_batch && Object.keys(context.visualize_batch).length) {
            visualizeKeys = Object.keys(context.visualize_batch).sort((a, b) => {
                const aLower = a.toLowerCase();
                const bLower = b.toLowerCase();
                return (aLower > bLower) ? 1 : ((aLower < bLower) ? -1 : 0);
            });
        }

        return (
            <div>

                {(context.total > 0) ?
                    <div>
                        <div className="lead-logo">
                            <a href="/">
                                <img src="/static/img/RegulomeLogoFinal.gif" alt="Regulome logo" />
                            </a>
                        </div>
                        <div>
                            <div className="result-summary">
                                {(context.regulome_score) ?
                                    <p className="regulomescore">Score: <span className="bold-class">{context.regulome_score}</span></p>
                                : null}
                            </div>
                            <div className="search-information">
                                {(context.coordinates) ?
                                    <p>Searched coordinates: {context.coordinates}</p>
                                : null}
                                {(context.notification) ?
                                    <p>{context.notification}</p>
                                : null}
                            </div>
                            <div className="button-collection">
                                {visualizeKeys && context.visualize_batch && !visualizeDisabled ?
                                    <div className="visualize-block">
                                        {visualizeCfg.hg19.UCSC ?
                                            <div>
                                                <div className="visualize-element">
                                                    <a href={visualizeCfg.hg19['Quick View']} rel="noopener noreferrer" target="_blank">
                                                        <i className="icon icon-external-link" />
                                                    Visualize: Quick View
                                                    </a>
                                                </div>
                                                <div className="visualize-element">
                                                    <a href={visualizeCfg.hg19.UCSC} rel="noopener noreferrer" target="_blank">
                                                        <i className="icon icon-external-link" />
                                                    UCSC browser
                                                    </a>
                                                </div>
                                            </div>
                                        :
                                            <div className="visualize-element visualize-error">To visualize, choose other datasets.</div>
                                        }
                                    </div>
                                :
                                    <div className="visualize-block">
                                        <div className="visualize-element visualize-error">Filter to fewer than 100 results to visualize</div>
                                    </div>
                                }
                                {(context.regulome_score && !context.peak_details) ?
                                    <a
                                        rel="nofollow"
                                        className="peaks-link"
                                        href={searchBase ? `${searchBase}&peak_metadata` : '?peak_metadata'}
                                    >
                                        <i className="icon icon-external-link" />
                                        View peak details
                                    </a>
                                : null}
                            </div>
                            <div>
                                <div className="panel flex-panel">

                                    {facets.length ?
                                        <div className="facet-column">
                                            <div className="facet-controls">
                                                <div className="results-count">Showing {results.length} of {total}</div>
                                            </div>
                                            <FilterList {...this.props} />
                                            <FacetList
                                                {...this.props}
                                                facets={facets}
                                                filters={filters}
                                                searchBase={searchBase ? `${searchBase}&` : `${searchBase}?`}
                                                onFilter={this.onFilter}
                                                modifyFacetsFlag
                                            />
                                        </div>
                                    : ''}

                                    <div className="wide-column">

                                        <ResultsTable {...this.props} />

                                    </div>

                                </div>

                            </div>
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
