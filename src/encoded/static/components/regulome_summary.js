import React from 'react';
import PropTypes from 'prop-types';
import * as globals from './globals';
import { SortTablePanel, SortTable } from './sorttable';

const snpsColumns = {
    chrom: {
        title: 'Chromosome location',
        display: (item) => {
            const hrefScore = `../regulome-search/?region=${item.chrom}:${item.start}-${item.end}&genome=GRCh37&limit=all`;
            return <a href={hrefScore}>{`${item.chrom}:${item.start}..${item.end}`}</a>;
        },
    },
    rsids: {
        title: 'dbSNP IDs',
        display: (item) => {
            const hrefScore = `../regulome-search/?region=${item.chrom}:${item.start}-${item.end}&genome=GRCh37&limit=all`;
            return <a href={hrefScore}>{item.rsids.join(', ')}</a>;
        },
    },
    regulome_score: {
        title: 'Regulome score',
        display: (item) => {
            const hrefScore = `../regulome-search/?region=${item.chrom}:${item.start}-${item.end}&genome=GRCh37`;
            if (item.regulome_score.probability && item.regulome_score.ranking) {
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
    // Notifications is an object having solely failure messages
    const notifications = Object.entries(context.notifications);

    return (
        <div>
            <div className="lead-logo">
                <a href="/"><img src="/static/img/RegulomeLogoFinal.gif" alt="Regulome logo" /></a>
            </div>

            <div className="notification-label-centered">
                <div className="notification-summary">This search has found <b>{context.total}</b> variant(s).</div>
                {notifications && notifications.length > 0 ?
                    <div className="notification-line notification-title">Unsuccessful searches:</div>
                : null}
                {notifications.map(note =>
                    <div className="notification-line wider" key={note[0]}>
                        <span className="notification-label">{note[0]}</span>
                        <span className="notification">{note[1]}</span>
                    </div>
                )}
            </div>
            {summaries.length > 0 ?
                <div className="summary-table-hoverable">
                    <SNPSummary {...props} />
                </div>
            :
                <div className="notification-label-centered">Try another search to see results.</div>
            }

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
