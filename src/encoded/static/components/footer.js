import React from 'react';
import PropTypes from 'prop-types';


/* eslint-disable jsx-a11y/anchor-is-valid */
const Footer = ({ version }, reactContext) => {
    return (
        <footer id="page-footer">
            <div className="container">
                <div className="row">
                    <div className="app-version">{version}</div>
                </div>
            </div>
            <div className="page-footer">
                <div className="container">
                    <div className="row">
                        <div className="col-sm-6 col-sm-push-6">
                            <ul className="footer-links">
                                <li><a href="https://www.stanford.edu/site/privacy/">Privacy</a></li>
                                <li><a href="mailto:regulomedb@mailman.stanford.edu">Contact</a></li>
                            </ul>
                        </div>

                        <div className="col-sm-6 col-sm-pull-6">
                            <ul className="footer-logos">
                                <li><a href="/regulome-search"><img src="/static/img/RegulomeLogoFinal_mixedcolors.png" alt="Regulome" id="encode-logo" height="35px" width="120px" /></a></li>
                                <li><a href="https://www.stanford.edu"><img src="/static/img/su-logo-white-2x.png" alt="Stanford University" id="su-logo" width="105px" height="49px" /></a></li>
                                <li><a href="https://umich.edu/"><img src="/static/img/umich-logo-blue.svg" alt="University of Michigan" id="umich-logo" width="75px" height="81px" /></a></li>
                                <li><a href="https://creativecommons.org/licenses/by/4.0/"><img src="/static/img/creative-commons-logo.png" alt="Creative Commons" id="cc-logo" /></a></li>
                            </ul>
                        </div>
                        <p className="copy-notice">&copy;{new Date().getFullYear()} Stanford University</p>
                    </div>
                </div>
            </div>
        </footer>
    );
};
/* eslint-enable jsx-a11y/anchor-is-valid */

Footer.contextTypes = {
    session: PropTypes.object,
};

Footer.propTypes = {
    version: PropTypes.string, // App version number
};

Footer.defaultProps = {
    version: '',
};

export default Footer;
