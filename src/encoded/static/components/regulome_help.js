import React from 'react';
import PropTypes from 'prop-types';
import * as globals from './globals';
import Layout from './layout';


const RegulomeHelp = (props) => {
    const context = props.context;
    return (
        <div>
            <header className="row">
                <div className="col-sm-12">
                    <h1 className="page-title">{context.title}</h1>
                </div>
            </header>
            <Layout value={context.layout} />
        </div>
    );
};

RegulomeHelp.propTypes = {
    context: PropTypes.object.isRequired, // RegulomeHelp object being displayed
};

globals.contentViews.register(RegulomeHelp, 'regulome-help');

