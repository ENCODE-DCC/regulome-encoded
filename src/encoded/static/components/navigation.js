import React from 'react';
import PropTypes from 'prop-types';
import url from 'url';
import { Navbar, Nav, NavItem } from '../libs/bootstrap/navbar';
import { DropdownMenu, DropdownMenuSep } from '../libs/bootstrap/dropdown-menu';
import { productionHost } from './globals';
import { BatchDownloadModal } from './search';
import { svgIcon } from '../libs/svg-icons';


export default class Navigation extends React.Component {
    constructor(props, context) {
        super(props, context);

        // Set initial React state.
        this.state = {
            testWarning: !productionHost[url.parse(context.location_href).hostname],
            openDropdown: '',
        };

        // Bind this to non-React methods.
        this.handleClickWarning = this.handleClickWarning.bind(this);
        this.documentClickHandler = this.documentClickHandler.bind(this);
        this.dropdownClick = this.dropdownClick.bind(this);
        this.batchDownload = this.batchDownload.bind(this);
    }

    // Initialize current React component context for others to inherit.
    getChildContext() {
        return {
            openDropdown: this.state.openDropdown,
            dropdownClick: this.dropdownClick,
        };
    }

    componentDidMount() {
        // Add a click handler to the DOM document -- the entire page
        document.addEventListener('click', this.documentClickHandler);
    }

    componentWillUnmount() {
        // Remove the DOM document click handler now that the DropdownButton is going away.
        document.removeEventListener('click', this.documentClickHandler);
    }

    documentClickHandler() {
        // A click outside the DropdownButton closes the dropdown
        this.setState({ openDropdown: '' });
    }

    dropdownClick(dropdownId, e) {
        // After clicking the dropdown trigger button, don't allow the event to bubble to the rest of the DOM.
        e.nativeEvent.stopImmediatePropagation();
        this.setState(prevState => ({
            openDropdown: dropdownId === prevState.openDropdown ? '' : dropdownId,
        }));
    }

    handleClickWarning(e) {
        // Handle a click in the close box of the test-data warning
        e.preventDefault();
        e.stopPropagation();

        // Remove the warning banner because the user clicked the close icon
        this.setState({ testWarning: false });

        // If collection with .sticky-header on page, jiggle scroll position
        // to force the sticky header to jump to the top of the page.
        const hdrs = document.getElementsByClassName('sticky-header');
        if (hdrs.length) {
            window.scrollBy(0, -1);
            window.scrollBy(0, 1);
        }
    }

    /**
     * Download data for ENCFF297XMQ
     */
    batchDownload() {
        this.context.navigate('https://www.encodeproject.org/files/ENCFF297XMQ/@@download/ENCFF297XMQ.tsv');
    }

    render() {
        const portal = this.context.portal;
        return (
            <div id="navbar" className="navbar navbar-fixed-top navbar-inverse">
                <div className="container">
                    <Navbar brand={portal.portal_title} brandlink="/" label="main" navClasses="navbar-main" openDropdown={this.state.openDropdown} dropdownClick={this.dropdownClick}>
                        <GlobalSections />
                        <BatchDownloadModal
                            handleDownloadClick={this.batchDownload}
                            additionalClasses="navigation-modal"
                            title={
                                <span className="download-scores">
                                    <div className="download-svg">{svgIcon('download')}</div>
                                    <div className="download-text">Download scores</div>
                                </span>
                            }
                            showTitle={false}
                            contentDescription={
                                <div>
                                    <h4>Download pre-calculated scores file for dbSNP v153 common SNPs (MAF &gt; 0.01)</h4>
                                    <div>Click the &ldquo;Download&rdquo; button below to download the file &ldquo;ENCFF297XMQ.txt&rdquo;. The file size is 1.32 GB.</div>
                                </div>
                            }
                        />
                        {this.props.isHomePage ? null : <ContextActions />}
                    </Navbar>
                </div>
                {this.state.testWarning ?
                    <div className="test-warning">
                        <div className="container">
                            <p>
                                The data displayed on this page is not official and only for testing purposes.
                                <button className="test-warning-close icon icon-times-circle-o" onClick={this.handleClickWarning}>
                                    <span className="sr-only">Close test warning banner</span>
                                </button>
                            </p>
                        </div>
                    </div>
                : null}
            </div>
        );
    }
}

Navigation.propTypes = {
    isHomePage: PropTypes.bool, // True if current page is home page
};

Navigation.defaultProps = {
    isHomePage: false,
};

Navigation.contextTypes = {
    location_href: PropTypes.string,
    portal: PropTypes.object,
    navigate: PropTypes.func,
};

Navigation.childContextTypes = {
    openDropdown: PropTypes.string, // Identifies dropdown currently dropped down; '' if none
    dropdownClick: PropTypes.func, // Called when a dropdown title gets clicked
};


// Main navigation menus
const GlobalSections = (props, context) => {
    const actions = context.listActionsFor('global_sections').map(action =>
        <NavItem key={action.id} dropdownId={action.id} dropdownTitle={action.title} openDropdown={props.openDropdown} dropdownClick={props.dropdownClick} >
            {action.children ?
                <DropdownMenu label={action.id}>
                    {action.children.map((childAction) => {
                        // Render any separators in the dropdown
                        if (childAction.id.substring(0, 4) === 'sep-') {
                            return <DropdownMenuSep key={childAction.id} />;
                        }

                        // Render any regular linked items in the dropdown
                        return (
                            <a href={childAction.url || ''} key={childAction.id}>
                                {childAction.title}
                            </a>
                        );
                    })}
                </DropdownMenu>
            : null}
        </NavItem>
    );
    return <Nav>{actions}</Nav>;
};

GlobalSections.propTypes = {
    openDropdown: PropTypes.string, // ID of the dropdown currently visible
    dropdownClick: PropTypes.func, // Function to call when dropdown clicked
};

GlobalSections.defaultProps = {
    openDropdown: '',
    dropdownClick: null,
};

GlobalSections.contextTypes = {
    listActionsFor: PropTypes.func.isRequired,
};


// Context actions: mainly for editing the current object
const ContextActions = (props, context) => {
    const actions = context.listActionsFor('context').map(action =>
        <a href={action.href} key={action.name}>
            <i className="icon icon-pencil" /> {action.title}
        </a>
    );

    // No action menu
    if (actions.length === 0) {
        return null;
    }

    // Action menu with editing dropdown menu
    if (actions.length > 1) {
        return (
            <Nav right>
                <NavItem dropdownId="context" dropdownTitle={<i className="icon icon-gear" />} openDropdown={props.openDropdown} dropdownClick={props.dropdownClick}>
                    <DropdownMenu label="context">
                        {actions}
                    </DropdownMenu>
                </NavItem>
            </Nav>
        );
    }

    // Action menu without a dropdown menu
    return <Nav right><NavItem>{actions}</NavItem></Nav>;
};

ContextActions.propTypes = {
    openDropdown: PropTypes.string, // ID of the dropdown currently visible
    dropdownClick: PropTypes.func, // Function to call when dropdown clicked
};

ContextActions.defaultProps = {
    openDropdown: '',
    dropdownClick: null,
};

ContextActions.contextTypes = {
    listActionsFor: PropTypes.func,
};
