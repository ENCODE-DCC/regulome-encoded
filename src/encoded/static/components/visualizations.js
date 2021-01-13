import React from 'react';
import PropTypes from 'prop-types';
import _ from 'underscore';
import * as globals from './globals';
import { ResultsTable } from './regulome_search';
import { isLight } from './datacolors';

const sanitizedString = globals.sanitizedString;

const mapChromatinNames = {
    TssAFlnk: 'Flanking Active TSS',
    TssA: 'Active TSS',
    TxFlnk: "Transcr. at gene 5' and 3'",
    TxWk: 'Weak transcription',
    Tx: 'Strong transcription',
    EnhG: 'Genic enhancers',
    EnhBiv: 'Bivalent Enhancer',
    Enh: 'Enhancers',
    'ZNF/Rpts': 'ZNF genes & repeats',
    Het: 'Heterochromatin',
    TssBiv: 'Bivalent/Poised TSS',
    BivFlnk: 'Flanking Bivalent TSS/Enh',
    ReprPCWk: 'Weak Repressed PolyComb',
    ReprPC: 'Repressed PolyComb',
    Quies: 'Quiescent/Low',
};

const colorChromatinState = {
    'Flanking Active TSS': '#FF4500',
    'Active TSS': '#FF0000',
    "Transcr. at gene 5' and 3'": '#32CD32',
    'Strong transcription': '#008000',
    'Weak transcription': '#006400',
    'Genic enhancers': '#C2E105',
    Enhancers: '#FFFF00',
    'ZNF genes & repeats': '#66CDAA',
    Heterochromatin: '#8A91D0',
    'Bivalent/Poised TSS': '#CD5C5C',
    'Flanking Bivalent TSS/Enh': '#E9967A',
    'Bivalent Enhancer': '#BDB76B',
    'Repressed PolyComb': '#808080',
    'Weak Repressed PolyComb': '#C0C0C0',
    'Quiescent/Low': '#DADADA', // this should be white but white is not visible against a white background
};

const lookupColorChromatinState = chrom => colorChromatinState[chrom];

export const lookupChromatinNames = (chrom) => {
    let result;
    Object.keys(mapChromatinNames).forEach((m) => {
        if (chrom.includes(m)) {
            result = mapChromatinNames[m];
        }
    });
    return result;
};

const initializedChromatinObject = {
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

// Consideration: may want to add back axis labels but they are not used now
function drawHorizontalChart(d3, svgBars, chartData, fillColor, chartWidth) {
    // compute max axis length
    let axisMax = 50;
    chartData.forEach((d) => {
        axisMax = Math.max(d.key.length * 5, axisMax);
    });
    // add in some extra margin for white space
    axisMax += 40;

    // create SVG container for chart components
    const margin = {
        top: 10,
        bottom: axisMax,
        right: 20,
        left: 30,
    };
    const height = 310 + axisMax + margin.top;

    const chartArray = chartData.map(d => d.value);
    const chartMax = Math.max(...chartArray);
    const tickNum = Math.min(chartMax, 4);

    svgBars
        .attr('width', chartWidth)
        .attr('height', height)
        .append('g');

    const xScale = d3.scaleBand()
        .domain(chartData.map(d => d.key))
        .range([margin.left, chartWidth - margin.right])
        .padding(0.2);

    const yScale = d3.scaleLinear()
        .domain([0, chartMax])
        .range([height - margin.bottom, margin.top]);

    // Define the axes
    svgBars.append('g')
        .attr('transform', `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(xScale))
        .selectAll('text')
        .style('text-anchor', 'end')
        .attr('dx', '-.8em')
        .attr('dy', '-.55em')
        .attr('transform', 'rotate(-90)');

    svgBars.append('g')
        .attr('transform', `translate(${margin.left},0)`)
        .call(d3.axisLeft(yScale)
            .ticks(tickNum)
            .tickFormat(d3.format('d')));

    svgBars.selectAll('bar')
        .data(chartData)
        .enter().append('rect')
        .style('fill', d => fillColor(d.key))
        .attr('x', d => xScale(d.key))
        .attr('width', xScale.bandwidth())
        .attr('y', d => yScale(+d.value))
        .attr('height', d => yScale(0) - yScale(+d.value));
}

function drawVerticalChart(d3, svgBars, chartData, fillColor, chartWidth) {
    // compute max axis length
    let axisMax = 50;
    chartData.forEach((d) => {
        axisMax = Math.max(d.key.length * 5, axisMax);
    });
    // add in some extra margin for white space
    axisMax += 40;

    // create SVG container for chart components
    const margin = {
        top: 10,
        bottom: 40,
        right: 20,
        left: axisMax,
    };
    const height = (Object.keys(chartData).length * 20) + margin.top + margin.bottom;
    const width = Math.max(500, chartWidth);
    const chartArray = Object.keys(chartData).map(key => chartData[key].doc_count);
    const chartMax = Math.max(...chartArray);

    function compare(a, b) {
        if (+a.doc_count < +b.doc_count) {
            return -1;
        }
        if (+a.doc_count > +b.doc_count) {
            return 1;
        }
        return 0;
    }
    const chartDataSorted = chartData.sort(compare);

    svgBars
        .attr('width', width)
        .attr('height', height)
        .append('g');

    const xScale = d3.scaleLinear()
        .domain([0, chartMax])
        .range([0, width - margin.right - margin.left]);

    const yScale = d3.scaleBand()
        .domain(chartData.map(d => d.key))
        .range([height - margin.bottom, margin.top])
        .padding(0.2);

    // Define the axes
    svgBars.append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`)
        .call(d3.axisTop(xScale));

    svgBars.append('g')
        .attr('transform', `translate(${margin.left},0)`)
        .call(d3.axisLeft(yScale));

    svgBars.selectAll('bar')
        .data(chartDataSorted)
        .enter().append('rect')
        .style('fill', fillColor)
        .attr('x', margin.left)
        .attr('width', d => xScale(+d.doc_count))
        .attr('y', d => yScale(d.key))
        .attr('height', yScale.bandwidth());
}

// Display information on page as JSON formatted data
export class BarChart extends React.Component {
    constructor(props, context) {
        super(props, context);

        // Bind `this` to non-React methods.
        this.drawCharts = this.drawCharts.bind(this);
        this.bindClickHandlers = this.bindClickHandlers.bind(this);
        this.drawChartsResized = this.drawChartsResized.bind(this);
    }

    componentDidMount() {
        require.ensure('d3', (require) => {
            if (this.chartdisplay) {
                this.d3 = require('d3');
                const targetElement = this.chartdisplay;
                this.drawCharts(targetElement);

                // Bind node/subnode click handlers to parent component handlers
                this.bindClickHandlers(this.d3, targetElement);

                window.addEventListener('resize', this.drawChartsResized);
            }
        });
    }

    // need to redraw charts when window changes
    componentDidUpdate() {
        if (this.chartdisplay) {
            this.d3 = require('d3');
            const targetElement = this.chartdisplay;
            targetElement.innerHTML = '';
            this.drawCharts(targetElement);
        }
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.drawChartsResized);
    }

    drawChartsResized() {
        if (this.chartdisplay) {
            this.d3 = require('d3');
            const targetElement = this.chartdisplay;
            targetElement.innerHTML = '';
            this.drawCharts(targetElement);
        }
    }

    drawCharts(targetElement) {
        const d3 = this.d3;
        const data = this.props.data;
        let fillColor;
        let fakeFacets = [];
        const newFakeFacets = [];
        let chartDataOrig = [];
        // collect target data into facet for ChIP-seq chart
        if (this.props.dataFilter === 'chip') {
            fillColor = () => '#276A8E';
            data.forEach((d) => {
                if (fakeFacets[d.targets]) {
                    fakeFacets[d.targets] += 1;
                } else {
                    fakeFacets[d.targets] = 1;
                }
            });
        // collect biosample ontology term name data into facet for DNase-seq chart
        } else if (this.props.dataFilter === 'dnase') {
            fillColor = () => '#276A8E';
            data.forEach((d) => {
                if (fakeFacets[d.biosample_ontology.term_name]) {
                    fakeFacets[d.biosample_ontology.term_name] += 1;
                } else {
                    fakeFacets[d.biosample_ontology.term_name] = 1;
                }
            });
        // collect chromatin state data into facet
        } else if (this.props.dataFilter === 'chromatin') {
            fillColor = lookupColorChromatinState;
            fakeFacets = Object.assign({}, initializedChromatinObject);
            data.forEach((d) => {
                const newName = lookupChromatinNames(d.value);
                fakeFacets[newName] += 1;
            });
        }
        // sort the histogram information by frequency of a value for ChIP-seq and DNase-seq
        if (this.props.dataFilter !== 'chromatin') {
            const keys = Object.keys(fakeFacets);
            keys.sort((a, b) => (fakeFacets[b] - fakeFacets[a]));
            keys.forEach((key) => {
                newFakeFacets.push({
                    key,
                    value: fakeFacets[key],
                });
            });
        // chromatin histogram information will be sorted by the activeness of the chromatin state, not frequency
        // because of how it was initialized, it is already in the proper order
        // however we do need to eliminate states from the facets for which there are 0 results so that we don't have empty bars on our bar chart
        } else {
            const keys = Object.keys(fakeFacets);
            keys.forEach((key) => {
                if (fakeFacets[key] > 0) {
                    newFakeFacets.push({
                        key,
                        value: fakeFacets[key],
                    });
                }
            });
        }
        chartDataOrig = newFakeFacets;

        // return subset of results if 'chartLimit' is defined or for mobile sizes
        let chartData = [];
        // subet of results is displayed on thumbnails
        if (this.props.chartLimit > 0 && (newFakeFacets.length > this.props.chartLimit)) {
            chartData = chartDataOrig.slice(0, this.props.chartLimit);
        // mobile devices need to display a subset of results on the full view in addition to the thumbnail
        } else if (this.props.chartLimit === 0 && this.props.chartWidth < 400) {
            chartData = chartDataOrig.slice(0, 20);
        // all results should be displayed on wide screens on full view
        } else {
            chartData = chartDataOrig;
        }
        // append chart to the target element
        const svgElement = d3.select(targetElement).append('svg');
        if (this.props.chartOrientation === 'horizontal') {
            drawHorizontalChart(d3, svgElement, chartData, fillColor, this.props.chartWidth);
        } else if (this.props.chartOrientation === 'vertical') {
            drawVerticalChart(d3, svgElement, chartData, fillColor, this.props.chartWidth);
        }
    }

    bindClickHandlers(d3, el) {
        // Add click event listeners to each node rendering. Node's ID is its ENCODE object ID
        const svg = d3.select(el);
        const nodes = svg.selectAll('g.node');
        const subnodes = svg.selectAll('g.subnode circle');

        nodes.on('click', (nodeId) => {
            this.nodeIdClick(nodeId);
        });
        subnodes.on('click', (subnode) => {
            d3.event.stopPropagation();
            this.nodeIdClick(subnode.id);
        });
    }

    render() {
        return (
            <div>
                <div ref={(div) => { this.chartdisplay = div; }} className="chart-display" />
            </div>
        );
    }
}

BarChart.propTypes = {
    data: PropTypes.array.isRequired,
    dataFilter: PropTypes.string.isRequired,
    chartWidth: PropTypes.number.isRequired,
    chartLimit: PropTypes.number.isRequired, // limit is set to 0 for all the data
    chartOrientation: PropTypes.string.isRequired,
};

function filterForKey(element, key, dataFilter) {
    if (dataFilter === 'dnase') {
        if (element.biosample_ontology) {
            if (element.biosample_ontology.term_name) {
                return element.biosample_ontology.term_name === key;
            }
            return false;
        }
        return false;
    } else if (dataFilter === 'chromatin') {
        return lookupChromatinNames(element.value) === key;
    }
    return false;
}

// Display information on page as JSON formatted data
export class ChartList extends React.Component {
    constructor(props, context) {
        super(props, context);

        this.state = {
            chartData: [],
            chartTitle: '',
            chartMax: 0,
            leftMargin: 0,
            currentTarget: [],
            data: [],
            unsanitizedSearchTerm: '',
            windowWidth: 0,
        };

        // Bind `this` to non-React methods.
        this.drawCharts = this.drawCharts.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.handleSearch = this.handleSearch.bind(this);
        this.clearSearch = this.clearSearch.bind(this);
        this.expandTerms = this.expandTerms.bind(this);
        this.collapseTerms = this.collapseTerms.bind(this);
        this.updateWidth = this.updateWidth.bind(this);
    }

    componentDidMount() {
        this.drawCharts();
        window.addEventListener('resize', _.debounce(() => this.updateWidth(), 10));
    }

    componentWillUnmount() {
        window.removeEventListener('resize', _.debounce(() => this.updateWidth(), 10));
    }

    updateWidth() {
        this.setState({ windowWidth: window.innerWidth });
    }

    handleClick(clickID) {
        this.updateWidth();
        if (!(this.state.currentTarget.includes(`table${clickID}`))) {
            this.setState(prevState => ({
                currentTarget: [...prevState.currentTarget, `table${clickID}`],
            }));
        } else {
            const removedIDX = this.state.currentTarget.indexOf(`table${clickID}`);
            this.setState(prevState => ({
                currentTarget: [...prevState.currentTarget.slice(0, removedIDX), ...prevState.currentTarget.slice(removedIDX + 1)],
            }));
        }
    }

    handleSearch(event) {
        // Unsanitized search term entered by user for display
        this.setState({ unsanitizedSearchTerm: event.target.value });
    }

    clearSearch() {
        // Clear search term
        this.setState({ unsanitizedSearchTerm: '' });
    }

    expandTerms() {
        this.updateWidth();
        const allTargets = Object.keys(this.state.chartData).map((key) => {
            const dKey = key.replace(/[^\w\s]/gi, '').toLowerCase();
            return `table${dKey}`;
        });
        this.setState({
            currentTarget: allTargets,
        });
    }

    collapseTerms() {
        this.setState({
            currentTarget: [],
        });
    }

    drawCharts() {
        const data = this.props.data;
        const fakeFacets = [];
        if (this.props.dataFilter === 'dnase') {
            data.forEach((d) => {
                if (fakeFacets[d.biosample_ontology.term_name]) {
                    fakeFacets[d.biosample_ontology.term_name] += 1;
                } else {
                    fakeFacets[d.biosample_ontology.term_name] = 1;
                }
            });
        } else {
            data.forEach((d) => {
                const newName = lookupChromatinNames(d.value);
                if (fakeFacets[newName]) {
                    fakeFacets[newName] += 1;
                } else {
                    fakeFacets[newName] = 1;
                }
            });
        }
        // sort the fake facets
        const keys = Object.keys(fakeFacets);
        keys.sort((a, b) => (fakeFacets[b] - fakeFacets[a]));
        const sortedFakeFacets = [];
        keys.forEach((key) => {
            sortedFakeFacets[key] = fakeFacets[key];
        });
        const chartData = sortedFakeFacets;
        const chartTitle = this.props.displayTitle;
        const chartArray = Object.keys(chartData).map(key => chartData[key]);
        const chartMax = Math.max(...chartArray);
        // compute left margin
        let leftMargin = 60;
        Object.keys(chartData).forEach((d) => {
            leftMargin = Math.max(d.length * 7, leftMargin);
        });
        // add in some extra margin for white space and caret icon
        leftMargin += 50;
        this.setState({
            chartData,
            chartTitle,
            chartMax,
            leftMargin,
            data,
        });
    }

    render() {
        const searchTerm = String(sanitizedString(this.state.unsanitizedSearchTerm));
        let errorMessage = !!searchTerm;
        let fillColor;
        if (this.props.dataFilter === 'dnase') {
            fillColor = () => '#276A8E';
        } else {
            fillColor = lookupColorChromatinState;
        }
        const chartWidth = this.props.chartWidth;
        const isMobile = this.state.windowWidth <= 600;

        return (
            <div className="bar-chart-container">
                <div className="bar-chart-header">
                    <h4>{this.state.chartTitle}</h4>
                    <button onClick={this.expandTerms}><i className="icon icon-expand" /></button>
                    <button onClick={this.collapseTerms}><i className="icon icon-compress" /></button>
                    <div className="chart-typeahead-container">
                        <div className="chart-typeahead" role="search">
                            <i className="icon icon-search" />
                            <div className="searchform">
                                <input type="search" aria-label="search to filter biosample results" placeholder="Search for a biosample name" value={this.state.unsanitizedSearchTerm} onChange={this.handleSearch} />
                            </div>
                            <i className="icon icon-times" aria-label="clear search and see all biosample results" onClick={this.clearSearch} onKeyDown={this.clearSearch} role="button" tabIndex="0" />
                        </div>
                    </div>
                </div>
                {Object.keys(this.state.chartData).map((d) => {
                    const dKey = d.replace(/[^\w\s]/gi, '').toLowerCase();
                    let searchTermMatch = true;
                    if (searchTerm) {
                        searchTermMatch = sanitizedString(d).match(searchTerm);
                        if (searchTermMatch) {
                            errorMessage = false;
                        }
                    }
                    let barWidth = 0;
                    let remainderWidth = 0;
                    let leftMargin = 0;
                    // for screen widths wider than 500 px, we have a two column display
                    // left column displays labels for the bars
                    // right column displays the bars and data entries pertaining to the bars
                    if (chartWidth > 500) {
                        leftMargin = this.state.leftMargin;
                        barWidth = ((chartWidth - leftMargin) / this.state.chartMax) * this.state.chartData[d];
                        remainderWidth = chartWidth - barWidth - leftMargin;
                    // for smaller screen widths, we stack the display
                    // labels are displayed on top of bars which are displayed on top of data entries
                    } else {
                        leftMargin = '100%';
                        barWidth = (chartWidth / this.state.chartMax) * this.state.chartData[d];
                        remainderWidth = chartWidth - barWidth;
                    }
                    return (
                        <div
                            className={`biosample-table table-list table${dKey} ${searchTermMatch ? 'display-table' : ''}`}
                            key={`table${dKey}`}
                        >
                            <div className="bar-row" key={this.state.chartData[d]}>
                                <button
                                    className="bar-label"
                                    style={{
                                        width: `${leftMargin}px`,
                                    }}
                                    onClick={() => this.handleClick(dKey)}
                                    aria-expanded={this.state.currentTarget.includes(`table${dKey}`)}
                                    aria-controls={`barchart-table-${dKey}`}
                                    id={`barchart-button-${dKey}`}
                                >
                                    <i className={`icon ${this.state.currentTarget.includes(`table${dKey}`) ? 'icon-caret-down' : 'icon-caret-right'}`} />
                                    {d}
                                </button>
                                <div
                                    className="bar-container"
                                    style={{
                                        width: `${barWidth}px`,
                                        marginRight: `${remainderWidth}px`,
                                    }}
                                >
                                    <div
                                        className="bar"
                                        style={{
                                            backgroundColor: fillColor(d),
                                            width: `${barWidth}px`,
                                        }}
                                    />
                                    <div
                                        className="bar-annotation"
                                        style={{
                                            color: `${isLight(fillColor(d)) ? 'black' : 'white'}`,
                                        }}
                                    >
                                        {this.state.chartData[d]}
                                    </div>
                                </div>
                            </div>
                            {isMobile ?
                                <div
                                    className={`barchart-table ${this.state.currentTarget.includes(`table${dKey}`) ? 'active' : ''}`}
                                    id={`barchart-table-${dKey}`}
                                    aria-labelledby={`barchart-button-${dKey}`}
                                >
                                    {this.state.data.filter(element => filterForKey(element, d, this.props.dataFilter)).map(d2 =>
                                        <div className="table-entry" key={`table-entry-${d2.file}`}>
                                            <p>
                                                <span className="table-label">File</span><a href={`../files/${d2.file}`}>{d2.file}</a>,
                                                <span className="table-label dataset-label">Dataset</span><a href={d2.dataset}>{d2.dataset.split('/')[2]}</a>
                                            </p>
                                            {(d2.biosample_ontology.organ_slims.length > 0) ?
                                                <p><span className="table-label">Organ</span>{d2.biosample_ontology.organ_slims.join(', ')}</p>
                                            : null}
                                            <p><span className="table-label">Method</span>{d2.method}</p>
                                            {(d2.chrom && this.props.dataFilter === 'chromatin') ?
                                                <p><span className="table-label">Chromatin state window</span>{d2.chrom}:{d2.start}..{d2.end}</p>
                                            : null}
                                            {d2.description ?
                                                <p><span className="table-label">Description</span>{d2.description}</p>
                                            : null}
                                        </div>
                                    )}
                                </div>
                            :
                                <table
                                    className={`barchart-table ${this.state.currentTarget.includes(`table${dKey}`) ? 'active' : ''}`}
                                    id={`barchart-table-${dKey}`}
                                    aria-labelledby={`barchart-button-${dKey}`}
                                >
                                    <tbody>
                                        <tr>
                                            <th>File</th>
                                            <th>Dataset</th>
                                            <th>Organ</th>
                                            <th>Method</th>
                                            {(this.props.dataFilter === 'chromatin') ?
                                                <th>Chromatin state window</th>
                                            : null}
                                        </tr>
                                        {this.state.data.filter(element => filterForKey(element, d, this.props.dataFilter)).map(d2 =>
                                            <tr key={d2.file}>
                                                <td><a href={`https://regulomedb.org/files/${d2.file}`}>{d2.file}</a></td>
                                                <td><a href={d2.dataset}>{d2.dataset.split('/')[4]}</a></td>
                                                <td>{d2.biosample_ontology.organ_slims.join(', ')}</td>
                                                <td>{d2.method}</td>
                                                {(this.props.dataFilter === 'chromatin') ?
                                                    <td>{d2.chrom}:{d2.start}..{d2.end}</td>
                                                : null}
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            }
                        </div>
                    );
                })}
                {errorMessage ?
                    <div className="error-message">There are no results matching the typed biosample name.</div>
                : null}
            </div>
        );
    }
}

ChartList.propTypes = {
    data: PropTypes.array.isRequired,
    displayTitle: PropTypes.string.isRequired,
    chartWidth: PropTypes.number.isRequired,
    dataFilter: PropTypes.string.isRequired,
};

// Display heat map for chromatin states
// Note: this was developed and then it was decided that this was the wrong way to visualize the data
// Nonetheless it may be useful later
export class HeatMap extends React.Component {
    constructor(props, context) {
        super(props, context);

        this.state = {
            matrix: [],
            chromatinStates: [],
            biosampleList: [],
        };

        // Bind `this` to non-React methods.
        this.generateChartMatrix = this.generateChartMatrix.bind(this);
    }

    componentDidMount() {
        this.generateChartMatrix();
    }

    generateChartMatrix() {
        const data = this.props.data;
        const matrix = [];
        const allChromatinStates = data.map(d => d.value);
        const chromatinStates = Array.from(new Set(allChromatinStates));
        const allBiosampleList = data.map(d => d.biosample_ontology.term_name).filter(b => b !== undefined);
        const biosampleList = Array.from(new Set(allBiosampleList));
        biosampleList.forEach((bio) => {
            chromatinStates.forEach((chrom) => {
                matrix.push({
                    biosample: bio,
                    chromatin: chrom,
                    count: 0,
                });
            });
        });
        data.forEach((d) => {
            const existingIdx = matrix.findIndex(m => m.chromatin === d.value && m.biosample === d.biosample_ontology.term_name);
            if (existingIdx > -1) {
                matrix[existingIdx].count += 1;
            }
        });
        this.setState({
            matrix,
            chromatinStates,
            biosampleList,
        });
    }

    render() {
        return (
            <div className="matrix-container">
                {!(this.props.thumbnail) ?
                    <div className="organ-labels">
                        {this.state.biosampleList.map(organ =>
                            <div
                                className="organ-label"
                                key={`organ${organ.toLowerCase().replace(/ /g, '')}`}
                            >{organ}
                            </div>
                        )}
                    </div>
                : null}
                <div className="heatmap">
                    <div
                        className="inner-heatmap"
                        style={{
                            width: `${this.state.chromatinStates.length * 26}px`,
                        }}
                    >
                        {this.state.matrix.map((m, midx) =>
                            <div
                                key={`matrix${midx}`}
                                className="color-block"
                                style={{
                                    backgroundColor: lookupColorChromatinState(m.chromatin),
                                }}
                            />
                        )}
                    </div>
                </div>
                {!(this.props.thumbnail) ?
                    <div className="biosample-empty-space" />
                : null}
                {!(this.props.thumbnail) ?
                    <div className="biosample-labels">
                        {this.state.chromatinStates.map(chrom =>
                            <div
                                className="bio-label"
                                key={`chrom${chrom.toLowerCase().replace(/ /g, '')}`}
                                style={{
                                    width: '26px',
                                }}
                            >
                                <div className="label-text">{chrom}</div>
                            </div>
                        )}
                    </div>
                : null}
            </div>
        );
    }
}

HeatMap.propTypes = {
    data: PropTypes.array.isRequired,
    thumbnail: PropTypes.bool.isRequired,
};

// Display information on page as JSON formatted data
export class ChartTable extends React.Component {
    constructor(props, context) {
        super(props, context);

        this.state = {
            chartData: [],
            filteredChartData: [],
            chartMax: 0,
            leftMargin: 0,
            data: [],
            filteredData: [],
            unsanitizedSearchTerm: '',
            selectedStates: [],
        };

        // Bind `this` to non-React methods.
        this.drawCharts = this.drawCharts.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.handleSearch = this.handleSearch.bind(this);
        this.clearSearch = this.clearSearch.bind(this);
    }

    componentDidMount() {
        this.drawCharts();
    }

    handleClick(clickID) {
        let modifiedSelectedStates;
        if (this.state.selectedStates.includes(clickID)) {
            modifiedSelectedStates = [...this.state.selectedStates];
            modifiedSelectedStates.splice(modifiedSelectedStates.indexOf(clickID), 1);
        } else {
            modifiedSelectedStates = [...this.state.selectedStates, clickID];
        }
        this.setState(prevState => ({
            selectedStates: modifiedSelectedStates,
            filteredData: prevState.data.filter((d) => {
                const searchTerm = String(sanitizedString(this.state.unsanitizedSearchTerm));
                if (searchTerm === '') {
                    return (modifiedSelectedStates.includes(sanitizedString(lookupChromatinNames(d.value))));
                }
                if (d.biosample_ontology.term_name) {
                    return (sanitizedString(lookupChromatinNames(d.value)).includes(searchTerm) || sanitizedString(d.biosample_ontology.term_name).includes(searchTerm) || sanitizedString(d.biosample_ontology.organ_slims.join(', ')).includes(searchTerm)) && modifiedSelectedStates.includes(sanitizedString(lookupChromatinNames(d.value)));
                }
                return (sanitizedString(lookupChromatinNames(d.value)).includes(searchTerm)) && modifiedSelectedStates.includes(sanitizedString(lookupChromatinNames(d.value)));
            }),
        }));
    }

    handleSearch(event) {
        // Unsanitized search term entered by user for display
        this.setState({ unsanitizedSearchTerm: event.target.value });
        // Search term entered by the user
        const filterVal = String(sanitizedString(event.target.value));
        let filteredData = [];
        if (filterVal === '') {
            filteredData = this.state.data;
        } else {
            filteredData = this.state.data.filter((d) => {
                if (d.biosample_ontology.term_name) {
                    return sanitizedString(lookupChromatinNames(d.value)).includes(filterVal) || sanitizedString(d.biosample_ontology.term_name).includes(filterVal) ||
                    sanitizedString(d.biosample_ontology.organ_slims.join(', ')).includes(filterVal);
                }
                return sanitizedString(lookupChromatinNames(d.value)).includes(filterVal);
            });
        }
        const fakeFacets = Object.keys(this.state.chartData)
            .reduce((obj, key) => {
                obj[key] = 0;
                return obj;
            }, {});
        const newSelectedStates = [];
        filteredData.forEach((d) => {
            fakeFacets[lookupChromatinNames(d.value)] += 1;
            const chromatinValue = sanitizedString(lookupChromatinNames(d.value));
            if (!newSelectedStates.includes(chromatinValue)) {
                newSelectedStates.push(chromatinValue);
            }
        });
        this.setState({
            filteredData,
            filteredChartData: fakeFacets,
            selectedStates: newSelectedStates,
        });
    }

    clearSearch() {
        // clear both search terms
        this.setState(prevState => ({
            unsanitizedSearchTerm: '',
            filteredData: prevState.data.filter(d => (prevState.selectedStates.includes(sanitizedString(lookupChromatinNames(d.value))))),
            filteredChartData: prevState.chartData,
        }));
    }

    drawCharts() {
        const data = this.props.data;
        const initialChartData = Object.assign({}, initializedChromatinObject);
        data.forEach((d) => {
            initialChartData[lookupChromatinNames(d.value)] += 1;
        });
        const chartData = Object.keys(initialChartData)
            .filter(key => initialChartData[key] > 0)
            .reduce((obj, key) => {
                obj[key] = initialChartData[key];
                return obj;
            }, {});
        const chartKeys = Object.keys(chartData);
        const chartArray = chartKeys.map(key => chartData[key]);
        const chartMax = Math.max(...chartArray);
        // compute left margin
        let leftMargin = 60;
        Object.keys(chartData).forEach((d) => {
            leftMargin = Math.max(d.length * 7, leftMargin);
        });
        // add in some extra margin for white space and caret icon
        leftMargin += 50;
        this.setState({
            chartData,
            filteredChartData: chartData,
            chartMax,
            leftMargin,
            data,
            selectedStates: [],
        });
    }

    render() {
        const chartTitle = this.props.displayTitle;
        return (
            <div className="bar-chart-container bar-chart-chromatin">
                <div className="bar-chart-header short">
                    <h4>{chartTitle}</h4>
                    <div className="chart-typeahead-container">
                        <div className="chart-typeahead" role="search">
                            <i className="icon icon-search" />
                            <div className="searchform">
                                <input type="search" aria-label="search to filter biosample results" placeholder="Search for a biosample name, chromatin state, or organ" value={this.state.unsanitizedSearchTerm} onChange={this.handleSearch} />
                            </div>
                            <i className="icon icon-times" aria-label="clear search and see all biosample results" onClick={this.clearSearch} onKeyDown={this.clearSearch} role="button" tabIndex="0" />
                        </div>
                    </div>
                </div>
                <div className="bar-chart-bars">
                    {Object.keys(this.state.filteredChartData).map((d) => {
                        const dKey = sanitizedString(d);
                        const barWidth = ((this.props.chartWidth - this.state.leftMargin) / this.state.chartMax) * this.state.filteredChartData[d];
                        const remainderWidth = this.props.chartWidth - barWidth - this.state.leftMargin;
                        return (
                            <div
                                className={`biosample-table table${dKey} display-table`}
                                key={`table${dKey}`}
                            >
                                <div className="bar-row" key={this.state.filteredChartData[d]}>
                                    <button
                                        className={`bar-label ${this.state.selectedStates.includes(dKey) ? 'active' : ''}`}
                                        style={{
                                            width: `${this.state.leftMargin}px`,
                                        }}
                                        onClick={() => this.handleClick(dKey)}
                                        id={`barchart-button-${dKey}`}
                                    >
                                        {d}
                                    </button>
                                    <div
                                        className="bar-container"
                                        style={{
                                            width: `${barWidth}px`,
                                            marginRight: `${remainderWidth}px`,
                                        }}
                                    >
                                        <div
                                            className="bar"
                                            style={{
                                                backgroundColor: lookupColorChromatinState(d),
                                                width: `${barWidth}px`,
                                            }}
                                        />
                                        <div
                                            className="bar-annotation"
                                            style={{
                                                color: `${(isLight(lookupColorChromatinState(d)) || d === 'Enhancers' || barWidth <= 20) ? 'black' : 'white'}`,
                                                right: `${barWidth > 20 ? '5px' : '-12px'}`,
                                            }}
                                        >
                                            {this.state.filteredChartData[d]}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <ResultsTable data={this.state.filteredData} displayTitle={''} dataFilter={'chromatin'} errorMessage={'Click on a chromatin state name or enter a different search term to see results.'} />
            </div>
        );
    }
}

ChartTable.propTypes = {
    data: PropTypes.array.isRequired,
    displayTitle: PropTypes.string.isRequired,
    chartWidth: PropTypes.number.isRequired,
};

export default {
    BarChart,
    ChartList,
    ChartTable,
    HeatMap,
    lookupChromatinNames,
};
