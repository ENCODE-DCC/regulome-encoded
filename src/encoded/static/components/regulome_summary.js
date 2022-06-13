import React from 'react';
import PropTypes from 'prop-types';
import * as globals from './globals';
import { SortTablePanel, SortTable } from './sorttable';

export const SNPSummary = props => (
    <SortTablePanel title="Summary of SNP analysis">
        <SortTable list={props.snps} columns={props.snpsColumns} sortColumn="ranking" />
    </SortTablePanel>
);

SNPSummary.propTypes = {
    snps: PropTypes.array.isRequired,
    snpsColumns: PropTypes.object.isRequired,
};

const RegulomeSummary = (props) => {
    const context = props.context;
    const variants = context.variants || [];
    // Notifications is an object having solely failure messages
    const notifications = Object.entries(context.notifications);

    const snpsColumns = {
        chrom: {
            title: 'Chromosome location',
            display: (item) => {
                console.log(item);
                const hrefScore = `../regulome-search/?regions=${item.chrom}:${item.start}-${item.end}&genome=${context.assembly}`;
                return <a href={hrefScore}>{`${item.chrom}:${item.start}..${item.end}`}</a>;
            },
        },
        rsids: {
            title: 'dbSNP IDs',
            display: (item) => {
                const hrefScore = `../regulome-search/?regions=${item.chrom}:${item.start}-${item.end}&genome=${context.assembly}`;
                if (item.rsids.length > 0) {
                    return <a href={hrefScore}>{item.rsids.join(', ')}</a>;
                }
                return <a href={hrefScore}>---</a>;
            },
        },
        ranking: {
            title: 'Rank',
            display: (item) => {
                const hrefScore = `../regulome-search/?regions=${item.chrom}:${item.start}-${item.end}&genome=${context.assembly}`;
                if (item.regulome_score.ranking) {
                    return <a href={hrefScore}>{item.regulome_score.ranking}</a>;
                }
                return <a href={hrefScore}>See related experiments</a>;
            },
            getValue: item => item.regulome_score.ranking,
        },
        probability: {
            title: 'Score',
            display: (item) => {
                const hrefScore = `../regulome-search/?regions=${item.chrom}:${item.start}-${item.end}&genome=${context.assembly}`;
                if (item.regulome_score.probability) {
                    return <a href={hrefScore}>{item.regulome_score.probability}</a>;
                }
                return <a href={hrefScore}>See related experiments</a>;
            },
            getValue: item => +item.regulome_score.probability,
            sorter: (a, b) => {
                if (a < b) {
                    return -1;
                } else if (a > b) {
                    return 1;
                }
                return 0;
            },
        },
    };

    return (
        <React.Fragment>
            <div className="lead-logo">
                <a href="/">
                    <img src="/static/img/RegulomeLogoFinal.gif" alt="Regulome logo" />
                    <div className="version-tag">2.0.3</div>
                </a>
            </div>

            <div className="notification-label-centered">
                <div className="notification-summary">This search has found <b>{context.total}</b> variant(s).{context.total > variants.length ? <span> Only <b>{variants.length}</b> are shown.</span> : null}</div>
                {notifications && notifications.length > 0 ?
                    <div className="notification-line notification-title">Unsuccessful searches:</div>
                : null}
                {notifications.map(note =>
                    <div className="notification-line wider" key={note[0]}>
                        <span className="notification-label">{note[0]}</span>
                        <span className="notification">{note[1]}</span>
                    </div>
                )}
                <div>
                    <a className="btn btn-info btn-sm" href={`${context['@id']}&format=bed`} data-bypass data-test="download-bed">Download BED</a>
                    <a className="btn btn-info btn-sm" href={`${context['@id']}&format=tsv`} data-bypass data-test="download-tsv">Download TSV</a>
                </div>
            </div>
            {variants.length > 0 ?
                <div className="summary-table-hoverable">
                    <SNPSummary snps={props.context.variants} assembly={context.assembly} snpsColumns={snpsColumns} />
                </div>
            :
                <div className="notification-label-centered">Try another search to see results.</div>
            }

        </React.Fragment>
    );
};

RegulomeSummary.propTypes = {
    context: PropTypes.object.isRequired,
};

RegulomeSummary.contextTypes = {
    location_href: PropTypes.string,
    navigate: PropTypes.func,
};

export default RegulomeSummary;

globals.contentViews.register(RegulomeSummary, 'regulome-summary');
