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

    let snpCount = 0;
    if (summaries) {
        summaries.forEach((summary) => {
            snpCount += summary.rsids.length;
        });
    }

    // Notifications are an array of objects instead of just an object
    const notificationKeys = [];
    let errorFlag = false;
    if (notifications) {
        notifications.forEach((notification) => {
            notificationKeys.push(Object.keys(notification)[0]);
            if (notification[Object.keys(notification)[0]] !== 'Success') {
                errorFlag = true;
            }
        });
    }

    return (
        <div>
            <div className="lead-logo">
                <a href="/"><img src="/static/img/RegulomeLogoFinal.gif" alt="Regulome logo" /></a>
            </div>

            <div className="notification-label-centered">
                <div className="notification-summary">This search has evaluated <b>{context.notifications.length}</b> input lines and found <b>{snpCount}</b> SNP(s).</div>
                {errorFlag ?
                    <div className="notification-line notification-title">Unsuccessful searches:</div>
                : null}
                {notifications.map((notification, idx) => {
                    if (notification[notificationKeys[idx]] !== 'Success') {
                        return (
                            <div className="notification-line wider" key={idx}>
                                <span className="notification-label">{notificationKeys[idx]}</span>
                                <span className="notification">{notification[notificationKeys[idx]]}</span>
                            </div>
                        );
                    }
                    return null;
                })}
            </div>
            {(snpCount > 0) ?
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
