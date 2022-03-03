import React from 'react';
import PropTypes from 'prop-types';
import _ from 'underscore';
import { FetchedData, Param } from './fetched';
import { BrowserFeat } from './browserfeat';
import Tooltip from '../libs/ui/tooltip';

const domainName = 'https://www.encodeproject.org';

const colorChromatinState = {
    'Active TSS': '#ff0000',
    'Flanking TSS': '#ff4400',
    'Flanking TSS upstream': '#ff4500',
    'Flanking TSS downstream': '#ff4500',
    'Strong transcription': '#008000',
    'Weak transcription': '#006400',
    'Genic enhancer 1': '#c4e105',
    'Genic enhancer 2': '#c4e105',
    'Active enhancer 1': '#ffc44d',
    'Active enhancer 2': '#ffc44d',
    'Weak enhancer': '#ffff00',
    'ZNF genes & repeats': '#66cdaa',
    Heterochromatin: '#8a91d0',
    'Bivalent/Poised TSS': '#cd5c5c',
    'Bivalent enhancer': '#bdb86b',
    'Repressed PolyComb': '#808080, #8937df',
    'Weak Repressed PolyComb': '#c0c0c0, #9750e3',
    'Quiescent/Low': '#ffffff',
};

const colorCCREs = {
    'Promoter-like': '#ff0000',
    'Proximal enhancer-like': '#ffa700',
    'Distal enhancer-like': '#ffcd00',
    'DNase-H3K4me3': '#ffaaaa',
    'CTCF-only': '#00b0f0',
    'DNase-only': '#06da93',
    'Low-DNase': '#ffffff',
};

const colorGenome = {
    'Nucleobase A': '#0c7489',
    'Nucleobase T': '#f9ce70',
    'Nucleobase G': '#0fa3b1',
    'Nucleobase C': '#c14953',
    'GC-low': '#0c7489',
    'GC-rich': '#f9ce70',
};

const colorGenes = {
    Transcript: '#cfd7c7',
    'Protein coding': '#575f5a',
    'Non-protein coding': '#f9ce70',
    UTR: '#c14953',
};

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

const LegendLabel = () => (
    <div className="legend-label">
        <div className="legend-color-container">
            <div className="legend-swatch" style={{ background: `${colorGenome['Nucleobase A']}` }} />
            <div className="legend-swatch" style={{ background: `${colorGenome['Nucleobase T']}` }} />
            <div className="legend-swatch" style={{ background: `${colorGenome['Nucleobase C']}` }} />
            <div className="legend-swatch" style={{ background: `${colorGenome['Nucleobase G']}` }} />
        </div>
        <div className="legend-name">Legend</div>
    </div>
);

/**
 * Display a legend
 */
const GenomeLegend = props => (
    <Tooltip
        trigger={<LegendLabel />}
        tooltipId="genome-legend"
        css="legend-button"
        size="large"
        columnCount={props.colorBlock.length + 2}
    >
        <div className="legend-container">
            <div className="legend-block">
                <h5>Genome</h5>
                {Object.keys(colorGenome).map(nucleobase => (
                    <div className="legend-element" key={nucleobase}>
                        <div className={`legend-swatch ${colorGenome[nucleobase] === '#ffffff' ? 'with-border' : ''}`} style={{ background: `${colorGenome[nucleobase]}` }} />
                        <div className="legend-label">{nucleobase}</div>
                    </div>
                ))}
            </div>
            <div className="legend-block">
                <h5>Genes</h5>
                {Object.keys(colorGenes).map(gene => (
                    <div className="legend-element" key={gene}>
                        <div className={`legend-swatch ${colorGenes[gene] === '#ffffff' ? 'with-border' : ''}`} style={{ background: `${colorGenes[gene]}` }} />
                        <div className="legend-label">{gene}</div>
                    </div>
                ))}
            </div>
            {(props.colorBlock.indexOf('ccres') > -1) ?
                <div className="legend-block">
                    <h5>CCREs</h5>
                    {Object.keys(colorCCREs).map(ccre => (
                        <div className="legend-element" key={ccre}>
                            <div className={`legend-swatch ${colorCCREs[ccre] === '#ffffff' ? 'with-border' : ''}`} style={{ background: `${colorCCREs[ccre]}` }} />
                            <div className="legend-label">{ccre}</div>
                        </div>
                    ))}
                </div>
            : null}
            {(props.colorBlock.indexOf('chromatin') > -1) ?
                <div className="legend-block">
                    <h5>Chromatin</h5>
                    {Object.keys(colorChromatinState).map(state => (
                        <div className="legend-element" key={state}>
                            {(colorChromatinState[state].indexOf(', ') === -1) ?
                                <div className={`legend-swatch ${colorChromatinState[state] === '#ffffff' ? 'with-border' : ''}`} style={{ background: `${colorChromatinState[state]}` }} />
                            :
                                <div className={`legend-swatch ${colorChromatinState[state] === '#ffffff' ? 'with-border' : ''}`} style={{ backgroundImage: `-webkit-linear-gradient(45deg, ${colorChromatinState[state].split(', ')[0]} 50%, ${colorChromatinState[state].split(', ')[1]} 50%)` }} />
                            }
                            <div className="legend-label">{state}</div>
                        </div>
                    ))}
                </div>
            : null}
        </div>
    </Tooltip>
);

GenomeLegend.propTypes = {
    colorBlock: PropTypes.array.isRequired,
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

/**
 * Display a label for a file’s track.
 */
const TrackLabel = ({ file, assembly }) => (
    <React.Fragment>
        {(file.name) ?
            <span>{file.name}</span>
        : (file.file_format === 'variant' || file.file_format === 'vgenes-dir' || file.title === 'representative DNase hypersensitivity sites' || file.title === 'cCRE, all') ?
            <span>{file.title}</span>
        : (file.file_format === 'bigWig') ?
            <span>
                {file.target ? `${file.target} - ` : ''}
                {file.assay_term_name} - {(file.biosample_ontology && file.biosample_ontology.term_name) ? file.biosample_ontology.term_name : ''}
            </span>
        : (file.file_format === 'vdna-dir') ?
            <span>{assembly.split(' ')[0]}</span>
        :
            <span>
                {file.target ? `${file.target} - ` : ''}
                {file.assay_term_name} - {(file.biosample_ontology && file.biosample_ontology.term_name) ? file.biosample_ontology.term_name : ''}
            </span>
        }
    </React.Fragment>
);

TrackLabel.propTypes = {
    /** File object being displayed in the track */
    file: PropTypes.object.isRequired,
    /** File object being displayed in the track */
    assembly: PropTypes.string.isRequired,
};

class GenomeBrowser extends React.Component {
    constructor(props, context) {
        super(props, context);
        const highlightLocationStart = +props.coordinates.split(':')[1].split('-')[0];
        const highlightLocationEnd = +props.coordinates.split(':')[1].split('-')[1];
        const x0 = highlightLocationStart - 5000;
        const x1 = highlightLocationEnd + 5000;
        this.state = {
            trackList: [],
            visualizer: null,
            showAutoSuggest: true,
            searchTerm: '',
            genome: '',
            contig: props.coordinates.split(':')[0],
            x0,
            x1,
            highlightLocationStart,
            highlightLocationEnd,
            pinnedFiles: [],
            disableBrowserForIE: false,
            geneSearch: false,
            colorBlock: this.props.selectedFilters.filter(f => f.indexOf('biosample') > -1).length > 0 ? ['chromatin'] : [],
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
        if (this.props.selectedFilters.filter(f => (f.indexOf('biosample') > -1)).length > 0) {
            if (this.state.colorBlock.length === 0) {
                this.setState({ colorBlock: ['chromatin'] });
            }
        }
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
                    files = [...this.state.pinnedFiles, ...dummyFiles];
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
            {
                title: 'dbSNP (153)',
                file_format: 'variant',
                path: 'https://encoded-build.s3.amazonaws.com/browser/hg19/hg19-dbSNP153.vvariants-dir',
            },
            // We are going to add in "representative DNase hypersensitivity sites" and "cCRE, all" tracks after update to GRCh38
            // {
            //     file_format: 'bigBed',
            //     href: '/files/ENCFF088UEJ/@@download/ENCFF088UEJ.bigBed',
            //     dataset: '/annotations/ENCSR169HLH/',
            //     title: 'representative DNase hypersensitivity sites',
            // },
            // {
            //     file_format: 'bigBed',
            //     href: '/files/ENCFF389ZVZ/@@download/ENCFF389ZVZ.bigBed',
            //     dataset: '/annotations/ENCSR439EAZ/',
            //     title: 'cCRE, all',
            // },
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
                trackObj.name = <TrackLabel file={file} assembly={this.props.assembly} />;
                trackObj.type = 'signal';
                trackObj.path = file.href;
                trackObj.heightPx = 50;
                return trackObj;
            }
            if (file.file_format === 'bigWig') {
                const trackObj = {};
                trackObj.name = <TrackLabel file={file} assembly={this.props.assembly} />;
                trackObj.type = 'signal';
                trackObj.path = domain + file.href;
                trackObj.heightPx = 50;
                return trackObj;
            }
            if (file.file_format === 'vdna-dir') {
                const trackObj = {};
                trackObj.name = <TrackLabel file={file} assembly={this.props.assembly} />;
                trackObj.type = 'sequence';
                trackObj.path = file.href;
                trackObj.heightPx = 50;
                return trackObj;
            }
            if (file.file_format === 'vgenes-dir') {
                const trackObj = {};
                trackObj.name = <TrackLabel file={file} assembly={this.props.assembly} />;
                trackObj.type = 'annotation';
                trackObj.path = file.href;
                trackObj.heightPx = 120;
                trackObj.displayLabels = true;
                return trackObj;
            }
            if (file.title === 'representative DNase hypersensitivity sites' || file.title === 'cCRE, all') {
                const trackObj = {};
                trackObj.name = <TrackLabel file={file} assembly={this.props.assembly} />;
                trackObj.type = 'annotation';
                trackObj.path = file.href;
                trackObj.heightPx = file.title === 'representative DNase hypersensitivity sites' ? 50 : 30;
                trackObj.expandable = false;
                trackObj.displayLabels = false;
                return trackObj;
            }
            if (file.file_format === 'variant') {
                const trackObj = {};
                trackObj.name = <TrackLabel file={file} assembly={this.props.assembly} />;
                trackObj.type = 'variant';
                trackObj.path = file.href || file.path; // some titles like dBSNP set path
                trackObj.heightPx = 40;
                trackObj.expandable = true;
                trackObj.displayLabels = true;
                return trackObj;
            }
            const trackObj = {};
            trackObj.name = <TrackLabel file={file} assembly={this.props.assembly} />;
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
        const highlightLocationStart = this.state.highlightLocationStart;
        const highlightLocationEnd = this.state.highlightLocationEnd;
        const highlightString = `${this.state.contig}:${highlightLocationStart}-${highlightLocationEnd}`;
        const visualizer = new this.GV.GenomeVisualizer({
            clampToTracks: true,
            reorderTracks: true,
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
        const hrefForSuggestion = `https://encodeproject.org/suggest/?genome=${this.state.genome}&q=${this.state.searchTerm}`;

        getCoordinateData(hrefForSuggestion, this.context.fetch).then((response) => {
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
                        <div className="regulome-legend">
                            <GenomeLegend colorBlock={this.state.colorBlock} />
                        </div>
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
    selectedFilters: PropTypes.array,
};

GenomeBrowser.defaultProps = {
    fixedHeight: false,
    assembly: '',
    selectedFilters: [],
};

GenomeBrowser.contextTypes = {
    location_href: PropTypes.string,
    navigate: PropTypes.func,
    fetch: PropTypes.func,
};

export default GenomeBrowser;
