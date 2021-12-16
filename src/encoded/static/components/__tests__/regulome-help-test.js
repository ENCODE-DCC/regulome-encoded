import React from 'react';
import { mount } from 'enzyme';


// Import test component
import RegulomeHelp from '../regulome_help';


describe('Help', () => {
    describe('Help page', () => {
        let help;

        beforeAll(() => {
            help = mount(
                <RegulomeHelp />
            );
        });

        it('Has correct title', () => {
            const item = help.find('.page-title');
            expect(item.at(0).text()).toEqual('Help');
            help.unmount();
        });
    });
});
