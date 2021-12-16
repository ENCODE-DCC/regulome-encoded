import React from 'react';
import PropTypes from 'prop-types';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../libs/bootstrap/modal';
import { requestSearch } from './objectutils';

/**
 * Display the modal for batch download, and pass back clicks in the Download button
 */
export const BatchDownloadModal = ({ handleDownloadClick, title, additionalContent, additionalClasses, showTitle, contentDescription, disabled }) => (
    <Modal actuator={<button className={`btn btn-info btn-sm ${additionalClasses}`} disabled={disabled} data-test="batch-download">{title || 'Download'}</button>}>
        <ModalHeader title={showTitle ? 'Using batch download' : ''} closeModal />
        <ModalBody>
            {contentDescription ?
                <React.Fragment>
                    {contentDescription}
                </React.Fragment>
            :
                <React.Fragment>
                    <p>
                        Click the &ldquo;Download&rdquo; button below to download a &ldquo;files.txt&rdquo; file that contains a list of URLs to a file containing all the experimental metadata and links to download the file.
                        The first line of the file has the URL or command line to download the metadata file.
                    </p>
                    <p>
                        Further description of the contents of the metadata file are described in the <a href="/help/batch-download/">Batch Download help doc</a>.
                    </p>
                    <p>
                        The &ldquo;files.txt&rdquo; file can be copied to any server.<br />
                        The following command using cURL can be used to download all the files in the list:
                    </p>
                    <code>xargs -L 1 curl -O -L &lt; files.txt</code><br />
                </React.Fragment>
            }
            <React.Fragment>{additionalContent}</React.Fragment>
        </ModalBody>
        <ModalFooter
            closeModal={<button className="btn btn-info btn-sm">Close</button>}
            submitBtn={<button className="btn btn-info btn-sm" disabled={disabled} onClick={handleDownloadClick}>Download</button>}
            dontClose
        />
    </Modal>
);

BatchDownloadModal.propTypes = {
    /** Function to call when Download button gets clicked */
    handleDownloadClick: PropTypes.func.isRequired,
    /** Title to override usual actuator "Download" button title */
    title: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.object,
    ]),
    /** True to disable Download button */
    disabled: PropTypes.bool,
    /** Additional content in modal as component */
    additionalContent: PropTypes.object,
    /** Description of content in modal as component */
    contentDescription: PropTypes.object,
    /** True to display default title */
    showTitle: PropTypes.bool,
    /** Extra classes for button */
    additionalClasses: PropTypes.string,
};

BatchDownloadModal.defaultProps = {
    title: '',
    disabled: false,
    additionalContent: null,
    contentDescription: null,
    showTitle: true,
    additionalClasses: '',
};


export class BatchDownload extends React.Component {
    constructor() {
        super();
        this.handleDownloadClick = this.handleDownloadClick.bind(this);
    }

    handleDownloadClick() {
        if (!this.props.context) {
            requestSearch(this.props.query).then((results) => {
                this.context.navigate(results.batch_download);
            });
        } else {
            this.context.navigate(this.props.context.batch_download);
        }
    }

    render() {
        return <BatchDownloadModal handleDownloadClick={this.handleDownloadClick} />;
    }
}

BatchDownload.propTypes = {
    context: PropTypes.object, // Search result object whose batch_download we're using
    query: PropTypes.string, // Without `context`, perform a search using this query string
};

BatchDownload.defaultProps = {
    context: null,
    query: '',
};

BatchDownload.contextTypes = {
    navigate: PropTypes.func,
};
