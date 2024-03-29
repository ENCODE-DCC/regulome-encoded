import React from 'react';
import PropTypes from 'prop-types';
import * as globals from './globals';
import { ChartTable, lookupChromatinNames, isLetter } from './visualizations';
import { createOrganFacets, complexFacets } from './facets';
import { BodyMapThumbnailAndModal, addingClass, HumanList } from './body_map';
import { ResultsTable } from './regulome_search';

const sanitizedString = globals.sanitizedString;
const classString = globals.classString;

export const initializedChromatinObjectHg19 = {
    'Active TSS': 0,
    'Flanking Active TSS': 0,
    'Genic enhancers': 0,
    Enhancers: 0,
    "Transcr. at gene 5' and 3'": 0,
    'Strong transcription': 0,
    'Weak transcription': 0,
    'Bivalent/Poised TSS': 0,
    'Flanking Bivalent TSS/Enh': 0,
    'Bivalent Enhancer': 0,
    'ZNF genes & repeats': 0,
    'Repressed PolyComb': 0,
    'Weak Repressed PolyComb': 0,
    Heterochromatin: 0,
    'Quiescent/Low': 0,
};

export const initializedChromatinObjectGRCh38 = {
    'Active TSS': 0,
    'Flanking TSS': 0,
    'Flanking TSS downstream': 0,
    'Flanking TSS upstream': 0,
    'Active enhancer 1': 0,
    'Active enhancer 2': 0,
    'Weak enhancer': 0,
    'Genic enhancer 1': 0,
    'Genic enhancer 2': 0,
    'Strong transcription': 0,
    'Weak transcription': 0,
    'Bivalent/Poised TSS': 0,
    'Bivalent enhancer': 0,
    'ZNF genes & repeats': 0,
    'Weak Repressed PolyComb': 0,
    'Repressed PolyComb': 0,
    Heterochromatin: 0,
    'Quiescent/Low': 0,
};

const applyFilters = (data, stateFilters, bodyMapFilters, biosampleFilters) => {
    let filteredData = data;
    if (stateFilters.length > 0 || bodyMapFilters.length > 0 || biosampleFilters.length > 0) {
        filteredData = filteredData.filter((d) => {
            const chromatinValue = sanitizedString(lookupChromatinNames(d.value));
            if (stateFilters.length > 0) {
                return stateFilters.includes(chromatinValue);
            }
            return true;
        }).filter((d) => {
            if (bodyMapFilters.length > 0) {
                let filterBool = false;
                if (d.biosample_ontology && d.biosample_ontology.organ_slims) {
                    d.biosample_ontology.organ_slims.forEach((slim) => {
                        if (bodyMapFilters.indexOf(slim) > -1) {
                            filterBool = true;
                        }
                    });
                }
                return filterBool;
            }
            return true;
        }).filter((d) => {
            if (biosampleFilters.length > 0 && d.biosample_ontology && d.biosample_ontology.term_name) {
                return biosampleFilters.includes(sanitizedString(d.biosample_ontology.term_name));
            } else if (!(d.biosample_ontology && d.biosample_ontology.term_name)) {
                return false;
            }
            return true;
        });
    }

    const files = filteredData.map(d => ({
        organ_slims: d.biosample_ontology.organ_slims,
        biosample: d.biosample_ontology.term_name,
        state: lookupChromatinNames(d.value),
    }));

    return [
        filteredData,
        files,
    ];
};

// Display selected filters and allow user to de-select them
const Selections = (props) => {
    const { filters, filterType, clearFilterFunc, keyArray } = props;
    return (
        <div className="selections">
            <span className="selections-hed">Selected filters:</span>
            {filters.map((f) => {
                let label = f;
                if (filterType === 'biosample') {
                    label = keyArray.find(k => sanitizedString(k) === f);
                } else if (filterType === 'state') {
                    label = keyArray.find(k => (!isLetter(k[0]) ? (classString(sanitizedString(k)) === f) : (sanitizedString(k) === f)));
                }
                let clearInput = f;
                if (filterType === 'biosample') {
                    clearInput = sanitizedString(f);
                } else if (filterType === 'chromatin') {
                    clearInput = classString(sanitizedString(f));
                }
                return (
                    <button
                        className={`selected-chromatin-filter ${filterType}`}
                        key={`${f}-${filterType}-selected-filter`}
                        onClick={() => clearFilterFunc(clearInput)}
                    >
                        <i className="icon icon-times-circle" />
                        {label}
                    </button>
                );
            })}
        </div>
    );
};

Selections.propTypes = {
    filters: PropTypes.array.isRequired,
    filterType: PropTypes.string.isRequired, // filterType can be "bodymap", "biosample", or "state"
    clearFilterFunc: PropTypes.func.isRequired,
    keyArray: PropTypes.array,
};

Selections.defaultProps = {
    keyArray: [],
};

export class ChromatinView extends React.Component {
    constructor(props) {
        super(props);

        const files = this.props.data.map(d => ({
            organ_slims: d.biosample_ontology.organ_slims,
            biosample: d.biosample_ontology.term_name,
            state: lookupChromatinNames(d.value),
        }));
        const filteredFiles = files;

        // generate facet data
        const bodyMapFacet = createOrganFacets(files, filteredFiles, 'organ_slims', this.props.assembly);
        const biosampleFacet = complexFacets(files, filteredFiles, 'biosample', this.props.assembly);
        const chromatinFacet = complexFacets(files, filteredFiles, 'state', this.props.assembly);

        let chromatinHierarchy = [];
        if (this.props.assembly === 'hg19') {
            chromatinHierarchy = Object.keys(initializedChromatinObjectHg19);
        } else {
            chromatinHierarchy = Object.keys(initializedChromatinObjectGRCh38);
        }
        const sortChromatin = (a, b) => chromatinHierarchy.indexOf(a) - chromatinHierarchy.indexOf(b);

        this.state = {
            allFiles: files,
            allData: this.props.data,
            filteredData: this.props.data,
            bodyMapFilters: [],
            stateFilters: [],
            biosampleFilters: [],
            bodyMapFacet,
            biosampleFacet: biosampleFacet.biosample,
            chromatinFacet: chromatinFacet.state,
            biosampleKeys: Object.keys(biosampleFacet.biosample),
            chromatinKeys: Object.keys(chromatinFacet.state).sort(sortChromatin),
        };

        this.sortChromatin = sortChromatin;

        this.handleFacetList = this.handleFacetList.bind(this);
        this.handleChromatinFilters = this.handleChromatinFilters.bind(this);
        this.handleBiosampleFilters = this.handleBiosampleFilters.bind(this);
        this.resetFilters = this.resetFilters.bind(this);
        this.sortByOrgan = this.sortByOrgan.bind(this);
        this.clearBodyMapFilter = this.clearBodyMapFilter.bind(this);
    }

    componentDidMount() {
        const newKeys = Object.keys(this.state.biosampleFacet).sort(this.sortByOrgan);
        this.setState({
            biosampleKeys: [...newKeys],
        });
    }

    sortByOrgan(a, b) {
        const aData = this.state.allData.find(d => d.biosample_ontology.term_name === a);
        const aOrgan = (aData && aData.biosample_ontology) ? aData.biosample_ontology.organ_slims.join(', ') : '';

        const bData = this.state.allData.find(d => d.biosample_ontology.term_name === b);
        const bOrgan = (bData && bData.biosample_ontology) ? bData.biosample_ontology.organ_slims.join(', ') : '';

        return aOrgan.localeCompare(bOrgan);
    }

    resetFilters() {
        const bodyMapFacet = createOrganFacets(this.state.allFiles, this.state.allFiles, 'organ_slims', this.props.assembly);
        const biosampleFacet = complexFacets(this.state.allFiles, this.state.allFiles, 'biosample', this.props.assembly);
        const chromatinFacet = complexFacets(this.state.allFiles, this.state.allFiles, 'state', this.props.assembly);

        this.setState({
            filteredData: this.state.allData,
            bodyMapFilters: [],
            stateFilters: [],
            biosampleFilters: [],
            bodyMapFacet,
            chromatinFacet: chromatinFacet.state,
            chromatinKeys: Object.keys(chromatinFacet.state).sort(this.sortChromatin),
            biosampleFacet: biosampleFacet.biosample,
            biosampleKeys: Object.keys(biosampleFacet.biosample).sort(this.sortByOrgan),
        });
    }

    clearBodyMapFilter(newFilter) {
        if (HumanList[newFilter]) {
            HumanList[newFilter].forEach((bodyClass) => {
                addingClass('active', bodyClass, true);
            });
        }
        const selectedFilters = this.state.bodyMapFilters.filter(f2 => f2 !== newFilter);
        this.handleFacetList(selectedFilters);
    }

    // Handle body map selections
    handleFacetList(selectedFilters) {
        // chromatin state facet should be filtered for body map selections and biosample selections
        const filteredForOrganAndBiosample = applyFilters(this.state.allData, [], selectedFilters, this.state.biosampleFilters);
        const chromatinFacet = complexFacets(this.state.allFiles, filteredForOrganAndBiosample[1], 'state', this.props.assembly);
        const chromatinKeys = Object.keys(chromatinFacet.state).sort(this.sortChromatin);

        // biosample facet should be filtered for body map and state selections
        const filteredForOrganAndState = applyFilters(this.state.allData, this.state.stateFilters, selectedFilters, []);
        const biosampleFacet = complexFacets(this.state.allFiles, filteredForOrganAndState[1], 'biosample', this.props.assembly);
        const biosampleKeys = Object.keys(biosampleFacet.biosample).sort(this.sortByOrgan);

        // table data must be filtered by all filters
        const filtered = applyFilters(this.state.allData, this.state.stateFilters, selectedFilters, this.state.biosampleFilters);
        const filteredData = filtered[0];

        this.setState({
            filteredData,
            bodyMapFilters: selectedFilters,
            biosampleFacet: biosampleFacet.biosample,
            chromatinFacet: chromatinFacet.state,
            biosampleKeys,
            chromatinKeys,
        });
    }

    // Handle biosample selections
    handleBiosampleFilters(clickID) {
        // update biosample filters
        let modifiedSelectedBiosamples;
        if (this.state.biosampleFilters.includes(clickID)) {
            modifiedSelectedBiosamples = [...this.state.biosampleFilters];
            modifiedSelectedBiosamples.splice(modifiedSelectedBiosamples.indexOf(clickID), 1);
        } else {
            modifiedSelectedBiosamples = [...this.state.biosampleFilters, clickID];
        }

        // chromatin facet should be filtered for body map and biosample
        const filteredByOrganAndBiosample = applyFilters(this.state.allData, [], this.state.bodyMapFilters, modifiedSelectedBiosamples);
        const chromatinFacet = complexFacets(this.state.allFiles, filteredByOrganAndBiosample[1], 'state', this.props.assembly);
        const chromatinKeys = Object.keys(chromatinFacet.state).sort(this.sortChromatin);

        // body map facet should be filtered by chromatin state and biosample
        const filteredByStateAndBiosample = applyFilters(this.state.allData, this.state.stateFilters, [], modifiedSelectedBiosamples);
        const bodyMapFacet = createOrganFacets(this.state.allFiles, filteredByStateAndBiosample[1], 'organ_slims', this.props.assembly);

        // table data must be filtered by all filters
        const filtered = applyFilters(this.state.allData, this.state.stateFilters, this.state.bodyMapFilters, modifiedSelectedBiosamples);
        const filteredData = filtered[0];

        this.setState({
            biosampleFilters: modifiedSelectedBiosamples,
            filteredData,
            bodyMapFacet,
            chromatinFacet: chromatinFacet.state,
            chromatinKeys,
        });
    }

    // Handle chromatin state selections
    handleChromatinFilters(clickID) {
        let chromatinFilter = clickID;
        if (!isLetter(clickID[0])) {
            chromatinFilter = classString(clickID);
        }
        // update state filters
        let modifiedSelectedStates;
        if (this.state.stateFilters.includes(chromatinFilter)) {
            modifiedSelectedStates = [...this.state.stateFilters];
            modifiedSelectedStates.splice(modifiedSelectedStates.indexOf(chromatinFilter), 1);
        } else {
            modifiedSelectedStates = [...this.state.stateFilters, chromatinFilter];
        }

        // body map facet should be filtered by state and biosample filters
        const filteredByStateAndBiosample = applyFilters(this.state.allData, modifiedSelectedStates, [], this.state.biosampleFilters);
        const bodyMapFacet = createOrganFacets(this.state.allFiles, filteredByStateAndBiosample[1], 'organ_slims', this.props.assembly);

        // biosample facet should be filtered by state and organ
        const filteredByStateAndOrgan = applyFilters(this.state.allData, modifiedSelectedStates, this.state.bodyMapFilters, []);
        const biosampleFacet = complexFacets(this.state.allFiles, filteredByStateAndOrgan[1], 'biosample', this.props.assembly);
        const biosampleKeys = Object.keys(biosampleFacet.biosample).sort(this.sortByOrgan);

        // table data must be filtered by all filters
        const filtered = applyFilters(this.state.allData, modifiedSelectedStates, this.state.bodyMapFilters, this.state.biosampleFilters);
        const filteredData = filtered[0];

        this.setState({
            stateFilters: modifiedSelectedStates,
            filteredData,
            bodyMapFacet,
            biosampleFacet: biosampleFacet.biosample,
            biosampleKeys,
        });
    }

    render() {
        const { data } = this.props;

        return (
            <div className="chromatin-view">
                {data.length > 0 ?
                    <React.Fragment>
                        <div className="chromatin-filters">
                            <div className="chromatin-filter body-map">
                                <div className="chromatin-hed">
                                    <i className="icon icon-filter" />
                                    Filter by organ
                                    <div className="sub-text">Colored by most active state</div>
                                </div>
                                <BodyMapThumbnailAndModal
                                    facet={this.state.bodyMapFacet}
                                    organism={'Homo sapiens'}
                                    handleFilters={this.handleFacetList}
                                    originalFilters={this.state.bodyMapFilters}
                                    assembly={this.props.assembly}
                                />
                                {this.state.bodyMapFilters.length > 0 ?
                                    <Selections
                                        filters={this.state.bodyMapFilters}
                                        filterType="bodymap"
                                        clearFilterFunc={this.clearBodyMapFilter}
                                    />
                                : null}
                            </div>
                            <div className="chromatin-filter biosample">
                                <div className="chromatin-hed">
                                    <i className="icon icon-filter" />
                                    Filter by biosample
                                    <div className="sub-text">Grouped by organs</div>
                                </div>
                                <ChartTable
                                    key={(this.state.stateFilters.length + this.state.bodyMapFilters.length + this.state.biosampleFilters.length + 3)}
                                    chartData={this.state.biosampleFacet}
                                    chartWidth={Math.min(this.props.chartWidth, 650)}
                                    handleChartFilters={this.handleBiosampleFilters}
                                    selectedStates={this.state.biosampleFilters}
                                    additionalClass="scrollable-table"
                                    sortedKeys={this.state.biosampleKeys}
                                    fullData={this.state.allData}
                                />
                                {this.state.biosampleFilters.length > 0 ?
                                    <Selections
                                        filters={this.state.biosampleFilters}
                                        filterType="biosample"
                                        clearFilterFunc={this.handleBiosampleFilters}
                                        keyArray={this.state.biosampleKeys}
                                    />
                                : null}
                            </div>
                            <div className="chromatin-filter chromatin-state">
                                <div className="chromatin-hed">
                                    <i className="icon icon-filter" />
                                    Filter by chromatin state
                                    <div className="sub-text">Ordered by transcription activity</div>
                                </div>
                                <ChartTable
                                    key={(this.state.stateFilters.length + this.state.bodyMapFilters.length + this.state.biosampleFilters.length)}
                                    chartData={this.state.chromatinFacet}
                                    chartWidth={Math.min(this.props.chartWidth, 270)}
                                    handleChartFilters={this.handleChromatinFilters}
                                    selectedStates={this.state.stateFilters}
                                    fixedBars
                                    sortedKeys={this.state.chromatinKeys}
                                />
                                {this.state.stateFilters.length > 0 ?
                                    <Selections
                                        filters={this.state.stateFilters}
                                        filterType="state"
                                        clearFilterFunc={this.handleChromatinFilters}
                                        keyArray={this.state.chromatinKeys}
                                    />
                                : null}
                            </div>
                            <div className="button-wrapper">
                                {(this.state.bodyMapFilters.length + this.state.stateFilters.length + this.state.biosampleFilters.length > 0) ?
                                    <React.Fragment>
                                        <div><button className="reset-all-filters" onClick={this.resetFilters}>Clear all filters</button></div>
                                    </React.Fragment>
                                : null}
                            </div>
                        </div>
                        <ResultsTable data={this.state.filteredData} displayTitle={''} dataFilter={'chromatin'} errorMessage={'Clear or edit selected filters to see results - no data matches current selections.'} />
                    </React.Fragment>
                : null}
            </div>
        );
    }
}

ChromatinView.propTypes = {
    data: PropTypes.array.isRequired,
    chartWidth: PropTypes.number.isRequired,
    assembly: PropTypes.string.isRequired,
};

export default ChromatinView;
