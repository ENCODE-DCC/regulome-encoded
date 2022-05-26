import React from 'react';
import PropTypes from 'prop-types';
import * as globals from './globals';
import { ChartTable, lookupChromatinNames, sortChromatin } from './visualizations';
import { createOrganFacets, complexFacets } from './facets';
import { BodyMapThumbnailAndModal, addingClass, HumanList } from './body_map';
import { ResultsTable } from './regulome_search';

const sanitizedString = globals.sanitizedString;
const classString = globals.classString;

export const initializedChromatinObject = {
    'Active TSS': 0,
    'Flanking Active TSS': 0,
    "Transcr. at gene 5' and 3'": 0,
    'Strong transcription': 0,
    'Weak transcription': 0,
    'Genic enhancers': 0,
    Enhancers: 0,
    'ZNF genes & repeats': 0,
    Heterochromatin: 0,
    'Bivalent/Poised TSS': 0,
    'Flanking Bivalent TSS/Enh': 0,
    'Bivalent Enhancer': 0,
    'Repressed PolyComb': 0,
    'Weak Repressed PolyComb': 0,
    'Quiescent/Low': 0,
};

const applyFilters = (data, stateFilters, bodyMapFilters, biosampleFilters) => {
    let filteredData = data;
    if (stateFilters.length > 0 || bodyMapFilters.length > 0 || biosampleFilters.length > 0) {
        filteredData = filteredData.filter((d) => {
            const chromatinValue = classString(sanitizedString(lookupChromatinNames(d.value)));
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

    const files = [];
    filteredData.forEach((d) => {
        files.push({
            organ_slims: d.biosample_ontology.organ_slims,
            biosample: d.biosample_ontology.term_name,
            state: lookupChromatinNames(d.value),
        });
    });

    return [
        filteredData,
        files,
    ];
};

export class ChromatinView extends React.Component {
    constructor(props) {
        super(props);

        const files = [];
        this.props.data.forEach((d) => {
            files.push({
                organ_slims: d.biosample_ontology.organ_slims,
                biosample: d.biosample_ontology.term_name,
                state: lookupChromatinNames(d.value),
            });
        });
        const filteredFiles = files;

        // generate facet data
        const bodyMapFacet = createOrganFacets(files, filteredFiles, 'organ_slims');
        const biosampleFacet = complexFacets(files, filteredFiles, 'biosample');
        const chromatinFacet = complexFacets(files, filteredFiles, 'state');

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
        const bodyMapFacet = createOrganFacets(this.state.allFiles, this.state.allFiles, 'organ_slims');
        const biosampleFacet = complexFacets(this.state.allFiles, this.state.allFiles, 'biosample');
        const chromatinFacet = complexFacets(this.state.allFiles, this.state.allFiles, 'state');

        this.setState({
            filteredData: this.state.allData,
            bodyMapFilters: [],
            stateFilters: [],
            biosampleFilters: [],
            bodyMapFacet,
            chromatinFacet: chromatinFacet.state,
            chromatinKeys: Object.keys(chromatinFacet.state).sort(sortChromatin),
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
        const chromatinFacet = complexFacets(this.state.allFiles, filteredForOrganAndBiosample[1], 'state');
        const chromatinKeys = Object.keys(chromatinFacet.state).sort(sortChromatin);

        // biosample facet should be filtered for body map and state selections
        const filteredForOrganAndState = applyFilters(this.state.allData, this.state.stateFilters, selectedFilters, []);
        const biosampleFacet = complexFacets(this.state.allFiles, filteredForOrganAndState[1], 'biosample');
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
        const chromatinFacet = complexFacets(this.state.allFiles, filteredByOrganAndBiosample[1], 'state');
        const chromatinKeys = Object.keys(chromatinFacet.state).sort(sortChromatin);

        // body map facet should be filtered by chromatin state and biosample
        const filteredByStateAndBiosample = applyFilters(this.state.allData, this.state.stateFilters, [], modifiedSelectedBiosamples);
        const bodyMapFacet = createOrganFacets(this.state.allFiles, filteredByStateAndBiosample[1], 'organ_slims');

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

    // handle chromatin state selections
    handleChromatinFilters(clickID) {
        const chromatinFilter = classString(clickID);
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
        const bodyMapFacet = createOrganFacets(this.state.allFiles, filteredByStateAndBiosample[1], 'organ_slims');

        // biosample facet should be filtered by state and organ
        const filteredByStateAndOrgan = applyFilters(this.state.allData, modifiedSelectedStates, this.state.bodyMapFilters, []);
        const biosampleFacet = complexFacets(this.state.allFiles, filteredByStateAndOrgan[1], 'biosample');
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
                                    <div className="sub-text">Colored by most active chromatin state</div>
                                </div>
                                <BodyMapThumbnailAndModal
                                    facet={this.state.bodyMapFacet}
                                    organism={'Homo sapiens'}
                                    handleFilters={this.handleFacetList}
                                    originalFilters={this.state.bodyMapFilters}
                                />
                                {this.state.bodyMapFilters.length > 0 ?
                                    <div className="selections">
                                        <span className="selections-hed">Selected filters:</span>
                                        {this.state.bodyMapFilters.map(f => (
                                            <button
                                                className="selected-chromatin-filter bodymap"
                                                key={`${f}-biosample-selected-filter`}
                                                onClick={() => this.clearBodyMapFilter(f)}
                                            >
                                                <i className="icon icon-times-circle" />
                                                {f}
                                            </button>
                                        ))}
                                    </div>
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
                                    <div className="selections">
                                        <span className="selections-hed">Selected filters:</span>
                                        {this.state.biosampleFilters.map((f) => {
                                            const label = this.state.biosampleKeys.find(k => sanitizedString(k) === f);
                                            return (
                                                <button
                                                    className="selected-chromatin-filter biosample"
                                                    key={`${f}-biosample-selected-filter`}
                                                    onClick={() => this.handleBiosampleFilters(sanitizedString(f))}
                                                >
                                                    <i className="icon icon-times-circle" />
                                                    {label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                : null}
                            </div>
                            <div className="chromatin-filter chromatin-state">
                                <div className="chromatin-hed">
                                    <i className="icon icon-filter" />
                                    Filter by chromatin state
                                    <div className="sub-text">Ordered by most actively transcribed gene regions</div>
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
                                    <div className="selections">
                                        <span className="selections-hed">Selected filters:</span>
                                        {this.state.stateFilters.map((f) => {
                                            const label = this.state.chromatinKeys.find(k => classString(sanitizedString(k)) === f);
                                            return (
                                                <button
                                                    className="selected-chromatin-filter state"
                                                    key={`${f}-chromatinstate-selected-filter`}
                                                    onClick={() => this.handleChromatinFilters(classString(sanitizedString(f)))}
                                                >
                                                    <i className="icon icon-times-circle" />
                                                    {label}
                                                </button>
                                            );
                                        })}
                                    </div>
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
};

export default ChromatinView;
