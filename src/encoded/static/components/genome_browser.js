import React from 'react';
import PropTypes from 'prop-types';
import _ from 'underscore';
import { FetchedData, Param } from './fetched';
import { BrowserFeat } from './browserfeat';

const domainName = 'https://www.encodeproject.org';

const AutocompleteBox = (props) => {
    const terms = props.auto['@graph']; // List of matching terms from server
    const handleClick = props.handleClick;
    const userTerm = props.userTerm && props.userTerm.toLowerCase(); // Term user entered

    if (!props.hide && userTerm && userTerm.length > 0 && terms && terms.length > 0) {
        return (
            <ul className="adv-search-autocomplete">
                {terms.map((term) => {
                    let matchEnd;
                    let preText;
                    let matchText;
                    let postText;

                    // Boldface matching part of term
                    const matchStart = term.text.toLowerCase().indexOf(userTerm);
                    if (matchStart >= 0) {
                        matchEnd = matchStart + userTerm.length;
                        preText = term.text.substring(0, matchStart);
                        matchText = term.text.substring(matchStart, matchEnd);
                        postText = term.text.substring(matchEnd);
                    } else {
                        preText = term.text;
                    }
                    return (
                        <AutocompleteBoxMenu
                            key={term.text}
                            handleClick={handleClick}
                            term={term}
                            name={props.name}
                            preText={preText}
                            matchText={matchText}
                            postText={postText}
                        />
                    );
                })}
            </ul>
        );
    }

    return null;
};

AutocompleteBox.propTypes = {
    auto: PropTypes.object,
    userTerm: PropTypes.string,
    handleClick: PropTypes.func,
    hide: PropTypes.bool,
    name: PropTypes.string,
};

AutocompleteBox.defaultProps = {
    auto: {}, // Looks required, but because it's built from <Param>, it can fail type checks.
    userTerm: '',
    handleClick: null,
    hide: false,
    name: '',
};

// Draw the autocomplete box drop-down menu.
class AutocompleteBoxMenu extends React.Component {
    constructor() {
        super();

        // Bind this to non-React methods.
        this.handleClick = this.handleClick.bind(this);
    }

    // Handle clicks in the drop-down menu. It just calls the parent's handleClick function, giving
    // it the parameters of the clicked item.
    handleClick() {
        const { term, name } = this.props;
        this.props.handleClick(term.text, term._source.payload.id, name);
    }

    render() {
        const { preText, matchText, postText } = this.props;

        /* eslint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex, jsx-a11y/click-events-have-key-events */
        return (
            <li tabIndex="0" onClick={this.handleClick}>
                {preText}<b>{matchText}</b>{postText}
            </li>
        );
        /* eslint-enable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex, jsx-a11y/click-events-have-key-events */
    }
}

AutocompleteBoxMenu.propTypes = {
    handleClick: PropTypes.func.isRequired, // Parent function to handle a click in a drop-down menu item
    term: PropTypes.object.isRequired, // Object for the term being searched
    name: PropTypes.string,
    preText: PropTypes.string, // Text before the matched term in the entered string
    matchText: PropTypes.string, // Matching text in the entered string
    postText: PropTypes.string, // Text after the matched term in the entered string
};

AutocompleteBoxMenu.defaultProps = {
    name: '',
    preText: '',
    matchText: '',
    postText: '',
};


// Files to be displayed for local version of browser
const dummyFiles = [
];

// Not all files can be visualized on the Valis genome browser
// Some of these files should be visualizable later, after updates to browser
export function filterForVisualizableFiles(fileList) {
    const newFileList = fileList.filter(file => (
        (file.file_format === 'bigWig' || file.file_format === 'bigBed')
        && (file.file_format_type !== 'bedMethyl')
        && (file.file_format_type !== 'bedLogR')
        && (file.file_format_type !== 'idr_peak')
        && (file.file_format_type !== 'tss_peak')
        && (file.file_format_type !== 'pepMap')
        && (file.file_format_type !== 'modPepMap')
        && ['released', 'in progress', 'archived'].indexOf(file.status) > -1
    ));
    return newFileList;
}

// Fetch gene coordinate file
export function getCoordinateData(geneLink, fetch) {
    return fetch(geneLink, {
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

function mapGenome(inputAssembly) {
    let genome = inputAssembly.split(' ')[0];
    if (genome === 'hg19') {
        genome = 'GRCh37';
    } else if (genome === 'mm9') {
        genome = 'GRCm37';
    } else if (genome === 'mm10') {
        genome = 'GRCm38';
    }
    return genome;
}

class GenomeBrowser extends React.Component {
    constructor(props, context) {
        super(props, context);

        this.state = {
            trackList: [],
            visualizer: null,
            showAutoSuggest: true,
            searchTerm: '',
            genome: '',
            contig: props.coordinates.split(':')[0],
            x0: +props.coordinates.split(':')[1].split('-')[0] - 5000,
            x1: +props.coordinates.split(':')[1].split('-')[1] + 5000,
            pinnedFiles: [],
            disableBrowserForIE: false,
            geneSearch: false,
        };
        this.setBrowserDefaults = this.setBrowserDefaults.bind(this);
        this.filesToTracks = this.filesToTracks.bind(this);
        this.drawTracks = this.drawTracks.bind(this);
        this.drawTracksResized = this.drawTracksResized.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleAutocompleteClick = this.handleAutocompleteClick.bind(this);
        this.handleOnFocus = this.handleOnFocus.bind(this);
        this.compileFiles = this.compileFiles.bind(this);
        this.setGenomeAndTracks = this.setGenomeAndTracks.bind(this);
        this.resetLocation = this.resetLocation.bind(this);
    }

    componentDidMount() {
        // Check if browser is IE 11 and disable browser if so
        if (BrowserFeat.getBrowserCaps('uaTrident')) {
            this.setState({ disableBrowserForIE: true });
        } else {
            // Load GenomeVisualizer library
            // We have to wait for the component to mount because the library relies on window variable
            require.ensure(['genome-visualizer'], (require) => {
                this.GV = require('genome-visualizer');
                // Determine pinned files based on genome, filter and sort files, compute and draw tracks
                this.setGenomeAndTracks();
            });
        }
    }

    componentDidUpdate(prevProps, prevState) {
        if (!(this.state.disableBrowserForIE)) {
            if (this.state.contig !== prevState.contig && this.state.visualizer) {
                this.state.visualizer.setLocation({ contig: this.state.contig, x0: this.state.x0, x1: this.state.x1 });
            }

            if (this.props.assembly !== prevProps.assembly) {
                // Determine pinned files based on genome, filter and sort files, compute and draw tracks
                this.setGenomeAndTracks();
                // Clear the gene search
                this.setState({ searchTerm: '' });
            }

            // If the parent container changed size, we need to update the browser width
            if (this.props.expanded !== prevProps.expanded) {
                setTimeout(this.drawTracksResized, 1000);
            }

            if (!(_.isEqual(this.props.files, prevProps.files))) {
                let newFiles = [];
                let files = [];
                let domain = `${window.location.protocol}//${window.location.hostname}`;
                if (domain.includes('localhost')) {
                    domain = domainName;
                    newFiles = [...this.state.pinnedFiles, ...dummyFiles];
                } else {
                    files = this.props.files;
                    newFiles = [...this.state.pinnedFiles, ...files];
                }
                let tracks = [];
                if (files.length > 0) {
                    tracks = this.filesToTracks(newFiles, domain);
                }
                this.setState({ trackList: tracks }, () => {
                    if (this.chartdisplay && tracks !== []) {
                        this.drawTracks(this.chartdisplay);
                    }
                });
            }
        }
    }

    setBrowserDefaults(assemblyAnnotation, resolve) {
        const pinnedFiles = [
            {
                file_format: 'vdna-dir',
                href: 'https://encoded-build.s3.amazonaws.com/browser/hg19/hg19.vdna-dir',
            },
            {
                file_format: 'vgenes-dir',
                href: 'https://encoded-build.s3.amazonaws.com/browser/hg19/hg19.vgenes-dir',
                title: 'GENCODE V29',
            },
        ];
        this.setState({
            pinnedFiles,
        }, () => {
            resolve('success!');
        });
    }

    setGenomeAndTracks() {
        const genome = mapGenome(this.props.assembly);
        this.setState({ genome });
        // Determine genome and Gencode pinned files for selected assembly
        const genomePromise = new Promise((resolve) => {
            this.setBrowserDefaults(genome, resolve);
        });
        // Make sure that we have these pinned files before we convert the files to tracks and chart them
        genomePromise.then(() => {
            const domain = `${window.location.protocol}//${window.location.hostname}`;
            const files = this.compileFiles(domain);
            if (files.length > 0) {
                const tracks = this.filesToTracks(files, domain);
                this.setState({ trackList: tracks }, () => {
                    this.drawTracks(this.chartdisplay);
                });
            } else {
                this.setState({ trackList: [] });
            }
        });
    }

    compileFiles(domain) {
        let newFiles = [];
        if (domain.includes('localhost')) {
            // Locally we will display some default tracks
            newFiles = [...this.state.pinnedFiles, ...dummyFiles];
        } else {
            const files = this.props.files;
            if (files.length > 0) {
                newFiles = [...this.state.pinnedFiles, ...files];
            }
        }
        return newFiles;
    }

    filesToTracks(files, domain) {
        const tracks = files.map((file) => {
            if (file.name) {
                const trackObj = {};
                trackObj.name = file.name;
                trackObj.type = 'signal';
                trackObj.path = file.href;
                trackObj.heightPx = 50;
                return trackObj;
            } else if (file.file_format === 'bigWig') {
                const trackObj = {};
                trackObj.name = `${file.target ? `${file.target} ` : ''}${file.assay_term_name} - ${(file.biosample_ontology && file.biosample_ontology.term_name) ? file.biosample_ontology.term_name : ''}`;
                trackObj.type = 'signal';
                trackObj.path = domain + file.href;
                trackObj.heightPx = 50;
                return trackObj;
            } else if (file.file_format === 'vdna-dir') {
                const trackObj = {};
                trackObj.name = this.props.assembly.split(' ')[0];
                trackObj.type = 'sequence';
                trackObj.path = file.href;
                trackObj.heightPx = 50;
                return trackObj;
            } else if (file.file_format === 'vgenes-dir') {
                const trackObj = {};
                trackObj.name = file.title;
                trackObj.type = 'annotation';
                trackObj.path = file.href;
                trackObj.heightPx = 120;
                return trackObj;
            }
            const trackObj = {};
            trackObj.name = `${file.target ? `${file.target} ` : ''}${file.assay_term_name} - ${(file.biosample_ontology && file.biosample_ontology.term_name) ? file.biosample_ontology.term_name : ''}`;
            trackObj.type = 'annotation';
            trackObj.path = domain + file.href;
            // bigBed bedRNAElements, bigBed peptideMapping, bigBed bedExonScore, bed12, and bed9 have two tracks and need extra height
            // Convert to lower case in case of inconsistency in the capitalization of the file format in the data
            if (file.file_format_type &&
                (['bedrnaelements', 'peptidemapping', 'bedexonscore', 'bed12', 'bed9'].includes(file.file_format_type.toLowerCase()))) {
                trackObj.heightPx = 120;
            } else {
                trackObj.heightPx = 50;
            }
            return trackObj;
        });
        return tracks;
    }

    drawTracksResized() {
        if (this.chartdisplay) {
            this.state.visualizer.render({
                width: this.chartdisplay.clientWidth,
                height: this.state.visualizer.getContentHeight(),
            }, this.chartdisplay);
        }
    }

    drawTracks(container) {
        const highlightLocation = Math.floor((this.state.x1 + this.state.x0) / 2);
        const highlightString = `${this.state.contig}:${highlightLocation}`;
        const visualizer = new this.GV.GenomeVisualizer({
            clampToTracks: true,
            removableTracks: false,
            highlightLocation: highlightString,
            originalChr: this.state.contig,
            panels: [{
                location: { contig: this.state.contig, x0: this.state.x0, x1: this.state.x1 },
            }],
            tracks: this.state.trackList,
        });
        this.setState({ visualizer });
        visualizer.render({
            width: this.chartdisplay.clientWidth,
            height: visualizer.getContentHeight(),
        }, container);
        visualizer.addEventListener('track-resize', this.drawTracksResized);
        window.addEventListener('resize', this.drawTracksResized);
    }

    handleChange(e) {
        this.setState({
            showAutoSuggest: true,
            searchTerm: e.target.value,
        });
    }

    handleAutocompleteClick(term, id, name) {
        const newTerms = {};
        const inputNode = this.gene;
        inputNode.value = term;
        newTerms[name] = id;
        this.setState({
            showAutoSuggest: false,
            searchTerm: term,
        });
        inputNode.focus();
    }

    handleOnFocus() {
        this.setState({ showAutoSuggest: false });
        console.log(this.props.assembly);
        console.log(`${this.context.location_href.split('/experiments/')[0]}/suggest/?genome=${this.state.genome}&q=${this.state.searchTerm}`);

        const hrefForSuggestion = `https://encodeproject.org/suggest/?genome=${this.state.genome}&q=${this.state.searchTerm}`;

        getCoordinateData(hrefForSuggestion, this.context.fetch).then((response) => {
            console.log('this is the response');
            console.log(response);
            console.log('href');
            console.log(this.context.location_href);
            // Find the response line that matches the search
            const responseIndex = response['@graph'].findIndex(responseLine => responseLine.text === this.state.searchTerm);

            // Find the annotation line that matches the genome selected in the fake facets
            const annotations = response['@graph'][responseIndex]._source.annotations;
            const annotationIndex = annotations.findIndex(annotation => annotation.assembly_name === this.state.genome);
            const annotation = annotations[annotationIndex];

            // Compute gene location information from the annotation
            const annotationLength = +annotation.end - +annotation.start;
            const contig = `chr${annotation.chromosome}`;
            const xStart = +annotation.start - (annotationLength / 2);
            const xEnd = +annotation.end + (annotationLength / 2);
            console.log(annotation);
            const printStatement = `Success: found gene location for ${this.state.searchTerm}`;
            console.log(printStatement);

            if (contig !== '') {
                this.state.visualizer.setLocation({
                    contig,
                    x0: xStart,
                    x1: xEnd,
                });
            }
        });
    }

    resetLocation() {
        this.state.visualizer.setLocation({ contig: this.state.contig, x0: this.state.x0, x1: this.state.x1 });
    }

    render() {
        return (
            <div className={`${this.props.fixedHeight ? 'tall-browser-container' : ''}`}>
                {(this.state.trackList.length > 0 && this.state.genome !== null && !(this.state.disableBrowserForIE)) ?
                    <div>
                        { (this.state.geneSearch) ?
                            <div className="gene-search">
                                <i className="icon icon-search" />
                                <div className="search-instructions">Search for a gene</div>
                                <div className="searchform">
                                    <input id="gene" ref={(input) => { this.gene = input; }} aria-label={'search for gene name'} placeholder="Enter gene name here" value={this.state.searchTerm} onChange={this.handleChange} />
                                    {(this.state.showAutoSuggest && this.state.searchTerm) ?
                                        <FetchedData loadingComplete>
                                            <Param
                                                name="auto"
                                                url={`/suggest/?genome=${this.state.genome}&q=${this.state.searchTerm}`}
                                                type="json"
                                            />
                                            <AutocompleteBox
                                                name="annotation"
                                                userTerm={this.state.searchTerm}
                                                handleClick={this.handleAutocompleteClick}
                                            />
                                        </FetchedData>
                                    : null}
                                </div>
                                <button className="submit-gene-search btn btn-info" onClick={this.handleOnFocus}>Submit</button>
                            </div>
                        : null}
                        <button className="reset-browser-button" onClick={this.resetLocation}>
                            <i className="icon icon-undo" />
                            <span className="reset-title">Reset to query variant</span>
                        </button>
                        <div ref={(div) => { this.chartdisplay = div; }} className="valis-browser" />
                    </div>
                :
                    <div>
                        {(this.state.disableBrowserForIE) ?
                            <div className="browser-error valis-browser">The genome browser does not support Internet Explorer. Please upgrade your browser to Edge to visualize files on ENCODE.</div>
                        :
                            <div className="browser-error valis-browser">There are no visualizable results. Please try a different SNP or different search parameters.</div>
                        }
                    </div>
                }
            </div>
        );
    }
}

GenomeBrowser.propTypes = {
    fixedHeight: PropTypes.bool,
    files: PropTypes.array.isRequired,
    expanded: PropTypes.bool.isRequired,
    assembly: PropTypes.string,
    coordinates: PropTypes.string.isRequired,
};

GenomeBrowser.defaultProps = {
    fixedHeight: false,
    assembly: '',
};

GenomeBrowser.contextTypes = {
    location_href: PropTypes.string,
    navigate: PropTypes.func,
    fetch: PropTypes.func,
};

export default GenomeBrowser;
