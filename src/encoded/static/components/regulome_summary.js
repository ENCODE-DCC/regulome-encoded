import React from 'react';
import PropTypes from 'prop-types';
import * as globals from './globals';
import { SortTablePanel, SortTable } from './sorttable';

const snpsColumns = {
    chrom: {
        title: 'Chromosome location',
        display: (item) => {
            const hrefScore = `../regulome-search/?region=${item.chrom}:${item.start}-${item.end}&genome=GRCh37`;
            return <a href={hrefScore}>{`${item.chrom}:${item.start}..${item.end}`}</a>;
        },
    },
    rsids: {
        title: 'dbSNP IDs',
        display: (item) => {
            const hrefScore = `../regulome-search/?region=${item.chrom}:${item.start}-${item.end}&genome=GRCh37`;
            return <a href={hrefScore}>{item.rsids.join(', ')}</a>;
        },
    },
    regulome_score: {
        title: 'Regulome score',
        display: (item) => {
            const hrefScore = `../regulome-search/?region=${item.chrom}:${item.start}-${item.end}&genome=GRCh37`;
            if (item.regulome_score.probability !== null && item.regulome_score.ranking !== null) {
                return <a href={hrefScore}>{item.regulome_score.probability} (probability); {item.regulome_score.ranking} (ranking)</a>;
            }
            return <a href={hrefScore}>See related experiments</a>;
        },
    },
};

const SNPSummary = (props) => {
    const snps = props.context.summaries;
    return (
        <div>
            <SortTablePanel title="Summary of SNP analysis">
                <SortTable list={snps} columns={snpsColumns} />
            </SortTablePanel>
        </div>
    );
};

SNPSummary.propTypes = {
    context: React.PropTypes.object.isRequired,
    summaries: React.PropTypes.array,
};

SNPSummary.defaultProps = {
    summaries: [],
};

const RegulomeSummary = (props) => {
    const context = props.context;
    const summaries = context.summaries;
    const notifications = context.notifications;
    const coordinates = context.coordinates;

    let snpCount = 0;
    summaries.forEach((summary) => {
        snpCount += summary.rsids.length;
    });

    return (
        <div>
            <div className="lead-logo">
                <a href="/"><img src="/static/img/RegulomeLogoFinal.gif" alt="Regulome logo" /></a>
            </div>

            <div className="results-summary">
                <p>This search has evaluated {context.notifications.length} input lines and found {snpCount} SNP(s).</p>
                {notifications.map((notification, idx) => {
                    if (notification[coordinates[idx]] !== 'Success') {
                        return (<p key={idx}>Region {coordinates[idx]} {notification[coordinates[idx]]}</p>);
                    }
                    return null;
                })}

            </div>

            <div className="summary-table-hoverable">
                <SNPSummary {...props} />
            </div>

        </div>
    );
};

RegulomeSummary.propTypes = {
    context: PropTypes.object.isRequired,
    currentRegion: PropTypes.func,
    region: PropTypes.string,
};

RegulomeSummary.defaultProps = {
    currentRegion: null,
    region: null,
};

RegulomeSummary.contextTypes = {
    location_href: PropTypes.string,
    navigate: PropTypes.func,
};

globals.contentViews.register(RegulomeSummary, 'regulome-summary');
