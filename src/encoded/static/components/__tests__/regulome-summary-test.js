import React from 'react';
import { mount } from 'enzyme';


// Import test component and data
import RegulomeSummary from '../regulome_summary';
import context from '../testdata/regulome_summary';


describe('Summary', () => {
    describe('Summary page', () => {
        let summary;

        beforeAll(() => {
            summary = mount(
                <RegulomeSummary context={context} />
            );
        });

        it('Has a summary of variants found', () => {
            const item = summary.find('.notification-summary');
            const itemCount = item.find('b');
            expect(itemCount.text()).toEqual('2');
        });

        it('Has two download links', () => {
            const downloadBed = summary.find('[data-test="download-bed"]');
            expect(downloadBed.text()).toEqual('Download BED');
            const downloadTsv = summary.find('[data-test="download-tsv"]');
            expect(downloadTsv.text()).toEqual('Download TSV');
        });

        it('Has summary table', () => {
            const table = summary.find('.summary-table-hoverable');
            const tableHeader = table.find('th');
            expect(tableHeader.at(0).text()).toEqual('Chromosome location');
        });
    });
});
