import React from 'react';
import PropTypes from 'prop-types';

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
        .style('fill', fillColor)
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

        const allData = this.props.data;
        let data = allData;
        const fakeFacets = [];
        if (this.props.dataFilter === 'chip') {
            data = allData.filter(d => d.assay_title === 'ChIP-seq');
            data.forEach((d) => {
                if (fakeFacets[d.target.label]) {
                    fakeFacets[d.target.label] += 1;
                } else {
                    fakeFacets[d.target.label] = 1;
                }
            });
        } else if (this.props.dataFilter === 'dnase') {
            data = allData.filter(d => (d.assay_title === 'FAIRE-seq' || d.assay_title === 'DNase-seq'));
            data.forEach((d) => {
                if (fakeFacets[d.biosample_ontology.term_name]) {
                    fakeFacets[d.biosample_ontology.term_name] += 1;
                } else {
                    fakeFacets[d.biosample_ontology.term_name] = 1;
                }
            });
        }
        // sort the fake facets
        const keys = Object.keys(fakeFacets);
        keys.sort((a, b) => (fakeFacets[b] - fakeFacets[a]));
        const sortedFakeFacets = [];
        keys.forEach((key) => {
            sortedFakeFacets.push({
                key,
                value: fakeFacets[key],
            });
        });
        const chartDataOrig = sortedFakeFacets;

        // return subset of results if 'chartLimit' is defined
        let chartData = [];
        if (this.props.chartLimit > 0 && (sortedFakeFacets.length > this.props.chartLimit)) {
            chartData = chartDataOrig.slice(0, this.props.chartLimit);
        } else {
            chartData = chartDataOrig;
        }
        const svgElement = d3.select(targetElement).append('svg');
        const fillColor = '#276A8E';
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

function filterForBiosample(element, key) {
    if (element.biosample_ontology) {
        if (element.biosample_ontology.term_name) {
            return element.biosample_ontology.term_name === key;
        }
        return false;
    }
    return false;
}

// Sanitize user input and facet terms for comparison: convert to lowercase, remove white space and asterisks (which cause regular expression error)
const sanitizedString = inputString => inputString.toLowerCase()
    .replace(/ /g, '') // remove spaces (to allow multiple word searches)
    .replace(/[*?()+[\]\\/]/g, ''); // remove certain special characters (these cause console errors)

// Display information on page as JSON formatted data
export class ChartTable extends React.Component {
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
        data.forEach((d) => {
            if (fakeFacets[d.biosample_ontology.term_name]) {
                fakeFacets[d.biosample_ontology.term_name] += 1;
            } else {
                fakeFacets[d.biosample_ontology.term_name] = 1;
            }
        });
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
                                            backgroundColor: '#276A8E',
                                            height: '20px',
                                            width: `${barWidth}px`,
                                        }}
                                    />
                                    <div className="bar-annotation">{this.state.chartData[d]}</div>
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
                                {this.state.data.filter(element => filterForBiosample(element, d)).map(d2 =>
                                    <div className="table-entry" key={`table-entry-${d2.accession}`}>
                                        <p><a href={d2['@id']}>{d2.accession}</a></p>
                                        <div className="inset-table-entries">
                                            {d2.organ_slims ?
                                                <p><span className="table-label">Organ</span>{d2.organ_slims.join(', ')}</p>
                                            : null}
                                            {d2.assay_title ?
                                                <p><span className="table-label">Method</span>{d2.assay_title}</p>
                                            :
                                                <p><span className="table-label">Method</span>{d2.annotation_type}</p>
                                            }
                                            {d2.biosample_ontology ?
                                                <p><span className="table-label">Biosample</span>{d2.biosample_ontology.term_name}</p>
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

ChartTable.propTypes = {
    data: PropTypes.array.isRequired,
    displayTitle: PropTypes.string.isRequired,
    chartWidth: PropTypes.number.isRequired,
};

export default {
    BarChart,
    ChartTable,
};
