import React from 'react';
import PropTypes from 'prop-types';
import * as globals from './globals';
import { shadeOverflowOnScroll } from './objectutils';
import { initializedChromatinObject } from './chromatin_view';

// Number of terms to show, the rest will be viewable on scroll
const displayedTermsCount = 14;

export const filterByAllSelectedFilters = (files, facets, facetList) => {
    let newFiles = files;
    facetList.forEach((facetName) => {
        const facetFilters = facets.filter(d => d.includes(`AND${facetName}`)).map(d => d.split('AND')[0].split(' (')[0]);
        if (facetFilters.length > 0) {
            // for organ facet, need to check if any of the listed organ terms match any of the organ filters
            if (facetName === 'organ') {
                newFiles = newFiles.filter((d) => {
                    if (d[facetName] && (d[facetName].indexOf(',') > -1)) {
                        return d[facetName].split(', ').some(f => facetFilters.includes(f));
                    }
                    return null;
                });
            // for non-organ facets, just check if the term matches any of the facet filters
            } else {
                newFiles = newFiles.filter(d => facetFilters.includes(d[facetName]));
            }
        }
    });
    return newFiles;
};

const placeZerosAtEnd = (arr) => {
    Object.filter = (obj, predicate) =>
        Object.keys(obj)
            .filter(key => predicate(obj[key]))
            .reduce((res, key) => Object.assign(res, { [key]: obj[key] }), {});

    const isntZero = Object.filter(arr, val => val > 0);
    const isZero = Object.filter(arr, val => val === 0);

    const sortedIsntZero = Object.keys(isntZero).sort().reduce((obj, key) => {
        obj[key] = isntZero[key];
        return obj;
    }, {});

    const sortedIsZero = Object.keys(isZero).sort().reduce((obj, key) => {
        obj[key] = isZero[key];
        return obj;
    }, {});

    return { ...sortedIsntZero, ...sortedIsZero };
};

export const createFacets = (files, filteredFiles, facetList, searchTerms) => {
    // initialize facet object
    const facetObject = [];
    facetList.forEach((facet) => {
        facetObject[facet] = [];
    });

    // compile term names for each facet from possible results
    files.forEach((file) => {
        facetList.forEach((facet) => {
            // generating facets based on file parameters
            // for every facet except organ, each file matches exactly 1 facet term
            // for the organ facet, each file can have multiple organ slims and we are listing them individually
            // so each file can match multiple organ facet terms whereas for other facets, each file matches exactly 1 term
            // we will probably keep it but we are not sure if it is confusing (the counts don't add up to the number of results for the organ facet) so this may change in a future update
            let slims = [];
            if (facet === 'organ' && file[facet] && (file[facet].indexOf(',') > -1)) {
                slims = file[facet].split(', ');
            } else if (facet === 'organ_slims' && file[facet]) {
                slims = [...file[facet]];
            } else if (file[facet] && facet !== 'organ') {
                slims = [file[facet]];
            }
            slims.forEach((slim) => {
                // if the facet has a typeahead, check that term matches typed search, if so, add if the term is not already present in facet list
                if (searchTerms[facet]) {
                    if ((searchTerms[facet] === '') || globals.sanitizedString(slim).match(searchTerms[facet])) {
                        if (!facetObject[facet][slim]) {
                            facetObject[facet][slim] = 0;
                        }
                    }
                // if the file has a term, add term to facet object if it does not exist yet
                } else if (!facetObject[facet][slim]) {
                    facetObject[facet][slim] = 0;
                }
            });
        });
    });

    // compile term names for each facet from possible results
    filteredFiles.forEach((file) => {
        facetList.forEach((facet) => {
            // generating facets based on file parameters
            // for every facet except organ, each file matches exactly 1 facet term
            // for the organ facet, each file can have multiple organ slims and we are listing them individually
            // so each file can match multiple organ facet terms whereas for other facets, each file matches exactly 1 term
            // we will probably keep it but we are not sure if it is confusing (the counts don't add up to the number of results for the organ facet) so this may change in a future update
            let slims = [];
            if (facet === 'organ' && file[facet] && (file[facet].indexOf(',') > -1)) {
                slims = file[facet].split(', ');
            } else if (facet === 'organ_slims' && file[facet]) {
                slims = [...file[facet]];
            } else if (file[facet] && facet !== 'organ') {
                slims = [file[facet]];
            }
            slims.forEach((slim) => {
                // if the facet has a typeahead, check that term matches typed search, if so, add if the term is not already present in facet list
                if (searchTerms[facet] && ((searchTerms[facet] === '') || globals.sanitizedString(slim).match(searchTerms[facet]))) {
                    facetObject[facet][slim] += 1;
                }
                // if the file has a term, add term to facet object if it does not exist yet
                facetObject[facet][slim] += 1;
            });
        });
    });

    const newFacetObject = {};
    // sort facet term names by counts with zeros at the end
    facetList.forEach((facet) => {
        newFacetObject[facet] = placeZerosAtEnd(facetObject[facet]);
    });
    return newFacetObject;
};

// Generates a facet structure as follows:
// The files structure contains results with various properties and we are aggregating counts of one of those properties in "facetObject"
// facetObject.associatedStates stores the most active state associated with each possible value of the property of interest
// facetObject.[property of interest] stores how many results with matching properties correspond to each chromatin state (so, how many results with biosample "B cell" match each chromatin state) along with a total of how many results have that matching property overall (how many results have a biosample "B cell")
// "param" refers to the property of interest and this function will need to be updated for other desired parameters to confirm that the slims are correctly aggregated
export const complexFacets = (files, filteredFiles, param) => {
    // initialize facet object
    const facetObject = [];
    facetObject[param] = {};
    facetObject.associatedStates = [];

    const chromatinHierarchy = Object.keys(initializedChromatinObject);

    // use all possible results (files) to generate an empty facet structure (associated states as null and totals as 0) with entries corresponding to all possible values for a given property
    files.forEach((file) => {
        let slims = [];
        if (file[param] && (param === 'biosample' || param === 'state')) {
            slims = [file[param]];
        }
        slims.forEach((slim) => {
            if (!facetObject[param][slim]) {
                facetObject[param][slim] = {};
                facetObject[param][slim].total = 0;
                facetObject.associatedStates[slim] = null;
            }
        });
    });

    // use filtered results (filteredFiles) to fill in the empty facet structure
    filteredFiles.forEach((file) => {
        let slims = [];
        if (file[param] && (param === 'biosample' || param === 'state')) {
            slims = [file[param]];
        }
        slims.forEach((slim) => {
            facetObject[param][slim].total += 1;
            if (facetObject[param][slim][file.state]) {
                facetObject[param][slim][file.state] += 1;
            } else {
                facetObject[param][slim][file.state] = 1;
            }
            const hierarchyIdx = chromatinHierarchy.indexOf(facetObject.associatedStates[slim]);
            facetObject.associatedStates[slim] = (hierarchyIdx !== -1 && hierarchyIdx < chromatinHierarchy.indexOf(file.state)) ? facetObject.associatedStates[slim] : file.state;
        });
    });

    return facetObject;
};

// Generates a facet structure as follows:
// The files structure contains results with various properties and we are aggregating counts of one of those properties in "facetObject"
// facetObject.associatedStates stores the most active state associated with each possible value of the property of interest
// facetObject.[property of interest] aggregates counts of possible values of the property of interest
// "param" refers to the property of interest which at this time should only be "organ_slims"
// Note: unlike "complexFacet", this structure does not include counts for each chromatin state per property value under facetObject.[property of interest] - it only includes total counts for each value corresponding to a given property
export const createOrganFacets = (files, filteredFiles, param) => {
    // initialize facet object
    const facetObject = [];
    facetObject[param] = [];
    facetObject.associatedStates = [];

    const chromatinHierarchy = Object.keys(initializedChromatinObject);

    // use all possible results (files) to generate an empty facet structure (associated states as null and counts as 0) with entries corresponding to all possible values for a given property
    files.forEach((file) => {
        let slims = [];
        if (file[param]) {
            slims = [...file[param]];
        }
        slims.forEach((slim) => {
            if (!facetObject[param][slim]) {
                facetObject[param][slim] = 0;
                facetObject.associatedStates[slim] = null;
            }
        });
    });

    // use filtered results (filteredFiles) to fill in the empty facet structure
    filteredFiles.forEach((file) => {
        let slims = [];
        if (file[param]) {
            slims = [...file[param]];
        }
        slims.forEach((slim) => {
            facetObject[param][slim] += 1;
            const hierarchyIdx = chromatinHierarchy.indexOf(facetObject.associatedStates[slim]);
            facetObject.associatedStates[slim] = (hierarchyIdx !== -1 && hierarchyIdx < chromatinHierarchy.indexOf(file.state)) ? facetObject.associatedStates[slim] : file.state;
        });
    });

    return facetObject;
};


class FacetButton extends React.Component {
    constructor() {
        super();
        this._addGenomeFilter = this._addGenomeFilter.bind(this);
    }

    _addGenomeFilter() {
        this.props.addGenomeFilter(this.props.buttonName, this.props.facetLabel);
    }

    render() {
        const { buttonLabel, buttonName, selectedFacets, facetLabel } = this.props;
        return (
            <button
                className={selectedFacets.includes(`${buttonName}AND${facetLabel}`) ? 'active' : ''}
                onClick={this._addGenomeFilter}
                disabled={(buttonLabel.indexOf('(0)') > -1) && !(selectedFacets.includes(`${buttonName}AND${facetLabel}`))}
            >
                {buttonLabel}
            </button>
        );
    }
}

FacetButton.propTypes = {
    buttonLabel: PropTypes.string.isRequired,
    buttonName: PropTypes.string.isRequired,
    facetLabel: PropTypes.string.isRequired,
    selectedFacets: PropTypes.array.isRequired,
    addGenomeFilter: PropTypes.func.isRequired,
};

export const Facet = (props) => {
    const { facetTitle, facetName, facetArray, addGenomeFilter, selectedFacets } = props;
    return (
        <div className="facet">
            <h4>{facetTitle}</h4>
            <div className="facet-scrollable">
                {Object.keys(facetArray).map((d) => {
                    if (d === '') {
                        return <hr />;
                    }
                    return <FacetButton
                        selectedFacets={selectedFacets}
                        buttonLabel={`${d} (${facetArray[d]})`}
                        buttonName={d}
                        facetLabel={facetName}
                        addGenomeFilter={addGenomeFilter}
                        key={d}
                    />;
                })}
            </div>
        </div>
    );
};

Facet.propTypes = {
    facetTitle: PropTypes.string.isRequired,
    facetName: PropTypes.string.isRequired,
    facetArray: PropTypes.object.isRequired,
    addGenomeFilter: PropTypes.func.isRequired,
    selectedFacets: PropTypes.array.isRequired,
};

const TypeaheadFacet = (props) => {
    const { facetTitle, facetName, facetArray, handleSearch, addGenomeFilter, selectedFacets, unsanitizedSearchTerm } = props;
    return (
        <div className="facet">
            <h4>{facetTitle}</h4>
            <div className="typeahead-entry" role="search">
                <i className="icon icon-search" />
                <div className="searchform">
                    <input type="search" aria-label={`Search to filter list of terms for ${facetName} facet`} placeholder="Search" value={unsanitizedSearchTerm} onChange={e => handleSearch(e, facetName)} name={`Search ${facetName} facet`} />
                </div>
            </div>
            <div className="facet-scrollable">
                <div className="top-shading hide-shading" />
                <div
                    className="term-list"
                    onScroll={shadeOverflowOnScroll}
                >
                    {Object.keys(facetArray).map((d) => {
                        if (d === '') {
                            return <hr />;
                        }
                        return <FacetButton
                            selectedFacets={selectedFacets}
                            buttonLabel={`${d} (${facetArray[d]})`}
                            buttonName={d}
                            facetLabel={facetName}
                            addGenomeFilter={addGenomeFilter}
                            key={d}
                        />;
                    })}
                </div>
                <div className={`shading ${(facetArray.length < displayedTermsCount) ? 'hide-shading' : ''}`} />
            </div>
        </div>
    );
};

TypeaheadFacet.propTypes = {
    facetTitle: PropTypes.string.isRequired,
    facetName: PropTypes.string.isRequired,
    facetArray: PropTypes.object.isRequired,
    handleSearch: PropTypes.func.isRequired,
    addGenomeFilter: PropTypes.func.isRequired,
    selectedFacets: PropTypes.array.isRequired,
    unsanitizedSearchTerm: PropTypes.string,
};

TypeaheadFacet.defaultProps = {
    unsanitizedSearchTerm: '',
};

class FilterButton extends React.Component {
    constructor() {
        super();
        this._addGenomeFilter = this._addGenomeFilter.bind(this);
    }

    _addGenomeFilter() {
        this.props.addGenomeFilter(this.props.buttonLabel, this.props.facetLabel);
    }

    render() {
        return (
            <button
                className="browser-filter"
                onClick={this._addGenomeFilter}
                key={this.props.facetKey}
            >
                <i className="icon icon-times-circle" />
                {this.props.buttonLabel}
            </button>
        );
    }
}

FilterButton.propTypes = {
    buttonLabel: PropTypes.string.isRequired,
    facetLabel: PropTypes.string.isRequired,
    facetKey: PropTypes.string.isRequired,
    addGenomeFilter: PropTypes.func.isRequired,
};

export class FacetList extends React.Component {
    constructor() {
        super();

        this.state = {
            selectedFacets: [],
            unsanitizedSearchTerms: {},
            searchTerms: {},
        };
        this.addGenomeFilter = this.addGenomeFilter.bind(this);
        this.toggleFacetDisplay = this.toggleFacetDisplay.bind(this);
        this.clearGenomeFilters = this.clearGenomeFilters.bind(this);
        this.handleSearch = this.handleSearch.bind(this);
    }

    componentDidMount() {
        this.setState({ selectedFacets: this.props.selectedFilters });
    }

    addGenomeFilter(item, category) {
        const itemFacet = `${item}AND${category}`;
        if (this.state.selectedFacets.includes(itemFacet)) {
            this.setState(prevState => ({
                selectedFacets: prevState.selectedFacets.filter(facet => facet !== itemFacet),
            }), () => {
                this.props.handleFacetList(this.state.selectedFacets);
            });
        } else {
            this.setState(prevState => ({
                selectedFacets: [...prevState.selectedFacets, itemFacet],
            }), () => {
                this.props.handleFacetList(this.state.selectedFacets);
            });
        }
    }

    clearGenomeFilters() {
        this.setState({ selectedFacets: [] }, () => {
            this.props.handleFacetList(this.state.selectedFacets);
        });
    }

    toggleFacetDisplay() {
        this.setState(prevState => ({
            facetDisplay: !(prevState.facetDisplay),
        }));
    }

    handleSearch(e, typeaheadIdentifier) {
        const filterVal = String(globals.sanitizedString(e.target.value));
        const targetValue = e.target.value;
        this.setState((prevState) => {
            const unsanitizedSearchTerms = { ...prevState.unsanitizedSearchTerms };
            const searchTerms = { ...prevState.searchTerms };
            unsanitizedSearchTerms[typeaheadIdentifier] = targetValue;
            searchTerms[typeaheadIdentifier] = filterVal;
            return {
                searchTerms,
                unsanitizedSearchTerms,
            };
        });
    }

    render() {
        const facetObject = createFacets(this.props.files, this.props.filteredFiles, this.props.facetList, this.state.searchTerms);

        return (
            <React.Fragment>
                {(this.state.selectedFacets.length > 0) ?
                    <React.Fragment>
                        <div className="browser-selected-facets">
                            <span>Selected filters:</span>
                            {this.state.selectedFacets.map((f) => {
                                const fsplit = f.split('AND');
                                return (
                                    <FilterButton
                                        key={f}
                                        buttonLabel={fsplit[0]}
                                        facetLabel={fsplit[1]}
                                        facetKey={f}
                                        addGenomeFilter={this.addGenomeFilter}
                                    />
                                );
                            })}
                            <button
                                className="browser-filter"
                                onClick={() => this.clearGenomeFilters()}
                            >
                                <i className="icon icon-times-circle" />
                                Clear all filters
                            </button>
                        </div>
                        {(this.props.filteredFiles.length === 0) ?
                            <div className="browser-selected-facets warning"><i className="icon icon-exclamation-circle" />No files match the selected filters. Try different filters to visualize results.</div>
                        : null}
                    </React.Fragment>
                :
                    <div className="browser-selected-facets">Selected filters: To select a filter, make a selection from &quot;Refine your search&quot; below.</div>
                }
                <button className={`browser-selections ${this.state.facetDisplay ? 'facets-without-border' : ''}`} onClick={this.toggleFacetDisplay}><i className={`icon ${this.state.facetDisplay ? 'icon-caret-down' : 'icon-caret-right'}`} /><span className="selection-header">Refine your search</span></button>
                {this.state.facetDisplay ?
                    <div className="browser-facet-container">
                        {this.props.facetList.map((facet, facetIndex) => {
                            if (this.props.typeaheadFacetList[facetIndex]) {
                                return (
                                    <TypeaheadFacet
                                        key={facetIndex}
                                        facetTitle={this.props.facetTitleList[facetIndex]}
                                        facetName={facet}
                                        facetArray={facetObject[facet]}
                                        handleSearch={this.handleSearch}
                                        addGenomeFilter={this.addGenomeFilter}
                                        selectedFacets={this.state.selectedFacets}
                                        unsanitizedSearchTerm={this.state.unsanitizedSearchTerms[facet]}
                                    />
                                );
                            }
                            return (
                                <Facet
                                    key={facetIndex}
                                    facetTitle={this.props.facetTitleList[facetIndex]}
                                    facetName={facet}
                                    facetArray={facetObject[facet]}
                                    addGenomeFilter={this.addGenomeFilter}
                                    selectedFacets={this.state.selectedFacets}
                                />
                            );
                        })}
                    </div>
                : null}
            </React.Fragment>
        );
    }
}

FacetList.propTypes = {
    files: PropTypes.array.isRequired,
    handleFacetList: PropTypes.func.isRequired,
    filteredFiles: PropTypes.array.isRequired,
    selectedFilters: PropTypes.array.isRequired,
    facetList: PropTypes.array.isRequired,
    facetTitleList: PropTypes.array.isRequired,
    typeaheadFacetList: PropTypes.array.isRequired,
};
