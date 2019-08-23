import React from 'react';
import PropTypes from 'prop-types';
import { ResultsTable } from './regulome_search';
import { isLight } from './datacolors';

export const mapChromatinNames = name => (
    name.includes('TssAFlnk') ? 'Flanking Active TSS'
    : name.includes('TssA') ? 'Active TSS'
    : name.includes('TxFlnk') ? "Transcr. at gene 5' and 3'"
    : name.includes('TxWk') ? 'Weak transcription'
    : name.includes('Tx') ? 'Strong transcription'
    : name.includes('EnhG') ? 'Genic enhancers'
    : name.includes('EnhBiv') ? 'Bivalent Enhancer'
    : name.includes('Enh') ? 'Enhancers'
    : name.includes('ZNF/Rpts') ? 'ZNF genes & repeats'
    : name.includes('Het') ? 'Heterochromatin'
    : name.includes('TssBiv') ? 'Bivalent/Poised TSS'
    : name.includes('BivFlnk') ? 'Flanking Bivalent TSS/Enh'
    : name.includes('ReprPCWk') ? 'Weak Repressed PolyComb'
    : name.includes('ReprPC') ? 'Repressed PolyComb'
    : name.includes('Quies') ? 'Quiescent/Low'
    : null
);

const colorChromatinState = chrom => (
    chrom === 'Flanking Active TSS' ? 'rgba(255,69,0)'
    : chrom === 'Active TSS' ? 'rgba(255,0,0)'
    : chrom === "Transcr. at gene 5' and 3'" ? 'rgba(50,205,50)'
    : chrom === 'Strong transcription' ? 'rgba(0,128,0)'
    : chrom === 'Weak transcription' ? 'rgba(0,100,0)'
    : chrom === 'Genic enhancers' ? 'rgba(194,225,5)'
    : chrom === 'Enhancers' ? 'rgba(255,255,0)'
    : chrom === 'ZNF genes & repeats' ? 'rgba(102,205,170)'
    : chrom === 'Heterochromatin' ? 'rgba(138,145,208)'
    : chrom === 'Bivalent/Poised TSS' ? 'rgba(205,92,92)'
    : chrom === 'Flanking Bivalent TSS/Enh' ? 'rgba(233,150,122)'
    : chrom === 'Bivalent Enhancer' ? 'rgba(189,183,107)'
    : chrom === 'Repressed PolyComb' ? 'rgba(128,128,128)'
    : chrom === 'Weak Repressed PolyComb' ? 'rgba(192,192,192)'
    : chrom === 'Quiescent/Low' ? '#DADADA' // this should be white but white is not visible against a white background
    : '#d2d2d2'
);

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
        top: 60,
        bottom: axisMax,
        right: 20,
        left: 30,
    };
    const height = 310 + axisMax;

    const chartArray = chartData.map(d => d.value);
    const chartMax = Math.max(...chartArray);

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
            .ticks(4)
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
        top: 60,
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
        const sortedFakeFacets = [];
        let chartDataOrig = [];
        if (this.props.dataFilter === 'chip') {
            fillColor = () => '#276A8E';
            data.forEach((d) => {
                if (fakeFacets[d.targets]) {
                    fakeFacets[d.targets] += 1;
                } else {
                    fakeFacets[d.targets] = 1;
                }
            });
        } else if (this.props.dataFilter === 'dnase') {
            fillColor = () => '#276A8E';
            data.forEach((d) => {
                if (fakeFacets[d.biosample_ontology.term_name]) {
                    fakeFacets[d.biosample_ontology.term_name] += 1;
                } else {
                    fakeFacets[d.biosample_ontology.term_name] = 1;
                }
            });
        } else if (this.props.dataFilter === 'chromatin') {
            fillColor = colorChromatinState;
            fakeFacets = Object.assign({}, initializedChromatinObject);
            data.forEach((d) => {
                const newName = mapChromatinNames(d.value);
                fakeFacets[newName] += 1;
            });
            const keys = Object.keys(fakeFacets);
            keys.forEach((key) => {
                if (fakeFacets[key] > 0) {
                    sortedFakeFacets.push({
                        key,
                        value: fakeFacets[key],
                    });
                }
            });
            chartDataOrig = sortedFakeFacets;
        }
        // only sort the bar chart data if it is not chromatin data
        if (this.props.dataFilter !== 'chromatin') {
            const keys = Object.keys(fakeFacets);
            keys.sort((a, b) => (fakeFacets[b] - fakeFacets[a]));
            keys.forEach((key) => {
                sortedFakeFacets.push({
                    key,
                    value: fakeFacets[key],
                });
            });
            chartDataOrig = sortedFakeFacets;
        }

        // return subset of results if 'chartLimit' is defined
        let chartData = [];
        if (this.props.chartLimit > 0 && (sortedFakeFacets.length > this.props.chartLimit)) {
            chartData = chartDataOrig.slice(0, this.props.chartLimit);
        } else {
            chartData = chartDataOrig;
        }
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
        return mapChromatinNames(element.value) === key;
    }
    return false;
}

// Sanitize user input and facet terms for comparison: convert to lowercase, remove white space and asterisks (which cause regular expression error)
const sanitizedString = inputString => inputString.toLowerCase()
    .replace(/ /g, '') // remove spaces (to allow multiple word searches)
    .replace(/[*?()+[\]\\/]/g, ''); // remove certain special characters (these cause console errors)

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
            searchTerm: '',
            fillColor: undefined,
        };

        // Bind `this` to non-React methods.
        this.drawCharts = this.drawCharts.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.handleSearch = this.handleSearch.bind(this);
        this.clearSearch = this.clearSearch.bind(this);
        this.expandTerms = this.expandTerms.bind(this);
        this.collapseTerms = this.collapseTerms.bind(this);
    }

    componentDidMount() {
        this.drawCharts();
    }

    handleClick(clickID) {
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
        // Search term entered by the user
        const filterVal = String(sanitizedString(event.target.value));
        this.setState({ searchTerm: filterVal });
    }

    clearSearch() {
        // clear both search terms
        this.setState({
            unsanitizedSearchTerm: '',
            searchTerm: '',
        });
    }

    expandTerms() {
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
        let fillColor;
        if (this.props.dataFilter === 'dnase') {
            data.forEach((d) => {
                if (fakeFacets[d.biosample_ontology.term_name]) {
                    fakeFacets[d.biosample_ontology.term_name] += 1;
                } else {
                    fakeFacets[d.biosample_ontology.term_name] = 1;
                }
            });
            fillColor = () => '#276A8E';
        } else {
            data.forEach((d) => {
                const newName = mapChromatinNames(d.value);
                if (fakeFacets[newName]) {
                    fakeFacets[newName] += 1;
                } else {
                    fakeFacets[newName] = 1;
                }
            });
            fillColor = colorChromatinState;
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
            fillColor,
        });
    }

    render() {
        let errorMessage = !!this.state.searchTerm;
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
                    if (this.state.searchTerm) {
                        searchTermMatch = sanitizedString(d).match(this.state.searchTerm);
                        if (searchTermMatch) {
                            errorMessage = false;
                        }
                    }
                    const barWidth = ((this.props.chartWidth - this.state.leftMargin) / this.state.chartMax) * this.state.chartData[d];
                    const remainderWidth = this.props.chartWidth - barWidth - this.state.leftMargin;
                    return (
                        <div
                            className={`biosample-table table${dKey} ${searchTermMatch ? 'display-table' : ''}`}
                            key={`table${dKey}`}
                        >
                            <div className="bar-row" key={this.state.chartData[d]}>
                                <button
                                    className="bar-label"
                                    style={{
                                        width: `${this.state.leftMargin}px`,
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
                                        height: '20px',
                                        width: `${barWidth}px`,
                                        marginRight: `${remainderWidth}px`,
                                    }}
                                >
                                    <div
                                        className="bar"
                                        style={{
                                            backgroundColor: this.state.fillColor(d),
                                            height: '20px',
                                            width: `${barWidth}px`,
                                        }}
                                    />
                                    <div
                                        className="bar-annotation"
                                        style={{
                                            color: `${isLight(this.state.fillColor(d)) ? 'black' : 'white'}`,
                                        }}
                                    >
                                        {this.state.chartData[d]}
                                    </div>
                                </div>
                            </div>
                            <div
                                className={`barchart-table ${this.state.currentTarget.includes(`table${dKey}`) ? 'active' : ''}`}
                                style={{
                                    marginLeft: `${this.state.leftMargin}px`,
                                }}
                                id={`barchart-table-${dKey}`}
                                aria-labelledby={`barchart-button-${dKey}`}
                            >
                                {this.state.data.filter(element => filterForKey(element, d, this.props.dataFilter)).map(d2 =>
                                    <div className="table-entry" key={`table-entry-${d2.dataset.split('/')[2]}`}>
                                        <p><a href={d2.dataset}>{d2.dataset.split('/')[2]}</a></p>
                                        <div className="inset-table-entries">
                                            {d2.biosample_ontology.organ_slims ?
                                                <p><span className="table-label">Organ</span>{d2.biosample_ontology.organ_slims.join(', ')}</p>
                                            : null}
                                            {d2.method ?
                                                <p><span className="table-label">Method</span>{d2.method}</p>
                                            :
                                                <p><span className="table-label">Method</span>{d2.method}</p>
                                            }
                                            {d2.file ?
                                                <p><span className="table-label">File</span>{d2.file}</p>
                                            : null}
                                            {d2.biosample_ontology ?
                                                <p><span className="table-label">Biosample</span>{d2.biosample_ontology.term_name}</p>
                                            : null}
                                            {(d2.chrom && this.props.dataFilter === 'chromatin') ?
                                                <p><span className="table-label">Chromatin state window</span>{d2.chrom}:{d2.start}..{d2.end}</p>
                                            : null}
                                            {d2.description ?
                                                <p><span className="table-label">Description</span>{d2.description}</p>
                                            : null}
                                        </div>
                                    </div>
                                )}
                            </div>
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
                                    backgroundColor: colorChromatinState(m.chromatin, m.count),
                                    // width: `${(1 / this.state.chromatinStates.length) * 100}%`,
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
            searchTerm: '',
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
                if (this.state.searchTerm === '') {
                    return (modifiedSelectedStates.includes(sanitizedString(mapChromatinNames(d.value))));
                }
                if (d.biosample_ontology.term_name) {
                    return (sanitizedString(mapChromatinNames(d.value)).includes(this.state.searchTerm) || sanitizedString(d.biosample_ontology.term_name).includes(this.state.searchTerm) || sanitizedString(d.biosample_ontology.organ_slims.join(', ')).includes(this.state.searchTerm)) && modifiedSelectedStates.includes(sanitizedString(mapChromatinNames(d.value)));
                }
                return (sanitizedString(mapChromatinNames(d.value)).includes(this.state.searchTerm)) && modifiedSelectedStates.includes(sanitizedString(mapChromatinNames(d.value)));
            }),
        }));
    }

    handleSearch(event) {
        // Unsanitized search term entered by user for display
        this.setState({ unsanitizedSearchTerm: event.target.value });
        // Search term entered by the user
        const filterVal = String(sanitizedString(event.target.value));
        this.setState({ searchTerm: filterVal });
        const filteredData = this.state.data.filter((d) => {
            if (filterVal === '') {
                return true;
            }
            if (d.biosample_ontology.term_name) {
                return sanitizedString(mapChromatinNames(d.value)).includes(filterVal) || sanitizedString(d.biosample_ontology.term_name).includes(filterVal) ||
                sanitizedString(d.biosample_ontology.organ_slims.join(', ')).includes(filterVal);
            }
            return sanitizedString(mapChromatinNames(d.value)).includes(filterVal);
        });
        const fakeFacets = Object.keys(this.state.chartData)
            .reduce((obj, key) => {
                obj[key] = 0;
                return obj;
            }, {});
        const newSelectedStates = [];
        filteredData.forEach((d) => {
            fakeFacets[mapChromatinNames(d.value)] += 1;
            const chromatinValue = sanitizedString(mapChromatinNames(d.value));
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
            searchTerm: '',
            unsanitizedSearchTerm: '',
            filteredData: prevState.data.filter(d => (prevState.selectedStates.includes(sanitizedString(mapChromatinNames(d.value))))),
            filteredChartData: prevState.chartData,
        }));
    }

    drawCharts() {
        const data = this.props.data;
        const initialChartData = Object.assign({}, initializedChromatinObject);
        data.forEach((d) => {
            initialChartData[mapChromatinNames(d.value)] += 1;
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
        let selectedStates = [];
        for (let idx = 0; idx < chartKeys.length; idx += 1) {
            if (chartData[chartKeys[idx]] > 0) {
                selectedStates = [sanitizedString(chartKeys[idx])];
                break;
            }
        }
        const filteredData = data.filter(d => (selectedStates.includes(sanitizedString(mapChromatinNames(d.value)))));
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
            filteredData,
            selectedStates,
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
                                <input type="search" aria-label="search to filter biosample results" placeholder="Search for a biosample name or chromatin state" value={this.state.unsanitizedSearchTerm} onChange={this.handleSearch} />
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
                                            height: '22px',
                                            width: `${barWidth}px`,
                                            marginRight: `${remainderWidth}px`,
                                        }}
                                    >
                                        <div
                                            className="bar"
                                            style={{
                                                backgroundColor: colorChromatinState(d),
                                                height: '22px',
                                                width: `${barWidth}px`,
                                            }}
                                        />
                                        <div
                                            className="bar-annotation"
                                            style={{
                                                color: `${(isLight(colorChromatinState(d)) || d === 'Enhancers' || barWidth <= 20) ? 'black' : 'white'}`,
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
    mapChromatinNames,
};
