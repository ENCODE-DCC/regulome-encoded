import React from 'react';
import PropTypes from 'prop-types';
import * as globals from './globals';
import { SortTablePanel, SortTable } from './sorttable';

const snpsColumns = {
    chrom: {
        title: 'Chromosome location',
        display: (item) => {
            const hrefScore = `../regulome-search/?regions=${item.chrom}:${item.start}-${item.end}&genome=GRCh37`;
            return <a href={hrefScore}>{`${item.chrom}:${item.start}..${item.end}`}</a>;
        },
    },
    rsids: {
        title: 'dbSNP IDs',
        display: (item) => {
            const hrefScore = `../regulome-search/?regions=${item.chrom}:${item.start}-${item.end}&genome=GRCh37`;
            if (item.rsids.length > 0) {
                return <a href={hrefScore}>{item.rsids.join(', ')}</a>;
            }
            return <a href={hrefScore}>---</a>;
        },
    },
    ranking: {
        title: 'Rank',
        display: (item) => {
            const hrefScore = `../regulome-search/?regions=${item.chrom}:${item.start}-${item.end}&genome=GRCh37`;
            if (item.regulome_score.ranking) {
                return <a href={hrefScore}>{item.regulome_score.ranking}</a>;
            }
            return <a href={hrefScore}>See related experiments</a>;
        },
    },
    probability: {
        title: 'Score',
        display: (item) => {
            const hrefScore = `../regulome-search/?regions=${item.chrom}:${item.start}-${item.end}&genome=GRCh37`;
            if (item.regulome_score.probability) {
                return <a href={hrefScore}>{item.regulome_score.probability}</a>;
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
    const summaries = context.summaries || [];
    // Notifications is an object having solely failure messages
    const notifications = Object.entries(context.notifications);

    return (
        <div>
            <div className="lead-logo">
                <a href="/"><img src="/static/img/RegulomeLogoFinal.gif" alt="Regulome logo" /></a>
            </div>

            <div className="notification-label-centered">
                <div className="notification-summary">This search has found <b>{context.total}</b> variant(s).{context.total > summaries.length ? <span> Only <b>{summaries.length}</b> are shown.</span> : null}</div>
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
