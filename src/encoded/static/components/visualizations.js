import React from 'react';
import PropTypes from 'prop-types';
import _ from 'underscore';
import * as globals from './globals';
import { isLight } from './datacolors';
import { initializedChromatinObject } from './chromatin_view';

const sanitizedString = globals.sanitizedString;
const classString = globals.classString;

const defaultColor = '#276A8E';

export const chromatinHierarchy = Object.keys(initializedChromatinObject);

export const sortChromatin = (a, b) => chromatinHierarchy.indexOf(a) - chromatinHierarchy.indexOf(b);

const extraTallLabels = ['endothelial cell of umbilical vein', 'myoepithelial cell of mammary gland'];

const shortenedLabel = name => name.replace('activated', 'ϟ')
    .replace('stimulated', '☆')
    .replace('alpha', 'α')
    .replace('beta', 'β')
    .replace('delta', 'δ')
    .replace('gamma', 'γ')
    .replace('-positive,', '+')
    .replace('-negative,', '-')
    .replace('-positive', '+')
    .replace('-negative', '-');

export const mapChromatinNames = {
    TssAFlnk: 'Flanking Active TSS',
    TssA: 'Active TSS',
    TxFlnk: "Transcr. at gene 5' and 3'",
    TxWk: 'Weak transcription',
    Tx: 'Strong transcription',
    EnhG: 'Genic enhancers',
    EnhBiv: 'Bivalent Enhancer',
    Enh: 'Enhancers',
    ZNFRpts: 'ZNF genes & repeats',
    Het: 'Heterochromatin',
    TssBiv: 'Bivalent/Poised TSS',
    BivFlnk: 'Flanking Bivalent TSS/Enh',
    ReprPCWk: 'Weak Repressed PolyComb',
    ReprPC: 'Repressed PolyComb',
    Quies: 'Quiescent/Low',
};

const colorChromatinState = {
    'Active TSS': '#B85151',
    'Flanking Active TSS': '#E68363',
    "Transcr. at gene 5' and 3'": '#A7DAA7',
    'Strong transcription': '#6c9f6d',
    'Weak transcription': '#88BF89',
    'Genic enhancers': '#C8DD41',
    Enhancers: '#f4f400',
    'ZNF genes & repeats': '#66CDAA',
    Heterochromatin: '#8A91D0',
    'Bivalent/Poised TSS': '#DD9292',
    'Flanking Bivalent TSS/Enh': '#F0BAA8',
    'Bivalent Enhancer': '#BDB76B',
    'Repressed PolyComb': '#848884',
    'Weak Repressed PolyComb': '#C0C0C0',
    'Quiescent/Low': '#E5E4E2',
};

const lookupColorChromatinState = chrom => colorChromatinState[chrom];

export const lookupChromatinNames = (chrom) => {
    let result;
    const newChrom = chrom.replace(/[^A-Za-z]+/g, '');
    Object.keys(mapChromatinNames).forEach((m) => {
        if (newChrom === m) {
            result = mapChromatinNames[m];
        }
    });
    return result;
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
                                                <td><a href={`https://www.encodeproject.org/files/${d2.file}`}>{d2.file}</a></td>
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

        const chartKeys = props.sortedKeys || Object.keys(props.chartData);
        const chartArray = chartKeys.map(key => props.chartData[key].total);
        const chartMax = Math.max(...chartArray);

        let leftMargin = 0;
        Object.keys(props.chartData).forEach((d) => {
            const numLen = d.replace(/\D/g, '').length > 0 ? 30 : 0;
            const stringLen = d.length;
            if (this.props.fullData) {
                leftMargin = Math.max((stringLen * 7) + 60, leftMargin);
            } else {
                leftMargin = Math.max(((stringLen * 7) - numLen), leftMargin);
            }
        });
        // add in some extra margin for white space and caret icon
        leftMargin += 38;
        if (props.chartWidth > 0 && props.chartWidth <= leftMargin) {
            leftMargin = props.chartWidth - 40;
        }

        this.state = {
            chartMax,
            leftMargin,
            chartData: props.chartData,
            chartKeys: props.sortedKeys || Object.keys(props.chartData).sort(),
        };

        this.handleClick = this.handleClick.bind(this);
    }

    componentDidUpdate(prevProps) {
        if (!(_.isEqual(prevProps.sortedKeys, this.props.sortedKeys)) && this.props.sortedKeys) {
            this.setState({
                chartKeys: this.props.sortedKeys,
            });
        }
        if (prevProps.chartWidth !== this.props.chartWidth) {
            if (this.props.chartWidth <= this.state.leftMargin) {
                this.setState({
                    leftMargin: (this.props.chartWidth - 40),
                });
            }
        }
    }

    handleClick(clickID) {
        this.props.handleChartFilters(clickID);
    }

    render() {
        return (
            <div className={`bar-chart-container bar-chart-chromatin ${this.props.additionalClass}`}>
                <div className="bar-chart-bars">
                    {this.state.chartKeys.map((d, dIdx) => {
                        const dKey = sanitizedString(d);
                        let barWidth = ((this.props.chartWidth - this.state.leftMargin) / this.state.chartMax) * this.state.chartData[d].total;
                        const remainderWidth = this.props.chartWidth - barWidth - this.state.leftMargin;

                        if (this.state.leftMargin === (this.props.chartWidth - 40)) {
                            barWidth = (this.state.leftMargin / this.state.chartMax) * this.state.chartData[d].total;
                        }

                        let fullResultOrgan = '';
                        if (this.props.fullData) {
                            const fullResult = this.props.fullData.find(d2 => d2.biosample_ontology.term_name === d);
                            fullResultOrgan = (fullResult && fullResult.biosample_ontology) ? fullResult.biosample_ontology.organ_slims.join(', ') : '';
                        }

                        if (this.state.chartData[d].total > 0) {
                            const stateKeys = Object.keys(this.state.chartData[d]).sort(sortChromatin);
                            return (
                                <div
                                    className={`biosample-table table${dKey} display-table`}
                                    key={`table${dKey}-${dIdx}`}
                                >
                                    <div className="bar-row" key={this.state.chartData[d].total}>
                                        <button
                                            className={`bar-label ${(this.props.selectedStates.includes(dKey) || this.props.selectedStates.includes(classString(dKey))) ? 'active' : ''}`}
                                            style={{
                                                width: `${this.state.leftMargin}px`,
                                            }}
                                            onClick={() => this.handleClick(dKey)}
                                            id={`barchart-button-${dKey}`}
                                        >
                                            {shortenedLabel(d)}
                                            {fullResultOrgan ?
                                                <span className="organ-label">{fullResultOrgan}</span>
                                            : null}
                                        </button>
                                        <div
                                            className="bar-container"
                                            style={{
                                                width: !this.props.fixedBars ? `${barWidth}px` : '30px',
                                                marginRight: !this.props.fixedBars ? `${remainderWidth}px` : '0px',
                                            }}
                                        >
                                            {stateKeys && !this.props.fixedBars ?
                                                <React.Fragment>
                                                    {stateKeys.map((state) => {
                                                        let stateWidth = ((this.props.chartWidth - this.state.leftMargin) / this.state.chartMax) * this.state.chartData[d][state];
                                                        if (this.state.leftMargin === (this.props.chartWidth - 40)) {
                                                            stateWidth = (this.state.leftMargin / this.state.chartMax) * this.state.chartData[d][state];
                                                        }
                                                        if (state !== 'total') {
                                                            return (
                                                                <div
                                                                    key={`bar${state}`}
                                                                    className="bar"
                                                                    style={{
                                                                        backgroundColor: lookupColorChromatinState(state) || defaultColor,
                                                                        width: `${stateWidth}px`,
                                                                        height: `${extraTallLabels.includes(shortenedLabel(d)) ? '39px' : '24px'}`,
                                                                        marginTop: `${extraTallLabels.includes(shortenedLabel(d)) ? '-15px' : '0px'}`,
                                                                    }}
                                                                />
                                                            );
                                                        }
                                                        return null;
                                                    })}
                                                </React.Fragment>
                                            :
                                                <div
                                                    className="bar"
                                                    style={{
                                                        backgroundColor: lookupColorChromatinState(stateKeys[1]) || defaultColor,
                                                        width: '30px',
                                                    }}
                                                />
                                            }
                                            {!this.props.fixedBars ?
                                                <div
                                                    className="bar-annotation"
                                                    style={{
                                                        color: 'black',
                                                        // color: `${((lookupColorChromatinState(d) && isLight(lookupColorChromatinState(d))) || d === 'Enhancers' || barWidth <= 20) ? 'black' : 'white'}`,
                                                        right: `${barWidth > 20 ? '5px' : '-12px'}`,
                                                    }}
                                                >
                                                    {this.state.chartData[d].total}
                                                </div>
                                            : null}
                                        </div>
                                    </div>
                                </div>
                            );
                        }
                        return null;
                    })}
                </div>
            </div>
        );
    }
}

ChartTable.propTypes = {
    chartData: PropTypes.object.isRequired,
    chartWidth: PropTypes.number.isRequired,
    handleChartFilters: PropTypes.func.isRequired,
    selectedStates: PropTypes.array.isRequired,
    additionalClass: PropTypes.string,
    fixedBars: PropTypes.bool,
    sortedKeys: PropTypes.array,
    fullData: PropTypes.array,
};

ChartTable.defaultProps = {
    additionalClass: '',
    fixedBars: false,
    sortedKeys: null,
    fullData: null,
};

export default {
    BarChart,
    ChartList,
    ChartTable,
    HeatMap,
    lookupChromatinNames,
};
