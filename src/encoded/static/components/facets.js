import React from 'react';
import PropTypes from 'prop-types';
import * as globals from './globals';
import { shadeOverflowOnScroll } from './objectutils';
import { initializedChromatinObjectHg19, initializedChromatinObjectGRCh38 } from './chromatin_view';

// Number of terms to show, the rest will be viewable on scroll
const displayedTermsCount = 14;

// Add method to filter objects based on value
Object.filter = (obj, predicate) =>
    Object.keys(obj)
        .filter(key => predicate(obj[key]))
        .reduce((res, key) => Object.assign(res, { [key]: obj[key] }), {});

// Compute how many results correspond to one filter
const filterByOneFilter = (files, facet) => {
    const facetFilter = facet.split('AND')[0];
    const facetName = facet.split('AND')[1];
    let newFiles;
    if (facetName === 'organ') {
        newFiles = files.filter((d) => {
            if (d[facetName] && (d[facetName].indexOf(',') > -1)) {
                return d[facetName].split(', ').some(f => facetFilter.includes(f));
            }
            return null;
        });
    // for non-organ facets, just check if the term matches the facet
    } else {
        newFiles = files.filter(d => facetFilter === d[facetName]);
    }
    return newFiles;
};

// Handles filter selections for genome browser filters
// Genome browser filters have the format "B cellANDorgan" where "B cell" is the term and "organ" is the facet
export const filterByAllSelectedFilters = (files, facets, facetParameters) => {
    let newFiles = files;
    facetParameters.forEach((param) => {
        const facetName = param.type;
        const facetFilters = facets.filter(d => d.includes(`AND${facetName}`)).map(d => d.split('AND')[0]);
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

// Arrange facet entries for genome browser view
// Entries with 0 corresponding results are separated from results with results
// Entries in each group are sorted, and then the groups are re-combined
const placeZerosAtEnd = (unorderedObject) => {
    const entriesWithResults = Object.filter(unorderedObject, val => val > 0);
    const entriesWithoutResults = Object.filter(unorderedObject, val => val === 0);

    const sortedEntriesWithResults = Object.keys(entriesWithResults).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())).reduce((obj, key) => {
        obj[key] = entriesWithResults[key];
        return obj;
    }, {});

    const sortedEntriesWithoutResults = Object.keys(entriesWithoutResults).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())).reduce((obj, key) => {
        obj[key] = entriesWithoutResults[key];
        return obj;
    }, {});

    return { ...sortedEntriesWithResults, ...sortedEntriesWithoutResults };
};

// Compute how many results would correspond to a facet term given current filter selections
const lookupFilterCount = (filter, category, selectedFacets, files, filteredFiles, facetParameters) => {
    const fakeFilter = `${filter}AND${category}`;
    // for filters that are not selected, we want to display how many new results would be added if that filter were selected
    if (!selectedFacets.includes(fakeFilter)) {
        // if we add this filter to our selected filters, we need to know how many results there will be
        const fakeFacets = [...selectedFacets, fakeFilter];
        const fakeFilteredFiles = filterByAllSelectedFilters(files, fakeFacets, facetParameters);
        // if a filter has already been selected in this category, we do not want to include results for those in our count
        if ((selectedFacets.filter(d => d.includes(category)).length > 0)) {
            if (category === 'organ') {
                const alreadyMatchingFiles = filterByOneFilter(filteredFiles, fakeFilter);
                return ((fakeFilteredFiles.length - filteredFiles.length) + alreadyMatchingFiles.length);
            }
            return (fakeFilteredFiles.length - filteredFiles.length);
        }
        return fakeFilteredFiles.length;
    }
    // for filters that are already selected, we want to display how many results that are displayed match this filter
    const matchingFiles = filterByOneFilter(filteredFiles, fakeFilter);
    return matchingFiles.length;
};

// Generate facets for the genome browser view
export const createFacets = (files, filteredFiles, facetParameters, searchTerms, selectedFilters) => {
    // initialize facet object
    const facetObject = {};
    facetParameters.forEach((facet) => {
        facetObject[facet.type] = [];
    });

    // compile term names for each facet from possible results
    files.forEach((file) => {
        facetParameters.forEach((param) => {
            const facet = param.type;
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

    Object.keys(facetObject).forEach((f) => {
        Object.keys(facetObject[f]).forEach((p) => {
            facetObject[f][p] = lookupFilterCount(p, f, selectedFilters, files, filteredFiles, facetParameters);
        });
    });

    const newFacetObject = {};
    // sort facet term names by counts with zeros at the end
    facetParameters.forEach((facet) => {
        newFacetObject[facet.type] = placeZerosAtEnd(facetObject[facet.type]);
    });
    return newFacetObject;
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
    const { typeahead, facetTitle, facetName, facetArray, addGenomeFilter, selectedFacets, handleSearch, unsanitizedSearchTerm } = props;
    return (
        <div className="facet">
            <h4>{facetTitle}</h4>
            {typeahead ?
                <div className="typeahead-entry" role="search">
                    <i className="icon icon-search" />
                    <div className="searchform">
                        <input type="search" aria-label={`Search to filter list of terms for ${facetName} facet`} placeholder="Search" value={unsanitizedSearchTerm} onChange={e => handleSearch(e, facetName)} name={`Search ${facetName} facet`} />
                    </div>
                </div>
            : null}
            <div className="facet-scrollable">
                {typeahead ?
                    <div className="top-shading hide-shading" />
                : null}
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
            </div>
            {typeahead ?
                <div className={`shading ${(facetArray.length < displayedTermsCount) ? 'hide-shading' : ''}`} />
            : null}
        </div>
    );
};

Facet.propTypes = {
    typeahead: PropTypes.bool.isRequired,
    facetTitle: PropTypes.string.isRequired,
    facetName: PropTypes.string.isRequired,
    facetArray: PropTypes.object.isRequired,
    addGenomeFilter: PropTypes.func.isRequired,
    selectedFacets: PropTypes.array.isRequired,
    handleSearch: PropTypes.func,
    unsanitizedSearchTerm: PropTypes.string,
};

Facet.defaultProps = {
    handleSearch: null,
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


// The "FacetList" component is used on the genome browser view


export class FacetList extends React.Component {
    constructor() {
        super();

        this.state = {
            selectedFacets: [],
            unsanitizedSearchTerms: {},
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
        const targetValue = e.target.value;
        this.setState((prevState) => {
            const unsanitizedSearchTerms = { ...prevState.unsanitizedSearchTerms };
            unsanitizedSearchTerms[typeaheadIdentifier] = targetValue;
            return {
                unsanitizedSearchTerms,
            };
        });
    }

    render() {
        // Generate sanitized search terms
        const searchTerms = {};
        Object.keys(this.state.unsanitizedSearchTerms).forEach((facet) => {
            searchTerms[facet] = String(globals.sanitizedString(this.state.unsanitizedSearchTerms[facet]));
        });
        // Create facet object filtered by appropriate search terms
        const facetObject = createFacets(this.props.files, this.props.filteredFiles, this.props.facetParameters, searchTerms, this.state.selectedFacets);

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
                        {this.props.facetParameters.map((facet, facetIndex) => {
                            if (facet.typeahead) {
                                return (
                                    <Facet
                                        typeahead
                                        key={facetIndex}
                                        facetTitle={facet.title}
                                        facetName={facet.type}
                                        facetArray={facetObject[facet.type]}
                                        handleSearch={this.handleSearch}
                                        addGenomeFilter={this.addGenomeFilter}
                                        selectedFacets={this.state.selectedFacets}
                                        unsanitizedSearchTerm={this.state.unsanitizedSearchTerms[facet.type]}
                                    />
                                );
                            }
                            return (
                                <Facet
                                    typeahead={false}
                                    key={facetIndex}
                                    facetTitle={facet.title}
                                    facetName={facet.type}
                                    facetArray={facetObject[facet.type]}
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
    facetParameters: PropTypes.array.isRequired,
};


// The functions "complexFacets" and "createOrganFacets" are used on the chromatin view page


// Generates a facet structure as follows:
// The files structure contains results with various properties and we are aggregating counts of one of those properties in "facetObject"
// facetObject.associatedStates stores the most active state associated with each possible value of the property of interest
// facetObject.[property of interest] stores how many results with matching properties correspond to each chromatin state (so, how many results with biosample "B cell" match each chromatin state) along with a total of how many results have that matching property overall (how many results have a biosample "B cell")
// "param" refers to the property of interest and this function will need to be updated for other desired parameters to confirm that the slims are correctly aggregated
export const complexFacets = (files, filteredFiles, param, assembly) => {
    // initialize facet object
    const facetObject = [];
    facetObject[param] = {};
    facetObject.associatedStates = [];

    let chromatinHierarchy = [];
    if (assembly === 'hg19') {
        chromatinHierarchy = Object.keys(initializedChromatinObjectHg19);
    } else {
        chromatinHierarchy = Object.keys(initializedChromatinObjectGRCh38);
    }

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
export const createOrganFacets = (files, filteredFiles, param, assembly) => {
    // initialize facet object
    const facetObject = [];
    facetObject[param] = [];
    facetObject.associatedStates = [];

    let chromatinHierarchy = [];
    if (assembly === 'hg19') {
        chromatinHierarchy = Object.keys(initializedChromatinObjectHg19);
    } else {
        chromatinHierarchy = Object.keys(initializedChromatinObjectGRCh38);
    }

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
